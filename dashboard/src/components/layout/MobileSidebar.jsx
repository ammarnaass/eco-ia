import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, ShoppingCart, Package, BarChart3,
  Settings, X
} from 'lucide-react'
import { channelConfig, gradients } from '../../lib/design-tokens.js'

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { to: '/inbox', icon: MessageSquare, label: 'الرسائل' },
  { to: '/orders', icon: ShoppingCart, label: 'الطلبات' },
  { to: '/products', icon: Package, label: 'المنتجات' },
  { to: '/tokens', icon: BarChart3, label: 'استهلاك AI' },
  { to: '/settings', icon: Settings, label: 'الإعدادات' },
]

export default function MobileSidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
        />
      )}
      <aside
        className={`
          lg:hidden fixed top-0 right-0 h-full w-72 z-50
          bg-white dark:bg-slate-900 shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-xl ${gradients.brand} flex items-center justify-center`}>
              <span className="text-white font-extrabold text-sm">e</span>
            </div>
            <h1 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">eco-ia</h1>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-l from-blue-500/10 to-indigo-500/10 text-blue-700 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
