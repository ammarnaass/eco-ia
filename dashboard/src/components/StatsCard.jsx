import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatsCard({ title, value, change, icon: Icon, color }) {
  const positive = change >= 0
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-default group">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1 group-hover:text-gray-700 transition-colors">{title}</p>
        <h3 className="text-3xl font-bold text-gray-800 tracking-tight">{value}</h3>
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${positive ? 'text-emerald-600' : 'text-rose-500'}`}>
          {positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>{Math.abs(change)}% مقارنة بالبارحة</span>
        </div>
      </div>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md bg-gradient-to-br ${color.replace('bg-', 'from-').replace('500', '400')} to-${color.split('-')[1]}-600 transition-transform duration-300 group-hover:scale-110`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
    </div>
  )
}
