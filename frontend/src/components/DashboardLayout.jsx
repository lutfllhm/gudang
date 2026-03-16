import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Calendar,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown
} from 'lucide-react'
import { Menu as HeadlessMenu } from '@headlessui/react'
import { getInitials } from '../utils/helpers'

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  const openSidebar = () => {
    setSidebarOpen(true)
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Items', href: '/items', icon: Package },
    { name: 'Sales Orders', href: '/sales-orders', icon: ShoppingCart },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Pengguna', href: '/users', icon: Users, adminOnly: true },
    { name: 'Pengaturan', href: '/settings', icon: Settings }
  ]

  const filteredNavigation = navigation.filter(item => {
    if (item.adminOnly && user?.role !== 'superadmin' && user?.role !== 'admin') {
      return false
    }
    return true
  })

  const isActive = (href) => location.pathname === href

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100 bg-gradient-to-r from-red-50 to-purple-50">
            <div className="flex items-center gap-3">
              <Logo variant="default" size="md" className="rounded-xl shadow-lg hover:scale-110 transition-transform" />
              <div>
                <h1 className="text-xl font-bold text-gradient-brand">iware</h1>
                <span className="text-xs text-gray-500 font-medium">Warehouse System</span>
              </div>
            </div>
            <button
              onClick={closeSidebar}
              className="lg:hidden text-gray-500 hover:text-gray-700 hover:rotate-90 transition-all"
              aria-label="Close sidebar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                item.name === 'Schedule' ? (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      window.open(item.href, '_blank')
                      closeSidebar()
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                      active
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg scale-105'
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-purple-50 hover:scale-105'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? '' : 'group-hover:scale-110 transition-transform'}`} />
                    <span className="font-semibold">{item.name}</span>
                  </button>
                ) : (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                      active
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg scale-105'
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-purple-50 hover:scale-105'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? '' : 'group-hover:scale-110 transition-transform'}`} />
                    <span className="font-semibold">{item.name}</span>
                  </Link>
                )
              )
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-gray-50">
            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border border-gray-100">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                {getInitials(user?.nama)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {user?.nama}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={openSidebar}
              className="lg:hidden text-gray-500 hover:text-gray-700 hover:scale-110 transition-all"
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1" />

            {/* User menu */}
            <HeadlessMenu as="div" className="relative">
              <HeadlessMenu.Button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-all hover:scale-105">
                <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                  {getInitials(user?.nama)}
                </div>
                <span className="hidden md:block text-sm font-bold text-gray-700">{user?.nama}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </HeadlessMenu.Button>

              <HeadlessMenu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 focus:outline-none">
                <HeadlessMenu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => navigate('/settings')}
                      className={`${
                        active ? 'bg-gradient-to-r from-red-50 to-purple-50' : ''
                      } flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all`}
                    >
                      <Settings className="w-4 h-4" />
                      Pengaturan
                    </button>
                  )}
                </HeadlessMenu.Item>
                <HeadlessMenu.Item>
                  {({ active }) => (
                    <button
                      onClick={logout}
                      className={`${
                        active ? 'bg-red-50' : ''
                      } flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-red-600 transition-all`}
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar
                    </button>
                  )}
                </HeadlessMenu.Item>
              </HeadlessMenu.Items>
            </HeadlessMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 2xl:p-10">{children}</main>
      </div>
    </div>
  )
}

export default DashboardLayout
