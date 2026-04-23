import { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  ExternalLink,
  AlertCircle,
  Clock,
  Database
} from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { formatDateTime } from '../utils/helpers'
import Card from './ui/Card'
import EmptyState from './ui/EmptyState'

const AccurateIntegration = () => {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncConfig, setSyncConfig] = useState({
    auto_sync_enabled: true,
    sync_interval_seconds: 300
  })

  useEffect(() => {
    fetchStatus()
    fetchSyncConfig()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await api.get('/accurate/status')
      setStatus(response.data.data)
    } catch (error) {
      console.error('Failed to fetch Accurate status:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSyncConfig = async () => {
    try {
      const response = await api.get('/sync/status')
      if (response.data.data.config) {
        setSyncConfig({
          auto_sync_enabled: response.data.data.config.autoSyncEnabled,
          sync_interval_seconds: response.data.data.config.syncIntervalSeconds
        })
      }
    } catch (error) {
      console.error('Failed to fetch sync config:', error)
    }
  }

  const handleConnect = async () => {
    try {
      const response = await api.get('/accurate/auth-url')
      const authUrl = response.data.data.authUrl
      window.location.href = authUrl
    } catch (error) {
      const msg = error.response?.data?.message || error.message
      toast.error('Failed to get auth URL: ' + msg)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect from Accurate Online?')) {
      return
    }

    try {
      await api.post('/accurate/disconnect')
      toast.success('Disconnected from Accurate Online')
      fetchStatus()
    } catch (error) {
      toast.error('Failed to disconnect')
    }
  }

  const handleSync = async (type = 'full') => {
    setSyncing(true)
    try {
      let endpoint = '/sync/trigger';
      let successMessage = 'Sync started successfully';
      
      // Gunakan endpoint khusus untuk sync mode tertentu
      if (type === 'current-month') {
        endpoint = '/sync/current-month';
        successMessage = 'Current month sync started successfully';
      } else if (type === 'from-march-2026') {
        endpoint = '/sync/from-march-2026';
        successMessage = 'Full sync from March 2026 started successfully';
      } else {
        endpoint = '/sync/trigger';
      }
      
      await api.post(endpoint, type === 'full' ? { type } : {})
      toast.success(successMessage)
      
      // Refresh status after 2 seconds
      setTimeout(() => {
        fetchStatus()
        fetchSyncConfig()
      }, 2000)
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message;
      toast.error('Failed to start sync: ' + errorMsg)
    } finally {
      setSyncing(false)
    }
  }

  const handleUpdateSyncConfig = async () => {
    try {
      await api.put('/sync/config', syncConfig)
      toast.success('Sync configuration updated')
      fetchSyncConfig()
    } catch (error) {
      toast.error('Failed to update sync config')
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-600" />
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Integrasi Accurate Online</h2>
            <p className="mt-1 text-sm text-slate-600">Kelola koneksi dan sinkronisasi data.</p>
          </div>
          {status?.connected ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
              <CheckCircle className="h-4 w-4" />
              <span>Terhubung</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700">
              <XCircle className="h-4 w-4" />
              <span>Belum terhubung</span>
            </div>
          )}
        </div>

        {status?.connected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="mb-1 flex items-center gap-2 text-slate-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Token Expired</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {status.expiresAt ? formatDateTime(status.expiresAt) : 'N/A'}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="mb-1 flex items-center gap-2 text-slate-600">
                  <Database className="h-4 w-4" />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{status.message}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSync('current-month')}
                disabled={syncing}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                title="Sync bulan berjalan saja (cepat)"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                <span>Sync Bulan Ini</span>
              </button>
              <button
                onClick={() => handleSync('from-march-2026')}
                disabled={syncing}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                title="Full sync dari Maret 2026 (lambat)"
              >
                <Database className="h-4 w-4" />
                <span>Full Sync</span>
              </button>
              <button
                onClick={handleDisconnect}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Disconnect
              </button>
            </div>
            
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-700">
                <span className="font-medium">Sync Bulan Ini</span>: update rutin (cepat).
                <br />
                <span className="font-medium">Full Sync</span>: setup awal / tarik data lama (lebih lama).
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <EmptyState
              icon={AlertCircle}
              title="Belum terhubung ke Accurate Online"
              description="Hubungkan akun Accurate Online agar sinkronisasi data dapat berjalan."
            />
            <div className="flex justify-center">
              <button
                onClick={handleConnect}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Connect Accurate</span>
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Sync Configuration */}
      {status?.connected && (
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Konfigurasi Sync</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="font-medium text-slate-900">Auto Sync</p>
                <p className="text-sm text-slate-600">Sinkronisasi otomatis dari Accurate.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncConfig.auto_sync_enabled}
                  onChange={(e) => setSyncConfig({
                    ...syncConfig,
                    auto_sync_enabled: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Interval Sync
              </label>
              <select
                value={syncConfig.sync_interval_seconds}
                onChange={(e) => setSyncConfig({
                  ...syncConfig,
                  sync_interval_seconds: parseInt(e.target.value)
                })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              >
                <option value={60}>1 minute</option>
                <option value={300}>5 minutes</option>
                <option value={600}>10 minutes</option>
                <option value={900}>15 minutes</option>
                <option value={1800}>30 minutes</option>
                <option value={3600}>1 hour</option>
              </select>
              <p className="mt-1 text-sm text-slate-500">
                Seberapa sering data diambil dari Accurate Online.
              </p>
            </div>

            <button
              onClick={handleUpdateSyncConfig}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
            >
              Save
            </button>
          </div>
        </Card>
      )}

      {/* Quick Sync Actions */}
      {status?.connected && (
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Quick Sync</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => handleSync('items')}
              disabled={syncing}
              className="rounded-lg border border-slate-200 bg-white p-4 text-left hover:bg-slate-50 disabled:opacity-60"
            >
              <Database className="mb-2 h-5 w-5 text-slate-700" />
              <p className="text-sm font-medium text-slate-900">Sync Items</p>
              <p className="text-sm text-slate-600">Sync master barang</p>
            </button>
            <button
              onClick={() => handleSync('sales_orders')}
              disabled={syncing}
              className="rounded-lg border border-slate-200 bg-white p-4 text-left hover:bg-slate-50 disabled:opacity-60"
            >
              <Database className="mb-2 h-5 w-5 text-slate-700" />
              <p className="text-sm font-medium text-slate-900">Sync Sales Orders</p>
              <p className="text-sm text-slate-600">Sync pesanan penjualan</p>
            </button>
            <button
              onClick={() => handleSync('full')}
              disabled={syncing}
              className="rounded-lg border border-slate-200 bg-white p-4 text-left hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw className="mb-2 h-5 w-5 text-slate-700" />
              <p className="text-sm font-medium text-slate-900">Full Sync</p>
              <p className="text-sm text-slate-600">Sync semua data</p>
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}

export default AccurateIntegration
