const SalesOrder = require('../models/SalesOrder');
const ApiClient = require('./accurate/ApiClient');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { query } = require('../config/database');

class SalesOrderService {
  static unmappedAccurateStatuses = new Set();

  static extractDisplayName(value) {
    if (!value) return null;
    if (typeof value === 'string') {
      const v = value.trim();
      return v || null;
    }
    if (typeof value === 'object') {
      const candidates = [
        value.name,
        value.fullName,
        value.username,
        value.userName,
        value.employeeName,
        value.alias
      ];
      const hit = candidates.find((item) => typeof item === 'string' && item.trim());
      return hit ? hit.trim() : null;
    }
    return null;
  }

  static extractCreatorFromHistoryText(text) {
    if (typeof text !== 'string') return null;
    const normalized = text.trim();
    if (!normalized) return null;

    // Hindari false-positive dari deskripsi SO biasa seperti "dibayar oleh kantor".
    // Hanya ambil pola "oleh <nama>" jika kalimatnya jelas konteks invoice.
    const hasInvoiceContext = /faktur penjualan|sales invoice|sales-invoice|buat faktur|create invoice/i.test(normalized);
    if (!hasInvoiceContext) return null;

    const invoiceByMatch = normalized.match(/\boleh\s+(.+)$/i);
    if (invoiceByMatch?.[1]) {
      const candidate = invoiceByMatch[1].trim().replace(/[.,;:]+$/, '');
      return candidate || null;
    }

    return null;
  }

  static extractCreatorFromAnyNode(node, depth = 0) {
    if (depth > 4 || node == null) return null;

    if (typeof node === 'string') {
      return this.extractCreatorFromHistoryText(node);
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        const found = this.extractCreatorFromAnyNode(item, depth + 1);
        if (found) return found;
      }
      return null;
    }

    if (typeof node === 'object') {
      // Prioritaskan key yang biasanya berisi deskripsi histori
      const prioritizedKeys = ['description', 'message', 'note', 'remarks', 'activity', 'summary'];
      for (const key of prioritizedKeys) {
        if (key in node) {
          const found = this.extractCreatorFromAnyNode(node[key], depth + 1);
          if (found) return found;
        }
      }

      for (const val of Object.values(node)) {
        const found = this.extractCreatorFromAnyNode(val, depth + 1);
        if (found) return found;
      }
    }

    return null;
  }

  static extractInvoiceReferenceTokens(node, depth = 0, acc = []) {
    if (depth > 4 || node == null) return acc;

    if (typeof node === 'string') {
      const v = node.trim();
      if (v) acc.push(v.toLowerCase());
      return acc;
    }

    if (Array.isArray(node)) {
      for (const item of node) this.extractInvoiceReferenceTokens(item, depth + 1, acc);
      return acc;
    }

    if (typeof node === 'object') {
      const candidateKeys = [
        'description', 'note', 'remarks', 'message',
        'number', 'transNumber', 'sourceNumber',
        'salesOrderNumber', 'soNumber', 'referenceNo',
        'referenceNumber', 'refNo'
      ];
      for (const key of candidateKeys) {
        if (key in node) this.extractInvoiceReferenceTokens(node[key], depth + 1, acc);
      }
      for (const val of Object.values(node)) this.extractInvoiceReferenceTokens(val, depth + 1, acc);
    }

    return acc;
  }

  static extractCreatorFromStructuredNode(node, depth = 0) {
    if (depth > 6 || node == null) return null;

    if (typeof node === 'string') return null;
    if (Array.isArray(node)) {
      for (const item of node) {
        const found = this.extractCreatorFromStructuredNode(item, depth + 1);
        if (found) return found;
      }
      return null;
    }

    if (typeof node !== 'object') return null;

    const creatorLikeKeys = [
      'createdBy',
      'createdByName',
      'inputBy',
      'employee',
      'employeeName',
      'salesman',
      'operator',
      'user',
      'userName',
      'username',
      'updatedBy',
      'lastUpdatedBy'
    ];

    for (const key of creatorLikeKeys) {
      if (!(key in node)) continue;
      const candidateVal = node[key];
      const direct = this.extractDisplayName(candidateVal);
      if (direct) return direct;

      if (typeof candidateVal === 'object' && candidateVal) {
        const nested =
          this.extractDisplayName(candidateVal?.name) ||
          this.extractDisplayName(candidateVal?.fullName) ||
          this.extractDisplayName(candidateVal?.userName) ||
          this.extractDisplayName(candidateVal?.username) ||
          this.extractDisplayName(candidateVal?.employeeName) ||
          this.extractDisplayName(candidateVal?.alias);
        if (nested) return nested;
      }
    }

    for (const val of Object.values(node)) {
      const found = this.extractCreatorFromStructuredNode(val, depth + 1);
      if (found) return found;
    }

    return null;
  }

  static async resolveInvoiceCreatorName(userId, accurateOrder) {
    const soId = accurateOrder?.id || accurateOrder?.orderId || null;
    const transNumber = accurateOrder?.number || accurateOrder?.transNumber || accurateOrder?.orderNumber || null;
    const soIdStr = soId ? String(soId).toLowerCase() : null;
    const soNumberStr = transNumber ? String(transNumber).toLowerCase() : null;

    const directCreator =
      this.extractDisplayName(accurateOrder?.invoiceCreatedBy) ||
      this.extractDisplayName(accurateOrder?.createdBy) ||
      this.extractDisplayName(accurateOrder?.salesInvoiceCreatedBy) ||
      this.extractDisplayName(accurateOrder?.lastInvoiceCreatedBy) ||
      this.extractCreatorFromStructuredNode(accurateOrder);
    if (directCreator) {
      logger.info('Invoice creator resolved from direct fields', {
        soId,
        transNumber,
        invoiceCreatedBy: directCreator
      });
      return directCreator;
    }

    const historyCreator = this.extractCreatorFromAnyNode(accurateOrder);
    if (historyCreator) {
      logger.info('Invoice creator resolved from history text', {
        soId,
        transNumber,
        invoiceCreatedBy: historyCreator
      });
      return historyCreator;
    }

    if (!soId || !userId) return null;

    // Fallback: coba baca sales invoice list yang terkait SO ini.
    // Parameter filter dapat berbeda antar versi API Accurate, jadi kita coba beberapa variasi.
    const filterCandidates = [
      `salesOrder.id=${soId}`,
      `salesOrderId=${soId}`,
      `sourceTransId=${soId}`
    ];

    for (const filter of filterCandidates) {
      try {
        const invoiceListResponse = await ApiClient.get(userId, '/sales-invoice/list.do', {
          'sp.page': 1,
          'sp.pageSize': 5,
          filter
        });
        const invoices = Array.isArray(invoiceListResponse?.d) ? invoiceListResponse.d : [];
        if (invoices.length === 0) continue;

        for (const inv of invoices) {
          const creatorFromList =
            this.extractDisplayName(inv?.createdBy) ||
            this.extractDisplayName(inv?.salesman) ||
            this.extractDisplayName(inv?.inputBy) ||
            this.extractCreatorFromStructuredNode(inv) ||
            this.extractCreatorFromAnyNode(inv);
          if (creatorFromList) return creatorFromList;

          if (!inv?.id) continue;
          // Coba kedua endpoint detail karena struktur Accurate bisa berbeda antar akun/versi.
          const detailEndpoints = ['/sales-invoice/detail.do', '/sales-invoice/detail-invoice.do'];
          for (const endpoint of detailEndpoints) {
            try {
              const detail = await ApiClient.get(userId, endpoint, { id: inv.id });
              const detailData = detail?.d ?? detail;
              const creatorFromDetail =
                this.extractDisplayName(detailData?.createdBy) ||
                this.extractDisplayName(detailData?.salesman) ||
                this.extractDisplayName(detailData?.inputBy) ||
                this.extractDisplayName(detailData?.createdUser) ||
                this.extractDisplayName(detailData?.createdByName) ||
                this.extractCreatorFromStructuredNode(detailData) ||
                this.extractCreatorFromAnyNode(detailData);
              if (creatorFromDetail) {
                logger.info('Invoice creator resolved from invoice detail endpoint', {
                  soId,
                  transNumber,
                  invoiceId: inv.id,
                  endpoint,
                  invoiceCreatedBy: creatorFromDetail
                });
                return creatorFromDetail;
              }
            } catch (_) {
              // skip endpoint yang gagal, lanjut endpoint berikutnya
            }
          }
        }
      } catch (_) {
        // skip filter yang tidak didukung endpoint
      }
    }

    // Fallback tambahan: ambil invoice terbaru tanpa filter, lalu cari yang referensinya memuat nomor SO.
    try {
      const invoiceListResponse = await ApiClient.get(userId, '/sales-invoice/list.do', {
        'sp.page': 1,
        'sp.pageSize': 100
      });
      const invoices = Array.isArray(invoiceListResponse?.d) ? invoiceListResponse.d : [];

      for (const inv of invoices) {
        const tokens = this.extractInvoiceReferenceTokens(inv);
        const matched = tokens.some((t) => {
          if (soNumberStr && t.includes(soNumberStr)) return true;
          if (soIdStr && (t === soIdStr || t.includes(soIdStr))) return true;
          return false;
        });
        if (!matched) continue;

        const creatorFromRecentList =
          this.extractDisplayName(inv?.createdBy) ||
          this.extractDisplayName(inv?.salesman) ||
          this.extractDisplayName(inv?.inputBy) ||
          this.extractCreatorFromStructuredNode(inv) ||
          this.extractCreatorFromAnyNode(inv);
        if (creatorFromRecentList) {
          logger.info('Invoice creator resolved from recent invoice list fallback', {
            soId,
            transNumber,
            invoiceId: inv?.id || null,
            invoiceCreatedBy: creatorFromRecentList
          });
          return creatorFromRecentList;
        }
      }
    } catch (_) {
      // skip fallback list error
    }

    logger.warn('Invoice creator unresolved for SO', {
      soId,
      transNumber,
      debugKeys: Object.keys(accurateOrder || {}),
      sampleHistoryText: this.extractCreatorFromAnyNode({
        description: accurateOrder?.description,
        note: accurateOrder?.note,
        remarks: accurateOrder?.remarks,
        message: accurateOrder?.message
      })
    });

    return null;
  }
  /**
   * Get all sales orders with pagination
   */
  static async getAll(filters) {
    return await SalesOrder.findAll(filters);
  }

  /**
   * Get sales order by ID
   */
  static async getById(id) {
    const order = await SalesOrder.findByIdWithDetails(id);
    
    if (!order) {
      throw new AppError('Sales order not found', 404);
    }

    return order;
  }

  /**
   * Search sales orders
   */
  static async search(searchTerm, limit = 20) {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    return await SalesOrder.search(searchTerm, limit);
  }

  /**
   * Get sales order statistics
   */
  static async getStats(filters = {}) {
    return await SalesOrder.getStats(filters);
  }

  /**
   * Get sales by date range
   */
  static async getSalesByDateRange(startDate, endDate) {
    return await SalesOrder.getSalesByDateRange(startDate, endDate);
  }

  /**
   * Get top customers
   */
  static async getTopCustomers(limit = 10) {
    return await SalesOrder.getTopCustomers(limit);
  }

  /**
   * Get pending orders
   */
  static async getPendingOrders(limit = 20) {
    return await SalesOrder.getPendingOrders(limit);
  }

  /**
   * Update sales order status
   */
  static async updateStatus(id, status) {
    return await SalesOrder.updateStatus(id, status);
  }

  /**
   * Sync sales orders from Accurate Online
   */
  static async syncFromAccurate(userId, options = {}) {
    const {
      pageSize = 100,
      startDate = null,
      endDate = null,
      forceFullSync = false
    } = options;

    try {
      logger.info('Starting sales orders sync from Accurate', { userId, options });

      // Create sync log
      const syncLogResult = await query(
        'INSERT INTO sync_logs (sync_type, status, started_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        ['sales_orders', 'started']
      );
      const syncLogId = syncLogResult.insertId;

      let totalSynced = 0;
      let page = 1;
      let hasMore = true;

      // Untuk saat ini, NONAKTIFKAN filter date di Accurate
      // karena format filter menyebabkan error "Invalid field value for field 'filter'".
      // Lebih baik tarik semua data dulu sampai format resmi dari Accurate sudah pasti.
      let filter = null;
      const effectiveStartDate = startDate || '2026-03-01';
      const effectiveEndDate = endDate || new Date().toISOString().split('T')[0];

      logger.info('Sync date range (filter disabled, fetch all from Accurate)', { 
        effectiveStartDate,
        effectiveEndDate
      });

      while (hasMore) {
        try {
          // Get sales orders list from Accurate (only IDs)
          const params = {
            'sp.page': page,
            'sp.pageSize': pageSize
          };

          if (filter) {
            params.filter = filter;
          }

          logger.info('Fetching sales orders page', { page, params });

          const response = await ApiClient.get(userId, '/sales-order/list.do', params);

          if (!response) {
            const errorMsg = 'No response from Accurate API';
            logger.error(errorMsg, { page });
            throw new Error(errorMsg);
          }

          if (!response.d) {
            logger.warn('No data in response', { page, response });
            break;
          }

          const orders = Array.isArray(response.d) ? response.d : [];

          if (orders.length === 0) {
            hasMore = false;
            break;
          }

          logger.info('Retrieved sales orders list', { page, count: orders.length });

          // Fetch details for each sales order (with rate limiting handled by ApiClient)
          const detailedOrders = [];
          for (const order of orders) {
            try {
              const detailResponse = await ApiClient.get(userId, '/sales-order/detail.do', { id: order.id });
              if (detailResponse && detailResponse.d) {
                detailedOrders.push(detailResponse.d);
              } else {
                logger.warn('No detail data for order', { orderId: order.id });
              }
            } catch (error) {
              logger.warn('Failed to get sales order detail', { 
                orderId: order.id, 
                error: error.message,
                stack: error.stack 
              });
              // Continue with next order even if one fails
            }
          }

          if (detailedOrders.length === 0) {
            logger.warn('No detailed orders retrieved', { page });
            page++;
            continue;
          }

          // Transform and upsert sales orders
          const transformedOrders = [];
          for (const order of detailedOrders) {
            transformedOrders.push(await this.transformAccurateOrder(order, userId));
          }
          const result = await SalesOrder.bulkUpsert(transformedOrders);

          totalSynced += result.inserted + result.updated;

          logger.info('Sales orders page synced', { 
            page, 
            count: detailedOrders.length, 
            inserted: result.inserted, 
            updated: result.updated 
          });

          // Check if there are more pages
          if (orders.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }

        } catch (error) {
          const errorMsg = `Error syncing sales orders page ${page}: ${error.message}`;
          logger.error(errorMsg, { 
            page, 
            error: error.message,
            stack: error.stack 
          });
          
          // Update sync log with error
          await query(
            'UPDATE sync_logs SET status = ?, error_message = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['failed', errorMsg, syncLogId]
          );

          throw new Error(errorMsg);
        }
      }

      // Update last sync timestamp
      await SalesOrder.updateLastSync();

      // Update sync log
      const duration = await this.calculateSyncDuration(syncLogId);
      await query(
        'UPDATE sync_logs SET status = ?, records_synced = ?, completed_at = CURRENT_TIMESTAMP, duration_seconds = ? WHERE id = ?',
        ['success', totalSynced, duration, syncLogId]
      );

      logger.info('Sales orders sync completed', { totalSynced, duration });

      return {
        success: true,
        synced: totalSynced,
        duration,
        dateRange: {
          startDate: effectiveStartDate,
          endDate: effectiveEndDate
        }
      };

    } catch (error) {
      logger.error('Sales orders sync failed', { 
        error: error.message,
        stack: error.stack 
      });
      
      // Return more detailed error
      const errorMessage = error.message || 'Unknown error occurred during sync';
      throw new AppError(`Failed to sync sales orders: ${errorMessage}`, 500);
    }
  }

  /**
   * Transform Accurate sales order to our format.
   * Status diambil persis dari Accurate Online agar tampilan sama (Menunggu diproses, Sebagian terproses, Terproses).
   */
  static async transformAccurateOrder(accurateOrder, userId = null) {
    // Ambil status dari semua kemungkinan field response API Accurate
    // Accurate Online bisa mengirim status sebagai object {id, name} atau string langsung
    const extractStatusStr = (val) => {
      if (val == null) return null;
      if (typeof val === 'object') return val.name ?? val.code ?? val.value ?? null;
      return String(val).trim() || null;
    };

    // Beberapa akun Accurate mengirim lebih dari 1 field status dan kadang berbeda makna.
    // Prioritaskan field yang paling sering merepresentasikan status Sales Order di UI Accurate.
    const statusCandidates = [
      ['transStatusName', extractStatusStr(accurateOrder?.transStatusName)],
      ['statusName', extractStatusStr(accurateOrder?.statusName)],
      ['documentStatusName', extractStatusStr(accurateOrder?.documentStatusName)],
      ['documentStatus', extractStatusStr(accurateOrder?.documentStatus)],
      ['status', extractStatusStr(accurateOrder?.status)],
      ['status_label', extractStatusStr(accurateOrder?.status_label)],
      ['state', extractStatusStr(accurateOrder?.state)],
      ['statusCode', extractStatusStr(accurateOrder?.statusCode)],
      ['status_code', extractStatusStr(accurateOrder?.status_code)]
    ].filter(([, v]) => v != null && String(v).trim() !== '');

    const rawStr = statusCandidates.length ? String(statusCandidates[0][1]).trim() : '';
    const normalizedStatus = rawStr.toUpperCase().trim();

    // Log INFO (bukan debug) agar selalu muncul di log - untuk diagnosa status Accurate
    logger.info('Accurate order status mapping', {
      orderId: accurateOrder?.id,
      transNumber: accurateOrder?.transNumber ?? accurateOrder?.number,
      rawStatus: rawStr,
      normalizedStatus,
      allStatusFields: {
        documentStatus: accurateOrder?.documentStatus,
        documentStatusName: accurateOrder?.documentStatusName,
        transStatusName: accurateOrder?.transStatusName,
        statusName: accurateOrder?.statusName,
        status: accurateOrder?.status,
        state: accurateOrder?.state,
      }
    });

    // Mapping status Accurate -> label baku aplikasi
    // Accurate Online mengirim: "Terproses", "Sebagian diproses", "Menunggu diproses"
    // Kita normalkan ke 3 label baku tersebut agar konsisten dengan tampilan Accurate.
    const completedSet = [
      'CLOSED', 'CLOSE', 'COMPLETED', 'COMPLETE', 'FINISHED', 'DONE',
      'SELESAI', 'TERPROSES', 'FULLY PROCESSED', 'FULLY_PROCESSED'
    ];
    const partialSet = [
      'PARTIAL', 'PARTIALLY', 'PARTIAL_COMPLETED', 'PARTIAL_COMPLETE',
      'SEBAGIAN', 'SEBAGIAN TERPROSES', 'SEBAGIAN_TERPROSES',
      'SEBAGIAN DIPROSES', 'SEBAGIAN_DIPROSES',
      'IN PROGRESS', 'IN_PROGRESS', 'PROCESSING',
      'PARTIALLY PROCESSED', 'PARTIALLY_PROCESSED'
    ];
    const pendingSet = [
      'DIPESAN', 'OPEN', 'OPENED', 'PENDING', 'MENUNGGU',
      'MENUNGGU PROSES', 'MENUNGGU DIPROSES', 'MENUNGGU_DIPROSES',
      'MENUNGGU DI...', 'MENUNGGU DI', // Status dari Accurate yang terpotong
      'NEW', 'DRAFT', 'WAITING', 'QUEUE'
    ];

    const mapNormalizedToLabel = (norm, raw) => {
      const n = String(norm || '').toUpperCase().trim();
      const r = raw == null ? '' : String(raw).trim();
      if (!n && !r) return null;

      if (completedSet.includes(n)) return 'Terproses';
      if (partialSet.includes(n)) return 'Sebagian diproses';
      if (pendingSet.includes(n)) return 'Menunggu diproses';
      if (n.startsWith('MENUNGGU')) return 'Menunggu diproses';
      if (n.startsWith('SEBAGIAN')) return 'Sebagian diproses';
      if (n.startsWith('TERPROSES')) return 'Terproses';
      return r || null;
    };

    // Pilih candidate pertama yang bisa dimapping ke 3 label baku.
    // Kalau tidak ada, simpan raw apa adanya (agar tidak hilang informasinya).
    let status = null;
    const mappedByCandidate = [];
    for (const [src, val] of statusCandidates) {
      const raw = String(val).trim();
      const mapped = mapNormalizedToLabel(raw.toUpperCase(), raw);
      if (mapped) mappedByCandidate.push([src, raw, mapped]);
      if (!status && mapped && ['Terproses', 'Sebagian diproses', 'Menunggu diproses'].includes(mapped)) {
        status = mapped;
      }
    }

    if (!status) {
      status = mapNormalizedToLabel(normalizedStatus, rawStr) || 'Menunggu diproses';
      if (rawStr && !SalesOrderService.unmappedAccurateStatuses.has(normalizedStatus)) {
        SalesOrderService.unmappedAccurateStatuses.add(normalizedStatus);
        logger.warn('UNMAPPED Accurate status - perlu ditambahkan ke mapping!', {
          accurateOrderId: accurateOrder?.id,
          rawStatus: rawStr,
          normalizedStatus
        });
      }
    }

    // Jika beberapa field status terdeteksi dan mappingnya konflik, log supaya bisa dianalisa.
    const distinctMapped = Array.from(new Set(mappedByCandidate.map(([, , m]) => m)));
    if (distinctMapped.length > 1) {
      logger.warn('Accurate status fields conflict - picked by priority', {
        accurateOrderId: accurateOrder?.id,
        transNumber: accurateOrder?.transNumber ?? accurateOrder?.number,
        candidates: mappedByCandidate.map(([src, raw, mapped]) => ({ src, raw, mapped })),
        chosen: status
      });
    }

    logger.info('Status mapping result', {
      orderId: accurateOrder?.id,
      transNumber: accurateOrder?.transNumber ?? accurateOrder?.number,
      rawStatus: rawStr,
      mappedStatus: status
    });

    // Convert date from DD/MM/YYYY to YYYY-MM-DD
    let tanggalSo = new Date().toISOString().split('T')[0];
    if (accurateOrder.transDate) {
      try {
        const parts = accurateOrder.transDate.split('/');
        if (parts.length === 3) {
          // DD/MM/YYYY -> YYYY-MM-DD
          tanggalSo = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      } catch (error) {
        logger.warn('Failed to parse date', { transDate: accurateOrder.transDate, error: error.message });
      }
    }

    // Get customer name from customer object or direct field
    let customerName = 'Unknown';
    if (accurateOrder.customer && accurateOrder.customer.name) {
      customerName = accurateOrder.customer.name;
    } else if (accurateOrder.customerName) {
      customerName = accurateOrder.customerName;
    }

    // Get currency code
    let currencyCode = 'IDR';
    if (accurateOrder.currency && accurateOrder.currency.code) {
      currencyCode = accurateOrder.currency.code;
    } else if (accurateOrder.currency && typeof accurateOrder.currency === 'string') {
      currencyCode = accurateOrder.currency;
    }

    const invoiceCreatedBy = await this.resolveInvoiceCreatorName(userId, accurateOrder);

    return {
      so_id: String(accurateOrder.id || accurateOrder.orderId),
      nomor_so: accurateOrder.number || accurateOrder.transNumber || accurateOrder.orderNumber || accurateOrder.soNumber || '',
      tanggal_so: tanggalSo,
      customer_id: String(accurateOrder.customerId || ''),
      nama_pelanggan: customerName,
      keterangan: accurateOrder.description || null,
      status: status,
      invoice_created_by: invoiceCreatedBy,
      total_amount: parseFloat(accurateOrder.totalAmount || accurateOrder.total || 0),
      currency: currencyCode
    };
  }

  /**
   * Get sales order from Accurate by ID
   */
  static async getFromAccurate(userId, soId) {
    try {
      const response = await ApiClient.get(userId, '/sales-order/detail.do', { id: soId });

      if (!response || !response.d) {
        throw new AppError('Sales order not found in Accurate', 404);
      }

      return await this.transformAccurateOrder(response.d, userId);
    } catch (error) {
      logger.error('Error getting sales order from Accurate', { soId, error: error.message });
      throw new AppError('Failed to get sales order from Accurate', 500);
    }
  }

  /**
   * Calculate sync duration
   */
  static async calculateSyncDuration(syncLogId) {
    const result = await query(
      'SELECT TIMESTAMPDIFF(SECOND, started_at, CURRENT_TIMESTAMP) as duration FROM sync_logs WHERE id = ?',
      [syncLogId]
    );
    return result[0]?.duration || 0;
  }

  /**
   * Sync single sales order from Accurate (untuk webhook)
   */
  static async syncSingleOrder(soId) {
    try {
      logger.info('Syncing single sales order from Accurate', { soId });

      // Get user ID (ambil user dengan token yang masih valid)
      const userResult = await query(
        'SELECT user_id FROM accurate_tokens WHERE is_active = 1 AND expires_at > NOW() ORDER BY id DESC LIMIT 1'
      );

      if (userResult.length === 0) {
        throw new AppError('No user with Accurate token found', 404);
      }

      const userId = userResult[0].user_id;

      // Get sales order from Accurate
      const accurateOrder = await this.getFromAccurate(userId, soId);

      // Upsert sales order
      const result = await SalesOrder.bulkUpsert([accurateOrder]);

      // Get the synced sales order from database
      const syncedOrder = await query(
        'SELECT * FROM sales_orders WHERE so_id = ?',
        [soId]
      );

      logger.info('Single sales order synced', { 
        soId, 
        inserted: result.inserted, 
        updated: result.updated 
      });

      return {
        success: true,
        soId,
        action: result.inserted > 0 ? 'inserted' : 'updated',
        data: syncedOrder[0] || null
      };

    } catch (error) {
      logger.error('Failed to sync single sales order', { soId, error: error.message });
      throw error;
    }
  }

  /**
   * Delete sales order (untuk webhook)
   */
  static async deleteOrder(soId) {
    try {
      logger.info('Deleting sales order', { soId });

      const result = await query(
        'DELETE FROM sales_orders WHERE so_id = ?',
        [String(soId)]
      );

      logger.info('Sales order deleted', { soId, affectedRows: result.affectedRows });

      return {
        success: true,
        soId,
        deleted: result.affectedRows > 0
      };

    } catch (error) {
      logger.error('Failed to delete sales order', { soId, error: error.message });
      throw error;
    }
  }
}

module.exports = SalesOrderService;
