import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './styles/tv-display.css'

const GLASS_INTENSITY_KEY = 'ui.glassIntensity'
const allowedIntensities = new Set(['soft', 'medium', 'strong'])

try {
  const savedIntensity = localStorage.getItem(GLASS_INTENSITY_KEY) || 'medium'
  const intensity = allowedIntensities.has(savedIntensity) ? savedIntensity : 'medium'
  document.documentElement.setAttribute('data-glass-intensity', intensity)
} catch (_) {
  document.documentElement.setAttribute('data-glass-intensity', 'medium')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
