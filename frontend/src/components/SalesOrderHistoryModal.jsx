import { useState, useEffect } from 'react'
import { X, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react'
import api from '../utils/api'
import { formatDate } from '../utils/helpers'
import toast from 'react-hot-toast'

const SalesOrderHistoryModal = ({ isOpen, onClose, order }) => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newHistory, setNewHistory] = useState({
    status: 'Sebagian diproses',
    description: '',
    invoiceNumber: ''
  })

  useEffect(() => {
    if (isOpen && order) {
      fetchHistory()
    }
  }, [isOpen, order])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/sales-orders/${order.id}/history`)
      if (response.data && response.data.success) {
        setHistory(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddHistory = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/sales-orders/${order.id}/history`, newHistory)
      toast.success('Schedule berhasil ditambahkan')
      setShowAddForm(false)
      setNewHistory({
        status: 'Sebagian diproses',
        description: '',
        invoiceNumber: ''
      })
      fetchHistory()
    } catch (error) {
      toast.error('Gagal menambahkan schedule: ' + (error.response?.data?.message || error.message))
    }
  }

  const getStatusIcon = (status) => {
    const s = (status || '').toLowerCase()
    if (s.includes('terproses') && !s.includes('sebagian')) {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    } else if (s.includes('sebagian')) {
      return <Clock className="w-5 h-5 text-yellow-500" />
    }
    return <AlertCircle className="w-5 h-5 text-gray-400" />
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">History & Schedule</h2>
            <p className="text-red-100 mt-1">
              {order?.transNumber} - {order?.customerName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Add Schedule Button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full mb-6 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Tambah Schedule
            </button>
          )}

          {/* Add Form */}
          {showAddForm && (
            <form onSubmit={handleAddHistory} className="mb-6 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Tambah Schedule Baru</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={newHistory.status}
                    onChange={(e) => setNewHistory({ ...newHistory, status: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  >
                    <option value="Menunggu diproses">Menunggu diproses</option>
                    <option value="Sebagian diproses">Sebagian diproses</option>
                    <option value="Terproses">Terproses</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    value={newHistory.description}
                    onChange={(e) => setNewHistory({ ...newHistory, description: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows="3"
                    placeholder="Contoh: Buat Faktur Penjualan SI.2026.04.00652 oleh Nur gudang admin"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nomor Faktur (Opsional)
                  </label>
                  <input
                    type="text"
                    value={newHistory.invoiceNumber}
                    onChange={(e) => setNewHistory({ ...newHistory, invoiceNumber: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Contoh: SI.2026.04.00652"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setNewHistory({
                        status: 'Sebagian diproses',
                        description: '',
                        invoiceNumber: ''
                      })
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* History Timeline */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Belum ada history atau schedule</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item, index) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-red-300 transition-all"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(item.status)}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-gray-900">{item.status}</h4>
                        <p className="text-gray-600 mt-1">{item.description}</p>
                        {item.invoiceNumber && (
                          <p className="text-sm text-blue-600 font-semibold mt-2">
                            Faktur: {item.invoiceNumber}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>{formatDate(item.createdAt)}</p>
                        <p className="text-xs mt-1">
                          {new Date(item.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    {item.createdBy && item.createdBy !== 'system' && (
                      <p className="text-xs text-gray-400 mt-2">oleh {item.createdBy}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t-2 border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

export default SalesOrderHistoryModal
