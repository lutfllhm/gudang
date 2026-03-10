import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import LoadingSpinner from '../components/LoadingSpinner'
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
    console.log('[UsersPage] Component mounted, fetching users...')
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('[UsersPage] Fetching users...')
      const response = await api.get('/users')
      console.log('[UsersPage] Users response:', response.data)
      
      // Response format: { success, message, data: [...users], pagination }
      if (response.data && response.data.success) {
        setUsers(response.data.data || [])
      } else {
        console.error('[UsersPage] Unexpected response structure:', response.data)
        setUsers([])
      }
    } catch (error) {
      console.error('[UsersPage] Failed to fetch users:', error)
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        setError({
          type: 'auth',
          message: 'Sesi Anda telah berakhir. Silakan login kembali untuk melanjutkan.'
        })
        toast.error('Sesi Anda telah berakhir')
      } else if (error.response?.status === 403) {
        setError({
          type: 'permission',
          message: 'Anda tidak memiliki akses untuk melihat data pengguna.'
        })
        toast.error('Akses ditolak')
      } else if (error.response?.status !== 429) {
        setError({
          type: 'general',
          message: 'Gagal memuat data pengguna. Silakan coba lagi.'
        })
        toast.error('Gagal memuat data pengguna')
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
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="animate-slide-in-left">
            <h1 className="text-4xl font-bold text-gradient-brand mb-2">Pengguna</h1>
            <p className="text-gray-600 text-lg">Kelola pengguna sistem</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all flex items-center gap-2 shadow-primary hover:shadow-xl hover:scale-105 animate-slide-in-right"
          >
            <UserPlus className="w-5 h-5" />
            <span>Tambah Pengguna</span>
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500">
          {loading ? (
            <div className="p-20">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center py-20 px-6">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
                <Users className="w-12 h-12 text-red-500" />
              </div>
              <p className="text-xl font-bold text-gray-900 mb-2">
                {error.type === 'auth' ? 'Sesi Berakhir' : error.type === 'permission' ? 'Akses Ditolak' : 'Terjadi Kesalahan'}
              </p>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">{error.message}</p>
              {error.type === 'auth' ? (
                <button
                  onClick={() => window.location.href = '/login'}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Login Ulang
                </button>
              ) : (
                <button
                  onClick={fetchUsers}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Coba Lagi
                </button>
              )}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <Users className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-xl font-bold text-gray-900 mb-2">Tidak ada pengguna ditemukan</p>
              <p className="text-gray-500 mb-4">Klik tombol "Tambah Pengguna" untuk menambahkan pengguna baru</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Nama
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Login Terakhir
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {users.map((user, idx) => (
                    <tr 
                      key={user.id} 
                      className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 group animate-fade-in"
                      style={{ animationDelay: `${idx * 0.03}s` }}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform">
                            {user.nama.charAt(0).toUpperCase()}
                          </div>
                          <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{user.nama}</div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-gray-600">{user.email}</td>
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          user.role === 'superadmin' 
                            ? 'bg-red-100 text-red-700 border border-red-300' 
                            : 'bg-blue-100 text-blue-700 border border-blue-300'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider badge-${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-gray-600">
                        {formatDate(user.last_login) || 'Belum pernah login'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-purple-50">
              <h2 className="text-2xl font-bold text-gray-900">Tambah User Baru</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors hover:rotate-90 duration-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Nama */}
              <div>
                <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  id="nama"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan nama lengkap"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@example.com"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Minimal 6 karakter"
                    required
                    disabled={submitting}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={submitting}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={submitting}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105"
                  disabled={submitting}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default UsersPage
