import { useState, useRef, useEffect } from 'react'
import { Bell, Check, X } from 'lucide-react'

const mockNotifications = [
  { id: 1, type: 'order',     title: 'طلب جديد #4521',           desc: 'محمد من وهران - 4500 دج', time: 'قبل 2 دقيقة',  read: false, color: 'emerald' },
  { id: 2, type: 'message',   title: 'رسالة جديدة من أحمد',       desc: 'هل المنتج متوفر بالحجم الكبير؟', time: 'قبل 5 دقائق', read: false, color: 'blue' },
  { id: 3, type: 'order',     title: 'تم شحن طلب #4518',         desc: 'yalidine - 1234567', time: 'قبل 15 دقيقة', read: true,  color: 'amber' },
  { id: 4, type: 'system',    title: 'تم تحديث البوت لـ GPT-4o',  desc: 'تم التحديث التلقائي', time: 'قبل ساعة',    read: true,  color: 'violet' },
]

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState(mockNotifications)
  const ref = useRef(null)
  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = () => setNotifications(ns => ns.map(n => ({ ...n, read: true })))

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        title="الإشعارات"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 animate-scale-in origin-top-left">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">الإشعارات</h3>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[11px] text-blue-600 hover:underline font-semibold">
                تحديد الكل كمقروء
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">لا توجد إشعارات</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-3 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    n.color === 'emerald' ? 'bg-emerald-500' :
                    n.color === 'blue' ? 'bg-blue-500' :
                    n.color === 'amber' ? 'bg-amber-500' : 'bg-violet-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{n.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{n.desc}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{n.time}</p>
                  </div>
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></span>}
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t border-slate-100 dark:border-slate-700 text-center">
            <button className="text-[11px] font-semibold text-blue-600 hover:underline">عرض كل الإشعارات</button>
          </div>
        </div>
      )}
    </div>
  )
}
