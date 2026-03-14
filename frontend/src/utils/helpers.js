import { format, formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

/**
 * Format currency to IDR
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Format number with thousand separator
 */
export const formatNumber = (number) => {
  return new Intl.NumberFormat('id-ID').format(number)
}

/**
 * Format date
 */
export const formatDate = (date, formatStr = 'dd MMM yyyy') => {
  if (!date) return '-'
  return format(new Date(date), formatStr, { locale: id })
}

/**
 * Format datetime
 */
export const formatDateTime = (date) => {
  if (!date) return '-'
  return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: id })
}

/**
 * Format relative time
 */
export const formatRelativeTime = (date) => {
  if (!date) return '-'
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: id })
}

/**
 * Get status badge color
 */
export const getStatusColor = (status) => {
  const colors = {
    aktif: 'success',
    active: 'success',
    completed: 'success',
    selesai: 'success',
    terproses: 'success',
    nonaktif: 'danger',
    inactive: 'danger',
    pending: 'warning',
    dipesan: 'warning',
    menunggu: 'warning',
    'menunggu proses': 'warning',
    proses: 'warning',
    diproses: 'info',
    processing: 'info',
    'sebagian terproses': 'info',
    cancelled: 'danger',
    batal: 'danger'
  }
  return colors[status?.toLowerCase()] || 'info'
}

/**
 * Truncate text
 */
export const truncate = (text, length = 50) => {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

/**
 * Download file
 */
export const downloadFile = (data, filename, type = 'text/csv') => {
  const blob = new Blob([data], { type })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}
