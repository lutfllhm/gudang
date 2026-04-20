/**
 * Script untuk testing Sales Invoice History API
 * Usage: node src/scripts/test-invoice-history.js
 */

require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const TEST_EMAIL = process.env.TEST_EMAIL || 'superadmin@iware.id';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'admin123';

let authToken = null;

/**
 * Login to get auth token
 */
async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      console.log('✅ Login successful');
      return true;
    }

    console.error('❌ Login failed:', response.data.message);
    return false;
  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test get recent history
 */
async function testGetRecentHistory() {
  try {
    console.log('\n📋 Testing: Get Recent History');
    const response = await axios.get(`${API_URL}/sales-invoice-history/recent`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { limit: 10 }
    });

    if (response.data.success) {
      console.log('✅ Success');
      console.log(`   Found ${response.data.data.length} history records`);
      if (response.data.data.length > 0) {
        console.log('   Latest:', {
          invoice: response.data.data[0].invoice_number,
          modifiedBy: response.data.data[0].modified_by,
          status: response.data.data[0].status
        });
      }
    } else {
      console.log('❌ Failed:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

/**
 * Test get history by status
 */
async function testGetHistoryByStatus() {
  try {
    console.log('\n📋 Testing: Get History by Status (Sebagian diproses)');
    const response = await axios.get(`${API_URL}/sales-invoice-history/status/Sebagian diproses`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { limit: 10 }
    });

    if (response.data.success) {
      console.log('✅ Success');
      console.log(`   Found ${response.data.data.length} history records`);
      response.data.data.forEach((h, idx) => {
        console.log(`   ${idx + 1}. ${h.invoice_number} - ${h.modified_by} (${h.nama_pelanggan})`);
      });
    } else {
      console.log('❌ Failed:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

/**
 * Test sync invoice history
 */
async function testSyncHistory() {
  try {
    console.log('\n🔄 Testing: Sync Invoice History');
    console.log('   This may take a while...');
    
    const today = new Date().toISOString().split('T')[0];
    const response = await axios.post(`${API_URL}/sales-invoice-history/sync`, {
      startDate: '2026-03-01',
      endDate: today,
      pageSize: 50
    }, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 300000 // 5 minutes timeout
    });

    if (response.data.success) {
      console.log('✅ Success');
      console.log('   Synced:', response.data.data.synced, 'records');
    } else {
      console.log('❌ Failed:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

/**
 * Test get history by SO ID
 */
async function testGetHistoryBySoId(soId) {
  try {
    console.log(`\n📋 Testing: Get History by SO ID (${soId})`);
    const response = await axios.get(`${API_URL}/sales-invoice-history/so/${soId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✅ Success');
      console.log(`   Found ${response.data.data.length} history records`);
      response.data.data.forEach((h, idx) => {
        console.log(`   ${idx + 1}. ${h.description} - ${h.modified_by}`);
      });
    } else {
      console.log('❌ Failed:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('==========================================');
  console.log('Sales Invoice History API Tests');
  console.log('==========================================');

  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('\n❌ Cannot proceed without authentication');
    process.exit(1);
  }

  // Run tests
  await testGetRecentHistory();
  await testGetHistoryByStatus();
  
  // Optional: Test with specific SO ID
  const testSoId = process.argv[2];
  if (testSoId) {
    await testGetHistoryBySoId(testSoId);
  }

  // Optional: Run sync (commented out by default)
  // Uncomment to test sync
  // await testSyncHistory();

  console.log('\n==========================================');
  console.log('✅ All tests completed');
  console.log('==========================================\n');
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
