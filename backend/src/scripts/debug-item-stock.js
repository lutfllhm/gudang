/**
 * Script debug untuk melihat raw response Accurate API untuk item tertentu
 * Jalankan: node src/scripts/debug-item-stock.js [itemNo]
 * Contoh: node src/scripts/debug-item-stock.js 102025
 */

require('dotenv').config();
const ApiClient = require('../services/accurate/ApiClient');
const { query } = require('../config/database');

const targetItemNo = process.argv[2] || '102025';

async function debugItemStock() {
  try {
    console.log('='.repeat(60));
    console.log(`DEBUG: Mencari stok untuk item no: ${targetItemNo}`);
    console.log('='.repeat(60));

    // Ambil user yang punya token
    const users = await query(
      'SELECT id, email FROM users WHERE accurate_access_token IS NOT NULL LIMIT 1'
    );

    if (users.length === 0) {
      console.error('❌ Tidak ada user dengan Accurate token!');
      process.exit(1);
    }

    const userId = users[0].id;
    console.log(`✅ Menggunakan user: ${users[0].email} (id: ${userId})\n`);

    // 1. Cari item di list
    console.log('📋 Step 1: Ambil dari /item/list.do ...');
    const listResp = await ApiClient.get(userId, '/item/list.do', {
      'sp.page': 1,
      'sp.pageSize': 200
    });

    const allItems = listResp?.d || [];
    const targetItem = allItems.find(i => i.no == targetItemNo || String(i.no) === String(targetItemNo));

    if (!targetItem) {
      console.log(`⚠️  Item ${targetItemNo} tidak ditemukan di list. Menampilkan item pertama sebagai contoh:`);
      const sample = allItems[0];
      console.log('\n📦 Sample item dari list.do:');
      console.log(JSON.stringify(sample, null, 2));
      console.log('\n🔑 Fields yang tersedia:', Object.keys(sample || {}));
    } else {
      console.log(`\n✅ Item ditemukan: ${targetItem.name}`);
      console.log('\n📦 Data dari list.do:');
      console.log(JSON.stringify(targetItem, null, 2));
      console.log('\n🔑 Fields dari list.do:', Object.keys(targetItem));
    }

    const itemId = targetItem?.id || allItems[0]?.id;
    if (!itemId) {
      console.error('❌ Tidak bisa mendapatkan item ID');
      process.exit(1);
    }

    // 2. Ambil detail
    console.log('\n' + '='.repeat(60));
    console.log(`📋 Step 2: Ambil dari /item/detail.do (id: ${itemId}) ...`);
    const detailResp = await ApiClient.get(userId, '/item/detail.do', { id: itemId });
    const detail = detailResp?.d;

    console.log('\n📦 Data dari detail.do:');
    console.log(JSON.stringify(detail, null, 2));
    console.log('\n🔑 Fields dari detail.do:', Object.keys(detail || {}));

    // 3. Coba get-stock endpoint
    console.log('\n' + '='.repeat(60));
    console.log(`📋 Step 3: Ambil dari /item/get-stock.do (id: ${itemId}) ...`);
    try {
      const stockResp = await ApiClient.get(userId, '/item/get-stock.do', { id: itemId });
      console.log('\n📦 Data dari get-stock.do:');
      console.log(JSON.stringify(stockResp, null, 2));
    } catch (e) {
      console.log(`⚠️  get-stock.do error: ${e.message}`);
    }

    // 4. Ringkasan field stok
    console.log('\n' + '='.repeat(60));
    console.log('📊 RINGKASAN - Field yang mungkin berisi stok:');
    const stockFields = [
      'availableQty', 'availableQuantity', 'qtyAvailable', 'onHand', 
      'qtyOnHand', 'stock', 'quantity', 'qty', 'totalQty',
      'warehouseQty', 'stockQty', 'currentStock'
    ];
    
    const merged = { ...(targetItem || allItems[0]), ...(detail || {}) };
    for (const field of stockFields) {
      if (merged[field] !== undefined) {
        console.log(`  ✅ ${field}: ${merged[field]}`);
      }
    }

    console.log('\n✅ Debug selesai!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

debugItemStock();
