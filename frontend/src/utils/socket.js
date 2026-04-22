import { io } from 'socket.io-client'

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// socket.io server is hosted on the backend origin (no `/api` suffix)
const SOCKET_URL = (() => {
  const normalized = String(rawApiUrl).replace(/\/+$/, '')
  return normalized.endsWith('/api') ? normalized.slice(0, -4) : normalized
})()

export function createSocket() {
  const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
  })

  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    if (user?.id) {
      socket.emit('authenticate', { userId: user.id })
    }
  } catch (_) {
    // ignore
  }

  return socket
}

