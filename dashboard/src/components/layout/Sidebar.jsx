import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, ShoppingCart, Package, BarChart3,
  Settings, Bot, Search, ChevronLeft, Sparkles, Inbox
} from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext.jsx'
import { channelConfig, gradients } from '../../lib/design-tokens.js'

const groups = [
  {
    title: 'الرئيسية',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
    ],
  },
  {
    title: 'المحادثات',
    items: [
      { to: '/inbox', icon: Inbox, label: 'الرسائل', badge: 3, badgeColor: 'emerald' },
    ],
  },
  {
    title: 'المتجر',
    items: [
      { to: '/orders', icon: ShoppingCart, label: 'الطلبات', badge: 5, badgeColor: 'amber' },
      { to: '/products', icon: Package, label: 'المنتجات' },
    ],
  },
  {
    title: 'التحليلات',
    items: [
      { to: '/tokens', icon: BarChart3, label: 'استهلاك AI' },
    ],
  },
  {
    title: 'النظام',
    items: [
      { to: '/settings', icon: Settings, label: 'الإعدادات' },
    ],
  },
]

export default function Sidebar({ collapsed, setCollapsed, onMobileClose }) {
  const { theme } = useTheme()
  const location = useLocation()
  const [hoveredItem, setHoveredItem] = useState(null)

  return (
    <aside
      className={`
        hidden lg:flex flex-col h-full
        bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl
        border-l border-slate-200/60 dark:border-slate-800/60
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-20' : 'w-64'}
        relative z-30
      `}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className={`w-10 h-10 rounded-xl ${gradients.brand} flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0`}>
            <Bot className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-tight whitespace-nowrap">eco-ia</h1>
              <p className="text-[10px] text-slate-400 leading-tight whitespace-nowrap">CRM الذكي</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            title="طي القائمة"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="absolute -left-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-slate-500 hover:text-blue-600 z-50"
        >
          <ChevronLeft className="w-3 h-3 rotate-180" />
        </button>
      )}

      {/* Search shortcut */}
      {!collapsed && (
        <div className="p-3">
          <div className="relative group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="بحث سريع... (⌘K)"
              className="w-full text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-lg pr-9 pl-12 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
            <kbd className="absolute left-2 top-1/2 -translate-y-1/2 hidden group-hover:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">⌘K</kbd>
          </div>
        </div>
      )}

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-4">
        {groups.map((group, gi) => (
          <div key={gi}>
            {!collapsed && (
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-1.5">
                {group.title}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => {
                const Icon = item.icon
                const isActive = location.pathname === item.to
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onMobileClose}
                    onMouseEnter={() => setHoveredItem(item.to)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`
                      group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                      text-sm font-semibold transition-all duration-200
                      ${isActive
                        ? 'bg-gradient-to-l from-blue-500/10 to-indigo-500/10 text-blue-700 dark:text-blue-400 border-r-2 border-blue-500'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                      }
                      ${collapsed ? 'justify-center' : ''}
                    `}
                    title={collapsed ? item.label : ''}
                  >
                    {isActive && (
                      <span className="absolute inset-0 bg-gradient-to-l from-blue-500/5 to-transparent rounded-xl" />
                    )}
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''} transition-transform group-hover:scale-110`} />
                    {!collapsed && <span className="relative truncate">{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span className={`mr-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-${item.badgeColor}-100 text-${item.badgeColor}-700 dark:bg-${item.badgeColor}-900/30 dark:text-${item.badgeColor}-300`}>
                        {item.badge}
                      </span>
                    )}
                    {collapsed && item.badge && (
                      <span className="absolute top-1 left-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900"></span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Upgrade card */}
      {!collapsed && (
        <div className="m-3 p-4 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white relative overflow-hidden">
          <div className="absolute -top-8 -left-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <Sparkles className="w-5 h-5 mb-2 text-amber-300" />
            <h3 className="text-xs font-bold leading-snug mb-1">انتقل لـ Pro</h3>
            <p className="text-[10px] text-blue-100 leading-snug mb-2">احصل على نماذج ذكاء اصطناعي غير محدودة</p>
            <button className="w-full text-[10px] font-bold bg-white text-blue-700 rounded-lg py-1.5 hover:bg-blue-50 transition-colors">
              ترقية الآن
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-200/60 dark:border-slate-800/60 text-[10px] text-slate-400 text-center">
        {!collapsed ? 'eco-ia v1.0 • 2026' : 'v1.0'}
      </div>
    </aside>
  )
}
