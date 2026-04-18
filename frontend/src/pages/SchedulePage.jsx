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
const TOAST_DURATION_MS = 15000
const KNOWN_SO_KEY = 'schedule_known_so_ids'
const INITIAL_LIMIT = 5000
const OVERDUE_DAYS = 3
// Jam reminder WIB (UTC+7): 13:36
// Format: { hour, minute } — trigger dalam window ±2 menit dari waktu yang ditentukan
const REMINDER_TIMES_WIB = [
  { hour: 13, minute: 36 },
]
// Safety cap so we don't accidentally request an absurdly huge payload.
// If total is bigger than this cap, we fall back to page-by-page fetching.
const MAX_LIMIT = 50000

// Marquee: kecepatan tetap (px/s) agar ganti bulan tidak mengubah kecepatan scroll.
// Durasi = (jarak animasi) / MARQUEE_PX_PER_SECOND; jarak = 2× tinggi konten (100%→-100%).
const MARQUEE_PX_PER_SECOND = 15
const MARQUEE_MIN_DURATION_SEC = 90
const MARQUEE_MAX_DURATION_SEC = 7200

// Status label baku dari Accurate Online (disimpan persis di DB):
// "Terproses", "Sebagian diproses", "Menunggu diproses"
const STATUS_GROUP = {
  completed: ['terproses', 'selesai', 'completed', 'closed', 'close', 'finished', 'done', 'fully processed'],
  processing: [
    'sebagian diproses',
    'sebagian terproses',
    'sebagian_diproses',
    'sebagian_terproses',
    'processing',
    'partial',
    'partially',
    'in progress',
    'in_progress',
    'partially processed',
    'partially_processed',
  ],
  pending: [
    'menunggu diproses',
    'menunggu proses',
    'menunggu_diproses',
    'pending',
    'belum terproses',
    'dipesan',
    'queue',
    'waiting',
    'open',
    'opened',
    'new',
    'draft',
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
  const [sortBy, setSortBy] = useState('date')
  const [sortDir, setSortDir] = useState('asc')
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    processing: 0,
    pending: 0,
    totalRevenue: 0,
  })

  const [newSOToasts, setNewSOToasts] = useState([])
  const [overdueReminder, setOverdueReminder] = useState(null) // { count, orders }
  const [activeToast, setActiveToast] = useState(null) // satu toast aktif sekaligus
  const toastQueueRef = useRef([])
  const isReminderActiveRef = useRef(false) // true saat reminder sedang diputar
  const isFirstLoad = useRef(true)
  const fetchRequestId = useRef(0)
  const marqueeRef = useRef(null)
  const [marqueeDurationSec, setMarqueeDurationSec] = useState(600)
  const lastReminderRef = useRef('') // format: "YYYY-MM-DD-HH" jam terakhir yang sudah diputar
  // displayOrders: list yang dipakai marquee — hanya append saat SO baru, tidak replace
  // sehingga animasi marquee tidak restart dari awal
  const [displayOrders, setDisplayOrders] = useState([])
  const displayOrdersRef = useRef([])

  const playNotificationSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()

      // 3 nada ascending — seperti notifikasi hotel/lounge profesional
      const notes = [
        { freq: 783.99, time: 0.0  },  // G5
        { freq: 987.77, time: 0.18 },  // B5
        { freq: 1318.5, time: 0.36 },  // E6
      ]

      notes.forEach(({ freq, time }) => {
        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        // Sedikit reverb feel: gabung sine + triangle
        const osc2  = ctx.createOscillator()
        const gain2 = ctx.createGain()

        osc.connect(gain);   gain.connect(ctx.destination)
        osc2.connect(gain2); gain2.connect(ctx.destination)

        osc.type  = 'sine'
        osc2.type = 'triangle'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + time)
        osc2.frequency.setValueAtTime(freq, ctx.currentTime + time)

        // Attack → sustain → fade
        gain.gain.setValueAtTime(0, ctx.currentTime + time)
        gain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + time + 0.02)
        gain.gain.setValueAtTime(0.55, ctx.currentTime + time + 0.08)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.7)

        gain2.gain.setValueAtTime(0, ctx.currentTime + time)
        gain2.gain.linearRampToValueAtTime(0.15, ctx.currentTime + time + 0.02)
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.5)

        osc.start(ctx.currentTime + time);  osc.stop(ctx.currentTime + time + 0.8)
        osc2.start(ctx.currentTime + time); osc2.stop(ctx.currentTime + time + 0.6)
      })
    } catch (_) {}
  }, [])

  // index SO yang sedang dibacakan (-1 = tidak ada / intro/outro)
  const [activeSOIndex, setActiveSOIndex] = useState(-1)
  const soListRef = useRef(null)

  // Helper: fetch satu segmen teks dari backend TTS dan play, return Promise resolve saat selesai
  // Retry 1x kalau gagal agar tidak skip diam-diam
  const fetchAndPlayTTS = useCallback(async (text, token, retryCount = 0) => {
    try {
      const response = await fetch(`${api.defaults.baseURL}/tts?text=${encodeURIComponent(text)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error(`TTS HTTP ${response.status}`)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const audio = new Audio(blobUrl)
      audio.volume = 1.0
      audio.playbackRate = 1.15
      return new Promise((resolve) => {
        audio.onended = () => { URL.revokeObjectURL(blobUrl); resolve() }
        audio.onerror = () => { URL.revokeObjectURL(blobUrl); resolve() }
        audio.play().catch(() => { URL.revokeObjectURL(blobUrl); resolve() })
      })
    } catch (err) {
      console.warn(`[TTS] Gagal segmen "${text.slice(0, 40)}..." (attempt ${retryCount + 1}):`, err.message)
      if (retryCount < 1) {
        // tunggu sebentar lalu retry sekali
        await new Promise((r) => setTimeout(r, 800))
        return fetchAndPlayTTS(text, token, retryCount + 1)
      }
      // Setelah retry tetap gagal, lanjut ke segmen berikutnya
    }
  }, [])

  // Pecah array SO menjadi segmen-segmen teks ≤ 180 karakter agar tidak terpotong Google TTS
  const buildTTSSegments = useCallback((overdueOrders) => {
    const intro = `Perhatian, terdapat ${overdueOrders.length} sales order yang belum diproses dan telah melewati batas waktu.`
    const segments = [intro]

    // Setiap SO jadi segmen sendiri: sebut 5 digit terakhir nomor SO lalu nama customer
    overdueOrders.forEach((o) => {
      const soNumber = o.transNumber || o.nomor_so || ''
      const soSuffix = soNumber ? soNumber.slice(-5) : ''
      const customer = o.customerName || o.nama_pelanggan || ''
      const soText = soSuffix ? `Nomor SO ${soSuffix.split('').join(' ')},` : ''
      const customerText = customer ? ` ${customer}.` : '.'
      if (soText || customer) segments.push(`${soText}${customerText}`)
    })

    segments.push('Mohon segera ditindaklanjuti.')
    return segments
  }, [])

  // Play semua segmen TTS satu per satu secara berurutan, sync highlight index
  const playAllTTSSegments = useCallback(async (overdueOrders) => {
    const token = localStorage.getItem('accessToken')
    const segments = buildTTSSegments(overdueOrders)

    for (let i = 0; i < segments.length; i++) {
      // segments[0] = intro, segments[1..n-1] = per SO, segments[n] = outro
      const soIndex = (i === 0 || i === segments.length - 1) ? -1 : i - 1
      setActiveSOIndex(soIndex)

      // Auto scroll ke item yang sedang dibacakan
      if (soIndex >= 0 && soListRef.current) {
        const item = soListRef.current.children[soIndex]
        if (item) item.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }

      try {
        await fetchAndPlayTTS(segments[i], token)
      } catch (_) {
        // lanjut ke segmen berikutnya meski ada error
      }
    }
    setActiveSOIndex(-1)
  }, [fetchAndPlayTTS, buildTTSSegments])

  // Bel stasiun: Ding-Dong-Ding-Dong via AudioContext
  // Mengembalikan Promise yang resolve setelah bel selesai (~6 detik)
  const playStationChime = useCallback(() => {
    return new Promise((resolve) => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        if (!AudioCtx) { resolve(); return }
        const ctx = new AudioCtx()

        const chimeNotes = [
          { freq: 1046.50, time: 0.0  },  // C6 - Ding
          { freq: 783.99,  time: 0.55 },  // G5 - Dong
          { freq: 880.00,  time: 1.1  },  // A5 - Ding
          { freq: 659.25,  time: 1.65 },  // E5 - Dong
        ]

        const playChime = (startOffset) => {
          chimeNotes.forEach(({ freq, time }) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.type = 'sine'
            osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset + time)
            gain.gain.setValueAtTime(0, ctx.currentTime + startOffset + time)
            gain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + startOffset + time + 0.02)
            gain.gain.setValueAtTime(0.7, ctx.currentTime + startOffset + time + 0.15)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + time + 0.9)
            osc.start(ctx.currentTime + startOffset + time)
            osc.stop(ctx.currentTime + startOffset + time + 1.0)
          })
        }

        // 2x chime seperti di stasiun, total ~5.8 detik
        playChime(0)
        playChime(2.8)

        // Resolve setelah semua nada selesai
        setTimeout(resolve, 5800)
      } catch (_) {
        resolve()
      }
    })
  }, [])

  // Reminder suara untuk SO yang telat >= OVERDUE_DAYS hari
  // Urutan: bel stasiun → banner muncul → TTS semua SO satu per satu → banner hilang
  const playOverdueReminder = useCallback(async (overdueOrders) => {
    if (!overdueOrders || overdueOrders.length === 0) return

    try {
      isReminderActiveRef.current = true

      // 1. Bunyikan bel stasiun dulu, tunggu selesai
      await playStationChime()

      // 2. Tampilkan banner merah
      setOverdueReminder({ count: overdueOrders.length, orders: overdueOrders })

      // 3. Play semua segmen TTS satu per satu sampai selesai
      await playAllTTSSegments(overdueOrders)

      // 4. Hilangkan banner setelah semua selesai dibacakan
      setTimeout(() => setOverdueReminder(null), 1500)

    } catch (error) {
      console.error('[playOverdueReminder] Error:', error)
      setTimeout(() => setOverdueReminder(null), 5000)
    } finally {
      isReminderActiveRef.current = false
      // Setelah reminder selesai, cek apakah ada toast yang menunggu
      setTimeout(showNextToast, 600)
    }
  }, [playStationChime, playAllTTSSegments, showNextToast])

  // Putar ulang TTS saja (tanpa bel) untuk tombol di banner
  const replayTTS = useCallback(async (overdueOrders) => {
    if (!overdueOrders || overdueOrders.length === 0) return
    try {
      await playAllTTSSegments(overdueOrders)
    } catch (_) {}
  }, [playAllTTSSegments])

  // Cek SO yang telat dan jalankan reminder jika sudah waktunya
  // Cek SO yang telat dan jalankan reminder hanya pada jam 08:50, 11:00, 14:00 WIB
  const checkAndTriggerOverdueReminder = useCallback((allOrders) => {
    const now = Date.now()
    const threeDaysMs = OVERDUE_DAYS * 24 * 60 * 60 * 1000

    const overdueOrders = allOrders.filter((o) => {
      const group = getOrderStatusGroup(o)
      if (group !== 'pending' && group !== 'processing') return false
      const dateStr = o.transDate || o.tanggal_so
      if (!dateStr) return false
      const orderDate = new Date(dateStr).getTime()
      return now - orderDate >= threeDaysMs
    })

    if (overdueOrders.length === 0) {
      setOverdueReminder(null)
      return
    }

    // Cek apakah sekarang adalah jam reminder WIB (UTC+7)
    const nowWIB = new Date(now + 7 * 60 * 60 * 1000) // konversi ke WIB
    const hourWIB = nowWIB.getUTCHours()
    const minuteWIB = nowWIB.getUTCMinutes()
    const dateKey = nowWIB.toISOString().slice(0, 10) // YYYY-MM-DD

    // Cari apakah waktu sekarang masuk window ±2 menit dari salah satu REMINDER_TIMES_WIB
    const matchedTime = REMINDER_TIMES_WIB.find(({ hour, minute }) => {
      if (hourWIB !== hour) return false
      return minuteWIB >= minute && minuteWIB < minute + 2
    })
    const reminderKey = matchedTime ? `${dateKey}-${matchedTime.hour}-${matchedTime.minute}` : ''
    const alreadyPlayed = lastReminderRef.current === reminderKey
    const isReminderHour = !!matchedTime

    if (isReminderHour && !alreadyPlayed) {
      lastReminderRef.current = reminderKey
      playOverdueReminder(overdueOrders)
    }
  }, [playOverdueReminder])

  const showNextToast = useCallback(() => {
    // Tunda toast kalau reminder sedang diputar
    if (isReminderActiveRef.current) return
    if (toastQueueRef.current.length === 0) {
      setActiveToast(null)
      return
    }
    const next = toastQueueRef.current.shift()
    setActiveToast(next)
    setTimeout(() => {
      setActiveToast(null)
      setTimeout(showNextToast, 400)
    }, TOAST_DURATION_MS)
  }, [])

  const dismissToast = useCallback(() => {
    setActiveToast(null)
    setTimeout(showNextToast, 400)
  }, [showNextToast])

  const fetchOrders = useCallback(async ({ silent = false } = {}) => {
    const requestId = ++fetchRequestId.current
    try {
      if (!silent) setLoading(true)
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

      // Saat silent refresh: merge data baru ke state existing agar tabel tidak flicker
      // Saat first load / ganti bulan: replace semua
      if (silent) {
        setOrders((prev) => {
          const existingMap = new Map(prev.map((o) => [String(o.so_id || o.id || o.transNumber), o]))
          allOrders.forEach((o) => {
            const key = String(o.so_id || o.id || o.transNumber)
            existingMap.set(key, o)
          })
          return Array.from(existingMap.values())
        })
      } else {
        setOrders(allOrders)
        // First load / ganti bulan: reset displayOrders sekalian
        displayOrdersRef.current = allOrders
        setDisplayOrders(allOrders)
      }

      // Deteksi SO baru (skip saat first load)
      if (!isFirstLoad.current) {
        const knownIds = new Set(JSON.parse(localStorage.getItem(KNOWN_SO_KEY) || '[]'))
        const newOrders = allOrders.filter((o) => {
          const id = o.so_id || o.id || o.transNumber
          return id && !knownIds.has(String(id))
        })
        if (newOrders.length > 0) {
          // Append SO baru ke displayOrders tanpa reset — animasi marquee tidak restart
          const existingDisplayMap = new Map(
            displayOrdersRef.current.map((o) => [String(o.so_id || o.id || o.transNumber), true])
          )
          const brandNewOrders = newOrders.filter((o) => {
            const key = String(o.so_id || o.id || o.transNumber)
            return !existingDisplayMap.has(key)
          })
          if (brandNewOrders.length > 0) {
            displayOrdersRef.current = [...displayOrdersRef.current, ...brandNewOrders]
            setDisplayOrders((prev) => [...prev, ...brandNewOrders])
          }

          const toasts = newOrders.slice(0, 5).map((o, i) => ({
            id: `${o.so_id || o.id || o.transNumber}-${Date.now()}-${i}`,
            soNumber: o.transNumber || o.nomor_so || o.so_id,
            customer: o.customerName || o.nama_pelanggan || '—',
          }))
          const wasEmpty = toastQueueRef.current.length === 0 && !activeToast
          toastQueueRef.current.push(...toasts)
          if (wasEmpty) {
            if (toasts.length > 0) playNotificationSound()
            showNextToast()
          }
        }
      } else {
        isFirstLoad.current = false
      }
      // Simpan semua ID yang diketahui
      const allIds = allOrders.map((o) => String(o.so_id || o.id || o.transNumber)).filter(Boolean)
      localStorage.setItem(KNOWN_SO_KEY, JSON.stringify(allIds))
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

      // Cek SO yang telat >= 3 hari dan trigger reminder suara
      checkAndTriggerOverdueReminder(allOrders)
    } catch (error) {
      console.error('[SchedulePage] Failed to fetch orders:', error)
    } finally {
      if (!silent) setLoading(false)
      setRefreshing(false)
    }
  }, [month, playNotificationSound, dismissToast, checkAndTriggerOverdueReminder, showNextToast, activeToast])

  // Reset displayOrders saat bulan berubah agar marquee mulai fresh
  useEffect(() => {
    displayOrdersRef.current = []
    setDisplayOrders([])
    isFirstLoad.current = true
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
    
    // Completed - Green
    if (STATUS_GROUP.completed.some(x => s === x || s.includes(x))) {
      return {
        className: 'bg-emerald-500/15 text-emerald-400 border-emerald-400/40',
        glow: 'animate-neon-pulse-green',
      }
    }
    
    // Processing (Sebagian diproses) - Yellow/Amber
    if (STATUS_GROUP.processing.some(x => s === x || s.includes(x))) {
      return {
        className: 'bg-amber-500/15 text-amber-400 border-amber-400/40',
        glow: 'animate-neon-pulse-yellow',
      }
    }
    
    // Pending (Menunggu diproses) - Red
    if (STATUS_GROUP.pending.some(x => s === x || s.includes(x))) {
      return {
        className: 'bg-red-500/15 text-red-400 border-red-400/40',
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
    
    // Kembalikan label baku Accurate berdasarkan group
    if (STATUS_GROUP.completed.some(x => s === x || s.includes(x))) {
      return 'Terproses'
    }
    if (STATUS_GROUP.processing.some(x => s === x || s.includes(x))) {
      return 'Sebagian diproses'
    }
    if (STATUS_GROUP.pending.some(x => s === x || s.includes(x))) {
      return 'Menunggu diproses'
    }
    if (s === 'cancelled' || s === 'batal') {
      return 'Batal'
    }
    // Tampilkan apa adanya jika tidak dikenali
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
    // Pakai displayOrders agar marquee tidak restart saat SO baru append
    let list = displayOrders.filter((o) => {
      if (filterStatus === 'all') return true
      if (filterStatus === 'active') {
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
  }, [displayOrders, filterStatus, sortBy, sortDir])

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

          {/* ── Toast SO Baru — muncul di tengah header setelah reminder selesai ── */}
          <AnimatePresence>
            {!overdueReminder && activeToast && (
              <motion.div
                key={activeToast.id}
                initial={{ opacity: 0, scale: 0.92, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -4 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex-1 mx-4 pointer-events-auto"
              >
                <div className="relative rounded-xl overflow-hidden"
                  style={{ boxShadow: '0 0 0 1px rgba(6,182,212,0.4), 0 0 20px rgba(6,182,212,0.12)' }}
                >
                  <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
                  <div className="bg-gradient-to-r from-cyan-950/98 to-slate-950/98 backdrop-blur-xl px-3 py-2">
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 shrink-0">
                        <span className="animate-ping absolute inline-flex w-full h-full rounded-lg bg-cyan-500/20" />
                        <svg className="w-4 h-4 text-cyan-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                        </svg>
                      </div>
                      {/* Label */}
                      <div className="flex-shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-cyan-400/80">SO Baru</span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">MASUK</span>
                        </div>
                        <span className="text-white font-mono font-bold text-sm">{activeToast.soNumber}</span>
                      </div>
                      <span className="text-slate-500 text-xs shrink-0">·</span>
                      {/* Customer */}
                      <span className="text-slate-200 text-sm truncate flex-1">{activeToast.customer}</span>
                      {/* Progress bar + close */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={dismissToast} className="text-slate-500 hover:text-slate-300 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {/* Progress bar countdown */}
                    <motion.div
                      className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-cyan-500 to-cyan-300"
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: TOAST_DURATION_MS / 1000, ease: 'linear' }}
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-600/60 to-transparent" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {overdueReminder && (
              <motion.div
                key="overdue-banner"
                initial={{ opacity: 0, scale: 0.92, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -4 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex-1 mx-4 pointer-events-auto"
              >
                <div className="relative rounded-xl overflow-hidden"
                  style={{ boxShadow: '0 0 0 1px rgba(239,68,68,0.4), 0 0 20px rgba(239,68,68,0.15)' }}
                >
                  <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-red-400 to-transparent animate-pulse" />
                  <div className="bg-gradient-to-r from-red-950/98 to-slate-950/98 backdrop-blur-xl px-3 py-2">
                    <div className="flex items-center gap-3">
                      {/* Alert icon */}
                      <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/30 shrink-0">
                        <span className="animate-ping absolute inline-flex w-full h-full rounded-lg bg-red-500/20" />
                        <svg className="w-4 h-4 text-red-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                      </div>

                      {/* Title + count */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-red-400/80">Peringatan</span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">OVERDUE</span>
                        </div>
                        <p className="text-white font-bold text-sm leading-tight">
                          {overdueReminder.count} SO Belum Diproses
                          <span className="text-red-400 ml-1.5 font-semibold text-xs">&gt; {OVERDUE_DAYS} Hari</span>
                        </p>
                      </div>

                      {/* SO list — wrap tanpa scroll */}
                      <div
                        ref={soListRef}
                        className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0"
                      >
                        {overdueReminder.orders.map((o, i) => {
                          const soNumber = o.transNumber || o.nomor_so || ''
                          const soSuffix = soNumber ? soNumber.slice(-5) : '—'
                          const customer = o.customerName || o.nama_pelanggan || '—'
                          const isActive = activeSOIndex === i
                          const dateStr = o.transDate || o.tanggal_so
                          const daysLate = dateStr
                            ? Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
                            : null
                          return (
                            <div
                              key={i}
                              className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] transition-all duration-300 ${
                                isActive
                                  ? 'bg-red-500/30 border-red-400/60 shadow-[0_0_6px_rgba(239,68,68,0.4)]'
                                  : 'bg-red-500/8 border-red-500/20'
                              }`}
                            >
                              <span className={`font-mono font-bold ${isActive ? 'text-red-200' : 'text-red-400/80'}`}>{soSuffix}</span>
                              <span className="text-slate-400/60">·</span>
                              <span className={`max-w-[80px] truncate ${isActive ? 'text-white font-semibold' : 'text-white/70'}`}>{customer}</span>
                              {daysLate !== null && (
                                <span className={`font-bold font-mono ml-0.5 ${
                                  daysLate >= 14 ? 'text-red-300' : daysLate >= 7 ? 'text-orange-300' : 'text-yellow-300'
                                }`}>{daysLate}h</span>
                              )}
                              {isActive && (
                                <span className="flex items-center gap-0.5 ml-0.5">
                                  <span className="w-0.5 h-0.5 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                  <span className="w-0.5 h-0.5 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                  <span className="w-0.5 h-0.5 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Replay button */}
                      <button
                        onClick={() => replayTTS(overdueReminder.orders)}
                        className="shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-500/15 border border-red-400/30 text-red-300 text-[10px] font-semibold hover:bg-red-500/25 transition-all"
                        title="Putar ulang"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-red-600/60 to-transparent" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
              <option value="date-asc">Date (terlama)</option>
              <option value="date-desc">Date (terbaru)</option>
              <option value="time-asc">Time (oldest)</option>
              <option value="time-desc">Time (newest)</option>
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
                              className={`inline-flex items-center justify-center w-full px-2 py-1.5 rounded border-2 font-bold uppercase tracking-wide whitespace-nowrap ${statusConfig.className} ${statusConfig.glow}`}
                              style={{ fontSize: formatStatusLabel(order.status).length > 12 ? '9px' : '11px' }}
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
            {overdueReminder && (
              <>
                <span className="text-slate-500">·</span>
                <span className="flex items-center gap-1 text-red-400 font-semibold">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                  {overdueReminder.count} SO telat &gt;{OVERDUE_DAYS}h
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[10px]">
              iWare · Warehouse Management
            </span>
          </div>
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
