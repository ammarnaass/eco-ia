import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line
} from 'recharts'
import { Coins, DollarSign, MessageSquare, TrendingUp, Loader2, Download, Calendar } from 'lucide-react'
import { api } from '../api.js'
import { gradients, channelConfig } from '../lib/design-tokens.js'
import EmptyState from '../components/ui/EmptyState.jsx'
import { SkeletonCard } from '../components/ui/Skeleton.jsx'

const COLORS = ['#6366F1', '#4F46E5', '#34D399', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function TokenAnalytics() {
  const [modelData, setModelData] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7d')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.getTokensByModel().catch(() => []),
      api.getTokenSummary().catch(() => null),
    ]).then(([models, summ]) => {
      const totalTokens = models.reduce((sum, m) => sum + (m.tokens || 0), 0)
      setModelData(models.map((m, i) => ({
        name: (m.model || '').split('/').pop() || m.model,
        fullName: m.model,
        tokens: totalTokens > 0 ? parseFloat(((m.tokens || 0) / 1_000_000).toFixed(2)) : 0,
        cost: parseFloat((m.cost || 0).toFixed(2)),
        color: COLORS[i % COLORS.length],
        count: m.count || 0,
      })))
      setSummary(summ)
    }).finally(() => setLoading(false))
  }, [dateRange])

  // Mock channel data
  const channelData = useMemo(() => {
    const totals = summary?.byPlatform || {}
    const data = [
      { name: 'واتساب',   tokens: 9.7, cost: 18.54, color: channelConfig.whatsapp.hex },
      { name: 'إنستغرام', tokens: 8.5, cost: 16.22, color: channelConfig.instagram.hex },
      { name: 'فيسبوك',  tokens: 6.1, cost: 11.59, color: channelConfig.facebook.hex },
    ]
    if (Object.keys(totals).length > 0) {
      return data.map(d => ({ ...d, tokens: parseFloat((totals[d.name === 'واتساب' ? 'whatsapp' : d.name === 'إنستغرام' ? 'instagram' : 'facebook'] || 0) / 1_000_000).toFixed(2) }))
    }
    return data
  }, [summary])

  // Trend data
  const trendData = useMemo(() => {
    return [
      { day: 'الإثنين', tokens: 2.1, cost: 4.2 },
      { day: 'الثلاثاء', tokens: 2.8, cost: 5.6 },
      { day: 'الأربعاء', tokens: 3.2, cost: 6.4 },
      { day: 'الخميس', tokens: 2.5, cost: 5.0 },
      { day: 'الجمعة', tokens: 1.8, cost: 3.6 },
      { day: 'السبت', tokens: 3.5, cost: 7.0 },
      { day: 'الأحد', tokens: 4.1, cost: 8.2 },
    ]
  }, [])

  const totalCost = useMemo(() => modelData.reduce((s, m) => s + m.cost, 0), [modelData])
  const totalTokensM = useMemo(() => modelData.reduce((s, m) => s + m.tokens, 0), [modelData])
  const topModel = useMemo(() => [...modelData].sort((a, b) => b.tokens - a.tokens)[0], [modelData])

  const exportCSV = () => {
    const rows = [
      ['Model', 'Tokens (M)', 'Cost (USD)', 'Requests'],
      ...modelData.map(m => [m.fullName, m.tokens, m.cost, m.count]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `tokens-${dateRange}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">تحليلات استهلاك AI</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">مراقبة استخدام النماذج والتكاليف</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
              {[
                { id: '24h', label: '24 ساعة' },
                { id: '7d', label: '7 أيام' },
                { id: '30d', label: '30 يوم' },
                { id: 'all', label: 'الكل' },
              ].map(r => (
                <button key={r.id} onClick={() => setDateRange(r.id)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all ${dateRange === r.id ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  {r.label}
                </button>
              ))}
            </div>
            <button onClick={exportCSV} className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl px-3 py-1.5 flex items-center gap-1.5 transition-colors">
              <Download className="w-3 h-3" /> تصدير
            </button>
          </div>
        </div>
      </div>

      {/* Big numbers */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي التوكن', value: `${totalTokensM.toFixed(1)}M`, icon: Coins, gradient: 'violet' },
            { label: 'التكلفة الكلية', value: `$${totalCost.toFixed(2)}`, icon: DollarSign, gradient: 'warning' },
            { label: 'إجمالي الطلبات', value: summary?.count || '—', icon: MessageSquare, gradient: 'info' },
            { label: 'النموذج الأكثر', value: topModel?.name || '—', icon: TrendingUp, gradient: 'success' },
          ].map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className={`relative overflow-hidden rounded-2xl ${gradients[s.gradient]} text-white p-4 shadow-lg animate-slide-in`} style={{ animationDelay: `${i * 80}ms` }}>
                <div className="absolute -top-8 -left-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">{s.label}</p>
                    <p className="text-2xl font-extrabold mt-1.5 truncate">{s.value}</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">اتجاه الاستهلاك</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="g-tokens" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g-cost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-slate-500" />
              <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} className="text-slate-500" />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: 12, fontSize: 12, color: '#fff' }} />
              <Area type="monotone" dataKey="tokens" name="التوكن (M)" stroke="#8b5cf6" strokeWidth={2} fill="url(#g-tokens)" />
              <Area type="monotone" dataKey="cost" name="التكلفة ($)" stroke="#f59e0b" strokeWidth={2} fill="url(#g-cost)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Channel pie */}
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">حسب القناة</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={channelData} dataKey="tokens" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                {channelData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: 12, fontSize: 12, color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {channelData.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }}></span>
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">{c.name}</span>
                </div>
                <span className="text-slate-500 dark:text-slate-400 font-mono">{c.tokens}M • ${c.cost}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Models table */}
      <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700/50">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">تفصيل حسب النموذج</h2>
        </div>
        {modelData.length === 0 ? (
          <div className="p-8">
            <EmptyState icon={Coins} title="لا توجد بيانات" description="لم يتم تسجيل أي استخدام بعد" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/30">
                  <th className="text-right p-3 font-bold">النموذج</th>
                  <th className="text-right p-3 font-bold">التوكن</th>
                  <th className="text-right p-3 font-bold">التكلفة</th>
                  <th className="text-right p-3 font-bold">الطلبات</th>
                  <th className="text-right p-3 font-bold">النسبة</th>
                </tr>
              </thead>
              <tbody>
                {modelData.map((m, i) => {
                  const maxTokens = Math.max(...modelData.map(x => x.tokens), 1)
                  const percent = (m.tokens / maxTokens) * 100
                  return (
                    <tr key={m.name || i} className="border-t border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }}></span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{m.fullName}</span>
                        </div>
                      </td>
                      <td className="p-3 font-extrabold text-slate-800 dark:text-slate-100">{m.tokens}M</td>
                      <td className="p-3 font-bold text-amber-600 dark:text-amber-400">${m.cost}</td>
                      <td className="p-3 font-bold text-slate-600 dark:text-slate-300">{m.count}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden max-w-[120px]">
                            <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, backgroundColor: m.color }}></div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 w-8 text-left">{percent.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
