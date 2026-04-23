import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
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
  const [glassIntensity, setGlassIntensity] = useState(() =>
    document.documentElement.getAttribute('data-glass-intensity') || 'medium'
  )

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    const handleGlassIntensityChange = (event) => {
      setGlassIntensity(event.detail || 'medium')
    }

    window.addEventListener('glass-intensity-change', handleGlassIntensityChange)
    return () => window.removeEventListener('glass-intensity-change', handleGlassIntensityChange)
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
      toast.success('Sync dimulai di background. Data akan ter-update dalam beberapa saat.')
      setTimeout(() => fetchDashboardData(), 3000)
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
      subtitle: `${formatNumber(stats?.items?.inStock || 0)} in stock`
    },
    {
      title: 'Sales Orders',
      value: formatNumber(stats?.salesOrders?.total || 0),
      icon: ShoppingCart,
      subtitle: `${formatNumber(stats?.salesOrders?.thisMonth || 0)} this month`
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.salesOrders?.totalRevenue || 0),
      icon: TrendingUp,
      subtitle: 'All time'
    }
  ]

  const chartThemeByIntensity = {
    soft: {
      gridStroke: '#e2e8f0',
      axisStroke: '#64748b',
      barFill: '#f87171',
      tooltipBackground: 'rgba(255,255,255,0.9)',
      tooltipBorder: '1px solid rgba(255,255,255,0.85)',
      tooltipShadow: '0 8px 24px -10px rgba(15, 23, 42, 0.18)',
      tooltipBlur: '6px'
    },
    medium: {
      gridStroke: '#e5e7eb',
      axisStroke: '#6b7280',
      barFill: '#ef4444',
      tooltipBackground: 'rgba(255,255,255,0.75)',
      tooltipBorder: '1px solid rgba(255,255,255,0.7)',
      tooltipShadow: '0 10px 30px -8px rgba(15, 23, 42, 0.25)',
      tooltipBlur: '8px'
    },
    strong: {
      gridStroke: '#f1f5f9',
      axisStroke: '#94a3b8',
      barFill: '#dc2626',
      tooltipBackground: 'rgba(255,255,255,0.62)',
      tooltipBorder: '1px solid rgba(255,255,255,0.55)',
      tooltipShadow: '0 14px 34px -8px rgba(15, 23, 42, 0.32)',
      tooltipBlur: '12px'
    }
  }

  const chartTheme = chartThemeByIntensity[glassIntensity] || chartThemeByIntensity.medium

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Ringkasan aktivitas dan integrasi Accurate."
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {statCards.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              icon={stat.icon}
            />
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Sales Chart */}
          <Card className="p-5 animate-fade-in">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="glass-glow rounded-xl bg-gradient-to-br from-red-500 to-rose-500 p-2 text-white shadow-sm shadow-red-500/25 ring-1 ring-inset ring-white/20">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">Penjualan 7 hari terakhir</h3>
              </div>
            </div>
            {stats?.salesChart && stats.salesChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.salesChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} />
                  <XAxis dataKey="date" stroke={chartTheme.axisStroke} style={{ fontSize: '12px' }} />
                  <YAxis stroke={chartTheme.axisStroke} style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: chartTheme.tooltipBackground,
                      border: chartTheme.tooltipBorder,
                      borderRadius: '0.5rem',
                      boxShadow: chartTheme.tooltipShadow,
                      backdropFilter: `blur(${chartTheme.tooltipBlur})`
                    }}
                  />
                  <Bar
                    dataKey="total"
                    fill={chartTheme.barFill}
                    radius={[8, 8, 0, 0]}
                    isAnimationActive
                    animationDuration={900}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={AlertCircle} title="Tidak ada data" description="Data chart akan muncul di sini." />
            )}
          </Card>

          {/* Recent Activity */}
          <Card className="p-5 animate-fade-in">
            <div className="mb-4 flex items-center gap-2">
                <div className="glass-glow rounded-xl bg-gradient-to-br from-red-500 to-rose-500 p-2 text-white shadow-sm shadow-red-500/25 ring-1 ring-inset ring-white/20">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Sales order terbaru</h3>
            </div>
            <div className="space-y-2">
              {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="glass-hover flex items-center justify-between gap-4 rounded-xl border border-white/60 bg-white/45 px-4 py-3 backdrop-blur-sm hover:bg-white/65"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{order.transNumber}</p>
                      <p className="mt-0.5 truncate text-sm text-slate-600">{order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatRelativeTime(order.transDate)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState icon={AlertCircle} title="Belum ada order" description="Order terbaru akan muncul di sini." />
              )}
            </div>
          </Card>
        </div>

        {/* Accurate Status */}
        {stats?.accurateStatus && (
          <Card className="p-5 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-gradient-to-br from-red-500 to-rose-500 p-2.5 text-white shadow-sm shadow-red-500/25 ring-1 ring-inset ring-white/20">
                <Package className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900">Integrasi Accurate</h4>
                <p className="mt-1 text-sm text-slate-600">
                  Sinkronisasi terakhir:{' '}
                  <span className="font-medium text-slate-900">
                    {formatRelativeTime(stats.accurateStatus.lastSync)}
                  </span>
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={[
                      'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                      stats.accurateStatus.connected
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700'
                    ].join(' ')}
                  >
                    {stats.accurateStatus.connected ? 'Terhubung' : 'Terputus'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DashboardPage
