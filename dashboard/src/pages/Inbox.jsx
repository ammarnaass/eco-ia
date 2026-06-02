import { useState, useEffect, useRef } from 'react'
import {
  Search, Phone, MessageCircle, Camera, Send, Bot,
  MapPin, Sparkles, CheckCircle2, Info, RefreshCw
} from 'lucide-react'
import { api } from '../api.js'

const platformIcon = { whatsapp: Phone, facebook: MessageCircle, instagram: Camera }
const platformLabel = { whatsapp: 'واتساب', facebook: 'فيسبوك', instagram: 'انستغرام' }
const platformColor = {
  whatsapp: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  facebook: 'bg-blue-50 text-blue-700 border-blue-100',
  instagram: 'bg-pink-50 text-pink-700 border-pink-100',
}

const quickReplies = [
  'مرحباً بك! كيف يمكنني مساعدتك اليوم؟',
  'تم تأكيد طلبك بنجاح وسنقوم بشحنه في أقرب وقت. شكراً لثقتك بنا! 📦✅',
  'الرجاء تزويدنا برقم الهاتف والولاية وتفاصيل العنوان لتسجيل الطلب.',
  'شحن ولاية الجزائر العاصمة 400 دج، وباقي الولايات 600 دج والجنوب 800 دج.',
  'المنتج متوفر حالياً بكمية محدودة. هل ترغب في تسجيل طلبك الآن؟'
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

  const messagesEndRef = useRef(null)

  // Fetch initial data
  const fetchData = () => {
    setLoading(true)
    Promise.all([
      api.getConversations().catch(() => []),
      api.getOrders().catch(() => [])
    ]).then(([convs, ords]) => {
      setConversations(convs)
      setOrders(ords)
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()

    // Setup real-time updates via SSE
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    const sseUrl = `${API_BASE}/updates/stream`
    
    console.log('Connecting to SSE:', sseUrl)
    const eventSource = new EventSource(sseUrl)

    eventSource.onopen = () => {
      console.log('SSE connection established')
      setSseConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        console.log('SSE Event received:', payload)
        if (payload.type === 'conversation_updated') {
          // Silent refresh of conversations list to keep it updated in real-time
          api.getConversations().then(setConversations).catch(() => {})
          api.getOrders().then(setOrders).catch(() => {})
        }
      } catch (e) {
        console.error('Error parsing SSE event:', e)
      }
    }

    eventSource.onerror = (err) => {
      console.error('SSE Connection error:', err)
      setSseConnected(false)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  // Auto-scroll to bottom of chat when messages change
  const selectedConv = conversations.find(c => c.id === selectedConvId)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConv?.messages])

  // Filters and search logic
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

  // Send manual reply
  const handleSendManual = async (e) => {
    e?.preventDefault()
    if (!replyText.trim() || !selectedConv) return
    setSendingManual(true)
    try {
      await api.sendManualReply(selectedConv.userId, replyText, selectedConv.platform)
      setReplyText('')
      // Refresh list to instantly show the new message (SSE will also trigger this, but manual refresh ensures prompt UI feedback)
      const updated = await api.getConversations()
      setConversations(updated)
    } catch (err) {
      alert('فشل في إرسال الرسالة: ' + err.message)
    } finally {
      setSendingManual(false)
    }
  }

  // Trigger AI Auto-reply
  const handleSendAI = async () => {
    if (!selectedConv) return
    
    // Find the last user message to feed into the AI responder
    const userMsgs = selectedConv.messages.filter(m => m.role === 'user')
    if (userMsgs.length === 0) {
      alert('لا توجد رسائل من العميل للرد عليها بالذكاء الاصطناعي')
      return
    }
    const lastUserMessage = userMsgs[userMsgs.length - 1].content

    setSendingAI(true)
    try {
      await api.sendAIReply(selectedConv.userId, lastUserMessage, selectedConv.platform)
      // Refresh list
      const updated = await api.getConversations()
      setConversations(updated)
    } catch (err) {
      alert('فشل توليد رد الذكاء الاصطناعي: ' + err.message)
    } finally {
      setSendingAI(false)
    }
  }

  // Get orders specifically for the selected customer
  const customerOrders = selectedConv 
    ? orders.filter(o => o.customer_id === selectedConv.userId)
    : []

  const totalSpent = customerOrders.reduce((sum, o) => sum + Number(o.grand_total || 0), 0)

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] overflow-hidden">
      {/* Top Header Panel */}
      <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-800">صندوق المحادثات الموحد</h1>
          <p className="text-xs text-gray-400 mt-1">تسيير وإجابة محادثات عملائك آلياً وبشكل يدوي</p>
        </div>
        <div className="flex items-center gap-3">
          {/* SSE Connection Status Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-gray-50 border-gray-100">
            <span className={`w-2.5 h-2.5 rounded-full ${sseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`}></span>
            <span className="text-gray-500">
              {sseConnected ? 'متصل فورياً بالسيرفر' : 'مزامنة بطيئة...'}
            </span>
          </div>
          <button onClick={fetchData} className="p-2 border border-gray-100 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Workspace Splitter */}
      <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        
        {/* RIGHT COLUMN: Conversations list */}
        <div className="w-80 md:w-96 bg-white rounded-xl border border-gray-100 flex flex-col overflow-hidden shadow-xs shrink-0">
          {/* Search bar */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="بحث عن عميل أو رسالة..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg pr-9 pl-3 py-2 bg-gray-50 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all" 
              />
            </div>
          </div>

          {/* Platform Filters */}
          <div className="flex gap-1 p-2 bg-gray-50/50 border-b border-gray-100">
            {['all', 'whatsapp', 'facebook', 'instagram'].map((p) => (
              <button 
                key={p} 
                onClick={() => setFilter(p)}
                className={`text-xs px-2.5 py-1.5 rounded-md transition-all font-medium flex-1 text-center ${
                  filter === p 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {p === 'all' ? 'الكل' : platformLabel[p]}
              </button>
            ))}
          </div>

          {/* Conversations list container */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {loading && conversations.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">جاري تحميل المحادثات...</div>
            ) : filteredConvs.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">لا توجد محادثات مطابقة</div>
            ) : (
              filteredConvs.map((c) => {
                const Icon = platformIcon[c.platform] || Phone
                const isActive = c.id === selectedConvId
                const initials = (c.customerName || c.platformId || '??').slice(0, 2)
                const lastMsgTime = c.lastUpdated 
                  ? new Date(c.lastUpdated).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }) 
                  : ''

                return (
                  <div 
                    key={c.id} 
                    onClick={() => setSelectedConvId(c.id)}
                    className={`flex items-start gap-3 p-3 cursor-pointer transition-all border-r-2 ${
                      isActive 
                        ? 'bg-blue-50/40 border-blue-600' 
                        : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0 mt-0.5">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white bg-linear-to-br from-blue-400 to-indigo-500 shadow-xs uppercase">
                        {initials}
                      </div>
                      <span className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full border-2 border-white bg-white flex items-center justify-center">
                        <Icon className={`w-3 h-3 ${
                          c.platform === 'whatsapp' ? 'text-emerald-500' : c.platform === 'facebook' ? 'text-blue-500' : 'text-pink-500'
                        }`} />
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-gray-800 truncate">
                          {c.customerName || c.customerPhone || 'عميل غير مسجل'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium shrink-0">{lastMsgTime}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mb-1">
                        {c.lastMessage || 'لا توجد رسائل'}
                      </p>
                      
                      {/* Sub-Badges */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-gray-100 text-gray-500 font-mono">
                          {c.ai_model ? c.ai_model.split('/')[1] : 'بدون نموذج'}
                        </span>
                        {c.messageCount > 0 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-blue-50 text-blue-600 font-medium">
                            {c.messageCount} رسائل
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* LEFT/CENTER CHAT PANEL */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 flex flex-col overflow-hidden shadow-xs min-w-0">
          {selectedConv ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-linear-to-l from-gray-50/50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white bg-linear-to-br from-blue-400 to-indigo-500">
                    {(selectedConv.customerName || selectedConv.platformId || '??').slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-sm text-gray-800">
                        {selectedConv.customerName || 'عميل غير مسجل'}
                      </h2>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${platformColor[selectedConv.platform]}`}>
                        {platformLabel[selectedConv.platform]}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                      رقم المعرف: {selectedConv.customerPhone || selectedConv.platformId}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Toggle Customer Info Panel */}
                  <button 
                    onClick={() => setShowDetails(!showDetails)}
                    className={`p-2 rounded-lg border text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-xs ${
                      showDetails ? 'bg-blue-50 border-blue-100 text-blue-600' : 'border-gray-100'
                    }`}
                  >
                    <Info className="w-4 h-4" />
                    <span className="hidden sm:inline">تفاصيل العميل</span>
                  </button>
                </div>
              </div>

              {/* Chat Workspace Splitter (Messages + Collapsible Info Panel) */}
              <div className="flex-1 flex overflow-hidden min-h-0">
                
                {/* Messages Feed Area */}
                <div className="flex-1 flex flex-col justify-between bg-slate-50/60 overflow-hidden">
                  
                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
                    {selectedConv.messages.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center my-auto">بدء محادثة جديدة</p>
                    ) : (
                      selectedConv.messages.map((m, index) => {
                        const isUser = m.role === 'user'
                        const isAgent = m.sender === 'agent'
                        
                        return (
                          <div 
                            key={index} 
                            className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}
                          >
                            <div 
                              className={`max-w-[75%] rounded-2xl p-3 text-sm shadow-2xs transition-all relative ${
                                isUser 
                                  ? 'bg-white text-gray-800 rounded-tr-none border border-gray-100' 
                                  : isAgent
                                    ? 'bg-linear-to-br from-indigo-600 to-indigo-700 text-white rounded-tl-none'
                                    : 'bg-linear-to-br from-blue-600 to-blue-700 text-white rounded-tl-none'
                              }`}
                            >
                              {/* Message Text */}
                              <p className="leading-relaxed whitespace-pre-line">{m.content}</p>
                              
                              {/* Message Footer Info */}
                              <div className={`flex items-center gap-2 mt-1 text-[9px] ${isUser ? 'text-gray-400' : 'text-blue-200'}`}>
                                <span>{m.timestamp ? new Date(m.timestamp).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                {!isUser && (
                                  <span className={`px-1 rounded-sm text-[8px] uppercase ${
                                    isAgent ? 'bg-indigo-500 text-white' : 'bg-blue-500 text-white'
                                  }`}>
                                    {isAgent ? 'رد يدوي' : 'رد آلي بالذكاء'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Canned replies helper */}
                  <div className="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none shrink-0 select-none">
                    <span className="text-[10px] text-gray-400 shrink-0 font-medium">ردود سريعة:</span>
                    {quickReplies.map((qr, idx) => (
                      <button
                        key={idx}
                        onClick={() => setReplyText(qr)}
                        className="text-[11px] bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-full px-3 py-1 cursor-pointer transition-colors"
                      >
                        {qr.slice(0, 30)}...
                      </button>
                    ))}
                  </div>

                  {/* Input Form Area */}
                  <form onSubmit={handleSendManual} className="p-3 bg-white border-t border-gray-100 flex items-end gap-2 shrink-0">
                    <div className="flex-1 relative">
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="اكتب ردك اليدوي هنا..."
                        className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 pr-3 pl-12 bg-gray-50 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none min-h-[44px] max-h-[120px] leading-normal"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendManual()
                          }
                        }}
                      />
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {/* AI auto-reply trigger button */}
                      <button
                        type="button"
                        onClick={handleSendAI}
                        disabled={sendingAI || sendingManual}
                        className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 hover:bg-emerald-100 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                        title="توليد رد تلقائي بالذكاء الاصطناعي بناءً على آخر رسالة من العميل"
                      >
                        <Sparkles className={`w-4 h-4 ${sendingAI ? 'animate-pulse' : ''}`} />
                        <span>{sendingAI ? 'جاري التوليد...' : 'رد آلي ذكي'}</span>
                      </button>

                      {/* Manual send button */}
                      <button
                        type="submit"
                        disabled={sendingManual || sendingAI || !replyText.trim()}
                        className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                      >
                        <Send className={`w-4 h-4 ${sendingManual ? 'animate-ping' : ''}`} />
                        <span>{sendingManual ? 'جاري الإرسال...' : 'إرسال يدوي'}</span>
                      </button>
                    </div>
                  </form>

                </div>

                {/* COLLAPSIBLE CUSTOMER DETAILS PANEL */}
                {showDetails && (
                  <div className="w-72 border-r border-gray-100 bg-white flex flex-col overflow-y-auto shrink-0 shadow-2xs">
                    
                    {/* Profile Header */}
                    <div className="p-4 border-b border-gray-50 text-center">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-white bg-linear-to-br from-blue-500 to-indigo-600 mx-auto shadow-sm">
                        {(selectedConv.customerName || selectedConv.platformId || '??').slice(0, 2)}
                      </div>
                      <h3 className="font-semibold text-sm text-gray-800 mt-2.5">
                        {selectedConv.customerName || 'عميل غير مسجل'}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">{selectedConv.customerPhone || selectedConv.platformId}</p>
                    </div>

                    {/* Metadata Section */}
                    <div className="p-4 space-y-4 border-b border-gray-50">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">بيانات الاتصال والتوصيل</h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-gray-500">الولاية والعنوان</p>
                            <p className="text-xs text-gray-800 mt-0.5">
                              {selectedConv.customerWilaya ? `${selectedConv.customerWilaya}` : ''} 
                              {selectedConv.customerAddress ? ` - ${selectedConv.customerAddress}` : ''}
                              {!selectedConv.customerWilaya && !selectedConv.customerAddress && 'غير مسجلة بعد'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <Bot className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-gray-500">النموذج الذكي الفعال</p>
                            <p className="text-xs text-blue-600 font-semibold mt-0.5">
                              {selectedConv.ai_model || 'لم يحدد بعد'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sales / Orders History */}
                    <div className="p-4 flex-1">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">سجل الطلبات</h4>
                      
                      {/* Customer metrics */}
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="p-2.5 bg-gray-50 rounded-lg text-center">
                          <span className="text-[10px] text-gray-400 block mb-0.5">الطلبات</span>
                          <span className="text-sm font-bold text-gray-800">{customerOrders.length}</span>
                        </div>
                        <div className="p-2.5 bg-gray-50 rounded-lg text-center">
                          <span className="text-[10px] text-gray-400 block mb-0.5">إجمالي المشتريات</span>
                          <span className="text-sm font-bold text-blue-600">{totalSpent} دج</span>
                        </div>
                      </div>

                      {/* Orders mini-list */}
                      {customerOrders.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">لا توجد طلبات مسجلة للعميل</p>
                      ) : (
                        <div className="space-y-2">
                          {customerOrders.map(o => (
                            <div key={o.id} className="p-2 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-gray-800">{o.id}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-medium ${
                                  o.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                }`}>
                                  {o.status}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-gray-400">
                                <span>{new Date(o.created_at).toLocaleDateString('ar-DZ')}</span>
                                <span className="font-bold text-gray-700">{o.grand_total} دج</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}

              </div>

            </div>
          ) : (
            // EMPTY PLACEHOLDER STATE
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-sm animate-bounce">
                <MessageCircle className="w-8 h-8" />
              </div>
              <h2 className="text-base font-bold text-gray-800 mb-1.5">ابدأ الدردشة المباشرة</h2>
              <p className="text-xs text-gray-400 max-w-sm leading-relaxed mb-4">
                اختر محادثة من القائمة الجانبية لبدء التفاعل مع العميل، أو الإرسال اليدوي، أو توليد رد ذكي عبر الذكاء الاصطناعي.
              </p>
              {sseConnected && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>لوحة الرسائل متصلة بالبث المباشر وتستقبل فورياً</span>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
