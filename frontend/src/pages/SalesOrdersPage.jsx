import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Table from '../components/ui/Table'
import Pagination from '../components/ui/Pagination'
import Button from '../components/ui/Button'
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

  // Auto refresh list (agar hasil auto-sync dari backend segera terlihat tanpa klik manual)
  useEffect(() => {
    const t = setInterval(() => {
      // Jangan ganggu saat sedang loading atau sync manual
      if (!loading && !syncing) {
        fetchOrders()
      }
    }, 60_000) // 1 menit
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, syncing, pagination.page, pagination.limit, search, month])

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

  const columns = [
    { key: 'order_number', header: 'Order Number', align: 'left' },
    { key: 'customer', header: 'Customer', align: 'left' },
    { key: 'date', header: 'Date', align: 'left' },
    { key: 'amount', header: 'Amount', align: 'right' },
    { key: 'status', header: 'Status', align: 'center' },
  ]

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
      <div className="space-y-6">
        <PageHeader
          title="Sales Orders"
          description="Lihat dan kelola sales orders."
          actions={
            <Button
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>Sync Accurate</span>
            </Button>
          }
        />

        {/* Search + Month Filter */}
        <Card className="p-5 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan nomor order atau nama customer..."
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-xl border border-white/60 bg-white/55 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-400/25"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-medium text-slate-600">Filter Bulan</span>
            <select
              value={month}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="rounded-xl border border-white/60 bg-white/55 px-3 py-2 text-sm text-slate-900 shadow-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-400/25"
            >
              <option value="all">Semua Data</option>
              <option value={toYyyyMm(new Date())}>Bulan Ini</option>
            </select>
            {month !== 'all' && (
              <input
                type="month"
                value={month}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="rounded-xl border border-white/60 bg-white/55 px-3 py-2 text-sm text-slate-900 shadow-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-400/25"
              />
            )}
          </div>
        </Card>

        {/* Orders Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-12">
              <LoadingSpinner />
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="Tidak ada sales order"
              description="Coba ubah kata kunci pencarian atau lakukan sync dari Accurate."
            />
          ) : (
            <>
              <Table columns={columns}>
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/40">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900">{order.transNumber}</div>
                      {order.description && (
                        <div className="mt-0.5 text-sm text-slate-600">{order.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{order.customerName}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {formatDate(order.transDate)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900 tabular-nums">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium badge-${getStatusColor(order.status || 'menunggu diproses')}`}
                        >
                          {formatStatusLabel(order.status)}
                        </span>
                        {order.invoiceCreatedBy && ['Terproses', 'Sebagian diproses'].includes(formatStatusLabel(order.status)) && (
                          <span className="text-[11px] text-slate-500">
                            oleh: {order.invoiceCreatedBy}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </Table>

              <Pagination
                page={pagination.page}
                limit={pagination.limit}
                total={pagination.total}
                totalPages={pagination.totalPages}
                label="orders"
                onPageChange={(nextPage) => setPagination({ ...pagination, page: nextPage })}
              />
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default SalesOrdersPage
