import { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import usePageTitle from '../hooks/usePageTitle'
import AccurateIntegration from '../components/AccurateIntegration'
import { Save, Key, Users, Settings, Shield, Database, Bell, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const SettingsPage = () => {
  usePageTitle('Pengaturan')
  const { user, updateProfile, changePassword } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
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
      <div className="space-y-8 max-w-4xl animate-fade-in">
        <div className="animate-slide-in-left">
          <h1 className="text-4xl font-bold text-gradient-brand mb-2">Pengaturan</h1>
          <p className="text-gray-600 text-lg">Kelola pengaturan akun dan integrasi Anda</p>
        </div>

        {/* Accurate Integration */}
        <AccurateIntegration />

        {/* Superadmin Only - Application Settings */}
        {isSuperAdmin && (
          <>
            {/* Quick Access to User Management */}
            <div className="relative bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-500 overflow-hidden group hover-lift">
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold mb-3 flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Shield size={28} />
                    </div>
                    <span>Manajemen Superadmin</span>
                  </h2>
                  <p className="text-red-100 text-lg">Kelola pengguna dan konfigurasi sistem</p>
                </div>
                <button
                  onClick={() => navigate('/users')}
                  className="px-6 py-3 bg-white text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Users size={20} />
                  Kelola Pengguna
                </button>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -top-4 -left-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            </div>

            {/* Application Configuration */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-2xl transition-all duration-500 hover-lift">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl">
                  <Settings className="text-white" size={24} />
                </div>
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
                    className="input focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Toggle Settings */}
                <div className="space-y-4">
                  {/* Maintenance Mode */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Database className="text-gray-600" size={20} />
                      <div>
                        <p className="font-medium text-gray-900">Mode Maintenance</p>
                        <p className="text-sm text-gray-600">Nonaktifkan akses sementara untuk maintenance</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={appSettings.maintenanceMode}
                        onChange={(e) => setAppSettings({ ...appSettings, maintenanceMode: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Allow Registration */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="text-gray-600" size={20} />
                      <div>
                        <p className="font-medium text-gray-900">Izinkan Registrasi</p>
                        <p className="text-sm text-gray-600">Pengguna baru dapat mendaftar sendiri</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={appSettings.allowRegistration}
                        onChange={(e) => setAppSettings({ ...appSettings, allowRegistration: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Email Notifications */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="text-gray-600" size={20} />
                      <div>
                        <p className="font-medium text-gray-900">Notifikasi Email</p>
                        <p className="text-sm text-gray-600">Kirim notifikasi penting via email</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={appSettings.emailNotifications}
                        onChange={(e) => setAppSettings({ ...appSettings, emailNotifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Auto Backup */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Database className="text-gray-600" size={20} />
                      <div>
                        <p className="font-medium text-gray-900">Backup Otomatis</p>
                        <p className="text-sm text-gray-600">Backup database secara otomatis setiap hari</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={appSettings.autoBackup}
                        onChange={(e) => setAppSettings({ ...appSettings, autoBackup: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  <span>Simpan Konfigurasi</span>
                </button>
              </form>
            </div>
          </>
        )}

        {/* Profile Settings */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-2xl transition-all duration-500 hover-lift">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-600 to-green-700 rounded-xl">
              <Users className="text-white" size={24} />
            </div>
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
                className="input focus:ring-2 focus:ring-blue-500"
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
                className="input focus:ring-2 focus:ring-blue-500"
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
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>Simpan Perubahan</span>
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-2xl transition-all duration-500 hover-lift">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl">
              <Key className="text-white" size={24} />
            </div>
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
                className="input focus:ring-2 focus:ring-blue-500"
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
                className="input focus:ring-2 focus:ring-blue-500"
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
                className="input focus:ring-2 focus:ring-blue-500"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50"
            >
              <Key className="w-5 h-5" />
              <span>Perbarui Kata Sandi</span>
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default SettingsPage
