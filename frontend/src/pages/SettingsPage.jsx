import { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import usePageTitle from '../hooks/usePageTitle'
import AccurateIntegration from '../components/AccurateIntegration'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Save, Key, Users, Settings, Shield, Database, Bell, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const GLASS_INTENSITY_KEY = 'ui.glassIntensity'
const GLASS_INTENSITY_OPTIONS = ['soft', 'medium', 'strong']

const SettingsPage = () => {
  usePageTitle('Pengaturan')
  const { user, updateProfile, changePassword } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [glassIntensity, setGlassIntensity] = useState(() => {
    try {
      const saved = localStorage.getItem(GLASS_INTENSITY_KEY) || 'medium'
      return GLASS_INTENSITY_OPTIONS.includes(saved) ? saved : 'medium'
    } catch (_) {
      return 'medium'
    }
  })
  const [profile, setProfile] = useState({
    nama: user?.nama || '',
    email: user?.email || ''
  })
  const [password, setPassword] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [appSettings, setAppSettings] = useState({
    appName: 'iware',
    maintenanceMode: false,
    allowRegistration: false,
    emailNotifications: true,
    autoBackup: true
  })

  const isSuperAdmin = user?.role === 'superadmin'

  const handleGlassIntensityChange = (nextIntensity) => {
    if (!GLASS_INTENSITY_OPTIONS.includes(nextIntensity)) return
    setGlassIntensity(nextIntensity)
    document.documentElement.setAttribute('data-glass-intensity', nextIntensity)
    localStorage.setItem(GLASS_INTENSITY_KEY, nextIntensity)
    window.dispatchEvent(new CustomEvent('glass-intensity-change', { detail: nextIntensity }))
    toast.success(`Mode glassmorphism: ${nextIntensity}`)
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateProfile(profile)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    if (password.newPassword !== password.confirmPassword) {
      toast.error('Password baru tidak cocok')
      return
    }

    if (password.newPassword.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }

    setLoading(true)
    try {
      const result = await changePassword(password.oldPassword, password.newPassword)
      if (result.success) {
        setPassword({ oldPassword: '', newPassword: '', confirmPassword: '' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAppSettingsSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // TODO: Implement API call to save app settings
      toast.success('Pengaturan aplikasi berhasil disimpan')
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan aplikasi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <PageHeader
          title="Pengaturan"
          description="Kelola pengaturan akun dan integrasi."
        />

        <Card className="p-6">
          <h2 className="mb-2 text-base font-semibold text-slate-900">Tema Glassmorphism</h2>
          <p className="mb-4 text-sm text-slate-600">
            Atur kekuatan blur dan transparansi untuk menyesuaikan performa perangkat.
          </p>
          <div className="max-w-xs">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Intensitas Tema
            </label>
            <select
              value={glassIntensity}
              onChange={(e) => handleGlassIntensityChange(e.target.value)}
              className="w-full rounded-xl border border-white/60 bg-white/55 px-3 py-2.5 text-sm text-slate-900 shadow-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-400/25"
            >
              <option value="soft">Soft</option>
              <option value="medium">Medium</option>
              <option value="strong">Strong</option>
            </select>
          </div>
        </Card>

        {/* Accurate Integration */}
        <AccurateIntegration />

        {/* Superadmin Only - Application Settings */}
        {isSuperAdmin && (
          <>
            {/* Quick Access to User Management */}
            <Card className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
                      <Shield size={18} />
                    </span>
                    <span>Manajemen Superadmin</span>
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">Kelola pengguna dan konfigurasi sistem.</p>
                </div>
                <button
                  onClick={() => navigate('/users')}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-gradient-to-r from-red-500 to-rose-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-red-500/25 hover:from-red-600 hover:to-rose-600"
                >
                  <Users size={18} />
                  Kelola Pengguna
                </button>
              </div>
            </Card>

            {/* Application Configuration */}
            <Card className="p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
                  <Settings className="text-white" size={18} />
                </span>
                <span>Konfigurasi Aplikasi</span>
              </h2>
              <form onSubmit={handleAppSettingsSubmit} className="space-y-6">
                {/* App Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Aplikasi
                  </label>
                  <input
                    type="text"
                    value={appSettings.appName}
                    onChange={(e) => setAppSettings({ ...appSettings, appName: e.target.value })}
                    className="input focus:ring-2 focus:ring-red-400/30"
                    required
                  />
                </div>

                {/* Toggle Settings */}
                <div className="space-y-4">
                  {/* Maintenance Mode */}
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-white/60 bg-white/45 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Database className="text-slate-700" size={20} />
                      <div>
                        <p className="font-medium text-slate-900">Mode Maintenance</p>
                        <p className="text-sm text-slate-600">Nonaktifkan akses sementara untuk maintenance</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={appSettings.maintenanceMode}
                        onChange={(e) => setAppSettings({ ...appSettings, maintenanceMode: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="h-6 w-11 rounded-full bg-gray-200 peer peer-checked:bg-red-500 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-200 peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-['']"></div>
                    </label>
                  </div>

                  {/* Allow Registration */}
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-white/60 bg-white/45 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Users className="text-slate-700" size={20} />
                      <div>
                        <p className="font-medium text-slate-900">Izinkan Registrasi</p>
                        <p className="text-sm text-slate-600">Pengguna baru dapat mendaftar sendiri</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={appSettings.allowRegistration}
                        onChange={(e) => setAppSettings({ ...appSettings, allowRegistration: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="h-6 w-11 rounded-full bg-gray-200 peer peer-checked:bg-red-500 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-200 peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-['']"></div>
                    </label>
                  </div>

                  {/* Email Notifications */}
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-white/60 bg-white/45 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Mail className="text-slate-700" size={20} />
                      <div>
                        <p className="font-medium text-slate-900">Notifikasi Email</p>
                        <p className="text-sm text-slate-600">Kirim notifikasi penting via email</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={appSettings.emailNotifications}
                        onChange={(e) => setAppSettings({ ...appSettings, emailNotifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="h-6 w-11 rounded-full bg-gray-200 peer peer-checked:bg-red-500 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-200 peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-['']"></div>
                    </label>
                  </div>

                  {/* Auto Backup */}
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-white/60 bg-white/45 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Database className="text-slate-700" size={20} />
                      <div>
                        <p className="font-medium text-slate-900">Backup Otomatis</p>
                        <p className="text-sm text-slate-600">Backup database secara otomatis setiap hari</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={appSettings.autoBackup}
                        onChange={(e) => setAppSettings({ ...appSettings, autoBackup: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="h-6 w-11 rounded-full bg-gray-200 peer peer-checked:bg-red-500 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-200 peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-['']"></div>
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                >
                  <Save className="h-4 w-4" />
                  <span>Simpan Konfigurasi</span>
                </Button>
              </form>
            </Card>
          </>
        )}

        {/* Profile Settings */}
        <Card className="p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Users className="text-white" size={18} />
            </span>
            <span>Informasi Profil</span>
          </h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama
              </label>
              <input
                type="text"
                value={profile.nama}
                onChange={(e) => setProfile({ ...profile, nama: e.target.value })}
                className="input focus:ring-2 focus:ring-red-400/30"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="input focus:ring-2 focus:ring-red-400/30"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <input
                type="text"
                value={user?.role || ''}
                className="input bg-gray-50"
                disabled
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
            >
              <Save className="h-4 w-4" />
              <span>Simpan Perubahan</span>
            </Button>
          </form>
        </Card>

        {/* Change Password */}
        <Card className="p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Key className="text-white" size={18} />
            </span>
            <span>Ubah Kata Sandi</span>
          </h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kata Sandi Saat Ini
              </label>
              <input
                type="password"
                value={password.oldPassword}
                onChange={(e) => setPassword({ ...password, oldPassword: e.target.value })}
                className="input focus:ring-2 focus:ring-red-400/30"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kata Sandi Baru
              </label>
              <input
                type="password"
                value={password.newPassword}
                onChange={(e) => setPassword({ ...password, newPassword: e.target.value })}
                className="input focus:ring-2 focus:ring-red-400/30"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Konfirmasi Kata Sandi Baru
              </label>
              <input
                type="password"
                value={password.confirmPassword}
                onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })}
                className="input focus:ring-2 focus:ring-red-400/30"
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
            >
              <Key className="h-4 w-4" />
              <span>Perbarui Kata Sandi</span>
            </Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default SettingsPage
