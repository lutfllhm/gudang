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
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <Logo variant="white" size="md" className="rounded-lg" />
              <div>
                <h1 className="text-base font-semibold text-white leading-5">iware</h1>
                <span className="text-xs text-slate-400 font-medium">Warehouse System</span>
              </div>
            </div>
            <button
              onClick={closeSidebar}
              className="lg:hidden text-slate-300 hover:text-white transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-200 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </button>
                ) : (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-200 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              )
            })}
          </nav>

          {/* User info */}
          <div className="p-3 border-t border-slate-800">
            <div className="flex items-center gap-3 px-3 py-3 bg-slate-800/40 rounded-lg border border-slate-800">
              <div className="flex-shrink-0 w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center text-slate-900 font-semibold">
                {getInitials(user?.nama)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.nama}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-slate-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={openSidebar}
              className="lg:hidden text-slate-600 hover:text-slate-900 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1" />

            {/* User menu */}
            <HeadlessMenu as="div" className="relative">
              <HeadlessMenu.Button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {getInitials(user?.nama)}
                </div>
                <span className="hidden md:block text-sm font-semibold text-slate-700">{user?.nama}</span>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </HeadlessMenu.Button>

              <HeadlessMenu.Items className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1 focus:outline-none">
                <HeadlessMenu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => navigate('/settings')}
                      className={`${
                        active ? 'bg-slate-50' : ''
                      } flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-slate-700`}
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
                      } flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-600`}
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
