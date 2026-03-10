import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const savedUser = localStorage.getItem('user')

      console.log('[AuthContext] Checking auth...', { hasToken: !!token, hasUser: !!savedUser })

      if (token && savedUser) {
        setUser(JSON.parse(savedUser))
        
        // Verify token is still valid
        try {
          const response = await api.get('/auth/profile')
          console.log('[AuthContext] Token verified, user:', response.data.data)
          setUser(response.data.data)
        } catch (error) {
          console.warn('[AuthContext] Token invalid, logging out:', error.message)
          // Token invalid, clear auth
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          setUser(null)
        }
      }
    } catch (error) {
      console.error('[AuthContext] Auth check failed:', error)
    } finally {
      console.log('[AuthContext] Auth check complete, loading set to false')
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { user, accessToken, refreshToken } = response.data.data

      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(user))

      setUser(user)
      toast.success('Login berhasil!')

      return { success: true, user }
    } catch (error) {
      const message = error.response?.data?.message || 'Login gagal'
      toast.error(message)
      return { success: false, message }
    }
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
    toast.success('Logout berhasil')
    window.location.href = '/login'
  }

  const updateProfile = async (data) => {
    try {
      const response = await api.put('/auth/profile', data)
      const updatedUser = response.data.data
      
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      toast.success('Profile berhasil diupdate')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Update profile gagal'
      toast.error(message)
      return { success: false, message }
    }
  }

  const changePassword = async (oldPassword, newPassword) => {
    try {
      await api.post('/auth/change-password', { oldPassword, newPassword })
      toast.success('Password berhasil diubah')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Ubah password gagal'
      toast.error(message)
      return { success: false, message }
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'superadmin',
    isAdmin: user?.role === 'admin' || user?.role === 'superadmin'
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
