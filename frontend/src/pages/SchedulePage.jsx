import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardLayout from '../components/DashboardLayout'
import usePageTitle from '../hooks/usePageTitle'
import Logo from '../components/Logo'
import api from '../utils/api'
import { formatCurrency, formatDate } from '../utils/helpers'
import AnimatedCounter from '../components/AnimatedCounter'
import {
  Maximize2,
  Minimize2,
  RefreshCw,
  Clock,
  Package,
  CheckCircle2,
  AlertCircle,
  Activity,
  Warehouse,
  Calendar,
  User,
  FileText,
  ClipboardList,
  Filter,
} from 'lucide-react'

const AUTO_REFRESH_MS = 30000
const DEFAULT_LIMIT = 200

const STATUS_GROUP = {
  // disamakan dengan Accurate + status dari app (QUEUE/PROCEED/WATING)
  completed: ['completed', 'terproses', 'selesai', 'proceed'],
  processing: ['processing', 'sebagian terproses', 'diproses'],
  pending: [
    'pending',
    'belum terproses',
    'menunggu proses',
    'menunggu diproses',
    'dipesan',
    'queue',
    'waiting',
  ],
}

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

const getOrderStatusGroup = (order) => {
  const s = (order?.status || '').toLowerCase()
  if (STATUS_GROUP.completed.some((x) => x === s)) return 'completed'
  if (STATUS_GROUP.processing.some((x) => x === s)) return 'processing'
  if (STATUS_GROUP.pending.some((x) => x === s)) return 'pending'
  return 'other'
}

const SchedulePage = () => {
  usePageTitle('Schedule SO')
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [month, setMonth] = useState(() => toYyyyMm(new Date()))
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('time')
  const [sortDir, setSortDir] = useState('desc')
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    processing: 0,
    pending: 0,
    totalRevenue: 0,
  })

  const fetchOrders = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) setRefreshing(true)
      else setLoading(true)
      const { startDate, endDate } = getMonthRange(month)
      const response = await api.get('/sales-orders', {
        params: { page: 1, limit: DEFAULT_LIMIT, startDate, endDate },
      })

      // Backend returns: { success, message, data: [...], pagination: {...} }
      if (response.data?.success) {
        const fetchedOrders = Array.isArray(response.data.data)
          ? response.data.data
          : []
        setOrders(fetchedOrders)

        const counter = fetchedOrders.reduce(
          (acc, o) => {
            const group = getOrderStatusGroup(o)
            if (group === 'completed') acc.completed += 1
            else if (group === 'processing') acc.processing += 1
            else if (group === 'pending') acc.pending += 1
            return acc
          },
          { completed: 0, processing: 0, pending: 0 }
        )
        const totalRevenue = fetchedOrders.reduce(
          (sum, o) => sum + (o.totalAmount || 0),
          0
        )

        setStats({
          total: fetchedOrders.length,
          completed: counter.completed,
          processing: counter.processing,
          pending: counter.pending,
          totalRevenue,
        })
      } else {
        // Keep previous data on unexpected response to avoid flashing
        console.error('[SchedulePage] Unexpected response structure:', response.data)
      }
    } catch (error) {
      console.error('[SchedulePage] Failed to fetch orders:', error)
    } finally {
      if (silent) setRefreshing(false)
      else setLoading(false)
    }
  }, [month])

  useEffect(() => {
    fetchOrders()
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timeInterval)
  }, [fetchOrders])

  useEffect(() => {
    const refreshInterval = setInterval(() => fetchOrders({ silent: true }), AUTO_REFRESH_MS)
    return () => clearInterval(refreshInterval)
  }, [fetchOrders])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const getStatusConfig = (status) => {
    const s = (status || '').toLowerCase()
    if (['completed', 'terproses', 'selesai', 'proceed'].includes(s)) {
      return {
        className:
          'bg-emerald-500/15 text-emerald-400 border-emerald-400/40',
        glow: 'animate-neon-pulse-green',
      }
    }
    if (['processing', 'sebagian terproses', 'diproses'].includes(s)) {
      return {
        className:
          'bg-amber-500/15 text-amber-400 border-amber-400/40',
        glow: 'animate-neon-pulse-yellow',
      }
    }
    if (
      [
        'pending',
        'belum terproses',
        'menunggu proses',
        'menunggu diproses',
        'dipesan',
        'queue',
        'waiting',
      ].includes(s)
    ) {
      return {
        className:
          'bg-red-500/15 text-red-400 border-red-400/40',
        glow: 'animate-neon-pulse-red',
      }
    }
    if (s === 'cancelled' || s === 'batal') {
      return {
        className: 'bg-slate-500/15 text-slate-400 border-slate-400/40',
        glow: '',
      }
    }
    return {
      className: 'bg-cyan-500/15 text-cyan-400 border-cyan-400/40',
      glow: 'animate-neon-pulse-blue',
    }
  }

  const formatStatusLabel = (status) => {
    const s = (status || '').toLowerCase()
    if (s === 'completed' || s === 'selesai' || s === 'terproses' || s === 'proceed') {
      return 'Terproses'
    }
    if (s === 'processing' || s === 'sebagian terproses' || s === 'diproses') {
      return 'Sebagian Terproses'
    }
    if (
      s === 'pending' ||
      s === 'belum terproses' ||
      s === 'menunggu proses' ||
      s === 'menunggu diproses' ||
      s === 'dipesan' ||
      s === 'queue' ||
      s === 'waiting'
    ) {
      return 'Menunggu diproses'
    }
    if (s === 'cancelled' || s === 'batal') {
      return 'Batal'
    }
    return status || '—'
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredAndSortedOrders = useMemo(() => {
    let list = orders.filter((o) => {
      if (filterStatus === 'all') return true
      return getOrderStatusGroup(o) === filterStatus
    })
    const dir = sortDir === 'asc' ? 1 : -1
    list = [...list].sort((a, b) => {
      const tA = new Date(a.transDate).getTime()
      const tB = new Date(b.transDate).getTime()
      switch (sortBy) {
        case 'time':
          return (tA - tB) * dir
        case 'so':
          return ((a.transNumber || '').localeCompare(b.transNumber || '')) * dir
        case 'date':
          return (tA - tB) * dir
        case 'status':
          return (getOrderStatusGroup(a).localeCompare(getOrderStatusGroup(b))) * dir
        default:
          return (tA - tB) * dir
      }
    })
    return list
  }, [orders, filterStatus, sortBy, sortDir])

  const tableColumns = [
    { key: 'time', label: 'Time', icon: Clock, span: 'col-span-1' },
    { key: 'so', label: 'SO Number', icon: FileText, span: 'col-span-2' },
    { key: 'date', label: 'Date', icon: Calendar, span: 'col-span-2' },
    { key: 'customer', label: 'Customer', icon: User, span: 'col-span-3' },
    { key: 'description', label: 'Description', icon: ClipboardList, span: 'col-span-2' },
    { key: 'status', label: 'Status', icon: Activity, span: 'col-span-2' },
  ]

  const renderScheduleContent = () => (
    <div
      className={`${
        isFullscreen ? 'min-h-screen' : ''
      } bg-slate-950 relative overflow-hidden`}
    >
      {/* Subtle noise texture for depth */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(148 163 184) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col p-6 sm:p-8 lg:p-10 max-w-[1920px] mx-auto">
        {/* Top bar */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Logo variant="neon" size="md" className="rounded-lg" />
            <div className="hidden sm:block border-l border-slate-600/60 pl-4">
              <div className="text-slate-400 text-xs font-semibold tracking-wider uppercase">
                Warehouse Control
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                Schedule &amp; Operations
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => navigate(-1)}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-600/50 text-slate-200 text-sm hover:bg-slate-700/80 hover:border-slate-500/50 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-950"
              whileTap={{ scale: 0.97 }}
            >
              Kembali
            </motion.button>
            <motion.button
              onClick={() => fetchOrders({ silent: true })}
              disabled={loading}
              className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-600/50 text-slate-300 hover:bg-slate-700/80 hover:border-slate-500/50 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-60"
              whileTap={{ scale: 0.97 }}
            >
              <RefreshCw
                className={`w-5 h-5 ${(loading || refreshing) ? 'animate-spin' : ''}`}
              />
            </motion.button>
            <motion.button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-600/50 text-slate-300 hover:bg-slate-700/80 hover:border-slate-500/50 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-950"
              whileTap={{ scale: 0.97 }}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </header>

        {/* Hero: Title + Clock */}
        <motion.section
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-8 pb-8 border-b border-slate-700/60"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              Schedule Board
            </h1>
            <p className="mt-2 text-slate-400 text-sm font-medium tracking-wide flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Live
            </p>
          </div>
          <div className="flex flex-col items-start lg:items-end">
            <span className="text-4xl sm:text-5xl lg:text-6xl font-mono font-semibold tabular-nums text-slate-100 tracking-tight">
              {currentTime.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
            <span className="text-slate-500 text-sm mt-1">
              {currentTime.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </motion.section>

        {/* Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              key: 'total',
              label: 'Total SO',
              value: stats.total,
              icon: Package,
              accent: 'cyan',
            },
            {
              key: 'completed',
              label: 'Terproses',
              value: stats.completed,
              icon: CheckCircle2,
              accent: 'emerald',
            },
            {
              key: 'processing',
              label: 'Sebagian terproses',
              value: stats.processing,
              icon: Activity,
              accent: 'amber',
            },
            {
              key: 'pending',
              label: 'Menunggu diproses',
              value: stats.pending,
              icon: AlertCircle,
              accent: 'red',
            },
          ].map((stat) => (
            <motion.div
              key={stat.key}
              className="relative rounded-xl bg-slate-800/60 border border-slate-700/50 overflow-hidden group"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className={`absolute top-0 left-0 right-0 h-0.5 bg-${stat.accent}-500/60`}
                style={{
                  backgroundColor:
                    stat.accent === 'cyan'
                      ? 'rgba(6, 182, 212, 0.6)'
                      : stat.accent === 'emerald'
                        ? 'rgba(16, 185, 129, 0.6)'
                        : stat.accent === 'amber'
                          ? 'rgba(245, 158, 11, 0.6)'
                          : 'rgba(239, 68, 68, 0.6)',
                }}
              />
              <div className="p-5 flex items-center gap-4">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    stat.accent === 'cyan'
                      ? 'bg-cyan-500/10 text-cyan-400'
                      : stat.accent === 'emerald'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : stat.accent === 'amber'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    {stat.label}
                  </div>
                  <div
                    className={`text-2xl font-bold tabular-nums mt-0.5 ${
                      stat.accent === 'cyan'
                        ? 'text-cyan-300'
                        : stat.accent === 'emerald'
                          ? 'text-emerald-300'
                          : stat.accent === 'amber'
                            ? 'text-amber-300'
                            : 'text-red-300'
                    }`}
                  >
                    <AnimatedCounter value={stat.value} duration={0.4} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </section>

        {/* Filter & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mr-2">Status</span>
            {[
              { value: 'all', label: 'Semua' },
              { value: 'completed', label: 'Terproses' },
              { value: 'processing', label: 'Sebagian terproses' },
              { value: 'pending', label: 'Menunggu diproses' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterStatus(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === opt.value
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : 'bg-slate-800/60 text-slate-400 border border-slate-600/50 hover:bg-slate-700/60 hover:text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Month</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
            />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sort</span>
            {refreshing && (
              <span className="text-xs text-slate-500 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400/80 animate-pulse" />
                Syncing…
              </span>
            )}
            <select
              value={`${sortBy}-${sortDir}`}
              onChange={(e) => {
                const [field, dir] = e.target.value.split('-')
                setSortBy(field)
                setSortDir(dir)
              }}
              className="bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
            >
              <option value="time-desc">Time (newest)</option>
              <option value="time-asc">Time (oldest)</option>
              <option value="so-asc">SO Number (A–Z)</option>
              <option value="so-desc">SO Number (Z–A)</option>
              <option value="date-desc">Date (newest)</option>
              <option value="date-asc">Date (oldest)</option>
              <option value="status-asc">Status (A–Z)</option>
              <option value="status-desc">Status (Z–A)</option>
            </select>
          </div>
        </div>


        {/* Table */}
        <motion.section
          className="flex-1 rounded-xl border border-slate-700/50 bg-slate-900/30 overflow-hidden shadow-xl shadow-black/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <div className="sticky top-0 z-20 grid grid-cols-12 gap-4 px-6 lg:px-8 py-4 bg-slate-800/90 border-b border-slate-700/60 backdrop-blur-sm">
            {tableColumns.map((col) => (
              <div
                key={col.key}
                className={`${col.span} flex items-center gap-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider`}
              >
                <col.icon className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                {col.label}
              </div>
            ))}
          </div>

          <div className="divide-y divide-slate-700/40 max-h-[calc(100vh-420px)] min-h-[400px] overflow-hidden relative">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-4">
                <RefreshCw className="w-10 h-10 text-slate-500 animate-spin" />
                <p className="text-slate-500 text-sm font-medium">
                  Loading schedule…
                </p>
              </div>
            ) : filteredAndSortedOrders.length === 0 ? (
              <motion.div
                className="py-24 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Warehouse className="w-14 h-14 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 font-medium text-lg">
                  {orders.length === 0
                    ? 'No orders scheduled'
                    : 'No orders match this filter'}
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  {orders.length === 0
                    ? 'New sales orders will appear here when added.'
                    : 'Try another status filter.'}
                </p>
              </motion.div>
            ) : (
              <div className="running-vertical absolute inset-x-0 bottom-0">
                {[...filteredAndSortedOrders, ...filteredAndSortedOrders].map((order, index) => {
                  const statusConfig = getStatusConfig(order.status)
                  return (
                    <div
                      key={`${order.id || order.transNumber || 'row'}-${index}`}
                      className={`grid grid-cols-12 gap-4 px-6 lg:px-8 py-4 lg:py-4 hover:bg-slate-800/40 transition-colors border-l-2 border-transparent hover:border-cyan-500/40 ${
                        index % 2 === 1 ? 'bg-slate-800/20' : ''
                      }`}
                    >
                      <div className="col-span-1 flex items-center min-w-0">
                        <span className="text-sm font-mono font-medium text-slate-300 tabular-nums">
                          {formatTime(order.transDate)}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center min-w-0">
                        <span className="text-sm font-medium text-slate-100 truncate" title={order.transNumber}>
                          {order.transNumber}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center min-w-0">
                        <span className="text-sm text-slate-400 font-mono tabular-nums">
                          {formatDate(order.transDate)}
                        </span>
                      </div>
                      <div className="col-span-3 flex items-center min-w-0">
                        <span className="text-sm text-slate-200 truncate block" title={order.customerName}>
                          {order.customerName}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center min-w-0">
                        {order.description ? (
                          <span className="text-sm text-slate-400 truncate block" title={order.description}>
                            {order.description}
                          </span>
                        ) : (
                          <span className="text-sm font-mono text-slate-300">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center justify-center">
                        <span
                          className={`inline-flex items-center justify-center min-w-[88px] px-3 py-1.5 rounded-md border text-[10px] font-semibold uppercase tracking-wider ${statusConfig.className} ${statusConfig.glow}`}
                        >
                          {formatStatusLabel(order.status)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.section>

        {/* Status bar */}
        <footer className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-4 rounded-lg bg-slate-800/40 border border-slate-700/40">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2 text-slate-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              System online
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-500">Auto refresh 30s</span>
          </div>
          <span className="text-slate-500 text-sm">
            iWare · Warehouse Management
          </span>
        </footer>
      </div>

      <style>{`
        @keyframes vertical-marquee {
          0% { transform: translateY(100%); }
          100% { transform: translateY(-100%); }
        }
        .running-vertical {
          will-change: transform;
          /* perlambat jauh supaya sekitar 30–40px/detik atau lebih lambat */
          animation: vertical-marquee 300s linear infinite;
        }
        .running-vertical:hover {
          animation-play-state: paused;
        }

        @keyframes neon-pulse-green {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.2); }
          50% { box-shadow: 0 0 0 3px rgba(16,185,129,0.15); }
        }
        @keyframes neon-pulse-yellow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.2); }
          50% { box-shadow: 0 0 0 3px rgba(245,158,11,0.15); }
        }
        @keyframes neon-pulse-red {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.2); }
          50% { box-shadow: 0 0 0 3px rgba(239,68,68,0.15); }
        }
        @keyframes neon-pulse-blue {
          0%, 100% { box-shadow: 0 0 0 0 rgba(6,182,212,0.2); }
          50% { box-shadow: 0 0 0 3px rgba(6,182,212,0.15); }
        }
        .animate-neon-pulse-green { animation: neon-pulse-green 2.5s ease-in-out infinite; }
        .animate-neon-pulse-yellow { animation: neon-pulse-yellow 2.5s ease-in-out infinite; }
        .animate-neon-pulse-red { animation: neon-pulse-red 2.5s ease-in-out infinite; }
        .animate-neon-pulse-blue { animation: neon-pulse-blue 2.5s ease-in-out infinite; }
        .schedule-scrollbar::-webkit-scrollbar { width: 8px; }
        .schedule-scrollbar::-webkit-scrollbar-track { background: rgb(15 23 42); border-radius: 4px; }
        .schedule-scrollbar::-webkit-scrollbar-thumb { background: rgb(51 65 85); border-radius: 4px; }
        .schedule-scrollbar::-webkit-scrollbar-thumb:hover { background: rgb(71 85 105); }
      `}</style>
    </div>
  )

  if (isFullscreen) return renderScheduleContent()
  return (
    <DashboardLayout>
      {renderScheduleContent()}
    </DashboardLayout>
  )
}

export default SchedulePage
