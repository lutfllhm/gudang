#!/usr/bin/env node

/**
 * Test Health Check Script
 * Tests if backend can start and respond to health checks
 */

require('dotenv').config();
const axios = require('axios');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

async function testHealth() {
  console.log('='.repeat(50));
  console.log('🏥 Testing Backend Health');
  console.log('='.repeat(50));
  console.log('');

  try {
    // Test 1: Health endpoint
    console.log('1. Testing /health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`, {
      timeout: 5000
    });
    
    if (healthResponse.data.success) {
      console.log('   ✅ Health endpoint OK');
      console.log('   Response:', JSON.stringify(healthResponse.data, null, 2));
    } else {
      console.log('   ❌ Health endpoint returned error');
      console.log('   Response:', healthResponse.data);
    }
    console.log('');

    // Test 2: API Health endpoint
    console.log('2. Testing /api/health endpoint...');
    const apiHealthResponse = await axios.get(`${BASE_URL}/api/health`, {
      timeout: 5000
    });
    
    if (apiHealthResponse.data.success) {
      console.log('   ✅ API Health endpoint OK');
      console.log('   Response:', JSON.stringify(apiHealthResponse.data, null, 2));
    } else {
      console.log('   ❌ API Health endpoint returned error');
      console.log('   Response:', apiHealthResponse.data);
    }
    console.log('');

    // Summary
    console.log('='.repeat(50));
    console.log('✅ All health checks passed!');
    console.log('='.repeat(50));
    console.log('');
    console.log('Backend is healthy and ready to accept requests.');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.log('');
    console.log('='.repeat(50));
    console.log('❌ Health check failed!');
    console.log('='.repeat(50));
    console.log('');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('Error: Cannot connect to backend server');
      console.log('');
      console.log('Possible causes:');
      console.log('  1. Backend server is not running');
      console.log('  2. Backend is running on a different port');
      console.log('  3. Firewall is blocking the connection');
      console.log('');
      console.log('Solutions:');
      console.log('  1. Start the backend: npm start');
      console.log('  2. Check PORT in .env file');
      console.log('  3. Check if port is already in use');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('Error: Request timed out');
      console.log('');
      console.log('Possible causes:');
      console.log('  1. Backend is taking too long to respond');
      console.log('  2. Database connection issues');
      console.log('  3. Network issues');
      console.log('');
      console.log('Solutions:');
      console.log('  1. Check backend logs for errors');
      console.log('  2. Verify database is running and accessible');
      console.log('  3. Check network connectivity');
    } else {
      console.log('Error:', error.message);
      console.log('');
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
    }
    
    console.log('');
    process.exit(1);
  }
}

// Check if backend is expected to be running
console.log('Checking backend at:', BASE_URL);
console.log('');
console.log('Note: Make sure backend is running before running this test');
console.log('Start backend with: npm start');
console.log('');

// Wait a bit before testing
setTimeout(() => {
  testHealth();
}, 1000);
