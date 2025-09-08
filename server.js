// Netomi API Node.js Starter (Express)
// -------------------------------------------------------------
// Now updated to support calling the Netomi `generate-token` API endpoint
// for testing, using environment variables provided in .env.
// -------------------------------------------------------------

import 'dotenv/config';
import express from 'express';
import crypto from 'crypto';

const app = express();
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
  const url = CONFIG.NETOMI_AUTH_URL;
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

// ------------------------------
// Routes
// ------------------------------

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

// Core route: Send a user message to Netomi
app.post('/api/netomi/send', async (req, res) => {
  try {
    const { userId, sessionId, text, channel = 'web', metadata } = req.body || {};

    if (!text) {
      return res.status(400).json({ error: 'Missing `text` in request body.' });
    }

    const payload = {
      user: { id: userId || sessionId || crypto.randomUUID() },
      message: {
        type: 'text',
        text,
      },
      channel,
      context: {
        sessionId: sessionId || undefined,
        workspaceId: CONFIG.WORKSPACE_ID || undefined,
        botId: CONFIG.BOT_ID || undefined,
        metadata: metadata || undefined,
      },
    };

    const data = await netomiFetch('/v1/messages', { method: 'POST', body: payload });

    return res.status(200).json({ ok: true, data });
  } catch (err) {
    console.error('Send failed:', err);
    return res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});


app.get('/', (_req, res) => res.sendFile('index.html', { root: 'public' }));

app.listen(CONFIG.PORT, () => {
  console.log(`Netomi Node server listening on http://localhost:${CONFIG.PORT}`);
});
