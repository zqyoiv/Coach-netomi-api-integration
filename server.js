// Netomi API Node.js Starter (Express)
// -------------------------------------------------------------
// Now updated to support calling the Netomi `generate-token` API endpoint
// for testing, using environment variables provided in .env.
// -------------------------------------------------------------

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
  }
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


function netomiHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${CONFIG.API_KEY}`,
  };
}

async function netomiFetch(path, { method = 'POST', body } = {}) {
  const url = new URL(path, CONFIG.BASE_URL).toString();
  const res = await fetch(url, {
    method,
    headers: netomiHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Netomi API error: ${res.status} ${txt}`);
  }
  if (res.status === 204) return null;
  return res.json();
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
      'x-integration-channel': 'CHAT_API',
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
const connectedClients = new Map(); // Store Socket.IO clients with their auth tokens

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
    // console.log('[Netomi Webhook] Payload:', JSON.stringify(payload, null, 2));
    
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
    const requestId = payload.requestId || payload.id || payload.conversationId;
    
    if (requestId && pendingRequests.has(requestId)) {
      // Resolve the pending promise with the webhook payload
      const { resolve } = pendingRequests.get(requestId);
      resolve(payload);
      pendingRequests.delete(requestId);
      console.log(`[Netomi Webhook] Resolved pending request: ${requestId}`);
    }
    
    // Store the conversation message for later retrieval
    const conversationId = payload.conversationId;
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

// Test route to call generate-token API
app.get('/api/netomi/generate-token', async (_req, res) => {
  try {
    const data = await generateToken();
    console.log('[Netomi token]', data);
    return res.status(200).json({ ok: true, data });
  } catch (err) {
    console.error('Token fetch failed:', err);
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
  try {
    const { authToken, messageData, waitForWebhook = true, timeoutMs = 30000 } = req.body || {};
    
    if (!authToken) {
      return res.status(400).json({ error: 'Missing `authToken` in request body.' });
    }
    
    if (!messageData) {
      return res.status(400).json({ error: 'Missing `messageData` in request body.' });
    }

    const data = await processMessage(messageData, authToken, waitForWebhook, timeoutMs);
    console.log('[Netomi process message]', data);
    
    if (data && data.webhookResponse) {
      console.log('[Netomi] Received webhook response with AI payload');
    } else if (data && data.error) {
      console.log('[Netomi] Webhook timeout, only acknowledgment received');
    }
    
    return res.status(200).json({ ok: true, data: data ?? {} });
  } catch (err) {
    console.error('Process message failed:', err);
    return res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});


app.get('/', (_req, res) => res.sendFile('index.html', { root: 'public' }));

app.get('/rexy', (_req, res) => res.sendFile('rexy.html', { root: 'public' }));

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
  
  // Handle client authentication (when they have a token)
  socket.on('authenticate', (data) => {
    const { authToken, clientInfo } = data;
    console.log(`[Socket.IO] Client ${socket.id} authenticating with token`);
    
    // Update client with auth info
    connectedClients.set(socket.id, {
      socket,
      authToken,
      clientInfo,
      authenticated: true,
      connectedAt: Date.now()
    });
    
    // Send confirmation
    socket.emit('authenticated', {
      success: true,
      message: 'Socket.IO connection authenticated',
      clientId: socket.id
    });
  });
  
  // Handle client disconnect
  socket.on('disconnect', (reason) => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}, reason: ${reason}`);
    connectedClients.delete(socket.id);
  });
  
  // Handle ping for connection testing
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });
});

// Function to broadcast webhook updates to all connected Socket.IO clients
function broadcastWebhookUpdate(webhookMessage) {
  const eventData = {
    type: 'webhook_update',
    message: webhookMessage,
    timestamp: Date.now()
  };

  console.log(`[Socket.IO] Broadcasting to ${connectedClients.size} connected clients`);

  // Send to all authenticated clients
  connectedClients.forEach((client, clientId) => {
    try {
      client.socket.emit('webhook_update', eventData);
    } catch (error) {
      console.error(`[Socket.IO] Failed to send to client ${clientId}:`, error);
      // Remove dead connection
      connectedClients.delete(clientId);
    }
  });
}

httpServer.listen(CONFIG.PORT, () => {
  console.log(`🌐 Netomi HTTP Server listening on http://localhost:${CONFIG.PORT}`);
  console.log(`🔌 Socket.IO enabled for real-time communication`);
  console.log(`🔗 Webhook endpoint: http://localhost:${CONFIG.PORT}/webhook/netomi`);
  console.log(`🧪 Test webhook: http://localhost:${CONFIG.PORT}/webhook/test`);
  console.log(`📋 Webhook info: http://localhost:${CONFIG.PORT}/webhook/info`);
  console.log(`🔐 Bearer Token: ${CONFIG.WEBHOOK_BEARER_TOKEN}`);
  console.log(`\n📝 For Netomi Team:`);
  console.log(`   URL: http://localhost:${CONFIG.PORT}/webhook/netomi`);
  console.log(`   Authorization: Bearer ${CONFIG.WEBHOOK_BEARER_TOKEN}`);
});
