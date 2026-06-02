import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, ShoppingCart, Package,
  BarChart3, Settings, Bot
} from 'lucide-react'

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'الرئيسية' },
  { to: '/inbox', icon: MessageSquare, label: 'المحادثات' },
  { to: '/orders', icon: ShoppingCart, label: 'الطلبات' },
  { to: '/products', icon: Package, label: 'المنتجات' },
  { to: '/tokens', icon: BarChart3, label: 'التوكن' },
  { to: '/settings', icon: Settings, label: 'الإعدادات' },
]

export default function Sidebar({ brand = {} }) {
  const hasLogo = Boolean(brand.logo)
  const hasName = Boolean(brand.name)
  return (
    <aside className="w-64 bg-white border-l border-gray-200 flex flex-col">
      <div className="flex flex-col items-center justify-center gap-2 p-5 border-b border-gray-200">
        {hasLogo ? (
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center">
            <img
              src={brand.logo}
              alt="Brand"
              className="w-full h-full object-contain"
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
          </div>
        ) : (
          <Bot className="w-7 h-7 text-blue-600" />
        )}
        <span className="text-base font-bold text-gray-800 text-center leading-tight">
          {hasName ? brand.name : 'CRM الذكي'}
        </span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200 text-xs text-gray-400 text-center">
        CRM v1.0
      </div>
    </aside>
  )
}
