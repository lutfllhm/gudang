#!/usr/bin/env node

/**
 * Script untuk memperbaiki status sales order yang tidak konsisten
 * dan melakukan re-sync dari Accurate
 */

const { query } = require('../config/database');
const SalesOrderService = require('../services/SalesOrderService');
const logger = require('../utils/logger');

async function fixSalesOrderStatus() {
  console.log('='.repeat(60));
  console.log('MEMPERBAIKI STATUS SALES ORDER');
  console.log('='.repeat(60));
  console.log('');

  try {
    // 1. Backup data sebelum update
    console.log('1. Membuat backup data...');
    await query(`
      CREATE TABLE IF NOT EXISTS sales_orders_backup_${Date.now()} AS 
      SELECT * FROM sales_orders
    `);
    console.log('   ✓ Backup berhasil dibuat');
    console.log('');

    // 2. Normalisasi status "Terproses"
    console.log('2. Normalisasi status "Terproses"...');
    const result1 = await query(`
      UPDATE sales_orders 
      SET status = 'Terproses',
          updated_at = CURRENT_TIMESTAMP
      WHERE UPPER(status) IN (
          'CLOSED', 'CLOSE', 'COMPLETED', 'COMPLETE', 'FINISHED', 'DONE',
          'SELESAI', 'TERPROSES', 'FULLY PROCESSED', 'FULLY_PROCESSED'
      )
      AND status != 'Terproses'
    `);
    console.log(`   ✓ ${result1.affectedRows} record diupdate ke "Terproses"`);
    console.log('');

    // 3. Normalisasi status "Sebagian diproses"
    console.log('3. Normalisasi status "Sebagian diproses"...');
    const result2 = await query(`
      UPDATE sales_orders 
      SET status = 'Sebagian diproses',
          updated_at = CURRENT_TIMESTAMP
      WHERE UPPER(status) IN (
          'PARTIAL', 'PARTIALLY', 'PARTIAL_COMPLETED', 'PARTIAL_COMPLETE',
          'SEBAGIAN', 'SEBAGIAN TERPROSES', 'SEBAGIAN_TERPROSES',
          'SEBAGIAN DIPROSES', 'SEBAGIAN_DIPROSES',
          'IN PROGRESS', 'IN_PROGRESS', 'PROCESSING',
          'PARTIALLY PROCESSED', 'PARTIALLY_PROCESSED'
      )
      AND status != 'Sebagian diproses'
    `);
    console.log(`   ✓ ${result2.affectedRows} record diupdate ke "Sebagian diproses"`);
    console.log('');

    // 4. Normalisasi status "Menunggu diproses"
    console.log('4. Normalisasi status "Menunggu diproses"...');
    const result3 = await query(`
      UPDATE sales_orders 
      SET status = 'Menunggu diproses',
          updated_at = CURRENT_TIMESTAMP
      WHERE (
        UPPER(status) IN (
            'DIPESAN', 'OPEN', 'OPENED', 'PENDING', 'MENUNGGU',
            'MENUNGGU PROSES', 'MENUNGGU DIPROSES', 'MENUNGGU_DIPROSES',
            'NEW', 'DRAFT', 'WAITING', 'QUEUE'
        )
        OR UPPER(status) LIKE 'MENUNGGU%'
      )
      AND status != 'Menunggu diproses'
    `);
    console.log(`   ✓ ${result3.affectedRows} record diupdate ke "Menunggu diproses"`);
    console.log('');

    // 5. Cek status yang belum termapping
    console.log('5. Mengecek status yang belum termapping...');
    const unmapped = await query(`
      SELECT 
          status,
          COUNT(*) as jumlah,
          GROUP_CONCAT(DISTINCT nomor_so SEPARATOR ', ') as contoh_so
      FROM sales_orders
      WHERE status NOT IN ('Terproses', 'Sebagian diproses', 'Menunggu diproses')
        AND is_active = 1
      GROUP BY status
    `);
    
    if (unmapped.length > 0) {
      console.log('   ⚠ Status yang belum termapping:');
      unmapped.forEach(row => {
        console.log(`     - "${row.status}": ${row.jumlah} record`);
        console.log(`       Contoh SO: ${row.contoh_so}`);
      });
    } else {
      console.log('   ✓ Semua status sudah termapping dengan benar');
    }
    console.log('');

    // 6. Tampilkan statistik
    console.log('6. Statistik status setelah perbaikan:');
    const stats = await query(`
      SELECT 
          status,
          COUNT(*) as jumlah,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sales_orders WHERE is_active = 1), 2) as persentase
      FROM sales_orders
      WHERE is_active = 1
      GROUP BY status
      ORDER BY 
          CASE status
              WHEN 'Menunggu diproses' THEN 1
              WHEN 'Sebagian diproses' THEN 2
              WHEN 'Terproses' THEN 3
              ELSE 4
          END
    `);
    
    console.log('');
    console.log('   Status                  | Jumlah | Persentase');
    console.log('   ' + '-'.repeat(50));
    stats.forEach(row => {
      const statusPadded = row.status.padEnd(23);
      const jumlahPadded = String(row.jumlah).padStart(6);
      const persentasePadded = String(row.persentase).padStart(6);
      console.log(`   ${statusPadded} | ${jumlahPadded} | ${persentasePadded}%`);
    });
    console.log('');

    console.log('='.repeat(60));
    console.log('PERBAIKAN STATUS SELESAI');
    console.log('='.repeat(60));
    console.log('');

    return {
      success: true,
      updated: result1.affectedRows + result2.affectedRows + result3.affectedRows,
      unmapped: unmapped.length,
      stats
    };

  } catch (error) {
    console.error('❌ Error:', error.message);
    logger.error('Fix sales order status failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

async function resyncFromAccurate() {
  console.log('='.repeat(60));
  console.log('RE-SYNC SALES ORDERS DARI ACCURATE');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Get user dengan token aktif
    const userResult = await query(
      'SELECT user_id FROM accurate_tokens WHERE is_active = 1 AND expires_at > NOW() ORDER BY id DESC LIMIT 1'
    );

    if (userResult.length === 0) {
      throw new Error('Tidak ada user dengan token Accurate yang aktif');
    }

    const userId = userResult[0].user_id;
    console.log(`User ID: ${userId}`);
    console.log('');

    // Sync dari Accurate
    console.log('Memulai sync dari Accurate...');
    console.log('(Proses ini mungkin memakan waktu beberapa menit)');
    console.log('');

    const result = await SalesOrderService.syncFromAccurate(userId, {
      pageSize: 100,
      forceFullSync: true
    });

    console.log('');
    console.log('='.repeat(60));
    console.log('RE-SYNC SELESAI');
    console.log('='.repeat(60));
    console.log('');
    console.log(`Total record di-sync: ${result.synced}`);
    console.log(`Durasi: ${result.duration} detik`);
    console.log('');

    return result;

  } catch (error) {
    console.error('❌ Error:', error.message);
    logger.error('Re-sync from Accurate failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

async function main() {
  try {
    console.log('');
    console.log('╔' + '═'.repeat(58) + '╗');
    console.log('║' + ' '.repeat(10) + 'FIX & RE-SYNC SALES ORDERS' + ' '.repeat(22) + '║');
    console.log('╚' + '═'.repeat(58) + '╝');
    console.log('');

    // Tanya user apakah ingin fix status saja atau juga re-sync
    const args = process.argv.slice(2);
    const skipResync = args.includes('--skip-resync');

    // Step 1: Fix status yang sudah ada di database
    await fixSalesOrderStatus();

    // Step 2: Re-sync dari Accurate (optional)
    if (!skipResync) {
      console.log('');
      console.log('Lanjut ke re-sync dari Accurate? (Tekan Ctrl+C untuk skip)');
      console.log('Menunggu 5 detik...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      await resyncFromAccurate();
    } else {
      console.log('');
      console.log('Re-sync di-skip (gunakan --skip-resync untuk skip)');
      console.log('');
    }

    console.log('✓ Semua proses selesai!');
    console.log('');
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('❌ Script gagal:', error.message);
    console.error('');
    process.exit(1);
  }
}

// Jalankan script
if (require.main === module) {
  main();
}

module.exports = { fixSalesOrderStatus, resyncFromAccurate };
