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
const INITIAL_LIMIT = 5000
// Safety cap so we don't accidentally request an absurdly huge payload.
// If total is bigger than this cap, we fall back to page-by-page fetching.
const MAX_LIMIT = 50000

// Marquee: kecepatan tetap (px/s) agar ganti bulan tidak mengubah kecepatan scroll.
// Durasi = (jarak animasi) / MARQUEE_PX_PER_SECOND; jarak = 2× tinggi konten (100%→-100%).
const MARQUEE_PX_PER_SECOND = 15
const MARQUEE_MIN_DURATION_SEC = 90
const MARQUEE_MAX_DURATION_SEC = 7200

const STATUS_GROUP = {
  // disamakan dengan Accurate + status dari app (QUEUE/PROCEED/WATING)
  completed: ['completed', 'terproses', 'selesai', 'proceed', 'closed', 'close', 'finished', 'done'],
  processing: [
    'processing', 
    'sebagian terproses', 
    'sebagian diproses', 
    'diproses',
    'partial',
    'partially',
    'in progress',
    'in_progress'
  ],
  pending: [
    'pending',
    'belum terproses',
    'menunggu proses',
    'menunggu diproses',
    'dipesan',
    'queue',
    'waiting',
    'open',
    'opened',
    'new',
    'draft'
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
  const s = (order?.status || '').toLowerCase().trim()
  if (STATUS_GROUP.completed.some((x) => s.includes(x))) return 'completed'
  if (STATUS_GROUP.processing.some((x) => s.includes(x))) return 'processing'
  if (STATUS_GROUP.pending.some((x) => s.includes(x))) return 'pending'
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
  const [filterStatus, setFilterStatus] = useState('active')
  const [sortBy, setSortBy] = useState('time')
  const [sortDir, setSortDir] = useState('asc')
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

      console.log('[SchedulePage] Total orders fetched:', allOrders.length)
      console.log('[SchedulePage] Total from API:', total)

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
      
      console.log('[SchedulePage] Stats breakdown:', counter)
      
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
    
    // Auto fullscreen saat halaman dibuka
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log('Fullscreen request failed:', err)
      })
      setIsFullscreen(true)
    }
    
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
    const s = (status || '').toLowerCase().trim()
    
    // Completed statuses - Green
    if (STATUS_GROUP.completed.some(x => s.includes(x))) {
      return {
        className:
          'bg-emerald-500/15 text-emerald-400 border-emerald-400/40',
        glow: 'animate-neon-pulse-green',
      }
    }
    
    // Processing statuses - Yellow/Amber
    if (STATUS_GROUP.processing.some(x => s.includes(x))) {
      return {
        className:
          'bg-amber-500/15 text-amber-400 border-amber-400/40',
        glow: 'animate-neon-pulse-yellow',
      }
    }
    
    // Pending statuses - Red
    if (STATUS_GROUP.pending.some(x => s.includes(x))) {
      return {
        className:
          'bg-red-500/15 text-red-400 border-red-400/40',
        glow: 'animate-neon-pulse-red',
      }
    }
    
    // Cancelled
    if (s === 'cancelled' || s === 'batal') {
      return {
        className: 'bg-slate-500/15 text-slate-400 border-slate-400/40',
        glow: '',
      }
    }
    
    // Default
    return {
      className: 'bg-cyan-500/15 text-cyan-400 border-cyan-400/40',
      glow: 'animate-neon-pulse-blue',
    }
  }

  const formatStatusLabel = (status) => {
    const s = (status || '').toLowerCase().trim()
    
    // Completed
    if (STATUS_GROUP.completed.some(x => s.includes(x))) {
      return 'Terproses'
    }
    
    // Processing - PERSIS seperti Accurate: "Sebagian diproses"
    if (STATUS_GROUP.processing.some(x => s.includes(x))) {
      return 'Sebagian diproses'
    }
    
    // Pending
    if (STATUS_GROUP.pending.some(x => s.includes(x))) {
      return 'Menunggu diproses'
    }
    
    // Cancelled
    if (s === 'cancelled' || s === 'batal') {
      return 'Batal'
    }
    
    // Return original if no match
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
      if (filterStatus === 'active') {
        // Hanya tampilkan pending dan processing, exclude completed
        const group = getOrderStatusGroup(o)
        return group === 'pending' || group === 'processing'
      }
      return getOrderStatusGroup(o) === filterStatus
    })
    
    console.log('[SchedulePage] Filtered orders count:', list.length, 'Filter:', filterStatus)
    
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
    { key: 'time', label: 'Time', icon: Clock },
    { key: 'so', label: 'SO Number', icon: FileText },
    { key: 'date', label: 'Date', icon: Calendar },
    { key: 'customer', label: 'Customer', icon: User },
    { key: 'description', label: 'Description', icon: ClipboardList },
    { key: 'status', label: 'Status', icon: Activity },
  ]

  const renderScheduleContent = () => (
    <div
      className={`${
        isFullscreen ? 'min-h-screen' : ''
      } bg-slate-950 relative overflow-hidden tv-display-mode`}
      style={{
        transformOrigin: 'top left',
      }}
    >
      {/* Subtle noise texture for depth */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(148 163 184) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 h-screen flex flex-col p-2 w-full overflow-hidden">
        {/* Top bar - Compact */}
        <header className="flex items-center justify-between mb-1.5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Logo variant="neon" size="sm" className="rounded-lg" />
            <div className="border-l border-slate-600/60 pl-3">
              <div className="text-slate-400 text-[10px] font-semibold tracking-wider uppercase">
                Warehouse Control
              </div>
              <div className="text-slate-500 text-[9px] mt-0.5">
                Schedule &amp; Operations
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => fetchOrders({ silent: true })}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800/80 border border-slate-600/50 text-slate-300 hover:bg-slate-700/80 hover:border-slate-500/50 hover:text-white transition-colors disabled:opacity-60"
              whileTap={{ scale: 0.97 }}
            >
              <RefreshCw
                className={`w-5 h-5 ${(loading || refreshing) ? 'animate-spin' : ''}`}
              />
            </motion.button>
            <motion.button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-slate-800/80 border border-slate-600/50 text-slate-300 hover:bg-slate-700/80 hover:border-slate-500/50 hover:text-white transition-colors"
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

        {/* Hero: Title + Clock - Compact */}
        <motion.section
          className="flex items-center justify-between gap-2 mb-1.5 pb-1.5 border-b border-slate-700/60 flex-shrink-0"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Schedule Board
            </h1>
            <p className="mt-0.5 text-slate-400 text-[10px] font-medium tracking-wide flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Live
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-2xl font-mono font-semibold tabular-nums text-slate-100 tracking-tight">
              {currentTime.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
            <span className="text-slate-500 text-[10px] mt-0.5">
              {currentTime.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </motion.section>

        {/* Stats - Compact */}
        <section className="grid grid-cols-4 gap-1.5 mb-1.5 flex-shrink-0">
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
              label: 'Sebagian diproses',
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
              className="relative rounded-lg bg-slate-800/60 border border-slate-700/50 overflow-hidden"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
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
              <div className="p-2 flex items-center gap-2">
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
                  <div className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">
                    {stat.label}
                  </div>
                  <div
                    className={`text-lg font-bold tabular-nums ${
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

        {/* Filter & Sort - Compact */}
        <div className="flex items-center justify-between gap-2 mb-1.5 flex-shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Status</span>
            {[
              { value: 'active', label: 'Aktif' },
              { value: 'processing', label: 'Sebagian' },
              { value: 'pending', label: 'Menunggu' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterStatus(opt.value)}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                  filterStatus === opt.value
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : 'bg-slate-800/60 text-slate-400 border border-slate-600/50 hover:bg-slate-700/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Month</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-slate-800/80 border border-slate-600/50 rounded px-2 py-1 text-[10px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            />
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Sort</span>
            <select
              value={`${sortBy}-${sortDir}`}
              onChange={(e) => {
                const [field, dir] = e.target.value.split('-')
                setSortBy(field)
                setSortDir(dir)
              }}
              className="bg-slate-800/80 border border-slate-600/50 rounded px-2 py-1 text-[10px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            >
              <option value="time-desc">Time (newest)</option>
              <option value="time-asc">Time (oldest)</option>
              <option value="so-asc">SO (A–Z)</option>
              <option value="so-desc">SO (Z–A)</option>
            </select>
          </div>
        </div>
        {/* Table - Optimized for TV */}
        <motion.section
          className="flex-1 rounded-lg border border-slate-700/50 bg-slate-900/30 overflow-hidden shadow-xl shadow-black/20 min-h-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          {/* Table Header */}
          <div className="sticky top-0 z-20 bg-slate-800/90 border-b border-slate-700/60 backdrop-blur-sm">
            <div 
              className="grid gap-2 px-4 py-2"
              style={{
                gridTemplateColumns: '80px 180px 120px 1fr 200px 160px'
              }}
            >
              {tableColumns.map((col) => (
                <div
                  key={col.key}
                  className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider"
                >
                  <col.icon className="w-4 h-4 shrink-0 text-slate-400" />
                  {col.label}
                </div>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-700/40 overflow-hidden relative" style={{ height: 'calc(100vh - 200px)' }}>
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-10 h-10 text-slate-500 animate-spin" />
                <p className="text-slate-500 text-sm font-medium">
                  Loading schedule…
                </p>
              </div>
            ) : filteredAndSortedOrders.length === 0 ? (
              <motion.div
                className="py-16 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Warehouse className="w-14 h-14 text-slate-600 mx-auto mb-3" />
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
              <div className="absolute inset-0 overflow-hidden">
                <div
                  ref={marqueeRef}
                  className="running-vertical"
                  style={{ ['--marquee-duration']: `${marqueeDurationSec}s` }}
                >
                  {[...filteredAndSortedOrders, ...filteredAndSortedOrders].map((order, index) => {
                    const statusConfig = getStatusConfig(order.status)
                    return (
                      <div
                        key={`${order.id || order.transNumber || 'row'}-${index}`}
                        className={`hover:bg-slate-800/40 transition-colors border-l-2 border-transparent hover:border-cyan-500/40 ${
                          index % 2 === 1 ? 'bg-slate-800/20' : ''
                        }`}
                      >
                        <div 
                          className="grid gap-2 px-4 py-2.5"
                          style={{
                            gridTemplateColumns: '80px 180px 120px 1fr 200px 160px'
                          }}
                        >
                          {/* Time */}
                          <div className="flex items-center">
                            <span className="text-base font-mono font-semibold text-slate-200 tabular-nums">
                              {formatTime(getOrderTimeValue(order))}
                            </span>
                          </div>
                          
                          {/* SO Number */}
                          <div className="flex items-center min-w-0">
                            <span className="text-base font-semibold text-white truncate" title={order.transNumber}>
                              {order.transNumber}
                            </span>
                          </div>
                          
                          {/* Date */}
                          <div className="flex items-center">
                            <span className="text-base text-slate-300 font-mono tabular-nums">
                              {formatDate(order.transDate)}
                            </span>
                          </div>
                          
                          {/* Customer */}
                          <div className="flex items-center min-w-0">
                            <span className="text-base text-white truncate" title={order.customerName}>
                              {order.customerName}
                            </span>
                          </div>
                          
                          {/* Description */}
                          <div className="flex items-center min-w-0">
                            {order.description ? (
                              <span className="text-base text-slate-300 truncate" title={order.description}>
                                {order.description}
                              </span>
                            ) : (
                              <span className="text-base font-mono text-slate-200">
                                {formatCurrency(order.totalAmount)}
                              </span>
                            )}
                          </div>
                          
                          {/* Status */}
                          <div className="flex items-center justify-center">
                            <span
                              className={`inline-flex items-center justify-center w-full px-3 py-1.5 rounded border-2 text-xs font-bold uppercase tracking-wider ${statusConfig.className} ${statusConfig.glow}`}
                            >
                              {formatStatusLabel(order.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.section>

        {/* Status bar - Compact */}
        <footer className="mt-1.5 flex items-center justify-between gap-2 py-1.5 px-3 rounded-lg bg-slate-800/40 border border-slate-700/40 flex-shrink-0">
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300">
                System online
              </span>
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-500">Auto refresh 30s</span>
            <span className="text-slate-500">·</span>
            <span className="text-cyan-400 font-medium">
              Menampilkan {filteredAndSortedOrders.length} dari {orders.length} SO
            </span>
          </div>
          <span className="text-slate-500 text-[10px]">
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
          0% { 
            transform: translateY(0); 
          }
          100% { 
            transform: translateY(-50%); 
          }
        }
        
        .running-vertical {
          will-change: transform;
          animation: vertical-marquee var(--marquee-duration, 600s) linear infinite;
          display: flex;
          flex-direction: column;
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
