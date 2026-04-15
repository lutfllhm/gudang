import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useLayoutEffect,
} from 'react'
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
const INITIAL_LIMIT = 1000
// Safety cap so we don't accidentally request an absurdly huge payload.
// If total is bigger than this cap, we fall back to page-by-page fetching.
const MAX_LIMIT = 10000

// Marquee: kecepatan tetap (px/s) agar ganti bulan tidak mengubah kecepatan scroll.
// Durasi = (jarak animasi) / MARQUEE_PX_PER_SECOND; jarak = 2× tinggi konten (100%→-100%).
const MARQUEE_PX_PER_SECOND = 15
const MARQUEE_MIN_DURATION_SEC = 90
const MARQUEE_MAX_DURATION_SEC = 7200

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
  const [isFullscreen, setIsFullscreen] = useState(true)
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

  const fetchRequestId = useRef(0)
  const marqueeRef = useRef(null)
  const [marqueeDurationSec, setMarqueeDurationSec] = useState(600)

  const fetchOrders = useCallback(async ({ silent = false } = {}) => {
    const requestId = ++fetchRequestId.current
    try {
      if (silent) setRefreshing(true)
      else setLoading(true)
      const { startDate, endDate } = getMonthRange(month)

      const firstResponse = await api.get('/sales-orders', {
        params: { page: 1, limit: INITIAL_LIMIT, startDate, endDate },
      })

      // Backend returns: { success, message, data: [...], pagination: {...} }
      if (!firstResponse.data?.success) {
        // Keep previous data on unexpected response to avoid flashing
        console.error(
          '[SchedulePage] Unexpected response structure:',
          firstResponse.data
        )
        return
      }

      const firstOrders = Array.isArray(firstResponse.data.data)
        ? firstResponse.data.data
        : []
      const total = Number(
        firstResponse.data?.pagination?.total ?? firstOrders.length
      )

      let allOrders = firstOrders

      // If total is within our cap, re-fetch once to get everything in one go.
      // This avoids multiple COUNT queries across pages.
      if (total > INITIAL_LIMIT && total <= MAX_LIMIT) {
        const secondResponse = await api.get('/sales-orders', {
          params: { page: 1, limit: total, startDate, endDate },
        })
        if (
          requestId === fetchRequestId.current &&
          secondResponse.data?.success &&
          Array.isArray(secondResponse.data.data)
        ) {
          allOrders = secondResponse.data.data
        }
      }

      // If total exceeds the cap, fall back to fetching page-by-page.
      if (total > MAX_LIMIT) {
        const totalPages = Number(
          firstResponse.data?.pagination?.totalPages ??
            Math.ceil(total / INITIAL_LIMIT)
        )
        const collected = [...firstOrders]
        for (let page = 2; page <= totalPages; page++) {
          const pageResponse = await api.get('/sales-orders', {
            params: { page, limit: INITIAL_LIMIT, startDate, endDate },
          })
          if (!pageResponse.data?.success) break
          const pageOrders = Array.isArray(pageResponse.data.data)
            ? pageResponse.data.data
            : []
          if (pageOrders.length === 0) break
          collected.push(...pageOrders)
        }
        allOrders = collected
      }

      // Ignore out-of-date requests (e.g. user changes month quickly).
      if (requestId !== fetchRequestId.current) return

      setOrders(allOrders)
      const counter = allOrders.reduce(
        (acc, o) => {
          const group = getOrderStatusGroup(o)
          if (group === 'completed') acc.completed += 1
          else if (group === 'processing') acc.processing += 1
          else if (group === 'pending') acc.pending += 1
          return acc
        },
        { completed: 0, processing: 0, pending: 0 }
      )
      const totalRevenue = allOrders.reduce(
        (sum, o) => sum + (o.totalAmount || 0),
        0
      )

      setStats({
        total: allOrders.length,
        completed: counter.completed,
        processing: counter.processing,
        pending: counter.pending,
        totalRevenue,
      })
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
    if (!date) return '—'
    const dt = new Date(date)
    if (Number.isNaN(dt.getTime())) return '—'
    return dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  const getOrderTimeValue = (order) => {
    // "Opsi A": Time mengikuti waktu SO tersimpan ke DB / terakhir sync,
    // karena `tanggal_so` di DB adalah DATE (tanpa jam).
    return (
      order?.createdAt ??
      order?.lastSync ??
      order?.transDate ??
      order?.updatedAt ??
      null
    )
  }

  const filteredAndSortedOrders = useMemo(() => {
    let list = orders.filter((o) => {
      if (filterStatus === 'all') return true
      return getOrderStatusGroup(o) === filterStatus
    })
    const dir = sortDir === 'asc' ? 1 : -1
    list = [...list].sort((a, b) => {
      const tA = new Date(getOrderTimeValue(a)).getTime()
      const tB = new Date(getOrderTimeValue(b)).getTime()
      switch (sortBy) {
        case 'time':
          return (tA - tB) * dir
        case 'so':
          return ((a.transNumber || '').localeCompare(b.transNumber || '')) * dir
        case 'date':
          return (
            (new Date(a.transDate).getTime() - new Date(b.transDate).getTime()) * dir
          )
        case 'status':
          return (getOrderStatusGroup(a).localeCompare(getOrderStatusGroup(b))) * dir
        default:
          return (tA - tB) * dir
      }
    })
    return list
  }, [orders, filterStatus, sortBy, sortDir])

  const updateMarqueeDuration = useCallback(() => {
    const el = marqueeRef.current
    if (!el) return
    const h = el.offsetHeight
    if (h < 4) return
    const travelPx = 2 * h
    const sec = travelPx / MARQUEE_PX_PER_SECOND
    setMarqueeDurationSec(
      Math.round(
        Math.min(
          MARQUEE_MAX_DURATION_SEC,
          Math.max(MARQUEE_MIN_DURATION_SEC, sec)
        )
      )
    )
  }, [])

  useLayoutEffect(() => {
    const el = marqueeRef.current
    if (!el) return
    updateMarqueeDuration()
    const ro = new ResizeObserver(() => {
      updateMarqueeDuration()
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [filteredAndSortedOrders, updateMarqueeDuration])

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

      <div className="relative z-10 min-h-screen flex flex-col p-3 sm:p-4 lg:p-5 w-full">
        {/* Top bar */}
        <header className="flex items-center justify-between mb-4">
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
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-4 pb-4 border-b border-slate-700/60"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
              Schedule Board
            </h1>
            <p className="mt-1 text-slate-400 text-xs font-medium tracking-wide flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Live
            </p>
          </div>
          <div className="flex flex-col items-start lg:items-end">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-mono font-semibold tabular-nums text-slate-100 tracking-tight">
              {currentTime.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
            <span className="text-slate-500 text-xs mt-1">
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
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
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
              <div className="p-3 flex items-center gap-3">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    stat.accent === 'cyan'
                      ? 'bg-cyan-500/10 text-cyan-400'
                      : stat.accent === 'emerald'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : stat.accent === 'amber'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  <stat.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    {stat.label}
                  </div>
                  <div
                    className={`text-xl font-bold tabular-nums mt-0.5 ${
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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
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
          <div className="sticky top-0 z-20 grid grid-cols-12 gap-3 px-4 lg:px-6 py-3 bg-slate-800/90 border-b border-slate-700/60 backdrop-blur-sm">
            {tableColumns.map((col) => (
              <div
                key={col.key}
                className={`${col.span} flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider`}
              >
                <col.icon className="w-4 h-4 shrink-0 text-slate-500" />
                {col.label}
              </div>
            ))}
          </div>

          <div className="divide-y divide-slate-700/40 max-h-[calc(100vh-260px)] min-h-[600px] overflow-hidden relative">
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
              <div
                ref={marqueeRef}
                className="running-vertical absolute inset-x-0 bottom-0"
                style={{ ['--marquee-duration']: `${marqueeDurationSec}s` }}
              >
                {[...filteredAndSortedOrders, ...filteredAndSortedOrders].map((order, index) => {
                  const statusConfig = getStatusConfig(order.status)
                  return (
                    <div
                      key={`${order.id || order.transNumber || 'row'}-${index}`}
                      className={`grid grid-cols-12 gap-3 px-4 lg:px-6 py-3 lg:py-3 hover:bg-slate-800/40 transition-colors border-l-2 border-transparent hover:border-cyan-500/40 ${
                        index % 2 === 1 ? 'bg-slate-800/20' : ''
                      }`}
                    >
                      <div className="col-span-1 flex items-center min-w-0">
                        <span className="text-base font-mono font-medium text-slate-300 tabular-nums">
                          {formatTime(getOrderTimeValue(order))}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center min-w-0">
                        <span className="text-base font-medium text-slate-100 truncate" title={order.transNumber}>
                          {order.transNumber}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center min-w-0">
                        <span className="text-base text-slate-400 font-mono tabular-nums">
                          {formatDate(order.transDate)}
                        </span>
                      </div>
                      <div className="col-span-3 flex items-center min-w-0">
                        <span className="text-base text-slate-200 truncate block" title={order.customerName}>
                          {order.customerName}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center min-w-0">
                        {order.description ? (
                          <span className="text-base text-slate-400 truncate block" title={order.description}>
                            {order.description}
                          </span>
                        ) : (
                          <span className="text-base font-mono text-slate-300">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center justify-center">
                        <span
                          className={`inline-flex items-center justify-center min-w-[100px] px-3 py-2 rounded-md border text-xs font-semibold uppercase tracking-wider ${statusConfig.className} ${statusConfig.glow}`}
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
        <footer className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-2 py-2 px-3 rounded-lg bg-slate-800/40 border border-slate-700/40">
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
        /* Optimized for 43" TV (1920x1080) */
        @media screen and (min-width: 1920px) {
          html {
            font-size: 16px;
          }
        }
        
        /* Prevent zoom and ensure proper scaling */
        * {
          -webkit-text-size-adjust: 100%;
          -moz-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
          text-size-adjust: 100%;
        }
        
        @keyframes vertical-marquee {
          0% { transform: translateY(100%); }
          100% { transform: translateY(-100%); }
        }
        .running-vertical {
          will-change: transform;
          /* linear scroll; hover pauses — default fallback jika CSS var tidak set */
          animation: vertical-marquee var(--marquee-duration, 600s) linear infinite;
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
