/**
 * Test script untuk mengecek API sales invoice dari Accurate
 * 
 * Usage:
 * node backend/src/scripts/test-invoice-api.js
 */

require('dotenv').config();
const ApiClient = require('../services/accurate/ApiClient');
const { query } = require('../config/database');
const logger = require('../utils/logger');

async function testInvoiceAPI() {
  try {
    console.log('=== Test Sales Invoice API ===\n');

    // Get user with valid token
    const userResult = await query(
      'SELECT user_id FROM accurate_tokens WHERE is_active = 1 AND expires_at > NOW() ORDER BY id DESC LIMIT 1'
    );

    if (userResult.length === 0) {
      console.error('❌ No user with valid Accurate token found');
      process.exit(1);
    }

    const userId = userResult[0].user_id;
    console.log('✅ Found user with valid token:', userId);

    // Get a sales order with status "Sebagian diproses"
    const soResult = await query(
      `SELECT so_id, nomor_so, status 
       FROM sales_orders 
       WHERE status LIKE '%sebagian%' 
       LIMIT 1`
    );

    if (soResult.length === 0) {
      console.error('❌ No sales order with "Sebagian diproses" status found');
      process.exit(1);
    }

    const so = soResult[0];
    console.log('✅ Found SO:', so.nomor_so, '- Status:', so.status);
    console.log('   SO ID:', so.so_id);

    // Test 1: Get invoice list
    console.log('\n--- Test 1: Get Invoice List ---');
    const listResponse = await ApiClient.get(userId, '/sales-invoice/list.do', {
      'sp.page': 1,
      'sp.pageSize': 10
    });

    if (listResponse && listResponse.d) {
      console.log('✅ Invoice list received:', listResponse.d.length, 'invoices');
      if (listResponse.d.length > 0) {
        console.log('   First invoice ID:', listResponse.d[0].id);
        console.log('   First invoice number:', listResponse.d[0].number);
      }
    } else {
      console.log('⚠️  No invoices found');
    }

    // Test 2: Get invoice detail
    if (listResponse && listResponse.d && listResponse.d.length > 0) {
      console.log('\n--- Test 2: Get Invoice Detail ---');
      const invoiceId = listResponse.d[0].id;
      const detailResponse = await ApiClient.get(userId, '/sales-invoice/detail.do', { 
        id: invoiceId 
      });

      if (detailResponse && detailResponse.d) {
        console.log('✅ Invoice detail received');
        console.log('   Invoice ID:', detailResponse.d.id);
        console.log('   Invoice Number:', detailResponse.d.number || detailResponse.d.transNumber);
        console.log('   Trans Date:', detailResponse.d.transDate);
        console.log('   Total Amount:', detailResponse.d.totalAmount || detailResponse.d.total);
        console.log('\n   Available fields:', Object.keys(detailResponse.d).join(', '));
        
        // Check for user/creator fields
        console.log('\n   Creator fields:');
        console.log('   - createdBy:', JSON.stringify(detailResponse.d.createdBy));
        console.log('   - createdByName:', detailResponse.d.createdByName);
        console.log('   - userName:', detailResponse.d.userName);
        console.log('   - userDisplayName:', detailResponse.d.userDisplayName);
        console.log('   - createdDate:', detailResponse.d.createdDate);
        console.log('   - modifiedBy:', JSON.stringify(detailResponse.d.modifiedBy));
      }
    }

    // Test 3: Try to get invoices for specific SO
    console.log('\n--- Test 3: Get Invoices for SO ---');
    try {
      const soInvoicesResponse = await ApiClient.get(userId, '/sales-invoice/list.do', {
        'sp.page': 1,
        'sp.pageSize': 100,
        filter: `salesOrderId=${so.so_id}`
      });

      if (soInvoicesResponse && soInvoicesResponse.d) {
        console.log('✅ Invoices for SO received:', soInvoicesResponse.d.length, 'invoices');
        soInvoicesResponse.d.forEach((inv, idx) => {
          console.log(`   ${idx + 1}. ${inv.number} - ID: ${inv.id}`);
        });
      } else {
        console.log('⚠️  No invoices found for this SO');
      }
    } catch (error) {
      console.error('❌ Error getting invoices for SO:', error.message);
    }

    console.log('\n=== Test Complete ===');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testInvoiceAPI();
