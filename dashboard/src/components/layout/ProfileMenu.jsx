import { useState, useRef, useEffect } from 'react'
import { User, LogOut, Settings as SettingsIcon, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Avatar from '../ui/Avatar.jsx'

export default function ProfileMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Avatar name="Admin User" size="sm" status="online" />
        <div className="hidden sm:block text-right">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">المدير</p>
          <p className="text-[10px] text-slate-400 leading-tight">admin@eco-ia.com</p>
        </div>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 animate-scale-in origin-top-left overflow-hidden">
          <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-l from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
            <div className="flex items-center gap-2">
              <Avatar name="Admin User" size="md" status="online" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">المدير</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">admin@eco-ia.com</p>
              </div>
            </div>
          </div>
          <div className="p-1.5">
            <button
              onClick={() => { setOpen(false); navigate('/settings') }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>الملف الشخصي</span>
            </button>
            <button
              onClick={() => { setOpen(false); navigate('/settings') }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>الإعدادات</span>
            </button>
            <div className="my-1 h-px bg-slate-100 dark:bg-slate-700"></div>
            <button
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
