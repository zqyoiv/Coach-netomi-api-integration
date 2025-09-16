#!/usr/bin/env node

// Environment Setup Script
// -------------------------
// Generates a .env file with a secure webhook bearer token

import fs from 'fs';
import crypto from 'crypto';

const BEARER_TOKEN = 'netomi-webhook-66f1dca1b5a5442667effe2be71e1ad2cbb3a249602582ba3f283efc2ab1ef42';

const envContent = `# Netomi API Configuration
# Fill in your actual values from the Netomi team

# Netomi API Base URL
NETOMI_BASE_URL=https://api.netomi.com

# Netomi Authentication
NETOMI_AUTH_URL=https://auth-us.netomi.com/v1/auth/generate-token
NETOMI_API_KEY=your_api_key_here

# Netomi Workspace/Bot Configuration
NETOMI_WORKSPACE_ID=your_workspace_id
NETOMI_BOT_ID=your_bot_id

# Netomi Channel Configuration
NETOMI_CHANNEL=CHAT
NETOMI_CHANNEL_REF_ID=your_channel_ref_id
NETOMI_VIRTUAL_AGENT_ID=your_virtual_agent_id

# Webhook Configuration
NETOMI_WEBHOOK_SECRET=your_webhook_secret

# Webhook Bearer Token (Required for Netomi webhook authentication)
# This token secures your webhook endpoint - provide this to the Netomi team
WEBHOOK_BEARER_TOKEN=${BEARER_TOKEN}

# Server Configuration
# HTTP Port (default: 3000)
HTTP_PORT=3000

# HTTPS Port (default: 3443)
HTTPS_PORT=3443

# Force HTTPS - redirects all HTTP traffic to HTTPS (default: false)
FORCE_HTTPS=false

# SSL Certificate Configuration
SSL_CERT_PATH=./certs/server.crt
SSL_KEY_PATH=./certs/server.key

# SSL Certificate Details (used when generating self-signed certificates)
SSL_COUNTRY=US
SSL_STATE=California
SSL_CITY=San Francisco
SSL_ORG=Development
SSL_UNIT=IT Department
SSL_COMMON_NAME=localhost
`;

try {
  // Check if .env already exists
  if (fs.existsSync('.env')) {
    console.log('⚠️  .env file already exists!');
    console.log('Creating .env.new instead to avoid overwriting your existing configuration.\n');
    
    fs.writeFileSync('.env.new', envContent);
    console.log('✅ Created .env.new with your secure bearer token!');
    console.log('\nTo use the new configuration:');
    console.log('1. Review the contents of .env.new');
    console.log('2. Copy any new values you need to your existing .env');
    console.log('3. Or replace your .env: copy .env.new .env');
  } else {
    fs.writeFileSync('.env', envContent);
    console.log('✅ Created .env file with your secure bearer token!');
  }
  
  console.log('\n🔐 Your Webhook Bearer Token:');
  console.log(`${BEARER_TOKEN}`);
  
  console.log('\n📋 For Netomi Team Configuration:');
  console.log('================================');
  console.log('Please provide the following to the Netomi team:');
  console.log('');
  console.log('Webhook URL: https://your-domain.com/webhook/netomi');
  console.log('Method: POST');
  console.log('Authentication: Bearer Token');
  console.log(`Authorization Header: Bearer ${BEARER_TOKEN}`);
  console.log('Content-Type: application/json');
  
  console.log('\n📝 Next Steps:');
  console.log('1. Fill in your actual Netomi API credentials in the .env file');
  console.log('2. Make your server publicly accessible (ngrok, CloudFlare tunnel, etc.)');
  console.log('3. Provide the public webhook URL and bearer token to Netomi team');
  console.log('4. Test with: npm run test:webhook');
  
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  process.exit(1);
}

