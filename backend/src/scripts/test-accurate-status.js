/**
 * Test script untuk melihat status yang datang dari Accurate
 * Gunakan untuk debugging status mapping
 */

require('dotenv').config();
const ApiClient = require('../services/accurate/ApiClient');
const logger = require('../utils/logger');

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
      return;
    }

    const orders = Array.isArray(response.d) ? response.d : [];
    console.log(`\n✓ Found ${orders.length} sales orders`);
    console.log('-'.repeat(60));

    // Fetch detail untuk setiap order dan tampilkan statusnya
    for (const order of orders.slice(0, 5)) { // Ambil 5 order pertama saja
      try {
        const detailResponse = await ApiClient.get(userId, '/sales-order/detail.do', { 
          id: order.id 
        });

        if (detailResponse && detailResponse.d) {
          const detail = detailResponse.d;
          
          console.log(`\n📋 Order: ${detail.transNumber || detail.number || 'N/A'}`);
          console.log(`   Customer: ${detail.customerName || 'N/A'}`);
          console.log(`   Date: ${detail.transDate || 'N/A'}`);
          console.log(`   Amount: ${detail.totalAmount || 0}`);
          
          // Tampilkan semua field status yang mungkin
          console.log('\n   Status Fields:');
          console.log(`   - documentStatus: ${JSON.stringify(detail.documentStatus)}`);
          console.log(`   - status: ${JSON.stringify(detail.status)}`);
          console.log(`   - documentStatusName: ${detail.documentStatusName || 'N/A'}`);
          console.log(`   - statusName: ${detail.statusName || 'N/A'}`);
          console.log(`   - status_label: ${detail.status_label || 'N/A'}`);
          console.log(`   - state: ${detail.state || 'N/A'}`);
          
          // Simulasi mapping
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
          
          console.log(`\n   Extracted Status:`);
          console.log(`   - Raw: "${rawStr}"`);
          console.log(`   - Normalized: "${normalizedStatus}"`);
          
          // Mapping
          const completedSet = ['CLOSED', 'CLOSE', 'COMPLETED', 'COMPLETE', 'FINISHED', 'DONE', 'SELESAI', 'TERPROSES'];
          const partialSet = ['PARTIAL', 'PARTIALLY', 'PARTIAL_COMPLETED', 'PARTIAL_COMPLETE', 'SEBAGIAN', 'SEBAGIAN_TERPROSES', 'SEBAGIAN TERPROSES', 'SEBAGIAN_DIPROSES', 'SEBAGIAN DIPROSES', 'DIPROSES', 'IN PROGRESS', 'IN_PROGRESS', 'PROCESSING'];
          const pendingSet = ['DIPESAN', 'OPEN', 'OPENED', 'PENDING', 'MENUNGGU', 'MENUNGGU PROSES', 'MENUNGGU DIPROSES', 'MENUNGGU_DIPROSES', 'NEW', 'DRAFT'];

          let mappedStatus = 'Menunggu diproses';
          if (completedSet.includes(normalizedStatus)) {
            mappedStatus = 'Terproses';
          } else if (partialSet.includes(normalizedStatus)) {
            mappedStatus = 'Sebagian diproses';
          } else if (pendingSet.includes(normalizedStatus)) {
            mappedStatus = 'Menunggu diproses';
          } else if (rawStr) {
            mappedStatus = rawStr;
          }
          
          console.log(`   - Mapped to: "${mappedStatus}"`);
          console.log('-'.repeat(60));
        }
      } catch (error) {
        console.error(`❌ Error fetching detail for order ${order.id}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✓ Test completed');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
testAccurateStatus()
  .then(() => {
    console.log('\n✓ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
