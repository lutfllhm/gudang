import { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import usePageTitle from '../hooks/usePageTitle'
import AccurateIntegration from '../components/AccurateIntegration'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
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
      <div className="space-y-6 max-w-4xl">
        <PageHeader
          title="Pengaturan"
          description="Kelola pengaturan akun dan integrasi."
        />

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
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
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
                    className="input focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Toggle Settings */}
                <div className="space-y-4">
                  {/* Maintenance Mode */}
                  <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Allow Registration */}
                  <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Email Notifications */}
                  <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Auto Backup */}
                  <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  <span>Simpan Konfigurasi</span>
                </button>
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
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              <span>Simpan Perubahan</span>
            </button>
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
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
            >
              <Key className="h-4 w-4" />
              <span>Perbarui Kata Sandi</span>
            </button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default SettingsPage
