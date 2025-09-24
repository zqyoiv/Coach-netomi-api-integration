import 'dotenv/config';
import express from 'express';
import crypto from 'crypto';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  // Increase heartbeat tolerances to reduce ping timeouts on slow networks or throttled tabs
  pingInterval: 25000, // server ping every 25s
  pingTimeout: 60000,  // allow up to 60s without pong before closing
});

app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

// ------------------------------
// Env & config
// ------------------------------
const CONFIG = {
  /** The Netomi API base URL (e.g., https://api.netomi.com) */
  BASE_URL: process.env.NETOMI_BASE_URL || 'https://api.netomi.com', // TODO(NETOMI_BASE_URL): confirm from PDF

  /** Auth: token generation endpoint */
  NETOMI_AUTH_URL: process.env.NETOMI_AUTH_URL || 'https://auth-us.netomi.com/v1/auth/generate-token',

  /** API key or bearer token used to authenticate requests (if static) */
  API_KEY: process.env.NETOMI_API_KEY, // TODO(NETOMI_AUTH): confirm header shape

  /** Optional: workspace / account / bot identifiers, if required */
  WORKSPACE_ID: process.env.NETOMI_WORKSPACE_ID, // e.g., org/workspace slug
  BOT_ID: process.env.NETOMI_BOT_ID, // e.g., assistant/bot id

  /** Channel headers required by Netomi auth */
  CHANNEL: process.env.NETOMI_CHANNEL || 'CHAT',
  CHANNEL_REF_ID: process.env.NETOMI_CHANNEL_REF_ID,
  VIRTUAL_AGENT_ID: process.env.NETOMI_VIRTUAL_AGENT_ID,

  /** Optional: webhook signing secret if Netomi signs callbacks */
  WEBHOOK_SECRET: process.env.NETOMI_WEBHOOK_SECRET,
  
  /** Webhook Bearer Token for authentication */
  WEBHOOK_BEARER_TOKEN: process.env.WEBHOOK_BEARER_TOKEN || 'netomi-webhook-secret-' + crypto.randomUUID(),

  /** Port */
  PORT: Number(process.env.PORT) || 3000,
};

// ------------------------------
// Helpers
// ------------------------------

/**
 * Generate a Netomi auth token using the configured auth endpoint and headers.
 * Returns { token, expiresIn?, issuedAt? } depending on API shape.
 */
async function fetchNetomiToken() {
  const url = CONFIG.NETOMI_AUTH_URL;
  if (!url) throw new Error('NETOMI_AUTH_URL is not set');

  const headers = {
    'x-channel': CONFIG.CHANNEL,
    'x-channel-ref-id': CONFIG.CHANNEL_REF_ID || crypto.randomUUID(),
    'x-virtual-agent-id': CONFIG.VIRTUAL_AGENT_ID,
  };

  // Remove undefined headers
  Object.keys(headers).forEach((k) => headers[k] === undefined && delete headers[k]);

  const resp = await fetch(url, { method: 'POST', headers });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Auth failed: ${resp.status} ${txt}`);
  }
  try {
    return await resp.json();
  } catch (e) {
    // Some auth endpoints return raw token string
    const txt = await resp.text();
    return { token: txt.trim() };
  }
}

// Generate token fetcher
async function generateToken() {
  const url = 'https://auth-us.netomi.com/v1/auth/generate-token';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'x-channel': CONFIG.CHANNEL,
      'x-channel-ref-id': CONFIG.CHANNEL_REF_ID,
      'x-virtual-agent-id': CONFIG.VIRTUAL_AGENT_ID,
    },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Token API error: ${res.status} ${txt}`);
  }

  return res.json();
}

// Refresh token fetcher
async function refreshToken(refreshTokenValue) {
  const url = 'https://auth-us.netomi.com/v1/auth/refresh-token';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'x-channel': CONFIG.CHANNEL,
      'x-channel-ref-id': CONFIG.CHANNEL_REF_ID,
      'x-virtual-agent-id': CONFIG.VIRTUAL_AGENT_ID,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      refreshToken: refreshTokenValue
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Refresh Token API error: ${res.status} ${txt}`);
  }

  return res.json();
}

// Process message fetcher with webhook support
async function processMessage(messageData, authToken, waitForWebhook = true, timeoutMs = 30000) {
  const url = 'https://aiapi-us.netomi.com/v1/conversations/process-message';
  
  // Create a unique request ID to track this request
  const requestId = messageData.conversationId || crypto.randomUUID();
  
  // Set up promise for webhook response if waiting
  let webhookPromise = null;
  if (waitForWebhook) {
    webhookPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pendingRequests.delete(requestId);
        reject(new Error('Webhook response timeout'));
      }, timeoutMs);
      
      pendingRequests.set(requestId, {
        resolve: (payload) => {
          clearTimeout(timeout);
          resolve(payload);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timestamp: Date.now()
      });
    });
  }
  
  // Send the message to Netomi
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'x-channel': CONFIG.CHANNEL,
      'x-integration-channel': 'NETOMI_WEB_WIDGET',
      'x-channel-ref-id': CONFIG.CHANNEL_REF_ID,
      'Content-Type': 'application/json',
      'x-virtual-agent-id': CONFIG.VIRTUAL_AGENT_ID,
      'x-auth-token': authToken,
    },
    body: JSON.stringify(messageData),
  });

  if (!res.ok) {
    if (waitForWebhook) {
      pendingRequests.delete(requestId);
    }
    const txt = await res.text();
    throw new Error(`Process Message API error: ${res.status} ${txt}`);
  }

  const acknowledgment = await res.json();
  
  if (!waitForWebhook) {
    // Return just the acknowledgment
    return { acknowledgment };
  }
  
  try {
    // Wait for webhook response
    const webhookResponse = await webhookPromise;
    return {
      acknowledgment,
      webhookResponse,
      requestId
    };
  } catch (error) {
    console.error(`[Process Message] Webhook timeout for request ${requestId}:`, error);
    return {
      acknowledgment,
      webhookResponse: null,
      error: error.message,
      requestId
    };
  }
}

// ------------------------------
// In-memory storage for pending requests (in production, use Redis or database)
// ------------------------------
const pendingRequests = new Map(); // requestId -> { resolve, reject, timestamp }
const conversations = new Map(); // conversationId -> messages array
const webhookMessages = []; // Store recent webhook messages for frontend display
const connectedClients = new Map(); // socketId -> { socket, authToken, authenticated, connectedAt, conversationIds?: Set }
const conversationToSocket = new Map(); // conversationId -> socketId

// ------------------------------
// Server-side token management
// ------------------------------
let serverAuthToken = null;
let serverTokenExpiry = null;
let tokenRefreshTimer = null;

/**
 * Generate and store a new server-side token
 */
async function generateServerToken() {
  try {
    console.log('[Server Token] Generating new server-side token...');
    const tokenData = await generateToken();
    
    // Extract token and expiry from response
    const token = tokenData.payload?.token || tokenData.token || tokenData.access_token;
    const expiresIn = tokenData.payload?.expires_in || tokenData.expires_in || tokenData.expiresIn;
    
    if (!token) {
      throw new Error('No token found in response');
    }
    
    serverAuthToken = token;
    serverTokenExpiry = expiresIn ? Date.now() + (expiresIn * 1000) : null;
    
    console.log('[Server Token] Token generated successfully');
    console.log('[Server Token] Token:', serverAuthToken ? `${serverAuthToken.substring(0, 20)}...` : 'None');
    console.log('[Server Token] Expires at:', serverTokenExpiry ? new Date(serverTokenExpiry).toISOString() : 'No expiration');
    
    return { token, expiresIn, expiresAt: serverTokenExpiry };
  } catch (error) {
    console.error('[Server Token] Failed to generate token:', error);
    throw error;
  }
}

/**
 * Check if the current server token is still valid
 */
function isServerTokenValid() {
  if (!serverAuthToken) return false;
  if (!serverTokenExpiry) return true; // Assume valid if no expiration
  return Date.now() < serverTokenExpiry;
}

/**
 * Get the current server token (read-only, never generates new tokens)
 */
function getCurrentServerToken() {
  if (isServerTokenValid()) {
    console.log('[Server Token] Returning valid existing token');
    return serverAuthToken;
  }
  
  console.log('[Server Token] Current token is expired or missing');
  return null; // Don't generate, let auto-refresh handle it
}

/**
 * Get the current valid server token, generating a new one ONLY for server-side operations
 * This should NEVER be called by client-facing endpoints
 */
async function getValidServerTokenInternal() {
  if (isServerTokenValid()) {
    console.log('[Server Token] Using existing valid token');
    return serverAuthToken;
  }
  
  console.log('[Server Token] Token expired or missing, generating new one...');
  await generateServerToken();
  return serverAuthToken;
}

/**
 * Set up automatic token refresh every 23 hours
 */
function setupTokenRefresh() {
  // Clear existing timer if any
  if (tokenRefreshTimer) {
    clearInterval(tokenRefreshTimer);
  }
  
  // Refresh every 23 hours (23 * 60 * 60 * 1000 ms)
  const refreshInterval = 23 * 60 * 60 * 1000;
  
  tokenRefreshTimer = setInterval(async () => {
    try {
      console.log('[Server Token] Auto-refreshing token (23-hour cycle)...');
      await generateServerToken();
      console.log('[Server Token] Token auto-refresh completed');
    } catch (error) {
      console.error('[Server Token] Auto-refresh failed:', error);
    }
  }, refreshInterval);
  
  console.log('[Server Token] Auto-refresh timer set for every 23 hours');
}

// ------------------------------
// Routes
// ------------------------------

// Webhook endpoint to receive Netomi responses
app.post('/webhook/netomi', express.json(), (req, res) => {
  try {
    console.log('[Netomi Webhook] Received webhook call');
    console.log('[Netomi Webhook] Headers:', req.headers);
    
    // Bearer Token Authentication (Required by Netomi)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.error('[Netomi Webhook] Missing Authorization header');
      return res.status(401).json({ 
        error: 'Missing Authorization header',
        message: 'Bearer token is required' 
      });
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      console.error('[Netomi Webhook] Invalid Authorization header format');
      return res.status(401).json({ 
        error: 'Invalid Authorization header format',
        message: 'Expected "Bearer <token>"' 
      });
    }
    
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    if (token !== CONFIG.WEBHOOK_BEARER_TOKEN) {
      console.error('[Netomi Webhook] Invalid bearer token');
      return res.status(401).json({ 
        error: 'Invalid bearer token',
        message: 'Unauthorized access' 
      });
    }
    
    console.log('[Netomi Webhook] Bearer token authentication successful');
    
    // Get the parsed JSON payload (express.json() already parsed it)
    const payload = req.body;
    
    // Validate that we received a valid payload
    if (!payload || typeof payload !== 'object') {
      console.error('[Netomi Webhook] Invalid or missing JSON payload');
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    
    console.log('[Netomi Webhook] Payload response received.');
    console.log('[Netomi Webhook] Payload:', JSON.stringify(payload, null, 2));
    
    // Optional: Additional signature verification (if Netomi provides it)
    if (CONFIG.WEBHOOK_SECRET) {
      const signature = req.headers['x-netomi-signature'] || req.headers['x-signature'];
      if (signature) {
        const bodyString = JSON.stringify(payload);
        const expectedSignature = crypto
          .createHmac('sha256', CONFIG.WEBHOOK_SECRET)
          .update(bodyString)
          .digest('hex');
        
        if (`sha256=${expectedSignature}` !== signature) {
          console.error('[Netomi Webhook] Invalid signature');
          return res.status(401).json({ error: 'Invalid signature' });
        }
        console.log('[Netomi Webhook] Signature verification successful');
      }
    }
    
    // Extract request ID from payload to match with pending requests
    const requestId = payload.requestId || payload.id || (payload.requestPayload && payload.requestPayload.conversationId);
    
    if (requestId && pendingRequests.has(requestId)) {
      // Resolve the pending promise with the webhook payload
      const { resolve } = pendingRequests.get(requestId);
      resolve(payload);
      pendingRequests.delete(requestId);
      console.log(`[Netomi Webhook] Resolved pending request: ${requestId}`);
    }
    
    // Store the conversation message for later retrieval
    const conversationId = payload.requestPayload && payload.requestPayload.conversationId;
    if (conversationId) {
      if (!conversations.has(conversationId)) {
        conversations.set(conversationId, []);
      }
      conversations.get(conversationId).push({
        timestamp: Date.now(),
        payload: payload,
        type: 'webhook_response'
      });
    }
    
    // Store webhook message for frontend display
    const webhookMessage = {
      timestamp: Date.now(),
      data: payload,
      headers: req.headers,
      source: 'webhook_endpoint'
    };
    
    webhookMessages.push(webhookMessage);
    
    // Keep only last 100 messages in memory
    if (webhookMessages.length > 100) {
      webhookMessages.shift();
    }
    
    // Broadcast to connected SSE clients
    broadcastWebhookUpdate(webhookMessage);
    
    // Acknowledge the webhook
    res.status(200).json({ 
      success: true, 
      message: 'Webhook received successfully',
      requestId: requestId 
    });
    
  } catch (error) {
    console.error('[Netomi Webhook] Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get conversation history
app.get('/api/conversations/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  const messages = conversations.get(conversationId) || [];
  
  res.json({
    ok: true,
    conversationId,
    messageCount: messages.length,
    messages: messages
  });
});

// Get all conversations
app.get('/api/conversations', (req, res) => {
  const allConversations = {};
  for (const [id, messages] of conversations.entries()) {
    allConversations[id] = {
      messageCount: messages.length,
      lastActivity: messages.length > 0 ? Math.max(...messages.map(m => m.timestamp)) : null
    };
  }
  
  res.json({
    ok: true,
    conversations: allConversations
  });
});

// Test server connection without exposing tokens
app.get('/api/netomi/test-connection', async (_req, res) => {
  try {
    const token = getCurrentServerToken();
    
    if (!token) {
      console.log('[Server Connection] No valid token available');
      return res.status(503).json({ 
        success: false, 
        error: 'Server token not available',
        message: 'Token refresh in progress, please retry' 
      });
    }
    
    console.log('[Server Connection] Server has valid token, connection OK');
    return res.json({ 
      success: true, 
      message: 'Server connection OK',
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[Server Connection] Connection test error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Connection test failed',
      message: error.message 
    });
  }
});

// Legacy endpoint - deprecated (tokens should not be exposed to client)
app.get('/api/netomi/generate-token', async (_req, res) => {
  console.warn('[DEPRECATED] /api/netomi/generate-token endpoint accessed - tokens should not be exposed to client');
  
  try {
    const token = getCurrentServerToken();
    
    if (!token) {
      console.log('[Server Token] No valid token available for client, token refresh in progress');
      return res.status(503).json({ 
        ok: false, 
        error: 'Server token not available',
        message: 'Please retry in a few seconds' 
      });
    }
    
    // Return connection status instead of actual token
    console.log('[Server Token] Connection OK (legacy endpoint)');
    return res.json({ 
      ok: true, 
      data: { 
        status: 'connected',
        message: 'Server connection OK - tokens are managed server-side'
      }
    });
  } catch (err) {
    console.error('Server token fetch failed:', err);
    return res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// Test route to call refresh-token API
app.post('/api/netomi/refresh-token', async (req, res) => {
  try {
    const { refreshToken: refreshTokenValue } = req.body || {};
    
    if (!refreshTokenValue) {
      return res.status(400).json({ error: 'Missing `refreshToken` in request body.' });
    }

    const data = await refreshToken(refreshTokenValue);
    console.log('[Netomi refresh token]', data);
    return res.status(200).json({ ok: true, data });
  } catch (err) {
    console.error('Refresh token failed:', err);
    return res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// Test route to call process-message API with webhook support
app.post('/api/netomi/process-message', async (req, res) => {
  console.log(`[Process Message]`);
  try {
    const { messageData, clientSocketId } = req.body || {};

    if (!messageData) {
      console.error('[Process Message] ERROR: Missing messageData in request body');
      return res.status(400).json({ error: 'Missing `messageData` in request body.' });
    }

    // Always use the server-managed token
    const authTokenToUse = await getValidServerTokenInternal();
    console.log('[Process Message] Using server-managed token for all requests');

    // Map conversationId -> socketId for targeted webhook routing (only if we have a valid socket)
    try {
      const convId = messageData && messageData.conversationId;
      if (convId && typeof convId === 'string' && clientSocketId) {
        conversationToSocket.set(convId, clientSocketId);
        const client = connectedClients.get(clientSocketId);
        if (client) {
          if (!client.conversationIds) client.conversationIds = new Set();
          client.conversationIds.add(convId);
          console.log(`[Routing] conversationId ${convId} mapped to socket ${clientSocketId}`);
        }
      }
    } catch (_) {}

    // Always return immediately on acknowledgment; do not wait for webhook here
    const data = await processMessage(messageData, authTokenToUse, /* waitForWebhook */ false, /* timeoutMs */ 0);
    console.log('[Netomi process message] Ack only (webhook will arrive via Socket.IO)');
    return res.status(200).json({ ok: true, data: data ?? {} });
  } catch (err) {
    console.error('Process message failed:', err);
    return res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});


app.get('/', (_req, res) => res.sendFile('rexy.html', { root: 'public' }));

app.get('/rexy', (_req, res) => res.sendFile('rexy.html', { root: 'public' }));

app.get('/netomi', (_req, res) => res.sendFile('netomi.html', { root: 'public' }));

// Test endpoint to verify webhook endpoint is accessible
app.get('/webhook/test', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is accessible',
    timestamp: new Date().toISOString(),
    url: `${req.protocol}://${req.get('host')}/webhook/netomi`
  });
});

// Webhook configuration info endpoint
app.get('/webhook/info', (req, res) => {
  res.json({
    webhook_endpoint: `${req.protocol}://${req.get('host')}/webhook/netomi`,
    authentication: {
      method: 'Bearer Token',
      header: 'Authorization: Bearer <token>',
      required: true
    },
    bearer_token: CONFIG.WEBHOOK_BEARER_TOKEN,
    instructions: {
      netomi_team: [
        "Please configure the following webhook URL in Netomi:",
        `URL: ${req.protocol}://${req.get('host')}/webhook/netomi`,
        "Method: POST",
        "Authentication: Bearer Token",
        `Authorization Header: Bearer ${CONFIG.WEBHOOK_BEARER_TOKEN}`,
        "Content-Type: application/json"
      ]
    },
    test_command: `curl -X POST "${req.protocol}://${req.get('host')}/webhook/netomi" -H "Authorization: Bearer ${CONFIG.WEBHOOK_BEARER_TOKEN}" -H "Content-Type: application/json" -d '{"test": "payload"}'`
  });
});

// Get recent webhook messages for frontend display
app.get('/api/webhook-messages', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const recentMessages = webhookMessages.slice(-limit);
  
  res.json({
    success: true,
    count: recentMessages.length,
    total: webhookMessages.length,
    messages: recentMessages
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  
  // Store unauthenticated client initially
  connectedClients.set(socket.id, {
    socket,
    authToken: null,
    authenticated: false,
    connectedAt: Date.now()
  });
  
  // Send initial connection confirmation
  socket.emit('connected', {
    success: true,
    message: 'Socket.IO connection established',
    clientId: socket.id
  });
  
  // Handle client info (no auth token needed from client)
  socket.on('authenticate', (data) => {
    const { clientInfo } = data;
    console.log(`[Socket.IO] Client ${socket.id} sending client info`);
    
    // Update client with info (no auth token from client)
    connectedClients.set(socket.id, {
      socket,
      clientInfo,
      authenticated: true, // Server manages auth, client is always "authenticated"
      connectedAt: Date.now()
    });
    
    // Send confirmation
    socket.emit('authenticated', {
      success: true,
      message: 'Socket.IO connection established',
      clientId: socket.id
    });
  });
  
  // Handle client disconnect
  socket.on('disconnect', (reason) => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}, reason: ${reason}`);
    const client = connectedClients.get(socket.id);
    if (client && client.conversationIds) {
      client.conversationIds.forEach((convId) => {
        const mapped = conversationToSocket.get(convId);
        if (mapped === socket.id) {
          conversationToSocket.delete(convId);
          console.log(`[Routing] Unmapped conversation ${convId} from socket ${socket.id}`);
        }
      });
    }
    connectedClients.delete(socket.id);
  });
  
  // Handle ping for connection testing
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });
});

// Function to send webhook updates to clients with matching conversation ID
function broadcastWebhookUpdate(webhookMessage) {
  const deliveryId = crypto.randomUUID();
  const eventData = {
    type: 'webhook_update',
    message: webhookMessage,
    timestamp: Date.now(),
    deliveryId
  };

  // Extract conversationId from webhook payload
  const convId = webhookMessage && webhookMessage.data && webhookMessage.data.requestPayload && webhookMessage.data.requestPayload.conversationId;
  
  if (!convId) {
    console.warn(`[Socket.IO] No conversationId found in webhook payload (deliveryId=${deliveryId})`);
    return;
  }

  // Find the socket mapped to this conversationId
  const targetSocketId = conversationToSocket.get(convId);
  
  if (!targetSocketId) {
    console.warn(`[Socket.IO] No socket found for conversation ${convId} (deliveryId=${deliveryId})`);
    return;
  }

  if (!connectedClients.has(targetSocketId)) {
    console.warn(`[Socket.IO] Socket ${targetSocketId} no longer connected for conversation ${convId} (deliveryId=${deliveryId})`);
    // Clean up stale mapping
    conversationToSocket.delete(convId);
    return;
  }

  // Send only to the targeted socket
  console.log(`[Socket.IO] Targeted send for conversation ${convId} to socket ${targetSocketId} (deliveryId=${deliveryId})`);
  const client = connectedClients.get(targetSocketId);
  sendWithRetry(client, targetSocketId, 1);

  function sendWithRetry(client, clientId, attempt = 1) {
    try {
      client.socket
        .timeout(10000)
        .emit('webhook_update', eventData, (err, ack) => {
          if (err) {
            console.warn(`[Socket.IO] Ack timeout for client ${clientId} on attempt ${attempt} (deliveryId=${deliveryId})`);
            if (attempt < 2) {
              // Check connection and retry once
              if (client.socket.connected) {
                console.log(`[Socket.IO] Retrying send to ${clientId} (deliveryId=${deliveryId})`);
                sendWithRetry(client, clientId, attempt + 1);
              } else {
                console.warn(`[Socket.IO] Client ${clientId} not connected; skipping retry`);
                // Clean up mapping if client disconnected
                if (conversationToSocket.get(convId) === clientId) {
                  conversationToSocket.delete(convId);
                  console.log(`[Routing] Cleaned up mapping for conversation ${convId} from disconnected socket ${clientId}`);
                }
              }
            }
            return;
          }
          console.log(`[Socket.IO] Ack received from client ${clientId} (deliveryId=${deliveryId})`, ack);
        });
    } catch (error) {
      console.error(`[Socket.IO] Failed to send to client ${clientId}:`, error);
      connectedClients.delete(clientId);
      // Clean up conversation mapping if this was the mapped socket
      if (conversationToSocket.get(convId) === clientId) {
        conversationToSocket.delete(convId);
        console.log(`[Routing] Cleaned up mapping for conversation ${convId} from failed socket ${clientId}`);
      }
    }
  }
}

// Initialize server token and start server
async function startServer() {
  try {
    // Generate initial server token
    console.log('[Server Startup] Generating initial server token...');
    await generateServerToken();
    
    // Set up automatic token refresh
    setupTokenRefresh();
    
    // Start the HTTP server
    httpServer.listen(CONFIG.PORT, () => {
      console.log(`🌐 Netomi HTTP Server listening on http://localhost:${CONFIG.PORT}`);
      console.log(`🔌 Socket.IO enabled for real-time communication`);
      console.log(`🔗 Webhook endpoint: http://localhost:${CONFIG.PORT}/webhook/netomi`);
      console.log(`🧪 Test webhook: http://localhost:${CONFIG.PORT}/webhook/test`);
      console.log(`📋 Webhook info: http://localhost:${CONFIG.PORT}/webhook/info`);
      console.log(`🔐 Bearer Token: ${CONFIG.WEBHOOK_BEARER_TOKEN}`);
      console.log(`🔄 Server token auto-refresh: Every 23 hours`);
      console.log(`\n📝 For Netomi Team:`);
      console.log(`   URL: http://localhost:${CONFIG.PORT}/webhook/netomi`);
      console.log(`   Authorization: Bearer ${CONFIG.WEBHOOK_BEARER_TOKEN}`);
    });
  } catch (error) {
    console.error('[Server Startup] Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
