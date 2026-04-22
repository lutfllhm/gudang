#!/usr/bin/env node

/**
 * Script untuk debugging status sales order
 * Membandingkan status di database vs Accurate
 */

const { query } = require('../config/database');
const ApiClient = require('../services/accurate/ApiClient');
const logger = require('../utils/logger');

async function debugSalesOrderStatus(soNumbers = []) {
  console.log('='.repeat(70));
  console.log('DEBUG SALES ORDER STATUS');
  console.log('='.repeat(70));
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

    // Jika tidak ada SO number yang diberikan, ambil 10 SO terbaru
    let orders;
    if (soNumbers.length === 0) {
      orders = await query(`
        SELECT * FROM sales_orders 
        WHERE is_active = 1 
        ORDER BY tanggal_so DESC, id DESC 
        LIMIT 10
      `);
      console.log('Mengambil 10 Sales Order terbaru dari database...');
    } else {
      const placeholders = soNumbers.map(() => '?').join(',');
      orders = await query(
        `SELECT * FROM sales_orders WHERE nomor_so IN (${placeholders}) ORDER BY nomor_so DESC`,
        soNumbers
      );
      console.log(`Mengambil ${soNumbers.length} Sales Order dari database...`);
    }

    console.log(`Ditemukan ${orders.length} Sales Order`);
    console.log('');

    // Header tabel
    console.log('Nomor SO'.padEnd(20) + ' | ' + 
                'Status DB'.padEnd(20) + ' | ' + 
                'Status Accurate'.padEnd(20) + ' | ' + 
                'Match?');
    console.log('-'.repeat(90));

    let matchCount = 0;
    let mismatchCount = 0;
    const mismatches = [];

    for (const order of orders) {
      try {
        // Get detail dari Accurate
        const response = await ApiClient.get(userId, '/sales-order/detail.do', { id: order.so_id });
        
        if (!response || !response.d) {
          console.log(`${order.nomor_so.padEnd(20)} | ${'ERROR'.padEnd(20)} | ${'N/A'.padEnd(20)} | ✗`);
          continue;
        }

        const accurateOrder = response.d;

        // Extract status dari Accurate (sama seperti di SalesOrderService)
        const extractStatusStr = (val) => {
          if (val == null) return null;
          if (typeof val === 'object') return val.name ?? val.code ?? val.value ?? null;
          return String(val).trim() || null;
        };

        const rawStatus =
          extractStatusStr(accurateOrder?.documentStatus) ??
          extractStatusStr(accurateOrder?.documentStatusName) ??
          extractStatusStr(accurateOrder?.transStatusName) ??
          extractStatusStr(accurateOrder?.statusName) ??
          extractStatusStr(accurateOrder?.status_label) ??
          extractStatusStr(accurateOrder?.state) ??
          extractStatusStr(accurateOrder?.statusCode) ??
          extractStatusStr(accurateOrder?.status_code) ??
          extractStatusStr(accurateOrder?.status);

        const accurateStatus = rawStatus || 'UNKNOWN';
        const dbStatus = order.status;

        // Normalisasi untuk perbandingan
        const normalizeStatus = (status) => {
          const s = String(status).toUpperCase().trim();
          
          // Terproses
          if (['CLOSED', 'CLOSE', 'COMPLETED', 'COMPLETE', 'FINISHED', 'DONE', 
               'SELESAI', 'TERPROSES', 'FULLY PROCESSED', 'FULLY_PROCESSED'].includes(s)) {
            return 'TERPROSES';
          }
          
          // Sebagian diproses
          if (['PARTIAL', 'PARTIALLY', 'PARTIAL_COMPLETED', 'PARTIAL_COMPLETE',
               'SEBAGIAN', 'SEBAGIAN TERPROSES', 'SEBAGIAN_TERPROSES',
               'SEBAGIAN DIPROSES', 'SEBAGIAN_DIPROSES',
               'IN PROGRESS', 'IN_PROGRESS', 'PROCESSING',
               'PARTIALLY PROCESSED', 'PARTIALLY_PROCESSED'].includes(s)) {
            return 'SEBAGIAN_DIPROSES';
          }
          
          // Menunggu diproses
          if (['DIPESAN', 'OPEN', 'OPENED', 'PENDING', 'MENUNGGU',
               'MENUNGGU PROSES', 'MENUNGGU DIPROSES', 'MENUNGGU_DIPROSES',
               'NEW', 'DRAFT', 'WAITING', 'QUEUE'].includes(s) || s.startsWith('MENUNGGU')) {
            return 'MENUNGGU_DIPROSES';
          }
          
          return s;
        };

        const normalizedDb = normalizeStatus(dbStatus);
        const normalizedAccurate = normalizeStatus(accurateStatus);
        const isMatch = normalizedDb === normalizedAccurate;

        if (isMatch) {
          matchCount++;
          console.log(`${order.nomor_so.padEnd(20)} | ${dbStatus.padEnd(20)} | ${accurateStatus.padEnd(20)} | ✓`);
        } else {
          mismatchCount++;
          console.log(`${order.nomor_so.padEnd(20)} | ${dbStatus.padEnd(20)} | ${accurateStatus.padEnd(20)} | ✗`);
          mismatches.push({
            nomor_so: order.nomor_so,
            so_id: order.so_id,
            db_status: dbStatus,
            accurate_status: accurateStatus,
            normalized_db: normalizedDb,
            normalized_accurate: normalizedAccurate
          });
        }

        // Delay untuk menghindari rate limit
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.log(`${order.nomor_so.padEnd(20)} | ${order.status.padEnd(20)} | ${'ERROR'.padEnd(20)} | ✗`);
        logger.error('Error getting SO detail from Accurate', { 
          nomor_so: order.nomor_so, 
          error: error.message 
        });
      }
    }

    console.log('-'.repeat(90));
    console.log('');
    console.log(`Total: ${orders.length} | Match: ${matchCount} | Mismatch: ${mismatchCount}`);
    console.log('');

    // Tampilkan detail mismatch
    if (mismatches.length > 0) {
      console.log('='.repeat(70));
      console.log('DETAIL MISMATCH');
      console.log('='.repeat(70));
      console.log('');

      mismatches.forEach((m, index) => {
        console.log(`${index + 1}. ${m.nomor_so} (ID: ${m.so_id})`);
        console.log(`   Database        : "${m.db_status}" → ${m.normalized_db}`);
        console.log(`   Accurate        : "${m.accurate_status}" → ${m.normalized_accurate}`);
        console.log('');
      });

      console.log('Rekomendasi:');
      console.log('1. Jalankan script fix-and-resync-sales-orders.js untuk memperbaiki');
      console.log('2. Atau update manual status yang salah');
      console.log('');
    } else {
      console.log('✓ Semua status sudah sesuai dengan Accurate!');
      console.log('');
    }

    return {
      total: orders.length,
      match: matchCount,
      mismatch: mismatchCount,
      mismatches
    };

  } catch (error) {
    console.error('❌ Error:', error.message);
    logger.error('Debug sales order status failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);
    
    console.log('');
    console.log('╔' + '═'.repeat(68) + '╗');
    console.log('║' + ' '.repeat(15) + 'DEBUG SALES ORDER STATUS' + ' '.repeat(29) + '║');
    console.log('╚' + '═'.repeat(68) + '╝');
    console.log('');

    if (args.length > 0) {
      console.log(`Checking specific SO: ${args.join(', ')}`);
      console.log('');
      await debugSalesOrderStatus(args);
    } else {
      console.log('Checking 10 latest SO (gunakan: node debug-sales-order-status.js SO.XXX SO.YYY untuk SO spesifik)');
      console.log('');
      await debugSalesOrderStatus();
    }

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

module.exports = { debugSalesOrderStatus };
