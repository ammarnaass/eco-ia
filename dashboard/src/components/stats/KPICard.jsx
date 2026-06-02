import { TrendingUp, TrendingDown } from 'lucide-react'
import Sparkline from './Sparkline.jsx'
import { gradients } from '../../lib/design-tokens.js'

export default function KPICard({ title, value, change = 0, changeLabel = 'مقارنة بالفترة السابقة', icon: Icon, gradient = 'brand', sparkline, color = '#3b82f6', delay = 0 }) {
  const positive = change >= 0
  return (
    <div
      className="group relative overflow-hidden bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 animate-slide-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Decorative gradient blob */}
      <div className={`absolute -top-12 -left-12 w-32 h-32 rounded-full opacity-20 group-hover:opacity-30 blur-2xl transition-opacity duration-500 ${gradients[gradient]}`}></div>

      <div className="relative flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1 tracking-tight animate-count-up">{value}</h3>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md ${gradients[gradient]} text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className={`flex items-center gap-1 text-xs font-semibold ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
          <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${positive ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
            {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          </span>
          <span>{Math.abs(change)}%</span>
          <span className="text-slate-400 dark:text-slate-500 font-normal hidden sm:inline">{changeLabel}</span>
        </div>
        {sparkline && (
          <div className="w-20 h-8 opacity-80 group-hover:opacity-100 transition-opacity">
            <Sparkline data={sparkline} color={color} />
          </div>
        )}
      </div>
    </div>
  )
}
