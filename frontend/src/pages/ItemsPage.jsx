import { useState, useEffect } from 'react'
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
import { formatNumber, debounce } from '../utils/helpers'
import { Search, RefreshCw, Package } from 'lucide-react'
import toast from 'react-hot-toast'

const ItemsPage = () => {
  usePageTitle('Items')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    fetchItems()
  }, [pagination.page, search])

  const fetchItems = async () => {
    try {
      setLoading(true)
      console.log('[ItemsPage] Fetching items...', { page: pagination.page, limit: pagination.limit, search })
      const response = await api.get('/items', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search
        }
      })
      console.log('[ItemsPage] Items fetched:', response.data)
      
      // Backend returns: { success, message, data: [...], pagination: {...} }
      if (response.data && response.data.success) {
        setItems(response.data.data || [])
        if (response.data.pagination) {
          setPagination(prev => ({
            ...prev,
            ...response.data.pagination
          }))
        }
      } else {
        console.error('[ItemsPage] Unexpected response structure:', response.data)
      }
    } catch (error) {
      console.error('[ItemsPage] Failed to fetch items:', error)
      // Don't show toast for rate limiting - just log them
      if (error.response?.status !== 429) {
        console.warn('Items fetch failed silently')
      }
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      // Jalankan sync items secara langsung (bukan queue) supaya data langsung muncul setelah selesai.
      await api.post('/items/sync', { pageSize: 100 })
      toast.success('Sync items berhasil')
      // Fetch ulang setelah sync selesai
      await fetchItems()
    } catch (error) {
      const status = error.response?.status
      const message = error.response?.data?.message || error.message
      if (status === 412) {
        toast.error(`Sync gagal: ${message} (silakan Connect/Reconnect Accurate di Pengaturan)`)
      } else {
        toast.error('Sync gagal: ' + message)
      }
    } finally {
      setSyncing(false)
    }
  }

  const handleSearchChange = debounce((value) => {
    setSearch(value)
    setPagination({ ...pagination, page: 1 })
  }, 500)

  const columns = [
    { key: 'item', header: 'Item', align: 'left' },
    { key: 'no', header: 'No', align: 'left' },
    { key: 'stock', header: 'Stock', align: 'right' },
    { key: 'unit_price', header: 'Unit Price', align: 'right' },
    { key: 'status', header: 'Status', align: 'center' },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Items"
          description="Kelola inventori barang Anda."
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

        {/* Search */}
        <Card className="p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari items berdasarkan nama atau nomor..."
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-xl border border-white/60 bg-white/55 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-400/25"
            />
          </div>
        </Card>

        {/* Items Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-12">
              <LoadingSpinner />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Tidak ada items"
              description="Coba ubah kata kunci pencarian atau lakukan sync dari Accurate."
            />
          ) : (
            <>
              <Table columns={columns}>
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/40">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                      {item.description && (
                        <div className="mt-0.5 text-sm text-slate-600">{item.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{item.no}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`text-sm font-semibold tabular-nums ${
                          item.availableStock > 0 ? 'text-emerald-700' : 'text-red-700'
                        }`}>
                          {formatNumber(item.availableStock)}
                        </span>
                        <span className="text-sm text-slate-500">{item.unitName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900 tabular-nums">
                      {formatNumber(item.unitPrice)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        item.availableStock > 0 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {item.availableStock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </Table>

              <Pagination
                page={pagination.page}
                limit={pagination.limit}
                total={pagination.total}
                totalPages={pagination.totalPages}
                label="items"
                onPageChange={(nextPage) => setPagination({ ...pagination, page: nextPage })}
              />
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default ItemsPage
