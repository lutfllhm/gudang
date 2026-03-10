import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import usePageTitle from '../hooks/usePageTitle'
import api from '../utils/api'
import { formatCurrency, formatNumber, formatRelativeTime } from '../utils/helpers'
import {
  Package,
  ShoppingCart,
  TrendingUp,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

const DashboardPage = () => {
  usePageTitle('Dashboard')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      console.log('[DashboardPage] Fetching dashboard data...')
      const response = await api.get('/dashboard/stats')
      console.log('[DashboardPage] Dashboard data fetched:', response.data)
      
      // Defensive: Check if response has expected structure
      if (response.data && response.data.data) {
        setStats(response.data.data)
      } else {
        console.error('[DashboardPage] Unexpected response structure:', response.data)
        setStats({})
      }
    } catch (error) {
      console.error('[DashboardPage] Failed to fetch dashboard data:', error)
      // Don't show toast for rate limiting or network errors - just log them
      if (error.response?.status !== 429) {
        // Only show error for non-rate-limit errors
        console.warn('Dashboard data fetch failed silently')
      }
      setStats({})
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      await api.post('/sync/items')
      toast.success('Sync items berhasil')
      fetchDashboardData()
    } catch (error) {
      toast.error('Sync gagal: ' + (error.response?.data?.message || error.message))
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSpinner fullScreen />
      </DashboardLayout>
    )
  }

  const statCards = [
    {
      title: 'Total Items',
      value: formatNumber(stats?.items?.total || 0),
      icon: Package,
      color: 'blue',
      subtitle: `${formatNumber(stats?.items?.inStock || 0)} in stock`
    },
    {
      title: 'Sales Orders',
      value: formatNumber(stats?.salesOrders?.total || 0),
      icon: ShoppingCart,
      color: 'green',
      subtitle: `${formatNumber(stats?.salesOrders?.thisMonth || 0)} this month`
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.salesOrders?.totalRevenue || 0),
      icon: TrendingUp,
      color: 'purple',
      subtitle: 'All time'
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="animate-slide-in-left">
            <h1 className="text-4xl font-bold text-gradient-brand mb-2">Dashboard</h1>
            <p className="text-gray-600 text-lg">
              Selamat datang kembali! Berikut ringkasan aktivitas Anda.
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="mt-4 sm:mt-0 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all flex items-center gap-2 shadow-primary hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed animate-slide-in-right"
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            <span>Sinkronisasi Accurate</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            const colorClasses = {
              blue: 'from-blue-600 to-blue-700',
              green: 'from-green-600 to-green-700',
              purple: 'from-purple-600 to-purple-700'
            }
            const bgClasses = {
              blue: 'bg-blue-50',
              green: 'bg-green-50',
              purple: 'bg-purple-50'
            }

            return (
              <div 
                key={index} 
                className="relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl transition-all duration-500 group cursor-pointer overflow-hidden hover-lift animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Background Gradient Overlay */}
                <div className={`absolute inset-0 ${bgClasses[stat.color]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{stat.title}</p>
                    <p className="text-4xl font-bold text-gray-900 mb-2 group-hover:scale-105 transition-transform duration-300">{stat.value}</p>
                    <p className="text-sm text-gray-600 font-medium">{stat.subtitle}</p>
                  </div>
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${colorClasses[stat.color]} shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                </div>

                {/* Decorative Element */}
                <div className={`absolute -bottom-2 -right-2 w-24 h-24 bg-gradient-to-br ${colorClasses[stat.color]} opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700`} />
              </div>
            )
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl transition-all duration-500 hover-lift">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl">
                <TrendingUp className="text-white" size={20} />
              </div>
              <span>Ringkasan Penjualan (7 Hari Terakhir)</span>
            </h3>
            {stats?.salesChart && stats.salesChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.salesChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="total" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Tidak ada data tersedia</p>
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl transition-all duration-500 hover-lift">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-600 to-green-700 rounded-xl">
                <ShoppingCart className="text-white" size={20} />
              </div>
              <span>Sales Order Terbaru</span>
            </h3>
            <div className="space-y-3">
              {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order, idx) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-50 hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-300 cursor-pointer border border-gray-200 hover:border-blue-300 hover:shadow-lg group animate-fade-in"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{order.transNumber}</p>
                      <p className="text-sm text-gray-600 mt-1">{order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900 group-hover:text-green-600 transition-colors">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatRelativeTime(order.transDate)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="font-semibold">Tidak ada order terbaru</p>
                  <p className="text-sm text-gray-400 mt-1">Order akan muncul di sini</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Accurate Status */}
        {stats?.accurateStatus && (
          <div className="relative bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 rounded-2xl shadow-lg border border-blue-200 p-6 hover:shadow-2xl transition-all duration-500 overflow-hidden group">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 flex items-start gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-xl mb-3">Integrasi Accurate</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Sinkronisasi terakhir: <span className="font-bold text-blue-600">{formatRelativeTime(stats.accurateStatus.lastSync)}</span>
                </p>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className={`w-3 h-3 rounded-full ${stats.accurateStatus.connected ? 'bg-green-500' : 'bg-red-500'} block`}></span>
                    <span className={`absolute inset-0 w-3 h-3 rounded-full ${stats.accurateStatus.connected ? 'bg-green-500' : 'bg-red-500'} animate-ping`}></span>
                  </div>
                  <span className={`text-sm font-bold ${stats.accurateStatus.connected ? 'text-green-600' : 'text-red-600'}`}>
                    Status: {stats.accurateStatus.connected ? 'Terhubung' : 'Terputus'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DashboardPage
