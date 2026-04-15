import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import usePageTitle from '../hooks/usePageTitle'
import Logo from '../components/Logo'
import { 
  Package, TrendingUp, Users, Shield, Zap, BarChart3,
  CheckCircle, ArrowRight, Menu, X, Database, RefreshCw,
  Layers, Activity, Cloud, Server, Lock, FileText,
  ChevronRight, Play, PieChart, BarChart
} from 'lucide-react'

const HomePage = () => {
  usePageTitle('Home')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [visibleSections, setVisibleSections] = useState(new Set())
  const [isHeroVisible, setIsHeroVisible] = useState(true)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
      
      // Pause hero animations when scrolled away (performance optimization)
      setIsHeroVisible(window.scrollY < window.innerHeight)
      
      // Detect visible sections for scroll animations
      const sections = document.querySelectorAll('[data-animate]')
      sections.forEach(section => {
        const rect = section.getBoundingClientRect()
        const isVisible = rect.top < window.innerHeight * 0.8 && rect.bottom > 0
        if (isVisible) {
          setVisibleSections(prev => new Set([...prev, section.id]))
        }
      })
    }
    
    // Throttled mouse move for 3D effects (only update every 100ms for performance)
    let mouseTimeout
    const handleMouseMove = (e) => {
      if (!mouseTimeout) {
        mouseTimeout = setTimeout(() => {
          // Only track mouse in hero section for performance
          if (window.scrollY < window.innerHeight) {
            setMousePos({ 
              x: (e.clientX / window.innerWidth - 0.5) * 20, // -10 to 10
              y: (e.clientY / window.innerHeight - 0.5) * 20 
            })
          }
          mouseTimeout = null
        }, 100) // Throttle to 10fps for mouse tracking
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    
    // Initial check
    handleScroll()
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
      if (mouseTimeout) clearTimeout(mouseTimeout)
    }
  }, [isAuthenticated, navigate])

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      closeMenu()
    }
  }

  const handleFeatureClick = (featureTitle) => {
    // Map fitur ke halaman yang sesuai
    const featureRoutes = {
      'Tracking Inventori': '/items',
      'Integrasi Accurate Online': '/settings',
      'Update Stok Real-Time': '/items',
      'Multi Gudang': '/dashboard',
      'Laporan & Analitik': '/dashboard',
      'Manajemen User': '/users'
    }
    
    const route = featureRoutes[featureTitle]
    if (route) {
      navigate('/login', { state: { redirectTo: route } })
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Professional Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
        scrolled 
          ? 'bg-white shadow-lg backdrop-blur-lg' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Logo variant="blue" size="md" className="rounded-lg shadow-lg group-hover:scale-110 transition-transform" />
              <div>
                <span className={`text-2xl font-extrabold tracking-tight transition-colors ${scrolled ? 'text-slate-900' : 'text-white'}`}>
                  iware
                </span>
                <span className={`block text-xs font-semibold tracking-wide uppercase transition-colors ${scrolled ? 'text-slate-500' : 'text-blue-100'}`}>
                  Warehouse System
                </span>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => scrollToSection('home')}
                className={`font-semibold text-sm tracking-wide transition-colors hover:text-blue-600 ${scrolled ? 'text-slate-700' : 'text-white'}`}
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className={`font-semibold text-sm tracking-wide transition-colors hover:text-blue-600 ${scrolled ? 'text-slate-700' : 'text-white'}`}
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('integration')}
                className={`font-semibold text-sm tracking-wide transition-colors hover:text-blue-600 ${scrolled ? 'text-slate-700' : 'text-white'}`}
              >
                Integration
              </button>
              <button 
                onClick={() => scrollToSection('about')}
                className={`font-semibold text-sm tracking-wide transition-colors hover:text-blue-600 ${scrolled ? 'text-slate-700' : 'text-white'}`}
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className={`font-semibold text-sm tracking-wide transition-colors hover:text-blue-600 ${scrolled ? 'text-slate-700' : 'text-white'}`}
              >
                Contact
              </button>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                Mulai Sekarang
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className={`md:hidden p-2 rounded-lg transition-colors ${
                scrolled ? 'text-slate-900 hover:bg-slate-100' : 'text-white hover:bg-white/10'
              }`}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-lg animate-slide-down">
            <div className="px-4 py-4 space-y-3">
              <button onClick={() => scrollToSection('home')} className="block w-full text-left py-2 text-slate-700 font-medium hover:text-blue-600 hover:translate-x-2 transition-all">Home</button>
              <button onClick={() => scrollToSection('features')} className="block w-full text-left py-2 text-slate-700 font-medium hover:text-blue-600 hover:translate-x-2 transition-all">Features</button>
              <button onClick={() => scrollToSection('integration')} className="block w-full text-left py-2 text-slate-700 font-medium hover:text-blue-600 hover:translate-x-2 transition-all">Integration</button>
              <button onClick={() => scrollToSection('about')} className="block w-full text-left py-2 text-slate-700 font-medium hover:text-blue-600 hover:translate-x-2 transition-all">About</button>
              <button onClick={() => scrollToSection('contact')} className="block w-full text-left py-2 text-slate-700 font-medium hover:text-blue-600 hover:translate-x-2 transition-all">Contact</button>
              <div className="pt-3">
                <button onClick={() => navigate('/login')} className="w-full px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all hover:scale-105">
                  Mulai Sekarang
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - Modern and Elegant */}
      <section id="home" className="relative pt-20 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden bg-slate-900">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          {/* Image with fade-in animation */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-fade-in"
            style={{
              backgroundImage: 'url(/bg1.jpeg)',
              opacity: 0.5,
              animationDuration: '1.5s'
            }}
          />
          {/* Dark overlay for readability - following image tone */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-800/80 to-slate-900/90" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-slate-900/40" />
          
          {/* Subtle animated overlay for depth */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(15, 23, 42, 0.4) 100%)',
              animation: 'pulse-subtle 10s ease-in-out infinite'
            }}
          />
        </div>
        
        {/* Animated Mesh Grid - Neutral tone */}
        <div className="absolute inset-0 opacity-8">
          <div className="absolute inset-0 animate-mesh-move" style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
              linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
            transform: 'perspective(500px) rotateX(60deg)',
            transformOrigin: 'center top'
          }} />
        </div>

        {/* Optimized Geometric Shapes - Only when hero is visible */}
        {isHeroVisible && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-15">
            {/* 3 Large circles with CSS-only animation - Neutral tone */}
            <div className="absolute top-20 left-10 w-64 h-64 border border-white/20 rounded-full animate-spin-very-slow" style={{ willChange: 'transform' }} />
            <div className="absolute top-40 right-20 w-96 h-96 border border-white/15 rounded-full animate-spin-reverse" style={{ willChange: 'transform' }} />
            <div className="absolute bottom-20 left-1/4 w-48 h-48 border border-white/20 rounded-full animate-spin-slow" style={{ willChange: 'transform' }} />
            
            {/* Optimized floating shapes - Only 5 instead of 15 */}
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-float-optimized"
                style={{
                  left: `${20 + i * 20}%`,
                  top: `${20 + (i % 3) * 25}%`,
                  animationDelay: `${i * 1}s`,
                  animationDuration: '10s',
                  willChange: 'transform'
                }}
              >
                <div 
                  className="w-6 h-6 bg-gradient-to-br from-white/10 to-white/5 rounded-lg transform rotate-45"
                />
              </div>
            ))}
          </div>
        )}

        {/* Optimized Orbs with subtle mouse parallax - Neutral tone */}
        {isHeroVisible && (
          <>
            <div 
              className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-10 transition-all duration-300 ease-out"
              style={{
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)',
                left: `${20 + mousePos.x * 2}px`,
                top: `${-100 + mousePos.y * 2}px`,
                animation: 'pulse-subtle 8s ease-in-out infinite',
                willChange: 'transform, opacity'
              }}
            />
            <div 
              className="absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-10 transition-all duration-300 ease-out"
              style={{
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)',
                right: `${-50 - mousePos.x * 2}px`,
                bottom: `${-100 - mousePos.y * 2}px`,
                animation: 'pulse-subtle 8s ease-in-out infinite',
                animationDelay: '4s',
                willChange: 'transform, opacity'
              }}
            />
          </>
        )}
        
        {/* Optimized Light Rays - Neutral white tone */}
        {isHeroVisible && (
          <div className="absolute inset-0 overflow-hidden opacity-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute h-full w-px bg-gradient-to-b from-transparent via-white to-transparent animate-light-ray"
                style={{
                  left: `${i * 25}%`,
                  animationDelay: `${i * 1}s`,
                  animationDuration: '6s',
                  willChange: 'transform'
                }}
              />
            ))}
          </div>
        )}

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <div className="space-y-5 animate-fade-in-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                <span className="text-xs font-bold tracking-wide text-white">SISTEM GUDANG MODERN</span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
                Atur Gudang Jadi
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 mt-1">
                  Gampang Banget!
                </span>
              </h1>

              <p className="text-base text-slate-300 leading-relaxed font-light">
                Langsung nyambung ke Accurate Online. Stok update sendiri, laporan lengkap, 
                semua barang terpantau dengan jelas.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={(e) => {
                    // Create ripple effect
                    const button = e.currentTarget
                    const ripple = document.createElement('span')
                    const rect = button.getBoundingClientRect()
                    const size = Math.max(rect.width, rect.height)
                    const x = e.clientX - rect.left - size / 2
                    const y = e.clientY - rect.top - size / 2
                    
                    ripple.style.width = ripple.style.height = `${size}px`
                    ripple.style.left = `${x}px`
                    ripple.style.top = `${y}px`
                    ripple.classList.add('ripple-effect')
                    
                    button.appendChild(ripple)
                    
                    setTimeout(() => ripple.remove(), 600)
                    navigate('/login')
                  }}
                  className="group relative px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all inline-flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:scale-105 text-sm overflow-hidden"
                >
                  {/* Shine effect */}
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  
                  <span className="relative z-10">Mulai Sekarang</span>
                  <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={(e) => {
                    // Create ripple effect
                    const button = e.currentTarget
                    const ripple = document.createElement('span')
                    const rect = button.getBoundingClientRect()
                    const size = Math.max(rect.width, rect.height)
                    const x = e.clientX - rect.left - size / 2
                    const y = e.clientY - rect.top - size / 2
                    
                    ripple.style.width = ripple.style.height = `${size}px`
                    ripple.style.left = `${x}px`
                    ripple.style.top = `${y}px`
                    ripple.classList.add('ripple-effect')
                    
                    button.appendChild(ripple)
                    
                    setTimeout(() => ripple.remove(), 600)
                    scrollToSection('features')
                  }}
                  className="group px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold border-2 border-white/20 hover:bg-white/20 hover:border-white/40 transition-all inline-flex items-center justify-center gap-2 text-sm relative overflow-hidden"
                >
                  {/* Animated background */}
                  <span className="absolute inset-0 bg-white/10 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-lg" />
                  
                  <Play size={18} className="relative z-10 group-hover:scale-110 transition-transform" />
                  <span className="relative z-10">Cek Fiturnya</span>
                </button>
              </div>

              {/* Stats */}
              {/* Optimized Stats with subtle glow - Neutral tone */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
                <div className="group cursor-pointer transition-all hover:scale-105 relative">
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 rounded-lg transition-all duration-300 blur-md" />
                  <div className="relative">
                    <div className="text-3xl font-black text-white mb-1 group-hover:text-slate-100 transition-colors">99.9%</div>
                    <div className="text-sm font-semibold text-slate-400 tracking-wide">Uptime</div>
                  </div>
                </div>
                <div className="group cursor-pointer transition-all hover:scale-105 relative">
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 rounded-lg transition-all duration-300 blur-md" />
                  <div className="relative">
                    <div className="text-3xl font-black text-white mb-1 group-hover:text-slate-100 transition-colors">24/7</div>
                    <div className="text-sm font-semibold text-slate-400 tracking-wide">Support</div>
                  </div>
                </div>
                <div className="group cursor-pointer transition-all hover:scale-105 relative">
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 rounded-lg transition-all duration-300 blur-md" />
                  <div className="relative">
                    <div className="text-3xl font-black text-white mb-1 group-hover:text-slate-100 transition-colors">100+</div>
                    <div className="text-sm font-semibold text-slate-400 tracking-wide">Clients</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Illustration - Dashboard Preview with optimized 3D */}
            <div className="relative animate-fade-in-right">
              {/* Optimized 3D Card with throttled mouse tracking */}
              <div 
                className="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl transition-all duration-300 group"
                style={{ 
                  transform: isHeroVisible 
                    ? `perspective(1000px) rotateY(${mousePos.x * 0.5}deg) rotateX(${-mousePos.y * 0.5}deg) scale(1)`
                    : 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)',
                  transformStyle: 'preserve-3d',
                  willChange: 'transform',
                  transition: 'transform 0.3s ease-out'
                }}
              >
                {/* Dynamic gradient overlay based on mouse - Neutral tone */}
                <div 
                  className="absolute inset-0 rounded-2xl opacity-15 pointer-events-none transition-opacity duration-500 group-hover:opacity-25"
                  style={{
                    background: isHeroVisible
                      ? `linear-gradient(${135 + mousePos.x * 2}deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))`
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                  }}
                />
                
                {/* Mock Dashboard with 3D depth */}
                <div className="space-y-4 relative" style={{ transform: 'translateZ(20px)' }}>
                  {/* Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg animate-pulse-glow">
                        <BarChart3 className="text-white" size={20} />
                      </div>
                      <div>
                        <div className="text-white font-semibold">Dashboard</div>
                        <div className="text-xs text-slate-400">Real-time Overview</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-ping" />
                      <div className="w-3 h-3 bg-green-400 rounded-full" />
                      <div className="text-xs text-slate-400 ml-1">Live</div>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Total Items', value: '2,847', icon: Package, color: 'from-blue-600 to-blue-700', trend: '+12%' },
                      { label: 'Orders', value: '1,234', icon: TrendingUp, color: 'from-green-600 to-green-700', trend: '+8%' },
                      { label: 'Warehouses', value: '12', icon: Database, color: 'from-purple-600 to-purple-700', trend: '+2' },
                      { label: 'Users', value: '48', icon: Users, color: 'from-orange-600 to-orange-700', trend: '+5' }
                    ].map((stat, index) => (
                      <div 
                        key={index} 
                        className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all cursor-pointer group relative overflow-hidden"
                        style={{ 
                          transform: 'translateZ(30px)',
                          willChange: 'transform'
                        }}
                      >
                        {/* Subtle glow on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300 rounded-lg" />
                        
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-2">
                            <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                              <stat.icon className="text-white" size={18} />
                            </div>
                            <div className="text-xs text-green-400 font-bold">{stat.trend}</div>
                          </div>
                          <div className="text-2xl font-bold text-white mb-1 group-hover:scale-105 transition-transform origin-left">{stat.value}</div>
                          <div className="text-xs text-slate-400">{stat.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chart Preview - Optimized with 3D depth */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10" style={{ transform: 'translateZ(40px)' }}>
                    <div className="text-sm text-slate-400 mb-3 flex items-center justify-between">
                      <span>Inventory Trend</span>
                      <Activity className="text-green-400" size={16} />
                    </div>
                    <div className="flex items-end gap-2 h-24">
                      {[40, 60, 45, 70, 55, 80, 65, 75, 60, 85, 70, 90].map((height, index) => (
                        <div 
                          key={index} 
                          className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t hover:from-blue-500 hover:to-blue-300 transition-all cursor-pointer group relative hover:scale-110" 
                          style={{ 
                            height: `${height}%`,
                            opacity: 0,
                            animation: `bar-grow-optimized 0.4s ease-out ${index * 0.05}s forwards`,
                            willChange: 'opacity, transform',
                            transformOrigin: 'bottom'
                          }}
                        >
                          {/* Enhanced Tooltip */}
                          <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg z-50">
                            {height}%
                          </div>
                          
                          {/* Subtle shine on hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-t" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Optimized Decorative Elements with 3D depth - Neutral tone */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float-slow" style={{ willChange: 'transform', transform: 'translateZ(-20px)' }} />
              <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '2s', willChange: 'transform', transform: 'translateZ(-20px)' }} />
              
              {/* Animated pulse ring with 3D - Neutral tone */}
              <div className="absolute inset-0 rounded-2xl border border-white/20 animate-pulse-ring" style={{ willChange: 'transform, opacity', transform: 'translateZ(50px)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Modern Cards */}
      <section 
        id="features" 
        data-animate
        className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div 
            className={`text-center mb-12 transition-all duration-1000 ${
              visibleSections.has('features') 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-full mb-4 hover:scale-110 transition-transform duration-300">
              <Layers className="text-blue-600" size={16} />
              <span className="text-xs font-bold tracking-wide text-blue-600 uppercase">Core Features</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
              Fitur yang Bikin Kerjaan Makin Ringan
            </h2>
            <p className="text-base text-slate-600 max-w-3xl mx-auto font-light leading-relaxed">
              Semua yang lo butuhin buat ngatur gudang ada di siniengan lebih baik
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Package,
                title: 'Tracking Inventori',
                description: 'Cek stok barang kapan aja, dimana aja. Pakai barcode, tracking batch, plus dikasih tau kalau stok mau habis.',
                color: 'blue',
                gradient: 'from-blue-600 to-blue-700'
              },
              {
                icon: RefreshCw,
                title: 'Integrasi Accurate Online',
                description: 'Nyambung langsung ke Accurate Online. Data keuangan sama inventori update otomatis, gak perlu input manual lagi.',
                color: 'green',
                gradient: 'from-green-600 to-green-700'
              },
              {
                icon: Activity,
                title: 'Update Stok Real-Time',
                description: 'Stok berubah? Langsung sinkron ke semua gudang. Gak ada lagi data yang ketinggalan atau salah.',
                color: 'purple',
                gradient: 'from-purple-600 to-purple-700'
              },
              {
                icon: Database,
                title: 'Multi Gudang',
                description: 'Punya beberapa gudang? Atur semuanya dari satu tempat aja. Gampang, praktis, gak ribet.',
                color: 'orange',
                gradient: 'from-orange-600 to-orange-700'
              },
              {
                icon: BarChart3,
                title: 'Laporan & Analitik',
                description: 'Dashboard lengkap dengan grafik dan laporan yang bisa disesuaikan. Bikin keputusan bisnis jadi lebih gampang.',
                color: 'indigo',
                gradient: 'from-indigo-600 to-indigo-700'
              },
              {
                icon: Users,
                title: 'Manajemen User',
                description: 'Atur siapa bisa akses apa. Setiap orang cuma bisa lihat dan edit yang mereka butuhin aja.',
                color: 'pink',
                gradient: 'from-pink-600 to-pink-700'
              }
            ].map((feature, index) => (
              <div
                key={index}
                onClick={() => navigate('/login')}
                className={`group bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-200 hover:border-blue-300 cursor-pointer transform hover:-translate-y-2 relative overflow-hidden ${
                  visibleSections.has('features')
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-10'
                }`}
                style={{ 
                  transitionDelay: `${index * 100}ms`
                }}
              >
                {/* Optimized hover background with ripple */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Subtle ripple effect */}
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  <div className="absolute inset-0 bg-blue-500/5 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-full" style={{ willChange: 'transform' }} />
                </div>
                
                {/* Icon with 3D effect and glow */}
                <div className={`relative w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-lg flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all`} style={{ willChange: 'transform', transform: 'translateZ(10px)' }}>
                  <feature.icon className="text-white group-hover:scale-110 transition-transform" size={22} />
                  
                  {/* Icon glow on hover */}
                  <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Content */}
                <h3 className="relative text-lg font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors tracking-tight">
                  {feature.title}
                </h3>
                <p className="relative text-sm text-slate-600 leading-relaxed mb-4 font-light group-hover:text-slate-700 transition-colors">
                  {feature.description}
                </p>

                {/* Learn More Link with animated arrow */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate('/login')
                  }}
                  className="relative flex items-center gap-2 text-blue-600 font-bold group-hover:gap-3 transition-all text-xs tracking-wide"
                >
                  <span className="relative">
                    LIHAT SELENGKAPNYA
                    {/* Animated underline */}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300" style={{ willChange: 'width' }} />
                  </span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section 
        id="integration" 
        data-animate
        className="py-24 px-4 sm:px-6 lg:px-8 bg-white"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8 animate-fade-in-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full">
                <Cloud className="text-blue-600" size={18} />
                <span className="text-sm font-bold tracking-wide text-blue-600 uppercase">Integration</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
                Langsung Nyambung ke
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 mt-2">
                  Accurate Online
                </span>
              </h2>

              <p className="text-lg text-slate-600 leading-relaxed font-light">
                Sistemnya langsung konek ke Accurate Online. Data gudang sama keuangan 
                selalu sinkron otomatis, gak perlu input manual lagi deh.
              </p>

              {/* Integration Features */}
              <div className="space-y-4">
                {[
                  {
                    icon: RefreshCw,
                    title: 'Sinkronisasi Otomatis',
                    description: 'Data gudang sama akuntansi selalu update sendiri secara real-time'
                  },
                  {
                    icon: Server,
                    title: 'Berbasis Cloud',
                    description: 'Pakai cloud yang aman dan stabil, bisa diakses dari mana aja'
                  },
                  {
                    icon: CheckCircle,
                    title: 'Validasi Data',
                    description: 'Data dicek otomatis biar gak ada yang salah atau gak konsisten'
                  }
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all group cursor-pointer">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                      <item.icon className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-slate-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/login')}
                className="group px-8 py-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all inline-flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Mulai Sekarang
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Right Illustration - API Connection */}
            <div className="relative animate-fade-in-right">
              <div className="relative bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl p-8 shadow-2xl">
                {/* Connection Diagram */}
                <div className="space-y-6">
                  {/* iware System */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="flex items-center gap-4 mb-4">
                      <img src="/logo.png" alt="iware" className="w-12 h-12 rounded-lg" />
                      <div>
                        <div className="text-white font-bold">iware System</div>
                        <div className="text-xs text-slate-400">Warehouse Management</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {['Inventory', 'Orders', 'Reports'].map((item, i) => (
                        <div key={i} className="bg-white/5 rounded px-2 py-1 text-xs text-slate-300 text-center">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Connection Line */}
                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <div className="w-16 h-0.5 bg-gradient-to-r from-green-400 to-blue-400" />
                      <RefreshCw className="text-blue-400 animate-spin-slow" size={20} />
                      <div className="w-16 h-0.5 bg-gradient-to-r from-blue-400 to-green-400" />
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    </div>
                  </div>

                  {/* Accurate Online */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                        <Server className="text-white" size={24} />
                      </div>
                      <div>
                        <div className="text-white font-bold">Accurate Online</div>
                        <div className="text-xs text-slate-400">Accounting System</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {['Finance', 'Sales', 'Purchase'].map((item, i) => (
                        <div key={i} className="bg-white/5 rounded px-2 py-1 text-xs text-slate-300 text-center">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span>Connected & Syncing</span>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl animate-pulse" />
              <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section 
        id="about" 
        data-animate
        className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-6">
              <BarChart3 className="text-blue-600" size={18} />
              <span className="text-sm font-bold tracking-wide text-blue-600 uppercase">Dashboard</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
              Dashboard yang Keren Abis
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto font-light leading-relaxed">
              Semua data penting langsung keliatan di satu layar
            </p>
          </div>

          {/* Dashboard Mockup */}
          <div className="relative animate-fade-in-up">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              {/* Dashboard Header */}
              <div className="bg-gradient-to-r from-slate-900 to-blue-900 px-8 py-6 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <BarChart3 className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Analytics Dashboard</h3>
                      <p className="text-slate-400 text-sm">Real-time warehouse metrics</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-slate-400 text-sm">Live</span>
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-8">
                {/* Statistics Cards - Optimized with 3D effects */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                  {[
                    { label: 'Total Revenue', value: 'Rp 2.4M', change: '+12.5%', icon: TrendingUp, color: 'green' },
                    { label: 'Total Orders', value: '1,847', change: '+8.2%', icon: Package, color: 'blue' },
                    { label: 'Active Items', value: '3,429', change: '+3.1%', icon: Database, color: 'purple' },
                    { label: 'Warehouses', value: '12', change: '+2', icon: Layers, color: 'orange' }
                  ].map((stat, index) => (
                    <div 
                      key={index} 
                      className="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:shadow-xl transition-all group cursor-pointer relative overflow-hidden"
                      style={{ 
                        willChange: 'transform, box-shadow',
                        transform: 'translateZ(0)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {/* Gradient on hover with 3D feel */}
                      <div className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                      
                      {/* Subtle glow */}
                      <div className={`absolute -inset-1 bg-${stat.color}-500/10 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all shadow-lg`} style={{ willChange: 'transform' }}>
                            <stat.icon className={`text-${stat.color}-600 group-hover:scale-110 transition-transform`} size={24} />
                          </div>
                          <span className="text-green-600 text-sm font-semibold bg-green-50 px-2 py-1 rounded-full group-hover:scale-110 transition-transform">{stat.change}</span>
                        </div>
                        <div className="text-3xl font-bold text-slate-900 mb-1 group-hover:scale-105 transition-transform origin-left">{stat.value}</div>
                        <div className="text-sm text-slate-600">{stat.label}</div>
                      </div>
                      
                      {/* Shine effect */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ willChange: 'transform' }} />
                    </div>
                  ))}
                </div>

                {/* Charts Grid */}
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Bar Chart - Optimized */}
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="font-bold text-slate-900">Monthly Sales</h4>
                      <BarChart className="text-slate-400" size={20} />
                    </div>
                    <div className="flex items-end gap-3 h-48">
                      {[65, 75, 60, 85, 70, 90, 80, 95, 85, 100, 90, 95].map((height, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t hover:from-blue-700 hover:to-blue-500 transition-colors cursor-pointer group relative" 
                          style={{ 
                            height: `${height}%`,
                            opacity: 0,
                            animation: `bar-grow-optimized 0.4s ease-out ${i * 0.05}s forwards`,
                            willChange: 'opacity, transform'
                          }}
                        >
                          {/* Enhanced Tooltip */}
                          <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                            {height}%
                          </div>
                          
                          {/* Subtle shine */}
                          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-t" />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-4 text-xs text-slate-500">
                      <span>Jan</span>
                      <span>Dec</span>
                    </div>
                  </div>

                  {/* Pie Chart - Optimized */}
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="font-bold text-slate-900">Warehouse Distribution</h4>
                      <PieChart className="text-slate-400" size={20} />
                    </div>
                    <div className="flex items-center justify-center h-48">
                      <div className="relative w-40 h-40 group cursor-pointer">
                        <svg viewBox="0 0 100 100" className="transform -rotate-90 transition-transform duration-300 group-hover:scale-105" style={{ willChange: 'transform' }}>
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="20" />
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="20" strokeDasharray="75 25" strokeLinecap="round" className="transition-all duration-300" />
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#8b5cf6" strokeWidth="20" strokeDasharray="15 85" strokeDashoffset="-75" strokeLinecap="round" className="transition-all duration-300" />
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="20" strokeDasharray="10 90" strokeDashoffset="-90" strokeLinecap="round" className="transition-all duration-300" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center group-hover:scale-105 transition-transform">
                            <div className="text-2xl font-bold text-slate-900">100%</div>
                            <div className="text-xs text-slate-600">Total</div>
                          </div>
                        </div>
                        {/* Subtle glow on hover */}
                        <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      {[
                        { label: 'Jakarta', value: '75%', color: 'blue' },
                        { label: 'Bandung', value: '15%', color: 'purple' },
                        { label: 'Others', value: '10%', color: 'orange' }
                      ].map((item, i) => (
                        <div key={i} className="text-center group cursor-pointer hover:scale-105 transition-transform">
                          <div className={`w-3 h-3 bg-${item.color}-600 rounded-full mx-auto mb-1 group-hover:scale-125 transition-transform`} />
                          <div className="text-xs text-slate-600">{item.label}</div>
                          <div className="text-sm font-semibold text-slate-900">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Activity Table - Simplified */}
                <div className="mt-8 bg-slate-50 rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-bold text-slate-900">Recent Transactions</h4>
                    <FileText className="text-slate-400" size={20} />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Order ID</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Customer</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Amount</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { id: '#ORD-001', customer: 'PT. Maju Jaya', amount: 'Rp 2.5M', status: 'Completed' },
                          { id: '#ORD-002', customer: 'CV. Sukses Makmur', amount: 'Rp 1.8M', status: 'Processing' },
                          { id: '#ORD-003', customer: 'PT. Berkah Abadi', amount: 'Rp 3.2M', status: 'Completed' }
                        ].map((row, i) => (
                          <tr key={i} className="border-b border-slate-100 hover:bg-white transition-colors group cursor-pointer">
                            <td className="py-3 px-4 text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{row.id}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">{row.customer}</td>
                            <td className="py-3 px-4 text-sm font-semibold text-slate-900">{row.amount}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                row.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action Section */}
      <section 
        id="contact" 
        data-animate
        className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
      >
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          {/* Image with fade-in animation */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(/bg2.jpeg)',
              opacity: 0.5
            }}
          />
          {/* Dark overlay for readability - following image tone */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-800/80 to-slate-900/90" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-slate-900/40" />
        </div>

        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Gradient Overlays */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="max-w-4xl mx-auto text-center relative z-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8">
            <Zap className="text-white" size={18} />
            <span className="text-sm font-bold tracking-wide text-white">GET STARTED TODAY</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
            Yuk, Atur Gudang
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 mt-2">
              Jadi Lebih Gampang!
            </span>
          </h2>

          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Udah ratusan bisnis yang pakai iware. Cobain sendiri gimana enaknya 
            ngatur gudang pakai teknologi modern.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={(e) => {
                // Create ripple effect
                const button = e.currentTarget
                const ripple = document.createElement('span')
                const rect = button.getBoundingClientRect()
                const size = Math.max(rect.width, rect.height)
                const x = e.clientX - rect.left - size / 2
                const y = e.clientY - rect.top - size / 2
                
                ripple.style.width = ripple.style.height = `${size}px`
                ripple.style.left = `${x}px`
                ripple.style.top = `${y}px`
                ripple.classList.add('ripple-effect')
                
                button.appendChild(ripple)
                
                setTimeout(() => ripple.remove(), 600)
                navigate('/login')
              }}
              className="group px-10 py-5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all inline-flex items-center justify-center gap-2 shadow-2xl hover:shadow-red-600/50 hover:scale-105 text-lg relative overflow-hidden"
            >
              {/* Shine effect */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              
              <span className="relative z-10">Get Started</span>
              <ArrowRight size={24} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={(e) => {
                // Create ripple effect
                const button = e.currentTarget
                const ripple = document.createElement('span')
                const rect = button.getBoundingClientRect()
                const size = Math.max(rect.width, rect.height)
                const x = e.clientX - rect.left - size / 2
                const y = e.clientY - rect.top - size / 2
                
                ripple.style.width = ripple.style.height = `${size}px`
                ripple.style.left = `${x}px`
                ripple.style.top = `${y}px`
                ripple.classList.add('ripple-effect')
                
                button.appendChild(ripple)
                
                setTimeout(() => ripple.remove(), 600)
                scrollToSection('features')
              }}
              className="px-10 py-5 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold border-2 border-white/20 hover:bg-white/20 transition-all inline-flex items-center justify-center gap-2 text-lg relative overflow-hidden"
            >
              Pelajari Lebih Lanjut
            </button>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-white/10">
            {[
              { icon: Shield, label: 'Secure & Reliable' },
              { icon: Lock, label: 'Data Protected' },
              { icon: Activity, label: '99.9% Uptime' },
              { icon: Users, label: '24/7 Support' }
            ].map((badge, index) => (
              <div key={index} className="flex flex-col items-center gap-3 group cursor-pointer">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-all">
                  <badge.icon className="text-white" size={24} />
                </div>
                <span className="text-sm text-slate-300">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6 group cursor-pointer">
                <Logo variant="blue" size="md" className="rounded-lg shadow-lg group-hover:scale-110 transition-transform" />
                <div>
                  <span className="text-2xl font-bold text-white block">iware</span>
                  <span className="text-xs text-slate-400">Warehouse Management System</span>
                </div>
              </div>
              <p className="text-slate-400 mb-6 max-w-md leading-relaxed">
                Enterprise-grade warehouse management solution integrated with Accurate Online. 
                Streamline your operations with cutting-edge technology and real-time synchronization.
              </p>
              <div className="flex gap-4">
                {[
                  { icon: Shield, label: 'Secure' },
                  { icon: Activity, label: 'Reliable' },
                  { icon: Zap, label: 'Fast' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer">
                    <item.icon className="text-blue-400" size={16} />
                    <span className="text-xs text-slate-300">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-lg">Quick Links</h4>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => scrollToSection('home')} className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                    Home
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                    Features
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('integration')} className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                    Integration
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('about')} className="hover:text-white transition-colors hover:translate-x-1 inline-block">
                    About
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-lg">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">Email:</span>
                  <a href="mailto:info@iware.id" className="hover:text-white transition-colors">
                    info@iware.id
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">Phone:</span>
                  <a href="tel:+6281234567890" className="hover:text-white transition-colors">
                    +62 812-3456-7890
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400">Location:</span>
                  <span>Surabaya, Indonesia</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-500">
              © 2026 iware System. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style>{`
        /* Smooth Animations */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-left {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fade-in-right {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.5;
          }
        }

        @keyframes float-3d {
          0%, 100% {
            transform: translateY(0) translateX(0) translateZ(0) rotateZ(0deg);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-30px) translateX(20px) translateZ(20px) rotateZ(180deg);
            opacity: 0.6;
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-20px) scale(1.1);
          }
        }

        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes mesh-move {
          0%, 100% {
            transform: perspective(500px) rotateX(60deg) translateY(0);
          }
          50% {
            transform: perspective(500px) rotateX(60deg) translateY(-20px);
          }
        }

        @keyframes spin-very-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes light-ray {
          0%, 100% {
            opacity: 0;
            transform: translateY(-100%);
          }
          50% {
            opacity: 1;
            transform: translateY(100%);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.8);
          }
        }

        @keyframes pulse-ring {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.02);
          }
        }

        @keyframes bar-grow {
          from {
            opacity: 0;
            transform: scaleY(0);
          }
          to {
            opacity: 0.8;
            transform: scaleY(1);
          }
        }

        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes bar-grow-optimized {
          from {
            opacity: 0;
            transform: scaleY(0.3);
          }
          to {
            opacity: 0.9;
            transform: scaleY(1);
          }
        }

        @keyframes float-optimized {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
        }

        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 0.15;
            transform: scale(1);
          }
          50% {
            opacity: 0.25;
            transform: scale(1.02);
          }
        }

        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes dash-grow {
          from {
            stroke-dasharray: 0 251.2;
          }
        }

        @keyframes ripple-animation {
          0% {
            transform: scale(0);
            opacity: 0.6;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }

        /* Ripple Effect */
        .ripple-effect {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.6);
          pointer-events: none;
          animation: ripple-animation 0.6s ease-out;
        }

        @keyframes text-reveal {
          from {
            opacity: 0;
            transform: translateY(20px) rotateX(-90deg);
          }
          to {
            opacity: 1;
            transform: translateY(0) rotateX(0);
          }
        }

        @keyframes gradient-text {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out both;
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out both;
        }

        .animate-fade-in-left {
          animation: fade-in-left 1s ease-out both;
        }

        .animate-fade-in-right {
          animation: fade-in-right 1s ease-out both;
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out both;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        .animate-float {
          animation: float linear infinite;
        }

        .animate-float-3d {
          animation: float-3d linear infinite;
        }

        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }

        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 15s ease infinite;
        }

        .animate-mesh-move {
          animation: mesh-move 10s ease-in-out infinite;
        }

        .animate-spin-very-slow {
          animation: spin-very-slow 30s linear infinite;
        }

        .animate-spin-reverse {
          animation: spin-reverse 25s linear infinite;
        }

        .animate-light-ray {
          animation: light-ray linear infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-pulse-ring {
          animation: pulse-ring 3s ease-in-out infinite;
        }

        .animate-bar-grow {
          animation: bar-grow 0.6s ease-out both;
          transform-origin: bottom;
        }

        .animate-gradient-text {
          background-size: 200% auto;
          animation: gradient-text 3s ease infinite;
        }

        .animate-ripple {
          animation: ripple 0.6s ease-out;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        /* Smooth Scroll */
        html {
          scroll-behavior: smooth;
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
          width: 10px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #ef4444, #dc2626);
          border-radius: 5px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #dc2626, #b91c1c);
        }

        /* Hover Effects */
        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        /* Gradient Text */
        .gradient-text {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Glass Effect */
        .glass {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        /* Shadow Soft */
        .shadow-soft {
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
        }

        /* Professional Spacing */
        .section-padding {
          padding: 6rem 0;
        }

        @media (max-width: 768px) {
          .section-padding {
            padding: 4rem 0;
          }
        }

        /* Modern Card */
        .modern-card {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
        }

        .modern-card:hover {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          transform: translateY(-4px);
        }

        /* Button Styles */
        .btn-primary {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          color: white;
          padding: 1rem 2rem;
          border-radius: 0.5rem;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
        }

        .btn-primary:hover {
          box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.4);
          transform: translateY(-2px);
        }

        /* Responsive Typography */
        @media (max-width: 640px) {
          h1 {
            font-size: 2rem;
          }
          h2 {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </div>
  )
}

export default HomePage
