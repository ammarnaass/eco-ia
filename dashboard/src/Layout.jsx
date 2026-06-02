import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import { api } from './api.js'

export default function Layout() {
  const [brand, setBrand] = useState({ logo: '', name: '' })

  useEffect(() => {
    let mounted = true
    api.getConfig()
      .then(cfg => {
        if (!mounted) return
        setBrand({
          logo: cfg.BRAND_LOGO || '',
          name: cfg.BRAND_NAME || '',
        })
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar brand={brand} />
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
