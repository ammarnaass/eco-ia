import { useState, useEffect } from 'react'
import {
  MessageSquare, ShoppingCart, DollarSign, Bot, Sparkles, ArrowLeft,
  TrendingUp, Package, Users, Zap, Eye, Plus, ArrowUpRight, Database
} from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import KPICard from '../components/stats/KPICard.jsx'
import { api } from '../api.js'
import dataService from '../lib/dataService.js'
import { channelConfig, gradients } from '../lib/design-tokens.js'
import { SkeletonCard } from '../components/ui/Skeleton.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import Badge from '../components/ui/Badge.jsx'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('صباح الخير')
    else if (hour < 18) setGreeting('مساء الخير')
    else setGreeting('مساء النور')

    setLoading(true)
    Promise.all([
      // الإحصائيات المُجمّعة تبقى عبر Backend
      dataService.analytics.dashboard().catch(() => null),
      // الطلبات والمحادثات تأتي من Supabase مباشرة (أسرع)
      dataService.orders.list().catch(() => ({ data: [] })),
      dataService.conversations.list().catch(() => ({ data: [] })),
    ]).then(([s, oRes, cRes]) => {
      setStats(s)
      setOrders(oRes.data || [])
      setConversations(cRes.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const today = new Date()
  const todayLabel = today.toLocaleDateString('ar-DZ', { weekday: 'long', day: 'numeric', month: 'long' })

  const newMessages = conversations.filter(c => c.status === 'open').length
  const pendingOrders = orders.filter(o => o.status === 'PROCESSING' || o.status === 'PENDING').length

  const statCards = [
    { title: 'الرسائل هذا الأسبوع', value: stats ? (stats.total_messages || 0).toLocaleString() : '—', change: 12.4, icon: MessageSquare, gradient: 'info',     sparkline: [12, 18, 14, 22, 19, 28, 24], color: '#3b82f6' },
    { title: 'الطلبات الكلية',       value: orders.length.toLocaleString(), change: 8.2, icon: ShoppingCart, gradient: 'success',  sparkline: [3, 5, 4, 7, 6, 9, 8], color: '#10b981' },
    { title: 'تكلفة AI',            value: stats ? `$${(stats.total_cost || 0).toFixed(2)}` : '—', change: -3.1, icon: DollarSign,  gradient: 'warning',  sparkline: [22, 18, 25, 20, 17, 15, 12], color: '#f59e0b' },
    { title: 'التوكنز المستهلكة',   value: stats ? (stats.total_tokens || 0).toLocaleString() : '—', change: 15.7, icon: Bot,         gradient: 'violet',   sparkline: [120, 180, 150, 220, 200, 280, 250], color: '#8b5cf6' },
  ]

  const chartData = [
    { day: 'السبت',  رسائل: 180, طلبات: 12 },
    { day: 'الأحد',  رسائل: 220, طلبات: 15 },
    { day: 'الإثنين', رسائل: 190, طلبات: 10 },
    { day: 'الثلاثاء', رسائل: 250, طلبات: 18 },
    { day: 'الأربعاء', رسائل: 210, طلبات: 14 },
    { day: 'الخميس', رسائل: 280, طلبات: 20 },
    { day: 'الجمعة', رسائل: 170, طلبات: 8 },
  ]

  const channelData = [
    { name: 'واتساب',  value: stats?.byPlatform?.whatsapp  || 562, color: channelConfig.whatsapp.hex },
    { name: 'إنستغرام', value: stats?.byPlatform?.instagram || 437, color: channelConfig.instagram.hex },
    { name: 'فيسبوك',  value: stats?.byPlatform?.facebook  || 248, color: channelConfig.facebook.hex },
  ].filter(c => c.value > 0)

  const fallbackChannelData = [
    { name: 'واتساب',  value: 562, color: channelConfig.whatsapp.hex },
    { name: 'إنستغرام', value: 437, color: channelConfig.instagram.hex },
    { name: 'فيسبوك',  value: 248, color: channelConfig.facebook.hex },
  ]

  const finalChannelData = channelData.length > 0 ? channelData : fallbackChannelData

  const recentConvs = conversations.slice(0, 4)

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto">
      {/* Hero Card */}
      <div className={`relative overflow-hidden rounded-3xl ${gradients.hero} text-white p-6 lg:p-8 shadow-2xl shadow-blue-500/20 animate-slide-in`}>
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-4 left-4 opacity-10">
          <Sparkles className="w-32 h-32" />
        </div>
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-[10px] font-bold ring-1 ring-white/20">{todayLabel}</span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 backdrop-blur-sm text-[10px] font-bold ring-1 ring-emerald-300/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse-dot"></span>
                البوت يعمل
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold mb-1.5">{greeting}! 👋</h1>
            <p className="text-sm text-blue-100 max-w-xl">
              لديك <b className="text-white">{newMessages}</b> محادثة مفتوحة و <b className="text-white">{pendingOrders}</b> طلب يحتاج انتباهك اليوم.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate('/inbox')} className="px-4 py-2 rounded-xl bg-white/15 backdrop-blur-sm hover:bg-white/25 text-xs font-bold ring-1 ring-white/20 transition-all flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              الرسائل
            </button>
            <button onClick={() => navigate('/orders')} className="px-4 py-2 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold transition-all flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5" />
              عرض الطلبات
              <ArrowLeft className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => <KPICard key={s.title} {...s} delay={i * 80} />)}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm animate-slide-in" style={{ animationDelay: '320ms' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">النشاط خلال 7 أيام</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">الرسائل والطلبات اليومية</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><span className="w-2 h-2 rounded-full bg-blue-500"></span>رسائل</span>
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>طلبات</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="g-messages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g-orders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'currentColor' }} className="text-slate-500" />
              <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} className="text-slate-500" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 12,
                  color: '#fff',
                  backdropFilter: 'blur(8px)',
                }}
              />
              <Area type="monotone" dataKey="رسائل" stroke="#3b82f6" strokeWidth={2} fill="url(#g-messages)" />
              <Area type="monotone" dataKey="طلبات" stroke="#10b981" strokeWidth={2} fill="url(#g-orders)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Channel Distribution */}
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm animate-slide-in" style={{ animationDelay: '400ms' }}>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">توزيع القنوات</h2>
          <p className="text-[11px] text-slate-400 mb-3">حجم الرسائل لكل قناة</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={finalChannelData}
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {finalChannelData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 12,
                  color: '#fff',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {finalChannelData.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }}></span>
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">{c.name}</span>
                </div>
                <span className="text-slate-500 dark:text-slate-400 font-mono">{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity & Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Conversations */}
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm animate-slide-in" style={{ animationDelay: '480ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">آخر المحادثات</h2>
            <button onClick={() => navigate('/inbox')} className="text-[11px] text-blue-600 hover:underline font-semibold flex items-center gap-1">
              عرض الكل <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          {recentConvs.length === 0 ? (
            <EmptyState icon={MessageSquare} title="لا توجد محادثات" description="ستظهر المحادثات هنا فور وصولها" />
          ) : (
            <div className="space-y-2">
              {recentConvs.map((c, i) => {
                const platform = channelConfig[c.platform] || channelConfig.whatsapp
                return (
                  <div key={c.id || i} onClick={() => navigate('/inbox')} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors group">
                    <Avatar name={c.customer_name || 'عميل'} status="online" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{c.customer_name || 'عميل'}</p>
                      <p className="text-[11px] text-slate-400 truncate">{c.last_message || '...'}</p>
                    </div>
                    <span className={`w-2 h-2 rounded-full shrink-0`} style={{ backgroundColor: platform.hex }}></span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm animate-slide-in" style={{ animationDelay: '560ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">آخر الطلبات</h2>
            <button onClick={() => navigate('/orders')} className="text-[11px] text-blue-600 hover:underline font-semibold flex items-center gap-1">
              عرض الكل <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          {orders.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="لا توجد طلبات" description="ستظهر الطلبات فور إتمام العملاء لعمليات الشراء" />
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 text-[10px] uppercase tracking-wider">
                    <th className="text-right pb-2 px-2 font-bold">الطلب</th>
                    <th className="text-right pb-2 px-2 font-bold">العميل</th>
                    <th className="text-right pb-2 px-2 font-bold">المبلغ</th>
                    <th className="text-right pb-2 px-2 font-bold">الحالة</th>
                    <th className="text-right pb-2 px-2 font-bold">القناة</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((o, i) => {
                    const name = o.address ? o.address.split(',')[0] : '—'
                    const total = o.grand_total ? `${parseFloat(o.grand_total).toLocaleString()} دج` : '—'
                    const statusMap = {
                      CONFIRMED:  { label: 'مؤكد',       color: 'emerald' },
                      SHIPPED:    { label: 'تم الشحن',   color: 'blue' },
                      DELIVERED:  { label: 'تم التسليم', color: 'green' },
                      PROCESSING: { label: 'قيد المعالجة', color: 'amber' },
                      CANCELLED:  { label: 'ملغي',       color: 'rose' },
                    }
                    const st = statusMap[o.status] || { label: o.status || '—', color: 'slate' }
                    const platform = channelConfig[o.platform]
                    return (
                      <tr key={o.id || i} className="border-t border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="py-2.5 px-2 font-bold text-blue-600 dark:text-blue-400">#{o.id?.slice(0, 6)}</td>
                        <td className="py-2.5 px-2 font-semibold text-slate-700 dark:text-slate-200">{name}</td>
                        <td className="py-2.5 px-2 font-bold text-slate-800 dark:text-slate-100">{total}</td>
                        <td className="py-2.5 px-2"><Badge color={st.color} size="sm">{st.label}</Badge></td>
                        <td className="py-2.5 px-2">
                          {platform && (
                            <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: platform.hex }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: platform.hex }}></span>
                              {platform.name}
                            </span>
                          )}
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-slide-in" style={{ animationDelay: '640ms' }}>
        {[
          { label: 'إرسال رسالة',    desc: 'بدء محادثة جديدة',  icon: MessageSquare, gradient: 'info',    to: '/inbox' },
          { label: 'إنشاء طلب',     desc: 'تسجيل طلب يدوي',   icon: Plus,          gradient: 'success', to: '/orders' },
          { label: 'إضافة منتج',    desc: 'منتج جديد للمتجر',  icon: Package,       gradient: 'warning', to: '/products' },
          { label: 'إعدادات AI',     desc: 'ضبط نماذج الذكاء',  icon: Zap,           gradient: 'violet',  to: '/settings?tab=channels' },
        ].map((a, i) => {
          const Icon = a.icon
          return (
            <button
              key={i}
              onClick={() => navigate(a.to)}
              className="group bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-4 text-right hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className={`w-10 h-10 rounded-xl ${gradients[a.gradient]} flex items-center justify-center shadow-md mb-2 group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{a.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{a.desc}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
