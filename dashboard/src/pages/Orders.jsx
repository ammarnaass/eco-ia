import { useState, useEffect, useRef } from 'react'
import {
  Search, ShoppingBag, Edit3, Printer, MessageCircle, Mail,
  X, Plus, Trash2, Save, RefreshCw, CheckCircle, AlertCircle,
  Package, User, Phone, MapPin, Tag, DollarSign, Send
} from 'lucide-react'
import { api } from '../api.js'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const SERVER_BASE = API_BASE.replace('/api', '')

const statusColors = {
  CONFIRMED:  'bg-emerald-50 text-emerald-700 border border-emerald-100',
  PROCESSING: 'bg-amber-50 text-amber-700 border border-amber-100',
  SHIPPED:    'bg-blue-50 text-blue-700 border border-blue-100',
  DELIVERED:  'bg-green-50 text-green-700 border border-green-100',
  CANCELLED:  'bg-red-50 text-red-700 border border-red-100',
  RETURNED:   'bg-gray-100 text-gray-700 border border-gray-200',
}
const statusLabels = {
  CONFIRMED: 'مؤكد', PROCESSING: 'قيد المعالجة', SHIPPED: 'تم الشحن',
  DELIVERED: 'تم التسليم', CANCELLED: 'ملغي', RETURNED: 'مرتجع',
}
const platformBadge = {
  whatsapp:  'bg-green-50 text-green-700 border-green-100',
  facebook:  'bg-blue-50 text-blue-700 border-blue-100',
  instagram: 'bg-pink-50 text-pink-700 border-pink-100',
}

/* ─── Toast helper ─────────────────────────────────────── */
function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl text-white transition-all duration-300 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'}`}>
      {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      <span className="text-sm font-semibold">{toast.msg}</span>
    </div>
  )
}

/* ─── Edit Modal ────────────────────────────────────────── */
function EditModal({ order, onClose, onSaved, showToast }) {
  const [form, setForm] = useState(() => {
    let items = []
    try { items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []) } catch {}
    const parts = (order.address || '').split(',')
    return {
      customer_name: parts[0]?.trim() || '',
      address: parts.slice(1).join(',').trim() || '',
      phone: order.phone || '',
      wilaya: order.wilaya || '',
      status: order.status || 'CONFIRMED',
      shipping_cost: order.shipping_cost || 0,
      items: items.length ? items : [{ name: '', qty: 1, price: 0 }],
    }
  })
  const [saving, setSaving] = useState(false)

  const total = form.items.reduce((sum, i) => sum + (parseFloat(i.price) || 0) * (parseInt(i.qty) || 1), 0)
    + (parseFloat(form.shipping_cost) || 0)

  const setItem = (idx, key, val) => setForm(p => {
    const items = [...p.items]
    items[idx] = { ...items[idx], [key]: val }
    return { ...p, items }
  })

  const addItem    = () => setForm(p => ({ ...p, items: [...p.items, { name: '', qty: 1, price: 0 }] }))
  const removeItem = idx => setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))

  const handleSave = async () => {
    if (!form.customer_name.trim()) { showToast('error', 'اسم العميل مطلوب'); return }
    setSaving(true)
    try {
      await api.updateOrder(order.id, { ...form, grand_total: total })
      showToast('success', `تم حفظ الطلب #${order.id} بنجاح ✓`)
      onSaved()
      onClose()
    } catch (e) {
      showToast('error', 'فشل الحفظ: ' + e.message)
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl"><Edit3 className="w-4 h-4 text-blue-600" /></div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">تعديل الطلب</h2>
              <p className="text-[10px] text-gray-400 font-mono">#{order.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Client Info */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> بيانات العميل
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'اسم العميل *', key: 'customer_name', icon: User, placeholder: 'أحمد بن علي' },
                { label: 'رقم الهاتف', key: 'phone', icon: Phone, placeholder: '0555 12 34 56' },
                { label: 'الولاية', key: 'wilaya', icon: MapPin, placeholder: 'الجزائر' },
                { label: 'العنوان التفصيلي', key: 'address', icon: MapPin, placeholder: 'الشارع، الحي...' },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-600">{f.label}</label>
                  <div className="relative">
                    <f.icon className="absolute right-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={form[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full text-xs border border-gray-200 rounded-xl pr-9 pl-3 py-2.5 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> حالة الطلب
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {Object.entries(statusLabels).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, status: val }))}
                  className={`text-[10px] font-bold py-2 px-2 rounded-lg border transition-all ${form.status === val ? statusColors[val] + ' ring-2 ring-offset-1 ring-blue-400' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> المنتجات
              </h3>
              <button onClick={addItem} className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                <Plus className="w-3 h-3" /> إضافة منتج
              </button>
            </div>

            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-1">
                <span className="col-span-6 text-[9px] font-bold text-gray-400 uppercase">المنتج</span>
                <span className="col-span-2 text-[9px] font-bold text-gray-400 uppercase text-center">الكمية</span>
                <span className="col-span-3 text-[9px] font-bold text-gray-400 uppercase text-center">السعر (دج)</span>
                <span className="col-span-1" />
              </div>
              {form.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-xl p-2">
                  <input
                    className="col-span-6 text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:ring-1 focus:ring-blue-400 outline-none"
                    placeholder="اسم المنتج..."
                    value={item.name}
                    onChange={e => setItem(idx, 'name', e.target.value)}
                  />
                  <input
                    type="number" min="1"
                    className="col-span-2 text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white text-center focus:ring-1 focus:ring-blue-400 outline-none"
                    value={item.qty}
                    onChange={e => setItem(idx, 'qty', e.target.value)}
                  />
                  <input
                    type="number" min="0"
                    className="col-span-3 text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white text-center focus:ring-1 focus:ring-blue-400 outline-none font-bold text-emerald-700"
                    value={item.price}
                    onChange={e => setItem(idx, 'price', e.target.value)}
                  />
                  <button onClick={() => removeItem(idx)} disabled={form.items.length === 1}
                    className="col-span-1 flex justify-center p-1.5 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-lg transition-colors disabled:opacity-30">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping cost + Grand Total */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center border-t border-gray-100 pt-4">
            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-bold text-gray-600 flex items-center gap-1"><DollarSign className="w-3 h-3" /> تكلفة الشحن (دج)</label>
              <input
                type="number" min="0"
                value={form.shipping_cost}
                onChange={e => setForm(p => ({ ...p, shipping_cost: e.target.value }))}
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
            <div className="sm:text-right sm:mt-5">
              <span className="text-[10px] text-gray-400 block">المجموع الكلي</span>
              <span className="text-2xl font-black text-blue-600">{total.toLocaleString()} <span className="text-sm font-bold">دج</span></span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50 sticky bottom-0">
          <button onClick={onClose} className="flex-1 sm:flex-none text-xs font-bold text-gray-600 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-100 transition-colors">
            إلغاء
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2.5 disabled:opacity-50 transition-colors shadow-sm">
            {saving ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />جاري الحفظ...</> : <><Save className="w-3.5 h-3.5" />حفظ التغييرات</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Email Modal ───────────────────────────────────────── */
function EmailModal({ order, onClose, showToast }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!email.trim() || !email.includes('@')) { showToast('error', 'يرجى إدخال بريد إلكتروني صحيح'); return }
    setSending(true)
    try {
      await api.sendOrderEmail(order.id, email)
      showToast('success', `تم إرسال الفاتورة إلى ${email} ✓`)
      onClose()
    } catch (e) {
      showToast('error', 'فشل إرسال البريد: ' + e.message)
    } finally { setSending(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl"><Mail className="w-4 h-4 text-indigo-600" /></div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">إرسال الفاتورة بالبريد</h2>
              <p className="text-[10px] text-gray-400">الطلب #{order.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-500">أدخل بريد العميل الإلكتروني لإرسال الفاتورة PDF كمرفق عبر Gmail.</p>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">البريد الإلكتروني للعميل</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="customer@example.com"
              autoFocus
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono"
            />
          </div>
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button onClick={onClose} className="text-xs font-bold text-gray-600 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-100 transition-colors">
            إلغاء
          </button>
          <button onClick={handleSend} disabled={sending}
            className="flex-1 flex items-center justify-center gap-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 disabled:opacity-50 transition-colors shadow-sm">
            {sending ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />جاري الإرسال...</> : <><Send className="w-3.5 h-3.5" />إرسال الفاتورة</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Orders Page ──────────────────────────────────── */
export default function Orders() {
  const [orders, setOrders]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingOrder, setEditingOrder] = useState(null)
  const [emailOrder, setEmailOrder]   = useState(null)
  const [toast, setToast]             = useState(null)
  const [sendingWA, setSendingWA]     = useState({})
  const toastTimer = useRef(null)

  const showToast = (type, msg) => {
    setToast({ type, msg })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  const loadOrders = () => {
    setLoading(true)
    api.getOrders().then(setOrders).catch(() => setOrders([])).finally(() => setLoading(false))
  }

  useEffect(() => { loadOrders() }, [])

  const filtered = orders.filter(o => {
    const term = search.toLowerCase()
    const id       = (o.id || '').toLowerCase()
    const phone    = (o.phone || '').toLowerCase()
    const address  = (o.address || '').toLowerCase()
    const matchSearch = !search || id.includes(term) || phone.includes(term) || address.includes(term)
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const stats = [
    { label: 'إجمالي', value: orders.length, color: 'text-gray-800', bg: 'bg-gray-50' },
    { label: 'مؤكدة',  value: orders.filter(o => o.status === 'CONFIRMED').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'مشحونة', value: orders.filter(o => o.status === 'SHIPPED').length, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'مسلمة',  value: orders.filter(o => o.status === 'DELIVERED').length, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'ملغية',  value: orders.filter(o => o.status === 'CANCELLED').length, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  const handleSendWA = async (order) => {
    setSendingWA(p => ({ ...p, [order.id]: true }))
    try {
      const res = await api.sendOrderWhatsApp(order.id)
      if (res.success) {
        showToast('success', `تم إرسال الفاتورة لـ ${order.phone} عبر واتساب ✓`)
      } else {
        // Fallback: open wa.me link
        const msg = encodeURIComponent(res.message || `فاتورة الطلب #${order.id}`)
        window.open(`https://wa.me/${order.phone?.replace(/\D/g, '')}?text=${msg}`, '_blank')
        showToast('success', 'تم فتح نافذة واتساب — أرسل الرسالة يدوياً')
      }
    } catch {
      const name = order.address?.split(',')[0] || 'العميل'
      const msg  = encodeURIComponent(`مرحباً ${name}، فاتورة طلبك #${order.id}`)
      window.open(`https://wa.me/${order.phone?.replace(/\D/g, '')}?text=${msg}`, '_blank')
      showToast('success', 'تم فتح رابط واتساب كبديل')
    } finally {
      setSendingWA(p => ({ ...p, [order.id]: false }))
    }
  }

  const handlePrintPDF = (order) => {
    const url = `${SERVER_BASE}/labels/label_${order.id}.pdf`
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة الطلبات</h1>
          <p className="text-sm text-gray-500 mt-0.5">عرض وتعديل الفواتير وإرسالها للعملاء عبر واتساب والبريد.</p>
        </div>
        <button onClick={loadOrders} className="flex items-center gap-2 text-sm border border-gray-200 rounded-xl px-4 py-2 bg-white hover:bg-gray-50 shadow-sm transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : 'text-gray-400'}`} />
          تحديث
        </button>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-5 gap-3">
        {stats.map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center border border-white shadow-sm`}>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="بحث برقم الطلب، الهاتف، العنوان..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-xl pr-9 pl-3 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[['all', 'الكل'], ...Object.entries(statusLabels)].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              className={`text-[11px] font-semibold px-3 py-2 rounded-xl border transition-all ${statusFilter === val ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'text-gray-500 border-gray-200 hover:border-gray-300 bg-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
          <p className="text-sm">جاري تحميل الطلبات...</p>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-2xl text-center shadow-sm">
          <ShoppingBag className="w-12 h-12 text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">لا توجد طلبات مطابقة</p>
          <p className="text-xs text-gray-400 mt-1">جرّب تغيير فلتر البحث أو تحديث القائمة.</p>
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-500 text-right text-xs">
                  <th className="p-4 font-semibold">رقم الطلب</th>
                  <th className="p-4 font-semibold">العميل</th>
                  <th className="p-4 font-semibold">الهاتف</th>
                  <th className="p-4 font-semibold">المنتجات</th>
                  <th className="p-4 font-semibold">المجموع الكلي</th>
                  <th className="p-4 font-semibold">الحالة</th>
                  <th className="p-4 font-semibold">القناة</th>
                  <th className="p-4 font-semibold">التاريخ</th>
                  <th className="p-4 font-semibold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(o => {
                  let items = []
                  try { items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []) } catch {}
                  const itemsStr  = items.map(i => `${i.name} (x${i.qty})`).join(', ') || '—'
                  const namePart  = o.address ? o.address.split(',')[0].trim() : '—'
                  const addrPart  = o.address ? o.address.split(',').slice(1).join(',').trim() : ''
                  const isWA = sendingWA[o.id]

                  return (
                    <tr key={o.id} className="hover:bg-blue-50/20 transition-colors group">
                      <td className="p-4 font-bold text-blue-600 font-mono">{o.id}</td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-800">{namePart}</div>
                        {addrPart && <div className="text-[10px] text-gray-400 truncate max-w-[140px]">{addrPart}</div>}
                      </td>
                      <td className="p-4 text-gray-600 font-medium dir-ltr text-right">{o.phone || '—'}</td>
                      <td className="p-4 text-gray-500 text-xs truncate max-w-[180px]" title={itemsStr}>{itemsStr}</td>
                      <td className="p-4 font-bold text-gray-900">{parseFloat(o.grand_total || 0).toLocaleString()} <span className="text-[10px] font-normal text-gray-400">دج</span></td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[o.status] || 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                          {statusLabels[o.status] || o.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold border ${platformBadge[o.platform] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {o.platform || '—'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 text-xs">
                        {o.created_at ? new Date(o.created_at).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                      </td>

                      {/* Action Buttons */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit */}
                          <button
                            onClick={() => setEditingOrder(o)}
                            title="تعديل الطلب"
                            className="p-2 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Print PDF */}
                          <button
                            onClick={() => handlePrintPDF(o)}
                            title="فتح / طباعة الفاتورة PDF"
                            className="p-2 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-all"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Send WhatsApp */}
                          <button
                            onClick={() => handleSendWA(o)}
                            disabled={isWA}
                            title="إرسال الفاتورة عبر واتساب"
                            className="p-2 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50 text-gray-400 hover:text-green-600 disabled:opacity-50 transition-all"
                          >
                            {isWA
                              ? <span className="w-3.5 h-3.5 border-2 border-green-400 border-t-transparent rounded-full animate-spin block" />
                              : <MessageCircle className="w-3.5 h-3.5" />
                            }
                          </button>

                          {/* Send Email */}
                          <button
                            onClick={() => setEmailOrder(o)}
                            title="إرسال الفاتورة بالبريد الإلكتروني"
                            className="p-2 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-all"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-gray-50 text-xs text-gray-400 flex items-center justify-between">
            <span>عرض {filtered.length} من أصل {orders.length} طلب</span>
            <span className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><Edit3 className="w-3 h-3" /> تعديل</span>
              <span className="flex items-center gap-1"><Printer className="w-3 h-3" /> PDF</span>
              <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> واتساب</span>
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> بريد</span>
            </span>
          </div>
        </div>
      )}

      {/* Modals */}
      {editingOrder && (
        <EditModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSaved={loadOrders}
          showToast={showToast}
        />
      )}
      {emailOrder && (
        <EmailModal
          order={emailOrder}
          onClose={() => setEmailOrder(null)}
          showToast={showToast}
        />
      )}
    </div>
  )
}
