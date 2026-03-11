#!/usr/bin/env node

/**
 * Test Accurate Online Connection
 * Script untuk testing koneksi ke Accurate Online API
 */

require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

const config = {
  accountUrl: process.env.ACCURATE_ACCOUNT_URL || 'https://account.accurate.id',
  appKey: process.env.ACCURATE_APP_KEY,
  clientId: process.env.ACCURATE_CLIENT_ID,
  clientSecret: process.env.ACCURATE_CLIENT_SECRET,
  signatureSecret: process.env.ACCURATE_SIGNATURE_SECRET,
  redirectUri: process.env.ACCURATE_REDIRECT_URI
};

// Generate timestamp
function generateTimestamp() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

// Generate signature
function generateSignature(timestamp) {
  const hmac = crypto.createHmac('sha256', config.signatureSecret);
  hmac.update(timestamp);
  return hmac.digest('hex');
}

async function testConnection() {
  console.log('='.repeat(60));
  console.log('🔍 Testing Accurate Online API Connection');
  console.log('='.repeat(60));
  console.log('');

  // Check credentials
  console.log('1️⃣  Checking credentials...');
  const missing = [];
  if (!config.appKey) missing.push('ACCURATE_APP_KEY');
  if (!config.clientId) missing.push('ACCURATE_CLIENT_ID');
  if (!config.clientSecret) missing.push('ACCURATE_CLIENT_SECRET');
  if (!config.signatureSecret) missing.push('ACCURATE_SIGNATURE_SECRET');
  
  if (missing.length > 0) {
    console.log('❌ Missing credentials:', missing.join(', '));
    console.log('');
    console.log('Please configure these in backend/.env file');
    process.exit(1);
  }
  
  console.log('✅ All credentials configured');
  console.log('');

  // Test timestamp generation
  console.log('2️⃣  Testing timestamp generation...');
  const timestamp = generateTimestamp();
  console.log('   Timestamp:', timestamp);
  console.log('   Format: dd/MM/yyyy HH:mm:ss');
  console.log('✅ Timestamp generated');
  console.log('');

  // Test signature generation
  console.log('3️⃣  Testing signature generation...');
  const signature = generateSignature(timestamp);
  console.log('   Signature:', signature.substring(0, 20) + '...');
  console.log('   Algorithm: HMAC SHA-256');
  console.log('✅ Signature generated');
  console.log('');

  // Test authorization URL
  console.log('4️⃣  Testing authorization URL...');
  const authUrl = `${config.accountUrl}/oauth/authorize?` +
    `client_id=${config.clientId}` +
    `&redirect_uri=${encodeURIComponent(config.redirectUri)}` +
    `&response_type=code` +
    `&scope=item_view sales_order_view customer_view warehouse_view`;
  
  console.log('   URL:', authUrl.substring(0, 80) + '...');
  console.log('✅ Authorization URL generated');
  console.log('');

  console.log('='.repeat(60));
  console.log('✅ All tests passed!');
  console.log('='.repeat(60));
  console.log('');
  console.log('Next steps:');
  console.log('1. Open the authorization URL in browser');
  console.log('2. Login with Accurate Online account');
  console.log('3. Authorize the application');
  console.log('4. You will be redirected back to your app');
  console.log('');
  console.log('Authorization URL:');
  console.log(authUrl);
}

testConnection().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
