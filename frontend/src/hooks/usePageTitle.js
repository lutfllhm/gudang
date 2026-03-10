import { useEffect } from 'react'

/**
 * Custom hook untuk mengatur dynamic page title
 * @param {string} title - Judul halaman
 */
export const usePageTitle = (title) => {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title ? `${title} | iware` : 'iware | Warehouse Management System'
    
    return () => {
      document.title = prevTitle
    }
  }, [title])
}

export default usePageTitle
