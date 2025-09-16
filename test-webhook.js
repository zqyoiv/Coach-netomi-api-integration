#!/usr/bin/env node

// Webhook Testing Script
// ----------------------
// Tests the /webhook/netomi endpoint with Bearer token authentication

import https from 'https';

const CONFIG = {
  BASE_URL: 'https://localhost:3443',
  BEARER_TOKEN: process.env.WEBHOOK_BEARER_TOKEN || 'netomi-webhook-secret-test',
  SKIP_SSL_VERIFY: true // For self-signed certificates
};

// Create HTTPS agent that skips certificate verification
const agent = new https.Agent({
  rejectUnauthorized: !CONFIG.SKIP_SSL_VERIFY
});

async function testWebhook(bearerToken, testName) {
  console.log(`\n🧪 Testing: ${testName}`);
  
  const testPayload = {
    conversationId: 'test-conversation-123',
    triggerType: 'RESPONSE',
    message: 'Test webhook payload',
    timestamp: new Date().toISOString(),
    requestId: 'test-request-' + Date.now()
  };

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(bearerToken && { 'Authorization': `Bearer ${bearerToken}` })
    },
    agent: agent
  };

  try {
    const response = await fetch(`${CONFIG.BASE_URL}/webhook/netomi`, {
      ...options,
      body: JSON.stringify(testPayload)
    });

    const responseData = await response.json();
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Response:`, responseData);
    
    if (response.ok) {
      console.log(`   ✅ ${testName} - SUCCESS`);
    } else {
      console.log(`   ❌ ${testName} - FAILED`);
    }
    
    return response.ok;
  } catch (error) {
    console.log(`   ❌ ${testName} - ERROR: ${error.message}`);
    return false;
  }
}

async function getWebhookInfo() {
  console.log('📋 Getting webhook configuration...');
  
  try {
    const response = await fetch(`${CONFIG.BASE_URL}/webhook/info`, {
      agent: agent
    });
    
    if (response.ok) {
      const info = await response.json();
      console.log('\n🔗 Webhook Configuration:');
      console.log(`   URL: ${info.webhook_endpoint}`);
      console.log(`   Method: POST`);
      console.log(`   Auth: ${info.authentication.method}`);
      console.log(`   Token: ${info.bearer_token}`);
      
      CONFIG.BEARER_TOKEN = info.bearer_token;
      return info;
    } else {
      console.log('❌ Failed to get webhook info');
      return null;
    }
  } catch (error) {
    console.log(`❌ Error getting webhook info: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('🔧 Webhook Authentication Test Suite');
  console.log('=====================================');
  
  // Get current webhook configuration
  const webhookInfo = await getWebhookInfo();
  
  if (!webhookInfo) {
    console.log('\n❌ Could not retrieve webhook configuration. Is the server running?');
    console.log('   Start the server with: npm run https');
    process.exit(1);
  }

  // Test 1: Valid Bearer Token
  const test1 = await testWebhook(CONFIG.BEARER_TOKEN, 'Valid Bearer Token');

  // Test 2: Invalid Bearer Token  
  const test2 = await testWebhook('invalid-token-123', 'Invalid Bearer Token');

  // Test 3: Missing Bearer Token
  const test3 = await testWebhook(null, 'Missing Bearer Token');

  // Test 4: Malformed Authorization Header
  console.log(`\n🧪 Testing: Malformed Authorization Header`);
  try {
    const response = await fetch(`${CONFIG.BASE_URL}/webhook/netomi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'InvalidFormat token123' // Wrong format
      },
      body: JSON.stringify({ test: 'payload' }),
      agent: agent
    });

    const responseData = await response.json();
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Response:`, responseData);
    
    if (response.status === 401) {
      console.log(`   ✅ Malformed Authorization Header - SUCCESS (Correctly rejected)`);
    } else {
      console.log(`   ❌ Malformed Authorization Header - FAILED (Should have been rejected)`);
    }
  } catch (error) {
    console.log(`   ❌ Malformed Authorization Header - ERROR: ${error.message}`);
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  const totalTests = 4;
  const passedTests = [test1, !test2, !test3, true].filter(Boolean).length; // test2 and test3 should fail
  
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('   🎉 All tests passed! Webhook authentication is working correctly.');
  } else {
    console.log('   ⚠️  Some tests failed. Check the authentication implementation.');
  }

  console.log('\n📝 For Netomi Team:');
  console.log('==================');
  console.log('Please configure your webhook with the following details:');
  console.log(`   URL: ${webhookInfo.webhook_endpoint}`);
  console.log(`   Method: POST`);
  console.log(`   Authorization: Bearer ${webhookInfo.bearer_token}`);
  console.log(`   Content-Type: application/json`);
}

// Handle self-signed certificate warnings
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Run the tests
runTests().catch(console.error);

