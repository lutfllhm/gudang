#!/usr/bin/env node
/**
 * Simple test script untuk melihat status dari Accurate
 * Jalankan dari root direktori backend: 
 * - Cara 1: node test-status-simple.js
 * - Cara 2: chmod +x test-status-simple.js && ./test-status-simple.js
 */

const path = require('path');

// Load environment variables
try {
  require('dotenv').config();
} catch (e) {
  console.log('⚠️  dotenv not loaded, using existing environment variables');
}

const ApiClient = require('./src/services/accurate/ApiClient');

async function testAccurateStatus() {
  try {
    console.log('='.repeat(60));
    console.log('Testing Accurate Sales Order Status Mapping');
    console.log('='.repeat(60));

    // Ambil user ID dari environment atau gunakan default
    const userId = process.env.TEST_USER_ID || 1;
    
    console.log(`\nFetching sales orders for user ID: ${userId}`);
    console.log('-'.repeat(60));

    // Fetch sales orders dari Accurate
    const response = await ApiClient.get(userId, '/sales-order/list.do', {
      'sp.page': 1,
      'sp.pageSize': 10
    });

    if (!response || !response.d) {
      console.error('❌ No response from Accurate API');
      console.log('\nPossible reasons:');
      console.log('1. Accurate token expired or invalid');
      console.log('2. Network connection issue');
      console.log('3. User ID not found in database');
      return;
    }

    const orders = Array.isArray(response.d) ? response.d : [];
    console.log(`\n✓ Found ${orders.length} sales orders`);
    console.log('-'.repeat(60));

    if (orders.length === 0) {
      console.log('\n⚠️  No sales orders found in Accurate');
      return;
    }

    // Fetch detail untuk setiap order dan tampilkan statusnya
    const maxOrders = Math.min(5, orders.length);
    console.log(`\nFetching details for first ${maxOrders} orders...\n`);

    for (let i = 0; i < maxOrders; i++) {
      const order = orders[i];
      try {
        const detailResponse = await ApiClient.get(userId, '/sales-order/detail.do', { 
          id: order.id 
        });

        if (detailResponse && detailResponse.d) {
          const detail = detailResponse.d;
          
          console.log(`📋 Order ${i + 1}: ${detail.transNumber || detail.number || 'N/A'}`);
          console.log(`   Customer: ${detail.customerName || 'N/A'}`);
          console.log(`   Date: ${detail.transDate || 'N/A'}`);
          console.log(`   Amount: ${detail.totalAmount || 0}`);
          
          // Tampilkan field status yang penting
          console.log('\n   Status Fields from Accurate:');
          if (detail.documentStatus) {
            console.log(`   - documentStatus: ${JSON.stringify(detail.documentStatus)}`);
          }
          if (detail.status) {
            console.log(`   - status: ${JSON.stringify(detail.status)}`);
          }
          if (detail.documentStatusName) {
            console.log(`   - documentStatusName: ${detail.documentStatusName}`);
          }
          if (detail.statusName) {
            console.log(`   - statusName: ${detail.statusName}`);
          }
          
          // Simulasi mapping (sama seperti di SalesOrderService)
          const docStatus = detail?.documentStatus;
          const statusObj = detail?.status;
          const rawStatus =
            (typeof docStatus === 'object' && docStatus !== null ? (docStatus.name ?? docStatus.code ?? docStatus) : docStatus) ??
            detail?.documentStatusName ??
            (typeof statusObj === 'object' && statusObj !== null ? (statusObj.name ?? statusObj.code ?? statusObj) : statusObj) ??
            detail?.statusName ??
            detail?.status_label ??
            detail?.state;

          const rawStr = rawStatus == null ? '' : String(rawStatus).trim();
          const normalizedStatus = rawStr.toUpperCase();
          
          console.log(`\n   📊 Status Mapping:`);
          console.log(`   - Raw Status: "${rawStr}"`);
          console.log(`   - Normalized: "${normalizedStatus}"`);
          
          // Mapping logic
          const completedSet = ['CLOSED', 'CLOSE', 'COMPLETED', 'COMPLETE', 'FINISHED', 'DONE', 'SELESAI', 'TERPROSES'];
          const partialSet = ['PARTIAL', 'PARTIALLY', 'PARTIAL_COMPLETED', 'PARTIAL_COMPLETE', 'SEBAGIAN', 'SEBAGIAN_TERPROSES', 'SEBAGIAN TERPROSES', 'SEBAGIAN_DIPROSES', 'SEBAGIAN DIPROSES', 'DIPROSES', 'IN PROGRESS', 'IN_PROGRESS', 'PROCESSING'];
          const pendingSet = ['DIPESAN', 'OPEN', 'OPENED', 'PENDING', 'MENUNGGU', 'MENUNGGU PROSES', 'MENUNGGU DIPROSES', 'MENUNGGU_DIPROSES', 'NEW', 'DRAFT'];

          let mappedStatus = 'Menunggu diproses';
          let category = 'pending';
          let color = '🔴';
          
          if (completedSet.includes(normalizedStatus)) {
            mappedStatus = 'Terproses';
            category = 'completed';
            color = '🟢';
          } else if (partialSet.includes(normalizedStatus)) {
            mappedStatus = 'Sebagian diproses';
            category = 'processing';
            color = '🟡';
          } else if (pendingSet.includes(normalizedStatus)) {
            mappedStatus = 'Menunggu diproses';
            category = 'pending';
            color = '🔴';
          } else if (rawStr) {
            mappedStatus = rawStr;
            category = 'unknown';
            color = '⚪';
          }
          
          console.log(`   - Mapped Status: "${mappedStatus}"`);
          console.log(`   - Category: ${category}`);
          console.log(`   - Display Color: ${color}`);
          console.log('-'.repeat(60));
        }
      } catch (error) {
        console.error(`❌ Error fetching detail for order ${order.id}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✓ Test completed successfully');
    console.log('='.repeat(60));
    console.log('\nNext Steps:');
    console.log('1. Verify the status mapping above matches Accurate');
    console.log('2. If correct, run sync: POST /api/sync/sales-orders');
    console.log('3. Check frontend to see if "Sebagian diproses" appears');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nError details:', error);
    
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check if Accurate token exists and is valid');
    console.log('2. Verify database connection in .env file');
    console.log('3. Ensure user_id exists in accurate_tokens table');
    console.log('4. Check network connectivity to Accurate API');
    
    process.exit(1);
  }
}

// Run test
console.log('\n🚀 Starting Accurate Status Test...\n');
testAccurateStatus()
  .then(() => {
    console.log('\n✅ Script finished successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
