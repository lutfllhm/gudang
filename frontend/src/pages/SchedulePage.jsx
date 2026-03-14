import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import usePageTitle from '../hooks/usePageTitle'
import Logo from '../components/Logo'
import api from '../utils/api'
import { formatCurrency, formatDate } from '../utils/helpers'
import { Maximize2, Minimize2, RefreshCw, Clock, Plane, Package, DollarSign, Activity, CheckCircle2, AlertCircle } from 'lucide-react'

const SchedulePage = () => {
  usePageTitle('Schedule SO')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    processing: 0,
    pending: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    fetchOrders()
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timeInterval)
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await api.get('/sales-orders', {
        params: {
          page: 1,
          limit: 20
        }
      })
      
      if (response.data && response.data.data) {
        const fetchedOrders = response.data.data.salesOrders || []
        setOrders(fetchedOrders)
        
        // Calculate stats (3 status Accurate: Menunggu Diproses, Sebagian Terproses, Terproses)
        const s = (st) => (fetchedOrders.filter(o => (o.status || '').toLowerCase() === st).length)
        const completed = s('completed') + s('terproses') + s('selesai')
        const processing = s('processing') + s('sebagian terproses') + s('diproses')
        const pending = s('pending') + s('menunggu proses') + s('menunggu diproses') + s('dipesan')
        const totalRevenue = fetchedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
        
        setStats({
          total: fetchedOrders.length,
          completed,
          processing,
          pending,
          totalRevenue
        })
      }
    } catch (error) {
      console.error('[SchedulePage] Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const getStatusBadgeClass = (status) => {
    const statusLower = (status || '').toLowerCase()
    // Terproses (Completed) = Hijau Neon
    if (['completed', 'terproses', 'selesai'].includes(statusLower)) {
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-400/60 shadow-[0_0_25px_rgba(16,185,129,0.6)] animate-neon-pulse-green'
    }
    // Sebagian Terproses = Kuning Neon
    if (['processing', 'sebagian terproses', 'diproses'].includes(statusLower)) {
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/60 shadow-[0_0_25px_rgba(234,179,8,0.6)] animate-neon-pulse-yellow'
    }
    // Menunggu Diproses / Pending = Merah Neon
    if (['pending', 'belum terproses', 'menunggu proses', 'menunggu diproses', 'dipesan'].includes(statusLower)) {
      return 'bg-red-500/20 text-red-400 border-red-400/60 shadow-[0_0_25px_rgba(239,68,68,0.6)] animate-neon-pulse-red'
    }
    if (statusLower === 'cancelled' || statusLower === 'batal') {
      return 'bg-slate-500/20 text-slate-400 border-slate-400/60 shadow-[0_0_20px_rgba(148,163,184,0.4)]'
    }
    return 'bg-sky-500/20 text-sky-400 border-sky-400/60 shadow-[0_0_25px_rgba(14,165,233,0.6)] animate-neon-pulse-blue'
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const ScheduleContent = () => (
    <div className={`${isFullscreen ? 'min-h-screen' : ''} bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden`}>
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 2px 2px, rgba(6, 182, 212, 0.15) 1px, transparent 0)
          `,
          backgroundSize: '48px 48px',
          animation: 'backgroundMove 60s linear infinite'
        }} />
      </div>

      {/* Elegant Gradient Overlays */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
      
      {/* Subtle Glow Orbs */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] animate-float" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] animate-float-delayed" />

      <div className="relative z-10 min-h-screen flex flex-col p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Logo variant="neon" size="md" className="rounded-lg" />
              <div className="absolute -inset-1 bg-cyan-500/10 rounded-lg blur-lg" />
            </div>
            <div className="hidden sm:block">
              <div className="text-cyan-400 text-[10px] font-bold tracking-[0.25em] uppercase">Warehouse Management</div>
              <div className="text-slate-400 text-[10px] font-mono mt-0.5">Real-Time Monitoring System</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="p-2.5 bg-slate-800/60 border border-cyan-400/20 rounded-lg hover:border-cyan-400/40 hover:bg-slate-800/80 transition-all backdrop-blur-sm group"
            >
              <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2.5 bg-slate-800/60 border border-emerald-400/20 rounded-lg hover:border-emerald-400/40 hover:bg-slate-800/80 transition-all backdrop-blur-sm"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Maximize2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
          </div>
        </div>

        {/* Main Header - Airport Departure Board Style */}
        <div className="bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-400/20 p-6 sm:p-8 mb-6 shadow-[0_0_60px_rgba(6,182,212,0.15)] relative overflow-hidden">
          {/* Top Neon Line */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent" />
          
          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-400/30 rounded-tl-2xl" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-emerald-400/30 rounded-br-2xl" />
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
            {/* Title Section */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 rounded-xl border border-cyan-400/40 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                  <Plane className="w-8 h-8 text-cyan-300 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-[0.05em] uppercase leading-none">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-400 to-emerald-300 drop-shadow-[0_0_30px_rgba(6,182,212,0.6)]">
                    SCHEDULE BOARD
                  </span>
                </h1>
                <p className="text-xs sm:text-sm font-bold text-emerald-300/80 mt-2 tracking-[0.25em] uppercase">
                  Gudang iWare - Real-Time Display
                </p>
              </div>
            </div>

            {/* Digital Clock Section */}
            <div className="text-center lg:text-right">
              <div className="relative inline-block">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-black font-mono text-cyan-300 tracking-[0.15em] drop-shadow-[0_0_25px_rgba(6,182,212,0.8)] tabular-nums">
                  {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
              <div className="text-xs text-emerald-300/70 font-mono mt-2 tracking-[0.25em] uppercase">
                {currentTime.toLocaleDateString('id-ID', { 
                  weekday: 'long',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                }).toUpperCase()}
              </div>
            </div>
          </div>
          
          {/* Bottom Neon Line */}
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent" />
        </div>

        {/* Stats Bar - Professional Neon Style */}
        <div className="relative bg-gradient-to-r from-slate-900/70 via-slate-800/70 to-slate-900/70 backdrop-blur-xl rounded-xl border border-cyan-400/20 overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.1)] mb-6">
          {/* Top Neon Line */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
          
          {/* Stats Container */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5">
            {/* Total SO - Cyan */}
            <div className="flex items-center gap-3 p-4 bg-slate-800/40 rounded-lg border border-cyan-400/20 hover:border-cyan-400/40 transition-all group">
              <div className="p-2.5 bg-cyan-500/10 rounded-lg border border-cyan-400/30 shadow-[0_0_15px_rgba(6,182,212,0.2)] group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all">
                <Package className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-cyan-400/70 font-bold tracking-[0.15em] uppercase">
                  Total SO
                </div>
                <div className="text-2xl font-black text-cyan-300 font-mono tabular-nums drop-shadow-[0_0_15px_rgba(6,182,212,0.6)] mt-0.5">
                  {stats.total}
                </div>
              </div>
            </div>

            {/* Completed - Green */}
            <div className="flex items-center gap-3 p-4 bg-slate-800/40 rounded-lg border border-emerald-400/20 hover:border-emerald-400/40 transition-all group">
              <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-emerald-400/70 font-bold tracking-[0.15em] uppercase">
                  Completed
                </div>
                <div className="text-2xl font-black text-emerald-300 font-mono tabular-nums drop-shadow-[0_0_15px_rgba(16,185,129,0.6)] mt-0.5">
                  {stats.completed}
                </div>
              </div>
            </div>

            {/* Processing - Yellow */}
            <div className="flex items-center gap-3 p-4 bg-slate-800/40 rounded-lg border border-yellow-400/20 hover:border-yellow-400/40 transition-all group">
              <div className="p-2.5 bg-yellow-500/10 rounded-lg border border-yellow-400/30 shadow-[0_0_15px_rgba(234,179,8,0.2)] group-hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all">
                <Activity className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-yellow-400/70 font-bold tracking-[0.15em] uppercase">
                  Processing
                </div>
                <div className="text-2xl font-black text-yellow-300 font-mono tabular-nums drop-shadow-[0_0_15px_rgba(234,179,8,0.6)] mt-0.5">
                  {stats.processing}
                </div>
              </div>
            </div>

            {/* Pending - Red */}
            <div className="flex items-center gap-3 p-4 bg-slate-800/40 rounded-lg border border-red-400/20 hover:border-red-400/40 transition-all group">
              <div className="p-2.5 bg-red-500/10 rounded-lg border border-red-400/30 shadow-[0_0_15px_rgba(239,68,68,0.2)] group-hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all">
                <AlertCircle className="w-5 h-5 text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-red-400/70 font-bold tracking-[0.15em] uppercase">
                  Pending
                </div>
                <div className="text-2xl font-black text-red-300 font-mono tabular-nums drop-shadow-[0_0_15px_rgba(239,68,68,0.6)] mt-0.5">
                  {stats.pending}
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Neon Line */}
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
        </div>

        {/* Departure Board Table */}
        <div className="flex-1 bg-slate-900/50 backdrop-blur-xl rounded-xl border border-cyan-400/20 overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.1)]">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 border-b border-cyan-400/20">
            <div className="grid grid-cols-12 gap-4 px-6 py-4">
              <div className="col-span-1 text-[10px] font-black text-cyan-300 tracking-[0.2em] uppercase flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Waktu</span>
              </div>
              <div className="col-span-2 text-[10px] font-black text-cyan-300 tracking-[0.2em] uppercase">
                Nomor SO
              </div>
              <div className="col-span-2 text-[10px] font-black text-cyan-300 tracking-[0.2em] uppercase">
                Tanggal
              </div>
              <div className="col-span-3 text-[10px] font-black text-cyan-300 tracking-[0.2em] uppercase">
                Pelanggan
              </div>
              <div className="col-span-2 text-[10px] font-black text-cyan-300 tracking-[0.2em] uppercase text-right">
                Keterangan
              </div>
              <div className="col-span-2 text-[10px] font-black text-cyan-300 tracking-[0.2em] uppercase text-center">
                Status
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-cyan-400/10 max-h-[calc(100vh-500px)] overflow-y-auto airport-scrollbar">
            {loading ? (
              <div className="py-24 text-center">
                <div className="relative inline-block mb-6">
                  <RefreshCw className="w-16 h-16 text-cyan-400 animate-spin drop-shadow-[0_0_25px_rgba(6,182,212,0.6)]" />
                </div>
                <p className="text-cyan-300 font-mono text-lg tracking-[0.25em] uppercase animate-pulse">
                  Loading Schedule...
                </p>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-24 text-center">
                <div className="relative inline-block mb-6">
                  <Plane className="w-20 h-20 text-slate-600" />
                </div>
                <p className="text-slate-400 font-mono text-xl tracking-[0.25em] uppercase">
                  No Orders Scheduled
                </p>
                <p className="text-slate-600 font-mono text-sm mt-2">
                  Menunggu sales order baru...
                </p>
              </div>
            ) : (
              orders.map((order, index) => (
                <div
                  key={order.id}
                  className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-cyan-400/5 transition-all duration-300 group border-l-2 border-transparent hover:border-cyan-400/60 animate-flip-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Waktu */}
                  <div className="col-span-1 flex items-center">
                    <div className="text-lg font-black text-cyan-300 font-mono tabular-nums drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]">
                      {formatTime(order.transDate)}
                    </div>
                  </div>

                  {/* Nomor SO */}
                  <div className="col-span-2 flex items-center">
                    <div className="text-base font-black text-white font-mono tracking-wide group-hover:text-cyan-300 transition-colors">
                      {order.transNumber}
                    </div>
                  </div>

                  {/* Tanggal */}
                  <div className="col-span-2 flex items-center">
                    <div className="text-sm text-slate-300 font-mono tabular-nums group-hover:text-white transition-colors">
                      {formatDate(order.transDate)}
                    </div>
                  </div>

                  {/* Pelanggan */}
                  <div className="col-span-3 flex items-center">
                    <div className="w-full">
                      <div className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                        {order.customerName}
                      </div>
                      {order.description && (
                        <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                          {order.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Keterangan (Amount) */}
                  <div className="col-span-2 flex items-center justify-end">
                    <div className="text-base font-black text-emerald-300 font-mono tabular-nums drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]">
                      {formatCurrency(order.totalAmount)}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex items-center justify-center">
                    <div className={`px-4 py-2 border-2 rounded-lg font-black text-[10px] tracking-[0.15em] uppercase backdrop-blur-sm transition-all duration-300 group-hover:scale-105 ${getStatusBadgeClass(order.status || 'completed')}`}>
                      <span className="drop-shadow-[0_0_8px_currentColor]">
                        {order.status || 'COMPLETED'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400 font-mono">
              <div className="relative flex items-center">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping absolute" />
                <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              </div>
              <span className="tracking-wider">SYSTEM ONLINE</span>
            </div>
            <div className="w-px h-4 bg-slate-600" />
            <div className="text-slate-500 font-mono tracking-wider">
              AUTO-REFRESH: 30s
            </div>
          </div>
          <div className="text-slate-500 font-mono tracking-wider">
            <span className="text-cyan-400 font-bold">iware</span> Warehouse Management © 2026
          </div>
        </div>
      </div>

      {/* Custom Styles - Airport Neon Theme */}
      <style>{`
        @keyframes backgroundMove {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(48px) translateX(48px); }
        }

        @keyframes shimmer-line {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes border-flow {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }

        @keyframes border-flow-reverse {
          0% { transform: translateX(100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(-100%); opacity: 0; }
        }

        @keyframes border-flow-vertical {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }

        @keyframes border-flow-vertical-reverse {
          0% { transform: translateY(100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-100%); opacity: 0; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(20px) scale(1.05); }
        }

        @keyframes flip-in {
          from {
            opacity: 0;
            transform: perspective(1000px) rotateX(-15deg) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: perspective(1000px) rotateX(0) translateY(0);
          }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }

        @keyframes ticker-seamless {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-33.333%); }
        }

        @keyframes ticker-continuous {
          from { transform: translateX(0); }
          to { transform: translateX(-33.333%); }
        }

        @keyframes digital-flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.98; }
        }

        @keyframes text-glow {
          0%, 100% { 
            filter: drop-shadow(0 0 40px rgba(6,182,212,0.8));
          }
          50% { 
            filter: drop-shadow(0 0 60px rgba(6,182,212,1)) drop-shadow(0 0 80px rgba(16,185,129,0.6));
          }
        }

        @keyframes neon-pulse-green {
          0%, 100% { 
            box-shadow: 0 0 25px rgba(16,185,129,0.6), inset 0 0 15px rgba(16,185,129,0.2);
          }
          50% { 
            box-shadow: 0 0 40px rgba(16,185,129,0.9), 0 0 60px rgba(16,185,129,0.5), inset 0 0 20px rgba(16,185,129,0.3);
          }
        }

        @keyframes neon-pulse-yellow {
          0%, 100% { 
            box-shadow: 0 0 25px rgba(234,179,8,0.6), inset 0 0 15px rgba(234,179,8,0.2);
          }
          50% { 
            box-shadow: 0 0 40px rgba(234,179,8,0.9), 0 0 60px rgba(234,179,8,0.5), inset 0 0 20px rgba(234,179,8,0.3);
          }
        }

        @keyframes neon-pulse-red {
          0%, 100% { 
            box-shadow: 0 0 25px rgba(239,68,68,0.6), inset 0 0 15px rgba(239,68,68,0.2);
          }
          50% { 
            box-shadow: 0 0 40px rgba(239,68,68,0.9), 0 0 60px rgba(239,68,68,0.5), inset 0 0 20px rgba(239,68,68,0.3);
          }
        }

        @keyframes neon-pulse-blue {
          0%, 100% { 
            box-shadow: 0 0 25px rgba(14,165,233,0.6), inset 0 0 15px rgba(14,165,233,0.2);
          }
          50% { 
            box-shadow: 0 0 40px rgba(14,165,233,0.9), 0 0 60px rgba(14,165,233,0.5), inset 0 0 20px rgba(14,165,233,0.3);
          }
        }

        .animate-shimmer-line {
          animation: shimmer-line 3s ease-in-out infinite;
        }

        .animate-border-flow {
          animation: border-flow 4s ease-in-out infinite;
        }

        .animate-border-flow-reverse {
          animation: border-flow-reverse 4s ease-in-out infinite;
        }

        .animate-border-flow-vertical {
          animation: border-flow-vertical 5s ease-in-out infinite;
        }

        .animate-border-flow-vertical-reverse {
          animation: border-flow-vertical-reverse 5s ease-in-out infinite;
        }

        .animate-float {
          animation: float 8s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
          animation-delay: 1s;
        }

        .animate-flip-in {
          animation: flip-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-ticker-seamless {
          animation: ticker-seamless 45s linear infinite;
          will-change: transform;
        }

        .animate-ticker-seamless:hover {
          animation-play-state: paused;
        }

        .animate-ticker-continuous {
          animation: ticker-continuous 45s linear infinite;
          will-change: transform;
        }

        .animate-ticker-continuous:hover {
          animation-play-state: paused;
        }

        .animate-digital-flicker {
          animation: digital-flicker 3s ease-in-out infinite;
        }

        .animate-text-glow {
          animation: text-glow 4s ease-in-out infinite;
        }

        .animate-neon-pulse-green {
          animation: neon-pulse-green 2s ease-in-out infinite;
        }

        .animate-neon-pulse-yellow {
          animation: neon-pulse-yellow 2s ease-in-out infinite;
        }

        .animate-neon-pulse-red {
          animation: neon-pulse-red 2s ease-in-out infinite;
        }

        .animate-neon-pulse-blue {
          animation: neon-pulse-blue 2s ease-in-out infinite;
        }

        /* Airport-Style Neon Scrollbar */
        .airport-scrollbar::-webkit-scrollbar {
          width: 12px;
        }

        .airport-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.8);
          border-radius: 6px;
          border: 1px solid rgba(6, 182, 212, 0.2);
        }

        .airport-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgba(6,182,212,0.6), rgba(16,185,129,0.6));
          border-radius: 6px;
          border: 2px solid rgba(15, 23, 42, 0.8);
          box-shadow: 0 0 10px rgba(6,182,212,0.5);
        }

        .airport-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, rgba(6,182,212,0.9), rgba(16,185,129,0.9));
          box-shadow: 0 0 20px rgba(6,182,212,0.8);
        }

        /* Tabular Numbers for Consistent Width */
        .tabular-nums {
          font-variant-numeric: tabular-nums;
        }

        /* Smooth Hardware Acceleration */
        .animate-flip-in,
        .animate-ticker-seamless,
        .animate-float,
        .animate-float-delayed {
          will-change: transform;
          transform: translateZ(0);
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  )

  if (isFullscreen) {
    return <ScheduleContent />
  }

  return (
    <DashboardLayout>
      <ScheduleContent />
    </DashboardLayout>
  )
}

export default SchedulePage
