import { useState, useEffect, useRef } from 'react'
import {
  Search, Phone, MessageCircle, Camera, Send, Bot, Sparkles,
  CheckCircle2, Info, RefreshCw, X, User, MapPin, Package,
  Hash, Zap, ChevronRight, Wifi, WifiOff, Loader2, Database
} from 'lucide-react'
import { api } from '../api.js'
import dataService from '../lib/dataService.js'
import Avatar from '../components/ui/Avatar.jsx'
import Badge from '../components/ui/Badge.jsx'
import { channelConfig } from '../lib/design-tokens.js'
import EmptyState from '../components/ui/EmptyState.jsx'

const platformIcon = { whatsapp: Phone, facebook: MessageCircle, instagram: Camera }
const platformLabel = { whatsapp: 'واتساب', facebook: 'فيسبوك', instagram: 'انستغرام' }

const quickReplies = [
  'مرحباً بك! كيف يمكنني مساعدتك اليوم؟',
  'تم تأكيد طلبك بنجاح وسنقوم بشحنه في أقرب وقت. شكراً لثقتك بنا! 📦✅',
  'الرجاء تزويدنا برقم الهاتف والولاية وتفاصيل العنوان لتسجيل الطلب.',
  'شحن ولاية الجزائر العاصمة 400 دج، وباقي الولايات 600 دج والجنوب 800 دج.',
  'المنتج متوفر حالياً بكمية محدودة. هل ترغب في تسجيل طلبك الآن؟',
]

export default function Inbox() {
  const [conversations, setConversations] = useState([])
  const [orders, setOrders] = useState([])
  const [selectedConvId, setSelectedConvId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [sendingManual, setSendingManual] = useState(false)
  const [sendingAI, setSendingAI] = useState(false)
  const [showDetails, setShowDetails] = useState(true)
  const [sseConnected, setSseConnected] = useState(false)
  const [mobileChatOpen, setMobileChatOpen] = useState(false)

  const messagesEndRef = useRef(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [convsRes, ordsRes] = await Promise.all([
        dataService.conversations.list().catch(() => ({ data: [] })),
        dataService.orders.list().catch(() => ({ data: [] })),
      ])
      setConversations(convsRes.data || [])
      setOrders(ordsRes.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    const sseUrl = `${API_BASE}/updates/stream`
    const eventSource = new EventSource(sseUrl)

    eventSource.onopen = () => setSseConnected(true)
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.type === 'conversation_updated') {
          dataService.conversations.list().then(({ data }) => setConversations(data || [])).catch(() => {})
          dataService.orders.list().then(({ data }) => setOrders(data || [])).catch(() => {})
        }
      } catch (e) { /* silent */ }
    }
    eventSource.onerror = () => setSseConnected(false)
    return () => eventSource.close()
  }, [])

  const selectedConv = conversations.find(c => c.id === selectedConvId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConv?.messages])

  const filteredConvs = conversations.filter(c => {
    const matchesPlatform = filter === 'all' || c.platform === filter
    const searchLower = search.toLowerCase()
    const matchesSearch =
      (c.customerName || '').toLowerCase().includes(searchLower) ||
      (c.customerPhone || '').toLowerCase().includes(searchLower) ||
      (c.platformId || '').toLowerCase().includes(searchLower) ||
      (c.lastMessage || '').toLowerCase().includes(searchLower)
    return matchesPlatform && matchesSearch
  })

  const handleSendManual = async (e) => {
    e?.preventDefault()
    if (!replyText.trim() || !selectedConv) return
    setSendingManual(true)
    try {
      await api.sendManualReply(selectedConv.userId, replyText, selectedConv.platform)
      setReplyText('')
      const { data } = await dataService.conversations.list()
      setConversations(data || [])
    } catch (err) {
      alert('فشل في إرسال الرسالة: ' + err.message)
    } finally {
      setSendingManual(false)
    }
  }

  const handleSendAI = async () => {
    if (!selectedConv) return
    const userMsgs = selectedConv.messages?.filter(m => m.role === 'user') || []
    if (userMsgs.length === 0) {
      alert('لا توجد رسائل من العميل للرد عليها بالذكاء الاصطناعي')
      return
    }
    const lastUserMessage = userMsgs[userMsgs.length - 1].content
    setSendingAI(true)
    try {
      await api.sendAIReply(selectedConv.userId, lastUserMessage, selectedConv.platform)
      const { data } = await dataService.conversations.list()
      setConversations(data || [])
    } catch (err) {
      alert('فشل توليد رد الذكاء الاصطناعي: ' + err.message)
    } finally {
      setSendingAI(false)
    }
  }

  const customerOrders = selectedConv
    ? orders.filter(o => o.customer_id === selectedConv.userId)
    : []
  const totalSpent = customerOrders.reduce((sum, o) => sum + Number(o.grand_total || 0), 0)

  // Filter chips with counts
  const filterCounts = {
    all: conversations.length,
    whatsapp: conversations.filter(c => c.platform === 'whatsapp').length,
    facebook: conversations.filter(c => c.platform === 'facebook').length,
    instagram: conversations.filter(c => c.platform === 'instagram').length,
  }

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">صندوق المحادثات الموحد</h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">إدارة المحادثات من جميع القنوات في مكان واحد</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border ${
            sseConnected
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
          }`}>
            {sseConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{sseConnected ? 'مباشر' : 'إعادة الاتصال...'}</span>
            {sseConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot"></span>}
          </div>
          <button onClick={fetchData} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main 3-pane workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-200px)] min-h-[500px]">

        {/* LEFT: Conversations list */}
        <div className={`${mobileChatOpen ? 'hidden' : 'flex'} lg:flex lg:col-span-3 flex-col bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-sm overflow-hidden`}>
          <div className="p-3 border-b border-slate-200/60 dark:border-slate-700/60 space-y-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="بحث..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="flex gap-1">
              {[
                { id: 'all',       label: 'الكل' },
                { id: 'whatsapp',  label: 'واتساب' },
                { id: 'facebook',  label: 'فيسبوك' },
                { id: 'instagram', label: 'انستغرام' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setFilter(p.id)}
                  className={`text-[10px] px-2 py-1 rounded-lg transition-all font-bold flex-1 ${
                    filter === p.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {p.label}
                  <span className="mr-1 opacity-60">({filterCounts[p.id]})</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">جاري التحميل...</div>
            ) : filteredConvs.length === 0 ? (
              <EmptyState icon={MessageCircle} title="لا توجد محادثات" description="ستظهر هنا فور وصولها" className="py-12" />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredConvs.map((c) => {
                  const Icon = platformIcon[c.platform] || Phone
                  const isActive = c.id === selectedConvId
                  const platform = channelConfig[c.platform] || channelConfig.whatsapp
                  const lastMsgTime = c.lastUpdated
                    ? new Date(c.lastUpdated).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })
                    : ''
                  return (
                    <div
                      key={c.id}
                      onClick={() => { setSelectedConvId(c.id); setMobileChatOpen(true) }}
                      className={`flex items-start gap-2.5 p-3 cursor-pointer transition-all border-r-2 ${
                        isActive
                          ? 'bg-blue-50/60 dark:bg-blue-900/20 border-blue-500'
                          : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/30'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <Avatar name={c.customerName || c.platformId || 'عميل'} size="sm" />
                        <span
                          className="absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center"
                          style={{ backgroundColor: platform.hex }}
                        >
                          <Icon className="w-2.5 h-2.5 text-white" />
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                            {c.customerName || c.customerPhone || 'عميل غير مسجل'}
                          </span>
                          <span className="text-[9px] text-slate-400 shrink-0">{lastMsgTime}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {c.lastMessage || 'لا توجد رسائل'}
                        </p>
                        {c.messageCount > 0 && (
                          <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold">
                            {c.messageCount} رسائل
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* CENTER: Chat panel */}
        <div className={`${mobileChatOpen ? 'flex' : 'hidden'} lg:flex lg:col-span-6 flex-col bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-sm overflow-hidden`}>
          {selectedConv ? (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between bg-gradient-to-l from-slate-50/50 to-white dark:from-slate-800/50 dark:to-slate-800/30">
                <div className="flex items-center gap-3">
                  <button onClick={() => setMobileChatOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                  <Avatar name={selectedConv.customerName || 'عميل'} size="md" status="online" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                        {selectedConv.customerName || 'عميل غير مسجل'}
                      </h2>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Hash className="w-2.5 h-2.5" />
                      {selectedConv.platformId || '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleSendAI}
                    disabled={sendingAI}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-l from-violet-500 to-purple-600 text-white text-[11px] font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
                    title="رد ذكي تلقائي"
                  >
                    {sendingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    <span className="hidden sm:inline">رد ذكي</span>
                  </button>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <Info className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-50/30 to-transparent dark:from-slate-900/20">
                {selectedConv.messages?.map((m, i) => {
                  const isUser = m.role === 'user'
                  const isAI = m.role === 'assistant' && m.sender !== 'agent'
                  return (
                    <div key={i} className={`flex ${isUser ? 'justify-start' : 'justify-end'} animate-slide-in`}>
                      <div className={`max-w-[75%] ${isUser ? 'order-2' : 'order-1'}`}>
                        {isAI && (
                          <div className="flex items-center gap-1 mb-1 text-[9px] font-bold text-violet-600 dark:text-violet-400">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>ذكاء اصطناعي</span>
                          </div>
                        )}
                        <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                          isUser
                            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-tr-sm border border-slate-200/60 dark:border-slate-600/60'
                            : isAI
                              ? 'bg-gradient-to-l from-violet-500 to-purple-600 text-white rounded-tl-sm'
                              : 'bg-gradient-to-l from-blue-500 to-indigo-600 text-white rounded-tl-sm'
                        }`}>
                          {m.content}
                        </div>
                        <div className={`mt-1 text-[9px] text-slate-400 ${isUser ? 'text-right' : 'text-left'}`}>
                          {new Date(m.timestamp || Date.now()).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                          {!isUser && <CheckCircle2 className="w-2.5 h-2.5 inline-block mr-1 text-emerald-500" />}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick replies */}
              <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700/50 flex gap-1.5 overflow-x-auto scrollbar-none">
                {quickReplies.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setReplyText(q)}
                    className="shrink-0 text-[10px] px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    {q.slice(0, 30)}...
                  </button>
                ))}
              </div>

              {/* Reply input */}
              <form onSubmit={handleSendManual} className="p-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendManual() } }}
                    rows={1}
                    placeholder="اكتب رسالتك... (Enter للإرسال)"
                    className="w-full text-sm bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none transition-all"
                    style={{ maxHeight: 100 }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!replyText.trim() || sendingManual}
                  className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-l from-blue-500 to-indigo-600 text-white flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-all shadow-md"
                >
                  {sendingManual ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </>
          ) : (
            <EmptyState
              icon={MessageCircle}
              title="اختر محادثة"
              description="اختر محادثة من القائمة لعرض الرسائل والرد"
              className="flex-1"
            />
          )}
        </div>

        {/* RIGHT: Customer details */}
        {showDetails && selectedConv && (
          <div className="hidden lg:flex lg:col-span-3 flex-col bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-l from-slate-50/50 to-transparent">
              <div className="flex flex-col items-center text-center">
                <Avatar name={selectedConv.customerName || 'عميل'} size="xl" status="online" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-3">
                  {selectedConv.customerName || 'عميل غير مسجل'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{selectedConv.platformId || '—'}</p>
                <Badge color={channelConfig[selectedConv.platform]?.color || 'slate'} size="sm" className="mt-2">
                  {platformLabel[selectedConv.platform]}
                </Badge>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">الطلبات</p>
                  <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mt-1">{customerOrders.length}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">الإنفاق</p>
                  <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mt-1">{totalSpent.toLocaleString()}</p>
                  <p className="text-[9px] text-slate-400">دج</p>
                </div>
              </div>

              {/* Orders */}
              {customerOrders.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                    <Package className="w-3 h-3" />
                    الطلبات السابقة
                  </h4>
                  <div className="space-y-2">
                    {customerOrders.slice(0, 5).map((o, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">#{o.id?.slice(0, 6)}</span>
                          <Badge color={o.status === 'CONFIRMED' ? 'emerald' : o.status === 'SHIPPED' ? 'blue' : 'slate'} size="sm">
                            {o.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-bold">{parseFloat(o.grand_total || 0).toLocaleString()} دج</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI info */}
              {selectedConv.ai_model && (
                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200/60 dark:border-violet-800/60">
                  <h4 className="text-[11px] font-bold text-violet-700 dark:text-violet-300 mb-1 flex items-center gap-1.5">
                    <Zap className="w-3 h-3" />
                    نموذج AI
                  </h4>
                  <p className="text-[11px] font-mono text-violet-600 dark:text-violet-300">{selectedConv.ai_model}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
