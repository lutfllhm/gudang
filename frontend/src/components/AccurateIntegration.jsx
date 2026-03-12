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
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Accurate Online Integration</h2>
            <p className="text-gray-600 mt-1">Manage your Accurate Online connection</p>
          </div>
          {status?.connected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              <span>Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium">
              <XCircle className="w-4 h-4" />
              <span>Not Connected</span>
            </div>
          )}
        </div>

        {status?.connected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Token Expires</span>
                </div>
                <p className="text-gray-900 font-semibold">
                  {status.expiresAt ? formatDateTime(status.expiresAt) : 'N/A'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Database className="w-4 h-4" />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <p className="text-gray-900 font-semibold">{status.message}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleSync('current-month')}
                disabled={syncing}
                className="btn btn-primary flex items-center gap-2"
                title="Sync bulan berjalan saja (cepat)"
              >
                <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                <span>Sync Bulan Ini</span>
              </button>
              <button
                onClick={() => handleSync('from-march-2026')}
                disabled={syncing}
                className="btn btn-secondary flex items-center gap-2"
                title="Full sync dari Maret 2026 (lambat)"
              >
                <Database className="w-5 h-5" />
                <span>Full Sync</span>
              </button>
              <button
                onClick={handleDisconnect}
                className="btn btn-secondary"
              >
                Disconnect
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Sync Bulan Ini:</strong> Hanya mengambil data bulan berjalan (cepat, untuk update rutin)
                <br />
                <strong>Full Sync:</strong> Mengambil semua data dari Maret 2026 (lambat, untuk setup awal)
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Not Connected to Accurate Online
            </h3>
            <p className="text-gray-600 mb-6">
              Connect your Accurate Online account to sync data automatically
            </p>
            <button
              onClick={handleConnect}
              className="btn btn-primary flex items-center gap-2 mx-auto"
            >
              <ExternalLink className="w-5 h-5" />
              <span>Connect to Accurate Online</span>
            </button>
          </div>
        )}
      </div>

      {/* Sync Configuration */}
      {status?.connected && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Configuration</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Auto Sync</p>
                <p className="text-sm text-gray-600">Automatically sync data from Accurate</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sync Interval (seconds)
              </label>
              <select
                value={syncConfig.sync_interval_seconds}
                onChange={(e) => setSyncConfig({
                  ...syncConfig,
                  sync_interval_seconds: parseInt(e.target.value)
                })}
                className="input"
              >
                <option value={60}>1 minute</option>
                <option value={300}>5 minutes</option>
                <option value={600}>10 minutes</option>
                <option value={900}>15 minutes</option>
                <option value={1800}>30 minutes</option>
                <option value={3600}>1 hour</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                How often to sync data from Accurate Online
              </p>
            </div>

            <button
              onClick={handleUpdateSyncConfig}
              className="btn btn-primary"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}

      {/* Quick Sync Actions */}
      {status?.connected && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Sync</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => handleSync('items')}
              disabled={syncing}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
            >
              <Database className="w-6 h-6 text-blue-600 mb-2" />
              <p className="font-medium text-gray-900">Sync Items</p>
              <p className="text-sm text-gray-600">Sync master barang</p>
            </button>
            <button
              onClick={() => handleSync('sales_orders')}
              disabled={syncing}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
            >
              <Database className="w-6 h-6 text-green-600 mb-2" />
              <p className="font-medium text-gray-900">Sync Sales Orders</p>
              <p className="text-sm text-gray-600">Sync pesanan penjualan</p>
            </button>
            <button
              onClick={() => handleSync('full')}
              disabled={syncing}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
            >
              <RefreshCw className="w-6 h-6 text-purple-600 mb-2" />
              <p className="font-medium text-gray-900">Full Sync</p>
              <p className="text-sm text-gray-600">Sync all data</p>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccurateIntegration
