import { useState, useEffect } from 'react'
import { Clock, User, FileText } from 'lucide-react'
import api from '../utils/api'
import { formatDate } from '../utils/helpers'

const SalesInvoiceHistory = ({ soId, status }) => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Hanya load history jika status adalah "Sebagian diproses"
    if (status && status.toLowerCase().includes('sebagian')) {
      fetchHistory()
    }
  }, [soId, status])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/sales-invoice-history/so/${soId}`)
      if (response.data && response.data.success) {
        setHistory(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch invoice history:', error)
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  // Jangan tampilkan apa-apa jika bukan status "Sebagian diproses"
  if (!status || !status.toLowerCase().includes('sebagian')) {
    return null
  }

  if (loading) {
    return (
      <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
        <Clock className="w-3 h-3 animate-spin" />
        <span>Loading history...</span>
      </div>
    )
  }

  if (history.length === 0) {
    return null
  }

  // Ambil history terbaru (yang pertama)
  const latestHistory = history[0]

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-start gap-2 text-xs text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
        <User className="w-3.5 h-3.5 mt-0.5 text-blue-600 flex-shrink-0" />
        <div className="flex-1">
          <div className="font-medium text-gray-800">
            {latestHistory.description || `Buat Faktur Penjualan ${latestHistory.invoice_number}`}
          </div>
          <div className="text-gray-500 mt-0.5 flex items-center gap-2">
            <span className="font-semibold text-blue-700">
              {latestHistory.modified_by || 'Unknown'}
            </span>
            <span>•</span>
            <span>{formatDate(latestHistory.created_at)}</span>
          </div>
        </div>
      </div>
      
      {history.length > 1 && (
        <button
          onClick={() => {
            // TODO: Bisa ditambahkan modal untuk show all history
            console.log('All history:', history)
          }}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-5"
        >
          Lihat {history.length - 1} history lainnya
        </button>
      )}
    </div>
  )
}

export default SalesInvoiceHistory
