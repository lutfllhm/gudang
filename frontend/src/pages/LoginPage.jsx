import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import usePageTitle from '../hooks/usePageTitle'
import Logo from '../components/Logo'
import { Loader2, Eye, EyeOff, Shield, Lock, ArrowLeft, Package, CheckCircle, Sparkles } from 'lucide-react'

const LoginPage = () => {
  usePageTitle('Login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await login(email, password)
      if (result.success) {
        navigate('/dashboard')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-900 relative overflow-hidden">
      {/* Background Image with Overlay - Same as HomePage */}
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

      {/* Optimized Geometric Shapes - Neutral tone */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-15">
        {/* Large circles with CSS-only animation */}
        <div className="absolute top-20 left-10 w-64 h-64 border border-white/20 rounded-full animate-spin-very-slow" style={{ willChange: 'transform' }} />
        <div className="absolute top-40 right-20 w-96 h-96 border border-white/15 rounded-full animate-spin-reverse" style={{ willChange: 'transform' }} />
        <div className="absolute bottom-20 left-1/4 w-48 h-48 border border-white/20 rounded-full animate-spin-slow" style={{ willChange: 'transform' }} />
        
        {/* Optimized floating shapes */}
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

      {/* Optimized Orbs with subtle mouse parallax - Neutral tone */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-10 transition-all duration-300 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)',
          left: `${20 + mousePosition.x / 20}px`,
          top: `${-100 + mousePosition.y / 20}px`,
          animation: 'pulse-subtle 8s ease-in-out infinite',
          willChange: 'transform, opacity'
        }}
      />
      <div 
        className="absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-10 transition-all duration-300 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)',
          right: `${-50 - mousePosition.x / 30}px`,
          bottom: `${-100 - mousePosition.y / 30}px`,
          animation: 'pulse-subtle 8s ease-in-out infinite',
          animationDelay: '4s',
          willChange: 'transform, opacity'
        }}
      />
      
      {/* Optimized Light Rays - Neutral white tone */}
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

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 relative z-10">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Branding & Info */}
          <div className="hidden lg:flex flex-col items-start justify-center space-y-8 animate-fade-in-left">
            {/* Logo & Title */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 group">
                <Logo variant="blue" size="xl" className="rounded-xl shadow-2xl group-hover:scale-110 transition-transform" />
                <div>
                  <h1 className="text-4xl font-bold text-white">iware</h1>
                  <p className="text-slate-300 text-sm">Warehouse Management System</p>
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-white leading-tight mt-6">
                Sistem Manajemen Gudang
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-slate-300 to-slate-400">
                  Cepat & Efisien
                </span>
              </h2>
              
              <p className="text-lg text-slate-300 leading-relaxed">
                Solusi terpadu yang terintegrasi dengan Accurate Online untuk sinkronisasi inventori secara real-time.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4 w-full">
              {[
                { icon: Shield, text: 'Keamanan Data Terjamin', color: 'from-blue-600 to-blue-700' },
                { icon: CheckCircle, text: 'Integrasi Real-time dengan Accurate', color: 'from-green-600 to-green-700' },
                { icon: Package, text: 'Kelola Multi Gudang dengan Mudah', color: 'from-purple-600 to-purple-700' }
              ].map((feature, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 hover:scale-105 hover:border-white/20 transition-all duration-300 cursor-pointer group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <feature.icon className="text-white" size={24} />
                  </div>
                  <span className="text-white font-medium group-hover:translate-x-1 transition-transform duration-300">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 w-full pt-6 border-t border-white/10">
              {[
                { value: '99.9%', label: 'Uptime' },
                { value: '24/7', label: 'Support' },
                { value: '100+', label: 'Clients' }
              ].map((stat, index) => (
                <div key={index} className="group cursor-pointer transition-all hover:scale-105 relative">
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 rounded-lg transition-all duration-300 blur-md" />
                  <div className="relative">
                    <div className="text-3xl font-black text-white mb-1 group-hover:text-slate-100 transition-colors">{stat.value}</div>
                    <div className="text-sm font-semibold text-slate-400 tracking-wide">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto animate-fade-in-right">
            {/* Back to Home Button */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white hover:text-slate-300 transition-colors mb-6 group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span>Kembali ke Beranda</span>
            </button>

            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <Logo variant="blue" size="xl" className="mx-auto mb-4 rounded-xl shadow-2xl" />
              <h1 className="text-3xl font-bold text-white">iware</h1>
              <p className="text-slate-300">Warehouse Management</p>
            </div>

            {/* Login Card */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-10 border border-slate-200 relative overflow-hidden hover:shadow-slate-500/20 transition-all duration-500">
              {/* Animated Decorative Background */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-slate-600/10 to-slate-700/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-slate-700/10 to-slate-800/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
              
              {/* Sparkle Effect */}
              <div className="absolute top-4 right-4">
                <Sparkles className="text-slate-400 animate-pulse" size={24} />
              </div>
              
              <div className="relative z-10">
                <div className="mb-8">
                  <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Selamat Datang Kembali</h3>
                  <p className="text-slate-600 font-light">Masuk untuk mengakses dashboard gudang Anda</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Input */}
                  <div className="group">
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                      Alamat Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all outline-none hover:border-slate-300"
                      placeholder="anda@perusahaan.com"
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Password Input */}
                  <div className="group">
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                      Kata Sandi
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all outline-none hover:border-slate-300"
                        placeholder="••••••••"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 hover:scale-110 transition-all"
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Remember & Forgot */}
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                      />
                      <span className="text-slate-600 group-hover:text-slate-900 transition-colors">Ingat saya</span>
                    </label>
                    <button type="button" className="text-red-600 hover:text-red-700 font-medium transition-colors">
                      Lupa password?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-2xl hover:shadow-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-600 opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                    {loading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Sedang masuk...</span>
                      </>
                    ) : (
                      <>
                        <span>Masuk</span>
                        <ArrowLeft size={20} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

                {/* Demo Account */}
                <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                  <p className="text-xs text-center text-slate-700">
                    <span className="font-semibold text-slate-900">Akun Demo:</span>{' '}
                    superadmin@iware.id / jasad666
                  </p>
                </div>

                {/* Security Badge */}
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <Lock size={14} />
                  <span>Dilindungi dengan enkripsi tingkat enterprise</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animations - Same as HomePage */}
      <style>{`
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

        @keyframes float {
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
            transform: scale(1.05);
          }
        }

        @keyframes mesh-move {
          0% {
            transform: perspective(500px) rotateX(60deg) translateY(0);
          }
          100% {
            transform: perspective(500px) rotateX(60deg) translateY(80px);
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

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes float-optimized {
          0%, 100% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-30px) translateX(15px) rotate(180deg);
            opacity: 0.6;
          }
        }

        @keyframes light-ray {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(100%);
            opacity: 0;
          }
        }

        .animate-fade-in-left {
          animation: fade-in-left 1s ease-out both;
        }

        .animate-fade-in-right {
          animation: fade-in-right 1s ease-out both;
        }

        .animate-float {
          animation: float linear infinite;
        }

        .animate-mesh-move {
          animation: mesh-move 20s linear infinite;
        }

        .animate-spin-very-slow {
          animation: spin-very-slow 30s linear infinite;
        }

        .animate-spin-reverse {
          animation: spin-reverse 40s linear infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 25s linear infinite;
        }

        .animate-float-optimized {
          animation: float-optimized ease-in-out infinite;
        }

        .animate-light-ray {
          animation: light-ray linear infinite;
        }
      `}</style>
    </div>
  )
}

export default LoginPage
