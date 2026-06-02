import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { api } from '../api.js'

const COLORS = ['#6366F1', '#4F46E5', '#34D399', '#10B981', '#F59E0B', '#EF4444']

export default function TokenAnalytics() {
  const [modelData, setModelData] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getTokensByModel(),
      api.getTokenSummary(),
    ]).then(([models, summ]) => {
      setModelData(models.map((m, i) => ({
        name: m.model,
        tokens: parseFloat((m.tokens / 1_000_000).toFixed(1)),
        cost: 0,
        color: COLORS[i % COLORS.length],
      })))
      setSummary(summ)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const channelTokenData = [
    { name: 'واتساب', tokens: 9.7, cost: 18.54, color: '#25D366' },
    { name: 'انستغرام', tokens: 8.5, cost: 16.22, color: '#E4405F' },
    { name: 'فيسبوك', tokens: 6.1, cost: 11.59, color: '#1877F2' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">إحصائيات التوكن</h1>
        <select className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white">
          <option>هذا الشهر</option>
          <option>هذا الأسبوع</option>
          <option>اليوم</option>
        </select>
      </div>

      {loading && <p className="text-sm text-gray-400 mb-4">جاري التحميل...</p>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80">إجمالي التوكن</p>
          <p className="text-2xl font-bold mt-1">{summary ? (summary.total_tokens / 1_000_000).toFixed(1) + 'M' : '—'}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80">التكلفة الكلية</p>
          <p className="text-2xl font-bold mt-1">${summary?.total_cost?.toFixed(2) || '—'}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80">إجمالي الرسائل</p>
          <p className="text-2xl font-bold mt-1">{summary?.count || '—'}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80">أعلى نموذج</p>
          <p className="text-2xl font-bold mt-1 truncate">{modelData[0]?.name?.split('/')[1] || '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">التوكن حسب النموذج (M)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={modelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="tokens" radius={[4, 4, 0, 0]}>
                {modelData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">التوكن حسب القناة (M)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={channelTokenData} dataKey="tokens" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {channelTokenData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">تفصيل حسب النموذج</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-right">
                <th className="pb-3 font-medium">النموذج</th>
                <th className="pb-3 font-medium">التوكن</th>
                <th className="pb-3 font-medium">النسبة</th>
              </tr>
            </thead>
            <tbody>
              {modelData.map((m) => (
                <tr key={m.name} className="border-b border-gray-100">
                  <td className="py-3 text-gray-800 font-medium">{m.name}</td>
                  <td className="py-3 text-gray-800">{m.tokens}M</td>
                  <td className="py-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="h-2 rounded-full" style={{ width: `${(m.tokens / Math.max(...modelData.map(x => x.tokens))) * 100}%`, backgroundColor: m.color }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
