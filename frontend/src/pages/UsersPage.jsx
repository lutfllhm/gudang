import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import usePageTitle from '../hooks/usePageTitle'
import api from '../utils/api'
import { formatDate, getStatusColor } from '../utils/helpers'
import { Users, UserPlus, X, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const UsersPage = () => {
  usePageTitle('Pengguna')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    role: 'user'
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/users')
      const res = response?.data

      // Backend returns { success, message, data: [...users], pagination }
      if (res && res.success !== false) {
        const list = Array.isArray(res.data) ? res.data : []
        setUsers(list)
      } else {
        setUsers([])
      }
    } catch (err) {
      const status = err.response?.status
      const serverMessage = err.response?.data?.message

      if (status === 401) {
        setError({
          type: 'auth',
          message: 'Sesi Anda telah berakhir. Silakan login kembali untuk melanjutkan.'
        })
        toast.error('Sesi Anda telah berakhir')
      } else if (status === 403) {
        setError({
          type: 'permission',
          message: serverMessage || 'Anda tidak memiliki akses untuk melihat data pengguna. Hanya admin dan superadmin yang dapat mengakses halaman ini.'
        })
        toast.error(serverMessage || 'Akses ditolak')
      } else if (status !== 429) {
        const message = serverMessage || (err.code === 'ERR_NETWORK' ? 'Tidak dapat terhubung ke server. Periksa koneksi atau pastikan backend berjalan.' : 'Gagal memuat data pengguna. Silakan coba lagi.')
        setError({
          type: 'general',
          message
        })
        toast.error(serverMessage || 'Gagal memuat data pengguna')
      }
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.nama || !formData.email || !formData.password) {
      toast.error('Semua field harus diisi')
      return
    }

    try {
      setSubmitting(true)
      const response = await api.post('/users', formData)
      
      if (response.data.success) {
        toast.success('User berhasil ditambahkan')
        setShowModal(false)
        setFormData({ nama: '', email: '', password: '', role: 'user' })
        fetchUsers()
      }
    } catch (error) {
      console.error('Failed to add user:', error)
      toast.error(error.response?.data?.message || 'Gagal menambahkan user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Pengguna"
          description="Kelola pengguna sistem."
          actions={
            <Button
              onClick={() => setShowModal(true)}
            >
              <UserPlus className="h-4 w-4" />
              <span>Tambah Pengguna</span>
            </Button>
          }
        />

        {/* Users Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="p-5">
              <EmptyState
                icon={Users}
                title={
                  error.type === 'auth'
                    ? 'Sesi berakhir'
                    : error.type === 'permission'
                      ? 'Akses ditolak'
                      : 'Terjadi kesalahan'
                }
                description={error.message}
              />
              <div className="mt-4 flex justify-center gap-2">
                {error.type === 'auth' ? (
                  <Button
                    onClick={() => window.location.href = '/login'}
                  >
                    Login ulang
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={fetchUsers}
                  >
                    Coba lagi
                  </Button>
                )}
              </div>
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Belum ada pengguna"
              description='Klik tombol "Tambah Pengguna" untuk menambahkan pengguna baru.'
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/50 bg-white/35 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Nama
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Login Terakhir
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/50 bg-white/20">
                  {users.map((user) => (
                    <tr 
                      key={user.id} 
                      className="hover:bg-white/40"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                            {user.nama.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-sm font-semibold text-slate-900">{user.nama}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{user.email}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          user.role === 'superadmin' 
                            ? 'bg-red-50 text-red-700' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium badge-${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {formatDate(user.last_login) || 'Belum pernah login'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-2xl backdrop-blur-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/60 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">Tambah User Baru</h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              {/* Nama */}
              <div>
                <label htmlFor="nama" className="mb-2 block text-sm font-medium text-slate-700">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  id="nama"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/60 bg-white/65 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-400/25"
                  placeholder="Masukkan nama lengkap"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/60 bg-white/65 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-400/25"
                  placeholder="user@example.com"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/60 bg-white/65 px-3 py-2.5 pr-11 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-400/25"
                    placeholder="Minimal 6 karakter"
                    required
                    disabled={submitting}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    disabled={submitting}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="mb-2 block text-sm font-medium text-slate-700">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/60 bg-white/65 px-3 py-2.5 text-sm text-slate-900 shadow-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-400/25"
                  required
                  disabled={submitting}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default UsersPage
