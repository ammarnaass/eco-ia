import { CheckCircle, AlertCircle } from 'lucide-react'

export default function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl text-white transition-all duration-300 transform ${toast ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-10 opacity-0 scale-95 pointer-events-none'} ${toast.type === 'success' ? 'bg-emerald-600 border border-emerald-500/30' : 'bg-red-500 border border-red-400/30'}`}>
      {toast.type === 'success' ? <CheckCircle className="w-5 h-5 animate-bounce" /> : <AlertCircle className="w-5 h-5 animate-pulse" />}
      <span className="text-sm font-semibold">{toast.message}</span>
    </div>
  )
}
