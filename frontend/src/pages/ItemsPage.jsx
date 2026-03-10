import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import LoadingSpinner from '../components/LoadingSpinner'
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
      await api.post('/sync/items')
      toast.success('Sync items berhasil')
      fetchItems()
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

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="animate-slide-in-left">
            <h1 className="text-4xl font-bold text-gradient-brand mb-2">Items</h1>
            <p className="text-gray-600 text-lg">Kelola inventori barang Anda</p>
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

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari items berdasarkan nama atau nomor..."
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
            />
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500">
          {loading ? (
            <div className="p-20">
              <LoadingSpinner />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-xl font-bold text-gray-900 mb-2">Tidak ada items ditemukan</p>
              <p className="text-gray-500">Coba ubah kata kunci pencarian atau sync dari Accurate</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        No
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {items.map((item, idx) => (
                      <tr 
                        key={item.id} 
                        className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 group animate-fade-in"
                        style={{ animationDelay: `${idx * 0.03}s` }}
                      >
                        <td className="px-6 py-5">
                          <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500 mt-1">{item.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-5 text-sm font-medium text-gray-600">{item.no}</td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={`text-lg font-bold ${
                              item.availableStock > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatNumber(item.availableStock)}
                            </span>
                            <span className="text-sm text-gray-500 font-medium">{item.unitName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right text-base font-bold text-gray-900">
                          {formatNumber(item.unitPrice)}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            item.availableStock > 0 
                              ? 'bg-green-100 text-green-700 border border-green-300' 
                              : 'bg-red-100 text-red-700 border border-red-300'
                          }`}>
                            {item.availableStock > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
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
                  <span className="font-bold text-gray-900">{pagination.total}</span> items
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

export default ItemsPage
