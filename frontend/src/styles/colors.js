// Professional Color System for iware
// Based on logo colors and enterprise design principles

export const colors = {
  // Primary Brand Colors (from logo - RED)
  primary: {
    50: '#fef2f2',   // Very light red
    100: '#fee2e2',  // Light red
    200: '#fecaca',  // Lighter red
    300: '#fca5a5',  // Light medium red
    400: '#f87171',  // Medium red
    500: '#ef4444',  // Base red (main brand color)
    600: '#dc2626',  // Dark red
    700: '#b91c1c',  // Darker red
    800: '#991b1b',  // Very dark red
    900: '#7f1d1d',  // Deepest red
  },

  // Secondary Colors (complementary)
  secondary: {
    50: '#f5f3ff',   // Very light purple
    100: '#ede9fe',  // Light purple
    200: '#ddd6fe',  // Lighter purple
    300: '#c4b5fd',  // Light medium purple
    400: '#a78bfa',  // Medium purple
    500: '#8b5cf6',  // Base purple
    600: '#7c3aed',  // Dark purple
    700: '#6d28d9',  // Darker purple
    800: '#5b21b6',  // Very dark purple
    900: '#4c1d95',  // Deepest purple
  },

  // Accent Colors
  accent: {
    cyan: {
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
    },
    green: {
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
    },
    orange: {
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
    }
  },

  // Neutral Colors
  neutral: {
    50: '#f8fafc',   // Almost white
    100: '#f1f5f9',  // Very light gray
    200: '#e2e8f0',  // Light gray
    300: '#cbd5e1',  // Medium light gray
    400: '#94a3b8',  // Medium gray
    500: '#64748b',  // Base gray
    600: '#475569',  // Dark gray
    700: '#334155',  // Darker gray
    800: '#1e293b',  // Very dark gray
    900: '#0f172a',  // Almost black
  },

  // Semantic Colors
  success: {
    light: '#d1fae5',
    DEFAULT: '#10b981',
    dark: '#059669',
  },
  warning: {
    light: '#fef3c7',
    DEFAULT: '#f59e0b',
    dark: '#d97706',
  },
  error: {
    light: '#fee2e2',
    DEFAULT: '#ef4444',
    dark: '#dc2626',
  },
  info: {
    light: '#fee2e2',
    DEFAULT: '#ef4444',
    dark: '#dc2626',
  }
}

// Gradient Definitions
export const gradients = {
  primary: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  secondary: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  brand: 'linear-gradient(135deg, #ef4444 0%, #8b5cf6 100%)', // Red to Purple
  neon: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)', // Cyan neon
  dark: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
}

// Shadow Definitions
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Colored shadows for brand elements
  primary: '0 10px 15px -3px rgba(239, 68, 68, 0.3), 0 4px 6px -2px rgba(239, 68, 68, 0.05)',
  secondary: '0 10px 15px -3px rgba(139, 92, 246, 0.3), 0 4px 6px -2px rgba(139, 92, 246, 0.05)',
  neon: '0 0 20px rgba(34, 211, 238, 0.5), 0 0 40px rgba(34, 211, 238, 0.3)',
}

export default { colors, gradients, shadows }
