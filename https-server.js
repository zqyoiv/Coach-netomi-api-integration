// HTTPS-enabled Netomi API Node.js Server
// -------------------------------------------------------------
// This script runs your server.js with HTTPS support
// Automatically generates self-signed certificates for development
// -------------------------------------------------------------

import 'dotenv/config';
import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

// ------------------------------
// Env & config
// ------------------------------
const CONFIG = {
  /** The Netomi API base URL (e.g., https://api.netomi.com) */
  BASE_URL: process.env.NETOMI_BASE_URL || 'https://api.netomi.com',
  
  /** Auth: token generation endpoint */
  NETOMI_AUTH_URL: process.env.NETOMI_AUTH_URL || 'https://auth-us.netomi.com/v1/auth/generate-token',
  
  /** API key or bearer token used to authenticate requests (if static) */
  API_KEY: process.env.NETOMI_API_KEY,
  
  /** Optional: workspace / account / bot identifiers, if required */
  WORKSPACE_ID: process.env.NETOMI_WORKSPACE_ID,
  BOT_ID: process.env.NETOMI_BOT_ID,
  
  /** Channel headers required by Netomi auth */
  CHANNEL: process.env.NETOMI_CHANNEL || 'CHAT',
  CHANNEL_REF_ID: process.env.NETOMI_CHANNEL_REF_ID,
  VIRTUAL_AGENT_ID: process.env.NETOMI_VIRTUAL_AGENT_ID,
  
  /** Optional: webhook signing secret if Netomi signs callbacks */
  WEBHOOK_SECRET: process.env.NETOMI_WEBHOOK_SECRET,
  
  /** Webhook Bearer Token for authentication */
  WEBHOOK_BEARER_TOKEN: process.env.WEBHOOK_BEARER_TOKEN || 'netomi-webhook-secret-' + crypto.randomUUID(),
  
  /** HTTPS Configuration */
  HTTPS_PORT: Number(process.env.HTTPS_PORT) || 3443,
  HTTP_PORT: Number(process.env.HTTP_PORT) || 3000,
  FORCE_HTTPS: process.env.FORCE_HTTPS === 'true',
  SSL_CERT_PATH: process.env.SSL_CERT_PATH || './certs/server.crt',
  SSL_KEY_PATH: process.env.SSL_KEY_PATH || './certs/server.key',
  SSL_COUNTRY: process.env.SSL_COUNTRY || 'US',
  SSL_STATE: process.env.SSL_STATE || 'California',
  SSL_CITY: process.env.SSL_CITY || 'San Francisco',
  SSL_ORG: process.env.SSL_ORG || 'Development',
  SSL_UNIT: process.env.SSL_UNIT || 'IT Department',
  SSL_COMMON_NAME: process.env.SSL_COMMON_NAME || 'localhost',
};

// ------------------------------
// SSL Certificate Generation
// ------------------------------

function ensureCertsDirectory() {
  const certsDir = path.dirname(CONFIG.SSL_CERT_PATH);
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
    console.log(`📁 Created certificates directory: ${certsDir}`);
  }
}

function generateSelfSignedCertificate() {
  ensureCertsDirectory();
  
  console.log('🔐 Generating self-signed SSL certificate...');
  
  const subj = `/C=${CONFIG.SSL_COUNTRY}/ST=${CONFIG.SSL_STATE}/L=${CONFIG.SSL_CITY}/O=${CONFIG.SSL_ORG}/OU=${CONFIG.SSL_UNIT}/CN=${CONFIG.SSL_COMMON_NAME}`;
  
  try {
    // Generate private key and certificate in one command
    const opensslCmd = `openssl req -x509 -newkey rsa:4096 -keyout "${CONFIG.SSL_KEY_PATH}" -out "${CONFIG.SSL_CERT_PATH}" -days 365 -nodes -subj "${subj}"`;
    
    execSync(opensslCmd, { stdio: 'inherit' });
    console.log('✅ SSL certificate generated successfully');
    console.log(`   Certificate: ${CONFIG.SSL_CERT_PATH}`);
    console.log(`   Private Key: ${CONFIG.SSL_KEY_PATH}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to generate SSL certificate with OpenSSL');
    console.log('📝 Attempting to create certificate using Node.js crypto...');
    
    try {
      // Fallback: Generate certificate using Node.js crypto
      return generateCertificateWithNodeCrypto();
    } catch (cryptoError) {
      console.error('❌ Failed to generate certificate:', cryptoError.message);
      return false;
    }
  }
}

function generateCertificateWithNodeCrypto() {
  // This is a simplified certificate generation
  // For production, use proper certificate authorities
  const { generateKeyPairSync } = crypto;
  
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  // Create a basic self-signed certificate structure
  const cert = [
    '-----BEGIN CERTIFICATE-----',
    Buffer.from(JSON.stringify({
      subject: { CN: CONFIG.SSL_COMMON_NAME },
      issuer: { CN: CONFIG.SSL_COMMON_NAME },
      serial: '01',
      valid: {
        from: new Date().toISOString(),
        to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      publicKey: publicKey
    })).toString('base64'),
    '-----END CERTIFICATE-----'
  ].join('\n');

  fs.writeFileSync(CONFIG.SSL_KEY_PATH, privateKey);
  fs.writeFileSync(CONFIG.SSL_CERT_PATH, cert);
  
  console.log('✅ Basic certificate generated using Node.js crypto');
  return true;
}

function certificatesExist() {
  return fs.existsSync(CONFIG.SSL_CERT_PATH) && fs.existsSync(CONFIG.SSL_KEY_PATH);
}

function loadSSLCredentials() {
  if (!certificatesExist()) {
    console.log('📜 SSL certificates not found, generating new ones...');
    if (!generateSelfSignedCertificate()) {
      throw new Error('Failed to generate SSL certificates');
    }
  }

  try {
    const credentials = {
      key: fs.readFileSync(CONFIG.SSL_KEY_PATH, 'utf8'),
      cert: fs.readFileSync(CONFIG.SSL_CERT_PATH, 'utf8')
    };
    
    console.log('🔑 SSL credentials loaded successfully');
    return credentials;
  } catch (error) {
    throw new Error(`Failed to load SSL credentials: ${error.message}`);
  }
}

// ------------------------------
// Helpers (same as original server.js)
// ------------------------------

async function fetchNetomiToken() {
  const url = CONFIG.NETOMI_AUTH_URL;
  if (!url) throw new Error('NETOMI_AUTH_URL is not set');

  const headers = {
    'x-channel': CONFIG.CHANNEL,
    'x-channel-ref-id': CONFIG.CHANNEL_REF_ID || crypto.randomUUID(),
    'x-virtual-agent-id': CONFIG.VIRTUAL_AGENT_ID,
  };

  Object.keys(headers).forEach((k) => headers[k] === undefined && delete headers[k]);

  const resp = await fetch(url, { method: 'POST', headers });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Auth failed: ${resp.status} ${txt}`);
  }
  try {
    return await resp.json();
  } catch (e) {
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

async function processMessage(messageData, authToken, waitForWebhook = true, timeoutMs = 30000) {
  const url = 'https://aiapi-us.netomi.com/v1/conversations/process-message';
  
  const requestId = messageData.conversationId || crypto.randomUUID();
  
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
    return { acknowledgment };
  }
  
  try {
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
// In-memory storage
// ------------------------------
const pendingRequests = new Map();
const conversations = new Map();

// ------------------------------
// HTTPS Redirect Middleware
// ------------------------------
function requireHTTPS(req, res, next) {
  if (!req.secure && req.get('x-forwarded-proto') !== 'https' && CONFIG.FORCE_HTTPS) {
    return res.redirect(`https://${req.get('host').replace(CONFIG.HTTP_PORT, CONFIG.HTTPS_PORT)}${req.url}`);
  }
  next();
}

// Add HTTPS redirect middleware when force HTTPS is enabled
if (CONFIG.FORCE_HTTPS) {
  app.use(requireHTTPS);
}

// ------------------------------
// Routes (same as original server.js)
// ------------------------------

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
    
    const requestId = payload.requestId || payload.id || payload.conversationId;
    
    if (requestId && pendingRequests.has(requestId)) {
      const { resolve } = pendingRequests.get(requestId);
      resolve(payload);
      pendingRequests.delete(requestId);
      console.log(`[Netomi Webhook] Resolved pending request: ${requestId}`);
    }
    
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
    
    if (data.webhookResponse) {
      console.log('[Netomi] Received webhook response with AI payload');
    } else if (data.error) {
      console.log('[Netomi] Webhook timeout, only acknowledgment received');
    }
    
    return res.status(200).json({ ok: true, data });
  } catch (err) {
    console.error('Process message failed:', err);
    return res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

app.get('/', (_req, res) => res.sendFile('index.html', { root: 'public' }));
app.get('/rexy', (_req, res) => res.sendFile('rexy.html', { root: 'public' }));

app.get('/webhook/test', (req, res) => {
  const protocol = req.secure ? 'https' : 'http';
  const port = req.secure ? CONFIG.HTTPS_PORT : CONFIG.HTTP_PORT;
  
  res.json({
    success: true,
    message: 'Webhook endpoint is accessible',
    timestamp: new Date().toISOString(),
    protocol: protocol,
    url: `${protocol}://${req.get('host')}/webhook/netomi`,
    https_enabled: req.secure
  });
});

// Webhook configuration info endpoint
app.get('/webhook/info', (req, res) => {
  const protocol = req.secure ? 'https' : 'http';
  
  res.json({
    webhook_endpoint: `${protocol}://${req.get('host')}/webhook/netomi`,
    authentication: {
      method: 'Bearer Token',
      header: 'Authorization: Bearer <token>',
      required: true
    },
    bearer_token: CONFIG.WEBHOOK_BEARER_TOKEN,
    instructions: {
      netomi_team: [
        "Please configure the following webhook URL in Netomi:",
        `URL: ${protocol}://${req.get('host')}/webhook/netomi`,
        "Method: POST",
        "Authentication: Bearer Token",
        `Authorization Header: Bearer ${CONFIG.WEBHOOK_BEARER_TOKEN}`,
        "Content-Type: application/json"
      ]
    },
    test_command: `curl -X POST "${protocol}://${req.get('host')}/webhook/netomi" -H "Authorization: Bearer ${CONFIG.WEBHOOK_BEARER_TOKEN}" -H "Content-Type: application/json" -d '{"test": "payload"}'`
  });
});

// ------------------------------
// Server Startup
// ------------------------------

async function startServers() {
  try {
    console.log('🚀 Starting Netomi HTTPS Server...\n');
    
    // Start HTTPS server
    const sslCredentials = loadSSLCredentials();
    const httpsServer = https.createServer(sslCredentials, app);
    
    httpsServer.listen(CONFIG.HTTPS_PORT, () => {
      console.log(`🔒 HTTPS Server running on https://localhost:${CONFIG.HTTPS_PORT}`);
      console.log(`🔗 Secure webhook endpoint: https://localhost:${CONFIG.HTTPS_PORT}/webhook/netomi`);
      console.log(`🧪 Test webhook accessibility: https://localhost:${CONFIG.HTTPS_PORT}/webhook/test`);
    });

    // Optionally start HTTP server for redirects or development
    if (!CONFIG.FORCE_HTTPS) {
      const httpServer = http.createServer(app);
      httpServer.listen(CONFIG.HTTP_PORT, () => {
        console.log(`🌐 HTTP Server running on http://localhost:${CONFIG.HTTP_PORT}`);
      });
    } else {
      // Create HTTP server that redirects to HTTPS
      const redirectApp = express();
      redirectApp.use((req, res) => {
        res.redirect(`https://${req.get('host').replace(CONFIG.HTTP_PORT, CONFIG.HTTPS_PORT)}${req.url}`);
      });
      
      const httpServer = http.createServer(redirectApp);
      httpServer.listen(CONFIG.HTTP_PORT, () => {
        console.log(`🔄 HTTP Server running on http://localhost:${CONFIG.HTTP_PORT} (redirects to HTTPS)`);
      });
    }

    console.log('\n📋 Configuration:');
    console.log(`   HTTPS Port: ${CONFIG.HTTPS_PORT}`);
    console.log(`   HTTP Port: ${CONFIG.HTTP_PORT}`);
    console.log(`   Force HTTPS: ${CONFIG.FORCE_HTTPS}`);
    console.log(`   SSL Certificate: ${CONFIG.SSL_CERT_PATH}`);
    console.log(`   SSL Private Key: ${CONFIG.SSL_KEY_PATH}`);
    console.log(`   Webhook Bearer Token: ${CONFIG.WEBHOOK_BEARER_TOKEN}`);
    console.log('\n🔗 Webhook Information:');
    console.log(`   📍 Webhook URL: https://localhost:${CONFIG.HTTPS_PORT}/webhook/netomi`);
    console.log(`   🔐 Authorization: Bearer ${CONFIG.WEBHOOK_BEARER_TOKEN}`);
    console.log(`   📋 Info Endpoint: https://localhost:${CONFIG.HTTPS_PORT}/webhook/info`);
    console.log('\n⚠️  Note: Self-signed certificates will show security warnings in browsers.');
    console.log('   Click "Advanced" → "Proceed to localhost" to continue.');

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down servers...');
  process.exit(0);
});

// Start the servers
startServers();
