import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, LayoutDashboard, MessageSquare, ShoppingCart, Package,
  BarChart3, Settings, ArrowLeft, ArrowRight, Hash, FileText
} from 'lucide-react'

const commands = [
  { id: 'nav-dashboard', type: 'page',  label: 'لوحة التحكم',     to: '/dashboard', icon: LayoutDashboard, group: 'التنقل' },
  { id: 'nav-inbox',     type: 'page',  label: 'الرسائل',         to: '/inbox',     icon: MessageSquare,  group: 'التنقل' },
  { id: 'nav-orders',    type: 'page',  label: 'الطلبات',         to: '/orders',    icon: ShoppingCart,   group: 'التنقل' },
  { id: 'nav-products',  type: 'page',  label: 'المنتجات',        to: '/products',  icon: Package,        group: 'التنقل' },
  { id: 'nav-tokens',    type: 'page',  label: 'استهلاك AI',      to: '/tokens',    icon: BarChart3,      group: 'التنقل' },
  { id: 'nav-settings',  type: 'page',  label: 'الإعدادات',       to: '/settings',  icon: Settings,       group: 'التنقل' },
  { id: 'set-wa',        type: 'setting', label: 'إعدادات واتساب',     to: '/settings?tab=whatsapp', icon: Hash,         group: 'الإعدادات' },
  { id: 'set-meta',      type: 'setting', label: 'فيسبوك وإنستغرام',   to: '/settings?tab=meta',     icon: Hash,         group: 'الإعدادات' },
  { id: 'set-ai',        type: 'setting', label: 'مفاتيح API',         to: '/settings?tab=ai_keys',  icon: Hash,         group: 'الإعدادات' },
  { id: 'set-channels',  type: 'setting', label: 'الردود التلقائية',   to: '/settings?tab=channels', icon: Hash,         group: 'الإعدادات' },
  { id: 'set-shipping',  type: 'setting', label: 'الشحن والتوصيل',     to: '/settings?tab=shipping', icon: Hash,         group: 'الإعدادات' },
  { id: 'set-budget',    type: 'setting', label: 'الميزانية والأمان',   to: '/settings?tab=budget',   icon: Hash,         group: 'الإعدادات' },
  { id: 'act-report',    type: 'action', label: 'إنشاء تقرير',        action: () => alert('سيتم إنشاء تقرير'), icon: FileText, group: 'الإجراءات' },
]

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    if (!query) return commands
    const q = query.toLowerCase()
    return commands.filter(c => c.label.toLowerCase().includes(q) || c.group.includes(q))
  }, [query])

  useEffect(() => { setActiveIdx(0) }, [query, open])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const run = (cmd) => {
    onClose()
    if (cmd.action) cmd.action()
    else navigate(cmd.to)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)); return }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); return }
    if (e.key === 'Enter')     { e.preventDefault(); if (filtered[activeIdx]) run(filtered[activeIdx]) }
  }

  if (!open) return null

  const groups = {}
  filtered.forEach((c, i) => {
    if (!groups[c.group]) groups[c.group] = []
    groups[c.group].push({ ...c, _idx: i })
  })

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-scale-in"
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="ابحث عن صفحة، إعداد، أو إجراء..."
            className="flex-1 bg-transparent outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">لا توجد نتائج لـ "{query}"</div>
          ) : (
            Object.entries(groups).map(([group, items]) => (
              <div key={group} className="mb-1">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 py-1.5">{group}</p>
                {items.map(item => {
                  const Icon = item.icon
                  const active = item._idx === activeIdx
                  return (
                    <button
                      key={item.id}
                      onClick={() => run(item)}
                      onMouseEnter={() => setActiveIdx(item._idx)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                        active ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="font-semibold">{item.label}</span>
                      {active && <ArrowLeft className="w-3 h-3 mr-auto text-slate-400" />}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-[10px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="px-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">↑↓</kbd> للتنقل</span>
            <span className="flex items-center gap-1"><kbd className="px-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">↵</kbd> للاختيار</span>
          </div>
          <span>eco-ia</span>
        </div>
      </div>
    </div>
  )
}
