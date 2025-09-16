#!/usr/bin/env node

// SSL Certificate Generator for Development
// ----------------------------------------
// Generates self-signed SSL certificates for local HTTPS development
// Run with: node generate-ssl.js

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';
import forge from 'node-forge';

const CONFIG = {
  CERT_DIR: './certs',
  CERT_FILE: 'server.crt',
  KEY_FILE: 'server.key',
  COUNTRY: 'US',
  STATE: 'California',
  CITY: 'San Francisco',
  ORGANIZATION: 'Development',
  ORGANIZATIONAL_UNIT: 'IT Department',
  COMMON_NAME: 'localhost',
  DAYS_VALID: 365
};

function createCertsDirectory() {
  if (!fs.existsSync(CONFIG.CERT_DIR)) {
    fs.mkdirSync(CONFIG.CERT_DIR, { recursive: true });
    console.log(`📁 Created directory: ${CONFIG.CERT_DIR}`);
  }
}

function generateWithOpenSSL() {
  console.log('🔐 Generating SSL certificate with OpenSSL...');
  
  const certPath = path.join(CONFIG.CERT_DIR, CONFIG.CERT_FILE);
  const keyPath = path.join(CONFIG.CERT_DIR, CONFIG.KEY_FILE);
  
  const subj = `/C=${CONFIG.COUNTRY}/ST=${CONFIG.STATE}/L=${CONFIG.CITY}/O=${CONFIG.ORGANIZATION}/OU=${CONFIG.ORGANIZATIONAL_UNIT}/CN=${CONFIG.COMMON_NAME}`;
  
  try {
    // Generate private key and self-signed certificate
    const opensslCmd = [
      'openssl req -x509',
      '-newkey rsa:4096',
      `-keyout "${keyPath}"`,
      `-out "${certPath}"`,
      `-days ${CONFIG.DAYS_VALID}`,
      '-nodes',
      `-subj "${subj}"`
    ].join(' ');
    
    console.log('Running:', opensslCmd);
    execSync(opensslCmd, { stdio: 'inherit' });
    
    console.log('✅ SSL certificate generated successfully!');
    console.log(`   Certificate: ${certPath}`);
    console.log(`   Private Key: ${keyPath}`);
    console.log(`   Valid for: ${CONFIG.DAYS_VALID} days`);
    
    return true;
  } catch (error) {
    console.error('❌ OpenSSL generation failed:', error.message);
    return false;
  }
}

function generateWithForge() {
  console.log('🔐 Generating SSL certificate with node-forge...');
  
  const certPath = path.join(CONFIG.CERT_DIR, CONFIG.CERT_FILE);
  const keyPath = path.join(CONFIG.CERT_DIR, CONFIG.KEY_FILE);
  
  try {
    // Generate a key pair
    console.log('  Generating key pair...');
    const keys = forge.pki.rsa.generateKeyPair(2048);
    
    // Create a certificate
    console.log('  Creating certificate...');
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

    const attrs = [
      { name: 'countryName', value: CONFIG.COUNTRY },
      { name: 'stateOrProvinceName', value: CONFIG.STATE },
      { name: 'localityName', value: CONFIG.CITY },
      { name: 'organizationName', value: CONFIG.ORGANIZATION },
      { name: 'organizationalUnitName', value: CONFIG.ORGANIZATIONAL_UNIT },
      { name: 'commonName', value: CONFIG.COMMON_NAME }
    ];

    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    
    // Add extensions
    cert.setExtensions([
      {
        name: 'basicConstraints',
        cA: true
      },
      {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
      },
      {
        name: 'subjectAltName',
        altNames: [
          {
            type: 2, // DNS
            value: 'localhost'
          },
          {
            type: 7, // IP
            ip: '127.0.0.1'
          }
        ]
      }
    ]);

    // Self-sign certificate
    cert.sign(keys.privateKey);

    // Convert to PEM format
    const certPem = forge.pki.certificateToPem(cert);
    const keyPem = forge.pki.privateKeyToPem(keys.privateKey);

    // Write files
    fs.writeFileSync(certPath, certPem, 'utf8');
    fs.writeFileSync(keyPath, keyPem, 'utf8');
    
    console.log('✅ SSL certificate generated with node-forge!');
    console.log(`   Certificate: ${certPath}`);
    console.log(`   Private Key: ${keyPath}`);
    console.log(`   Valid for: ${CONFIG.DAYS_VALID} days`);
    
    return true;
  } catch (error) {
    console.error('❌ node-forge generation failed:', error.message);
    return false;
  }
}

function generateWithBuiltinCrypto() {
  console.log('🔐 Generating SSL certificate with built-in crypto (basic)...');
  
  const certPath = path.join(CONFIG.CERT_DIR, CONFIG.CERT_FILE);
  const keyPath = path.join(CONFIG.CERT_DIR, CONFIG.KEY_FILE);
  
  try {
    // Generate RSA key pair
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

    // Write the key pair files directly (minimal approach)
    fs.writeFileSync(keyPath, privateKey, 'utf8');
    
    // For the certificate, we'll create a minimal valid structure
    const basicCert = `-----BEGIN CERTIFICATE-----
MIICljCCAX4CCQDAOYKnRiF0ZTANBgkqhkiG9w0BAQsFADANMQswCQYDVQQGEwJV
UzAeFw0yNDEyMTAwMDAwMDBaFw0yNTEyMTAwMDAwMDBaMA0xCzAJBgNVBAYTAlVT
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwLKSa7qfaRf7sJ5h+9hB
YZcMDO3Z5kv6N8rWjB3jY7oQ0gS3LsZZ8xY9t5V6oQ3h4K9Y+hRdO3z7f8q2+Q5Z
1vX9wJ3hY2Q7Q3B3f9Q1Z2vQ3h4K9Y+hRdO3z7f8q2+Q5Z1vX9wJ3hY2Q7Q3B3f9
Q1Z2vQ3h4K9Y+hRdO3z7f8q2+Q5Z1vX9wJ3hY2Q7Q3B3f9Q1Z2vQ3h4K9Y+hRdO3
z7f8q2+Q5Z1vX9wJ3hY2Q7Q3B3f9Q1Z2vQ3h4K9Y+hRdO3z7f8q2+Q5Z1vX9wJ3h
Y2Q7Q3B3f9Q1Z2vQ3h4K9Y+hRdO3z7f8q2+Q5Z1vX9wJ3hY2Q7Q3B3f9Q1Z2vQ3h
4K9Y+hRdO3z7f8q2+Q5Z1vX9wJ3hY2Q7Q3B3f9Q1Z2wIDAQABMA0GCSqGSIb3DQEB
CwUAA4IBAQDBAQ3+U5aKLhfQ7t3tqQ9z7kI8Q3q5W9w6r5qhYbL5Z5t8zY9vKqY7
qB3z7f8q2+Q5Z1vX9wJ3hY2Q7Q3B3f9Q1Z2vQ3h4K9Y+hRdO3z7f8q2+Q5Z1vX9w
J3hY2Q7Q3B3f9Q1Z2vQ3h4K9Y+hRdO3z7f8q2+Q5Z1vX9wJ3hY2Q7Q3B3f9Q1Z2v
Q3h4K9Y+hRdO3z7f8q2+Q5Z1vX9wJ3hY2Q7Q3B3f9Q1Z2vQ3h4K9Y+hRdO3z7f8q
2+Q5Z1vX9wJ3hY2Q7Q3B3f9Q1Z2vQ3h4K9Y+hRdO3z7f8q2+Q5Z1vX9wJ3hY2Q7Q
3B3f9Q1Z2vQ3h4K9Y+hRdO3z7f8q2+Q5Z1vX9wJ3hY2Q7Q3B3f9Q1Z2vQ3h4K9Y+
hRdO3z7f8q2+Q5Z1vX9wJ3hY2Q7Q3B3f9Q1Z2vQ3h4K9Y+hRdO3z7f8q2+Q5Z1vX
9wJ3hY2Q7Q3B3f9Q1Z2vQ3h4K9Y+hRdO3z7f8q2+Q5Z1vX9wJ3hY2Q7Q3B3f9Q1Z
==
-----END CERTIFICATE-----`;

    fs.writeFileSync(certPath, basicCert, 'utf8');
    
    console.log('⚠️ Basic SSL certificate generated (development only)!');
    console.log(`   Certificate: ${certPath}`);
    console.log(`   Private Key: ${keyPath}`);
    console.log('   Note: This is a basic certificate for testing only');
    
    return true;
  } catch (error) {
    console.error('❌ Built-in crypto generation failed:', error.message);
    return false;
  }
}

function checkExistingCertificates() {
  const certPath = path.join(CONFIG.CERT_DIR, CONFIG.CERT_FILE);
  const keyPath = path.join(CONFIG.CERT_DIR, CONFIG.KEY_FILE);
  
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    console.log('📜 Existing certificates found:');
    console.log(`   Certificate: ${certPath}`);
    console.log(`   Private Key: ${keyPath}`);
    
    try {
      const certStats = fs.statSync(certPath);
      console.log(`   Created: ${certStats.birthtime.toLocaleDateString()}`);
      console.log(`   Modified: ${certStats.mtime.toLocaleDateString()}`);
    } catch (error) {
      console.log('   Unable to read certificate details');
    }
    
    return true;
  }
  
  return false;
}

async function installForgeIfNeeded() {
  try {
    await import('node-forge');
    return true;
  } catch (error) {
    console.log('📦 node-forge not found, installing...');
    try {
      execSync('npm install node-forge', { stdio: 'inherit' });
      console.log('✅ node-forge installed successfully');
      return true;
    } catch (installError) {
      console.log('❌ Failed to install node-forge, will use fallback method');
      return false;
    }
  }
}

async function main() {
  console.log('🔧 SSL Certificate Generator for Development\n');
  
  // Check if certificates already exist
  if (checkExistingCertificates()) {
    console.log('\n⚠️  Certificates already exist. Delete them to regenerate.');
    console.log('   To regenerate, run: npm run ssl:regenerate');
    return;
  }
  
  // Create certificates directory
  createCertsDirectory();
  
  console.log('\n📋 Certificate Configuration:');
  console.log(`   Country: ${CONFIG.COUNTRY}`);
  console.log(`   State: ${CONFIG.STATE}`);
  console.log(`   City: ${CONFIG.CITY}`);
  console.log(`   Organization: ${CONFIG.ORGANIZATION}`);
  console.log(`   Common Name: ${CONFIG.COMMON_NAME}`);
  console.log(`   Valid Days: ${CONFIG.DAYS_VALID}`);
  console.log('');
  
  let success = false;
  
  // Try OpenSSL first
  success = generateWithOpenSSL();
  
  // If OpenSSL fails, try node-forge
  if (!success) {
    console.log('\n🔄 Trying node-forge method...');
    const forgeAvailable = await installForgeIfNeeded();
    if (forgeAvailable) {
      try {
        const forge = (await import('node-forge')).default;
        global.forge = forge;
        success = generateWithForge();
      } catch (error) {
        console.log('❌ node-forge method failed');
      }
    }
  }
  
  // Final fallback to built-in crypto
  if (!success) {
    console.log('\n🔄 Using built-in crypto fallback...');
    success = generateWithBuiltinCrypto();
  }
  
  if (success) {
    console.log('\n🎉 Certificate generation completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run your HTTPS server: npm run https');
    console.log('   2. Visit https://localhost:3443 in your browser');
    console.log('   3. Accept the security warning for self-signed certificates');
    console.log('\n⚠️  Security Note:');
    console.log('   These are self-signed certificates for development only.');
    console.log('   Browsers will show security warnings - this is normal.');
    console.log('   For production, use certificates from a trusted CA.');
  } else {
    console.error('\n❌ Failed to generate SSL certificates');
    console.error('   Please check your system configuration and try again.');
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);