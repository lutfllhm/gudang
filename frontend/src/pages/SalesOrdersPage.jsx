import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import usePageTitle from '../hooks/usePageTitle'
import api from '../utils/api'
import { formatCurrency, formatDate, debounce, getStatusColor } from '../utils/helpers'
import { Search, RefreshCw, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'
import { createSocket } from '../utils/socket'

const toYyyyMm = (d) => {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${yyyy}-${mm}`
}

const getMonthRange = (yyyyMm) => {
  const [y, m] = String(yyyyMm).split('-').map((v) => parseInt(v, 10))
  const start = new Date(y, (m || 1) - 1, 1)
  const end = new Date(y, (m || 1), 0)
  const toIsoDate = (dt) => dt.toISOString().slice(0, 10)
  return { startDate: toIsoDate(start), endDate: toIsoDate(end) }
}

const SalesOrdersPage = () => {
  usePageTitle('Sales Orders')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState('all') // Default ke 'all' untuk menampilkan semua data
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  const monthRange = useMemo(() => {
    if (month === 'all') return null
    return getMonthRange(month)
  }, [month])

  const isOrderInCurrentFilter = (o) => {
    // Search filter
    const q = String(search || '').trim().toLowerCase()
    if (q) {
      const hay = `${o?.transNumber || ''} ${o?.customerName || ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }

    // Month filter
    if (!monthRange) return true
    const d = o?.transDate ? new Date(o.transDate) : null
    if (!d || Number.isNaN(d.getTime())) return false
    const yyyyMm = toYyyyMm(d)
    return yyyyMm === month
  }

  const normalizeIncomingOrder = (incoming) => {
    if (!incoming) return null

    // If backend sends raw DB row, map it to UI shape
    if (incoming.nomor_so || incoming.nama_pelanggan || incoming.tanggal_so) {
      return {
        id: incoming.id,
        so_id: incoming.so_id,
        transNumber: incoming.nomor_so,
        customerName: incoming.nama_pelanggan,
        transDate: incoming.tanggal_so,
        totalAmount: incoming.total_amount,
        status: incoming.status,
        description: incoming.keterangan,
        invoiceCreatedBy: incoming.invoice_created_by,
      }
    }

    // Otherwise assume it's already in UI shape
    return incoming
  }

  useEffect(() => {
    fetchOrders()
  }, [pagination.page, search, month])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      
      // Hanya kirim startDate dan endDate jika month bukan 'all'
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
      }
      
      if (monthRange) {
        const { startDate, endDate } = monthRange
        params.startDate = startDate
        params.endDate = endDate
        console.log('[SalesOrdersPage] Fetching orders with date filter...', { page: pagination.page, limit: pagination.limit, search, month, startDate, endDate })
      } else {
        console.log('[SalesOrdersPage] Fetching all orders (no date filter)...', { page: pagination.page, limit: pagination.limit, search })
      }
      
      const response = await api.get('/sales-orders', { params })
      console.log('[SalesOrdersPage] Orders fetched:', response.data)
      
      // Backend returns: { success, message, data: [...], pagination: {...} }
      if (response.data && response.data.success) {
        setOrders(response.data.data || [])
        if (response.data.pagination) {
          setPagination(prev => ({
            ...prev,
            ...response.data.pagination
          }))
        }
      } else {
        console.error('[SalesOrdersPage] Unexpected response structure:', response.data)
      }
    } catch (error) {
      console.error('[SalesOrdersPage] Failed to fetch orders:', error)
      // Don't show toast for rate limiting - just log them
      if (error.response?.status !== 429) {
        console.warn('Sales orders fetch failed silently')
      }
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  // Live updates via WebSocket: append/merge orders without refresh
  useEffect(() => {
    const socket = createSocket()

    const handleNew = (payload) => {
      const incoming = normalizeIncomingOrder(payload?.data)
      if (!incoming) return

      // SalesOrders list uses a page + filters; only merge if it matches current filter
      if (!isOrderInCurrentFilter(incoming)) return

      setOrders((prev) => {
        const idx = prev.findIndex((x) => String(x.so_id) === String(incoming.so_id))
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = { ...next[idx], ...incoming }
          return next
        }
        // prepend so it appears immediately
        return [incoming, ...prev]
      })
      setPagination((p) => ({ ...p, total: (Number(p.total) || 0) + 1 }))
    }

    const handleUpdated = (payload) => {
      const incoming = normalizeIncomingOrder(payload?.data)
      if (!incoming) return

      setOrders((prev) => {
        const idx = prev.findIndex((x) => String(x.so_id) === String(incoming.so_id))
        if (idx === -1) {
          // if the updated order now matches filter, insert it
          if (!isOrderInCurrentFilter(incoming)) return prev
          setPagination((p) => ({ ...p, total: (Number(p.total) || 0) + 1 }))
          return [incoming, ...prev]
        }

        // if it no longer matches filter, remove it
        if (!isOrderInCurrentFilter(incoming)) {
          const next = [...prev]
          next.splice(idx, 1)
          setPagination((p) => ({ ...p, total: Math.max(0, (Number(p.total) || 0) - 1) }))
          return next
        }

        const next = [...prev]
        next[idx] = { ...next[idx], ...incoming }
        return next
      })
    }

    socket.on('sales_order:new', handleNew)
    socket.on('sales_order:updated', handleUpdated)

    return () => {
      try {
        socket.off('sales_order:new', handleNew)
        socket.off('sales_order:updated', handleUpdated)
        socket.disconnect()
      } catch (_) {}
    }
    // We want socket handlers to reflect current filters (search/month)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, month, monthRange])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      await api.post('/sales-orders/sync', {
        startDate: '2026-03-01',
        endDate: today,
        forceFullSync: true
      })
      toast.success('Sync sales orders dimulai di background. Refresh halaman nanti untuk melihat hasil.')
      // Refresh daftar setelah beberapa detik (sync berjalan di background)
      setTimeout(() => fetchOrders(), 3000)
    } catch (error) {
      toast.error('Sync gagal: ' + (error.response?.data?.message || error.message))
    } finally {
      setSyncing(false)
    }
  }

  const handleSearchChange = debounce((value) => {
    setSearch(value)
    setPagination({ ...pagination, page: 1 })
  }, 500)

  const handleMonthChange = (value) => {
    setMonth(value)
    setPagination({ ...pagination, page: 1 })
  }

  const formatStatusLabel = (status) => {
    const s = (status || '').toLowerCase().trim()

    // Pending harus dicek lebih dulu.
    // Kalau tidak, string "menunggu diproses" akan salah masuk ke "Sebagian diproses"
    // karena mengandung kata "diproses".
    if (
      s.includes('menunggu') ||
      s.includes('pending') ||
      s.includes('dipesan') ||
      s.includes('open') ||
      s.includes('opened') ||
      s.includes('queue') ||
      s.includes('waiting') ||
      s.includes('draft') ||
      s.includes('new')
    ) {
      return 'Menunggu diproses'
    }

    if (
      s.includes('terproses') ||
      s.includes('completed') ||
      s.includes('selesai') ||
      s.includes('proceed') ||
      s.includes('closed') ||
      s.includes('close') ||
      s.includes('finished') ||
      s.includes('done')
    ) {
      return 'Terproses'
    }

    if (
      s.includes('sebagian') ||
      s.includes('processing') ||
      s.includes('partial') ||
      s.includes('in progress')
    ) {
      return 'Sebagian diproses'
    }

    // Fallback: kalau backend sudah menyimpan label baku Accurate, tampilkan apa adanya
    if (s === 'menunggu diproses') return 'Menunggu diproses'
    if (s === 'sebagian diproses') return 'Sebagian diproses'
    if (s === 'terproses') return 'Terproses'

    return status || 'Menunggu diproses'
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="animate-slide-in-left">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-gradient-brand">Sales Orders</h1>
            </div>
            <p className="text-gray-600 text-lg">Lihat dan kelola sales orders</p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all flex items-center gap-2 shadow-primary hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed animate-slide-in-right"
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            <span>Sync dari Accurate</span>
          </button>
        </div>

        {/* Search + Month Filter */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan nomor order atau nama customer..."
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold text-gray-600">Filter Bulan</span>
            <select
              value={month}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="border-2 border-gray-200 rounded-xl px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50 hover:bg-white"
            >
              <option value="all">Semua Data</option>
              <option value={toYyyyMm(new Date())}>Bulan Ini</option>
            </select>
            {month !== 'all' && (
              <input
                type="month"
                value={month}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="border-2 border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50 hover:bg-white"
              />
            )}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500">
          {loading ? (
            <div className="p-20">
              <LoadingSpinner />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-xl font-bold text-gray-900 mb-2">Tidak ada sales orders ditemukan</p>
              <p className="text-gray-500">Coba ubah kata kunci pencarian atau sync dari Accurate</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Order Number
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {orders.map((order, idx) => (
                      <tr 
                        key={order.id} 
                        className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 group animate-fade-in"
                        style={{ animationDelay: `${idx * 0.03}s` }}
                      >
                        <td className="px-6 py-5">
                          <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{order.transNumber}</div>
                          {order.description && (
                            <div className="text-sm text-gray-500 mt-1">{order.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-base font-semibold text-gray-900">{order.customerName}</div>
                        </td>
                        <td className="px-6 py-5 text-sm font-medium text-gray-600">
                          {formatDate(order.transDate)}
                        </td>
                        <td className="px-6 py-5 text-right text-lg font-bold text-green-600">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold tracking-wider badge-${getStatusColor(order.status || 'menunggu diproses')}`}
                            >
                              {formatStatusLabel(order.status)}
                            </span>
                            {order.invoiceCreatedBy && ['Terproses', 'Sebagian diproses'].includes(formatStatusLabel(order.status)) && (
                              <span className="text-[11px] text-gray-500">
                                oleh: {order.invoiceCreatedBy}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-5 bg-gray-50 border-t-2 border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm font-medium text-gray-700">
                  Menampilkan <span className="font-bold text-gray-900">{((pagination.page - 1) * pagination.limit) + 1}</span> sampai{' '}
                  <span className="font-bold text-gray-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> dari{' '}
                  <span className="font-bold text-gray-900">{pagination.total}</span> orders
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 shadow-lg"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default SalesOrdersPage
