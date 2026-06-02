import { useState, useEffect, useMemo } from 'react'
import {
  Search, Filter, Edit3, Mail, MessageCircle, X, Plus, Trash2, Save,
  Package, User, Phone, MapPin, Tag, DollarSign, Send, Loader2,
  LayoutGrid, List, ChevronDown, Printer, ArrowUpDown, Calendar, Database
} from 'lucide-react'
import { api } from '../api.js'
import dataService from '../lib/dataService.js'
import { orderStatus, channelConfig, gradients, colorVariants } from '../lib/design-tokens.js'
import EmptyState from '../components/ui/EmptyState.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import Badge from '../components/ui/Badge.jsx'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const SERVER_BASE = API_BASE.replace('/api', '')

const statusLabels = {
  CONFIRMED:  'مؤكد', PROCESSING: 'قيد المعالجة', SHIPPED: 'تم الشحن',
  DELIVERED:  'تم التسليم', CANCELLED: 'ملغي', RETURNED: 'مرتجع', PENDING: 'قيد الانتظار',
}

const KANBAN_COLUMNS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']

function OrderCard({ order, onEdit, onEmail, onWhatsApp, onPrint, isDragging, draggable, onDragStart }) {
  const name = order.address ? order.address.split(',')[0].trim() : '—'
  const total = order.grand_total ? `${parseFloat(order.grand_total).toLocaleString()} دج` : '—'
  const st = orderStatus[order.status] || orderStatus.PENDING
  const platform = channelConfig[order.platform]
  const date = order.created_at ? new Date(order.created_at).toLocaleDateString('ar-DZ', { day: 'numeric', month: 'short' }) : ''

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      className={`group bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing animate-slide-in ${isDragging ? 'opacity-40' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Avatar name={name} size="sm" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[120px]">{name}</p>
            <p className="text-[10px] text-slate-400">#{order.id?.slice(0, 6)}</p>
          </div>
        </div>
        {platform && (
          <span className="text-[9px] font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded-md" style={{ backgroundColor: `${platform.hex}15`, color: platform.hex }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: platform.hex }}></span>
            {platform.name}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{total}</span>
        {date && <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{date}</span>}
      </div>

      {order.wilaya && (
        <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2">
          <MapPin className="w-2.5 h-2.5" />
          {order.wilaya}
        </p>
      )}

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-2 border-t border-slate-100 dark:border-slate-700/50">
        <button onClick={() => onEdit(order)} className="flex-1 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-500 hover:text-blue-600 transition-colors" title="تعديل">
          <Edit3 className="w-3 h-3 mx-auto" />
        </button>
        <button onClick={() => onWhatsApp(order)} className="flex-1 p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-500 hover:text-emerald-600 transition-colors" title="إرسال واتساب">
          <MessageCircle className="w-3 h-3 mx-auto" />
        </button>
        <button onClick={() => onEmail(order)} className="flex-1 p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-500 hover:text-indigo-600 transition-colors" title="إرسال بريد">
          <Mail className="w-3 h-3 mx-auto" />
        </button>
        <button onClick={() => onPrint(order)} className="flex-1 p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-500 hover:text-amber-600 transition-colors" title="طباعة">
          <Printer className="w-3 h-3 mx-auto" />
        </button>
      </div>
    </div>
  )
}

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

  const total = form.items.reduce((sum, i) => sum + (parseFloat(i.price) || 0) * (parseInt(i.qty) || 1), 0) + (parseFloat(form.shipping_cost) || 0)

  const setItem = (idx, key, val) => setForm(p => {
    const items = [...p.items]; items[idx] = { ...items[idx], [key]: val }
    return { ...p, items }
  })
  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { name: '', qty: 1, price: 0 }] }))
  const removeItem = idx => setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))

  const handleSave = async () => {
    if (!form.customer_name.trim()) { showToast('error', 'اسم العميل مطلوب'); return }
    setSaving(true)
    try {
      await api.updateOrder(order.id, { ...form, grand_total: total })
      showToast('success', `تم حفظ الطلب #${order.id} بنجاح ✓`)
      onSaved(); onClose()
    } catch (e) {
      showToast('error', 'فشل الحفظ: ' + e.message)
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl"><Edit3 className="w-4 h-4 text-blue-600" /></div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">تعديل الطلب</h2>
              <p className="text-[10px] text-slate-400 font-mono">#{order.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <User className="w-3 h-3" /> بيانات العميل
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'اسم العميل *', key: 'customer_name', icon: User, placeholder: 'أحمد بن علي' },
                { label: 'رقم الهاتف', key: 'phone', icon: Phone, placeholder: '0555 12 34 56' },
                { label: 'الولاية', key: 'wilaya', icon: MapPin, placeholder: 'الجزائر' },
                { label: 'العنوان', key: 'address', icon: MapPin, placeholder: 'الشارع، الحي...' },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">{f.label}</label>
                  <div className="relative">
                    <f.icon className="absolute right-3 top-2.5 w-3 h-3 text-slate-400" />
                    <input
                      type="text"
                      value={form[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2 bg-slate-50 dark:bg-slate-900/40 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Tag className="w-3 h-3" /> حالة الطلب
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5">
              {Object.entries(statusLabels).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setForm(p => ({ ...p, status: val }))}
                  className={`text-[10px] font-bold py-1.5 px-2 rounded-lg border transition-all ${
                    form.status === val
                      ? `${colorVariants[orderStatus[val]?.color || 'slate'].bg} ${colorVariants[orderStatus[val]?.color || 'slate'].text} ${colorVariants[orderStatus[val]?.color || 'slate'].border} ring-2 ring-blue-400/40`
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3 h-3" /> المنتجات
              </h3>
              <button onClick={addItem} className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 px-2.5 py-1 rounded-lg transition-colors">
                <Plus className="w-3 h-3" /> إضافة
              </button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-slate-900/40 rounded-xl p-2">
                  <input
                    className="col-span-6 text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-blue-400 outline-none"
                    placeholder="اسم المنتج..."
                    value={item.name}
                    onChange={e => setItem(idx, 'name', e.target.value)}
                  />
                  <input
                    type="number" min="1"
                    className="col-span-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-center focus:ring-1 focus:ring-blue-400 outline-none"
                    value={item.qty}
                    onChange={e => setItem(idx, 'qty', e.target.value)}
                  />
                  <input
                    type="number" min="0"
                    className="col-span-3 text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-center focus:ring-1 focus:ring-blue-400 outline-none font-bold text-emerald-700"
                    value={item.price}
                    onChange={e => setItem(idx, 'price', e.target.value)}
                  />
                  <button onClick={() => removeItem(idx)} disabled={form.items.length === 1}
                    className="col-span-1 flex justify-center p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors disabled:opacity-30">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center border-t border-slate-100 dark:border-slate-700 pt-4">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><DollarSign className="w-3 h-3" /> تكلفة الشحن (دج)</label>
              <input
                type="number" min="0"
                value={form.shipping_cost}
                onChange={e => setForm(p => ({ ...p, shipping_cost: e.target.value }))}
                className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900/40 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 outline-none font-mono"
              />
            </div>
            <div className="sm:text-right">
              <span className="text-[10px] text-slate-400 block">المجموع الكلي</span>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{total.toLocaleString()} <span className="text-xs font-bold">دج</span></span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 sticky bottom-0">
          <button onClick={onClose} className="text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            إلغاء
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 text-xs font-bold bg-gradient-to-l from-blue-600 to-indigo-600 hover:opacity-90 text-white rounded-xl px-6 py-2 disabled:opacity-50 transition-all shadow-md">
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />جاري الحفظ...</> : <><Save className="w-3.5 h-3.5" />حفظ التغييرات</>}
          </button>
        </div>
      </div>
    </div>
  )
}

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
    } catch (e) { showToast('error', 'فشل إرسال البريد: ' + e.message) }
    finally { setSending(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl"><Mail className="w-4 h-4 text-indigo-600" /></div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">إرسال الفاتورة بالبريد</h2>
              <p className="text-[10px] text-slate-400">الطلب #{order.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">أدخل بريد العميل الإلكتروني لإرسال الفاتورة PDF كمرفق.</p>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">البريد الإلكتروني</label>
            <input
              type="email" autoFocus value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="customer@example.com"
              className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 bg-slate-50 dark:bg-slate-900/40 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none font-mono"
            />
          </div>
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
          <button onClick={onClose} className="text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700">إلغاء</button>
          <button onClick={handleSend} disabled={sending}
            className="flex-1 flex items-center justify-center gap-2 text-xs font-bold bg-gradient-to-l from-indigo-600 to-purple-600 hover:opacity-90 text-white rounded-xl px-4 py-2 disabled:opacity-50 shadow-md">
            {sending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />جاري...</> : <><Send className="w-3.5 h-3.5" />إرسال</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [editingOrder, setEditingOrder] = useState(null)
  const [emailOrder, setEmailOrder] = useState(null)
  const [toast, setToast] = useState(null)
  const [view, setView] = useState('table')
  const [draggedOrder, setDraggedOrder] = useState(null)

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const loadOrders = async () => {
    setLoading(true)
    try {
      const { data, source } = await dataService.orders.list()
      setOrders(data || [])
      setDataSource(source)
    } catch {
      setOrders([])
      setDataSource('error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOrders() }, [])

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = !search ||
        (o.id || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.address || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.phone || '').includes(search)
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter
      const matchesPlatform = platformFilter === 'all' || o.platform === platformFilter
      return matchesSearch && matchesStatus && matchesPlatform
    })
  }, [orders, search, statusFilter, platformFilter])

  const groupedByStatus = useMemo(() => {
    const groups = {}
    KANBAN_COLUMNS.forEach(c => groups[c] = [])
    filtered.forEach(o => {
      const status = KANBAN_COLUMNS.includes(o.status) ? o.status : 'PENDING'
      groups[status].push(o)
    })
    return groups
  }, [filtered])

  const refresh = async () => {
    const { data } = await dataService.orders.list()
    setOrders(data || [])
  }
  const handleEdit = (order) => setEditingOrder(order)
  const handleEmail = (order) => setEmailOrder(order)
  const handleWhatsApp = async (order) => {
    try {
      const result = await api.sendOrderWhatsApp(order.id)
      if (result?.success) showToast('success', 'تم إرسال الفاتورة عبر واتساب ✓')
      else showToast('error', 'فشل الإرسال: ' + (result?.phone || 'لا يوجد رقم'))
    } catch (e) { showToast('error', 'فشل: ' + e.message) }
  }
  const handlePrint = (order) => {
    window.open(`${SERVER_BASE}/labels/label_${order.id}.pdf`, '_blank')
  }
  const handleStatusChange = async (order, newStatus) => {
    try {
      await api.updateOrder(order.id, { status: newStatus })
      await refresh()
      showToast('success', `تم تغيير الحالة إلى ${statusLabels[newStatus]} ✓`)
    } catch (e) { showToast('error', 'فشل التحديث: ' + e.message) }
  }

  const handleDragStart = (e, order) => { setDraggedOrder(order); e.dataTransfer.effectAllowed = 'move' }
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
  const handleDrop = (e, status) => {
    e.preventDefault()
    if (draggedOrder && draggedOrder.status !== status) {
      handleStatusChange(draggedOrder, status)
    }
    setDraggedOrder(null)
  }

  // Stats
  const stats = useMemo(() => ({
    total: orders.length,
    today: orders.filter(o => {
      if (!o.created_at) return false
      const d = new Date(o.created_at); const t = new Date()
      return d.getDate() === t.getDate() && d.getMonth() === t.getMonth()
    }).length,
    pending: orders.filter(o => o.status === 'PROCESSING' || o.status === 'PENDING').length,
    revenue: orders.reduce((sum, o) => sum + Number(o.grand_total || 0), 0),
  }), [orders])

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-bold animate-slide-in ${toast.type === 'success' ? 'bg-gradient-to-l from-emerald-500 to-teal-600' : 'bg-gradient-to-l from-rose-500 to-red-600'}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">إدارة الطلبات</h1>
              {dataSource && (
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  dataSource === 'supabase'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60'
                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200/60'
                }`} title={dataSource === 'supabase' ? 'قراءة مباشرة من Supabase' : 'قراءة عبر Backend (fallback)'}>
                  <Database className="w-2.5 h-2.5" />
                  {dataSource === 'supabase' ? 'Supabase' : 'Backend'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{stats.total} طلب • {stats.pending} قيد المعالجة</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
              <button
                onClick={() => setView('table')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${view === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <List className="w-3.5 h-3.5" /> جدول
              </button>
              <button
                onClick={() => setView('kanban')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${view === 'kanban' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> كانبان
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text" placeholder="بحث برقم الطلب، الاسم، الهاتف..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 font-semibold">
            <option value="all">جميع الحالات</option>
            {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 font-semibold">
            <option value="all">جميع القنوات</option>
            <option value="whatsapp">واتساب</option>
            <option value="facebook">فيسبوك</option>
            <option value="instagram">إنستغرام</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي الطلبات', value: stats.total, color: 'blue' },
          { label: 'طلبات اليوم', value: stats.today, color: 'emerald' },
          { label: 'قيد المعالجة', value: stats.pending, color: 'amber' },
          { label: 'إجمالي الإيرادات', value: `${(stats.revenue / 1000).toFixed(1)}k دج`, color: 'violet' },
        ].map((s, i) => (
          <div key={i} className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
            <p className={`text-xl font-extrabold mt-1 ${colorVariants[s.color].text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          جاري التحميل...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-6">
          <EmptyState icon={Package} title="لا توجد طلبات" description="لم يتم العثور على طلبات تطابق الفلاتر" />
        </div>
      ) : view === 'table' ? (
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/30">
                  <th className="text-right p-3 font-bold">رقم</th>
                  <th className="text-right p-3 font-bold">العميل</th>
                  <th className="text-right p-3 font-bold">الهاتف</th>
                  <th className="text-right p-3 font-bold">المبلغ</th>
                  <th className="text-right p-3 font-bold">القناة</th>
                  <th className="text-right p-3 font-bold">الحالة</th>
                  <th className="text-right p-3 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, i) => {
                  const name = o.address ? o.address.split(',')[0] : '—'
                  const total = o.grand_total ? `${parseFloat(o.grand_total).toLocaleString()} دج` : '—'
                  const st = orderStatus[o.status] || orderStatus.PENDING
                  const platform = channelConfig[o.platform]
                  return (
                    <tr key={o.id || i} className="border-t border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="p-3 font-bold text-blue-600 dark:text-blue-400">#{o.id?.slice(0, 6)}</td>
                      <td className="p-3 font-semibold text-slate-700 dark:text-slate-200">
                        <div className="flex items-center gap-2">
                          <Avatar name={name} size="xs" />
                          {name}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{o.phone || '—'}</td>
                      <td className="p-3 font-extrabold text-slate-800 dark:text-slate-100">{total}</td>
                      <td className="p-3">
                        {platform && (
                          <span className="text-[10px] font-bold flex items-center gap-1 w-fit" style={{ color: platform.hex }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: platform.hex }}></span>
                            {platform.name}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge color={st.color} size="sm" dot>{st.label}</Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEdit(o)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 transition-colors" title="تعديل">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleWhatsApp(o)} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600 transition-colors" title="واتساب">
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleEmail(o)} className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-400 hover:text-indigo-600 transition-colors" title="بريد">
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handlePrint(o)} className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-400 hover:text-amber-600 transition-colors" title="طباعة">
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // KANBAN VIEW
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {KANBAN_COLUMNS.map(status => {
            const st = orderStatus[status]
            const cards = groupedByStatus[status] || []
            return (
              <div
                key={status}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
                className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-3 min-h-[300px] flex flex-col"
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${colorVariants[st.color].dot}`}></span>
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">{st.label}</h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-full">{cards.length}</span>
                </div>
                <div className="space-y-2 flex-1 overflow-y-auto scrollbar-none">
                  {cards.length === 0 ? (
                    <div className="text-center text-[10px] text-slate-400 py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                      اسحب هنا
                    </div>
                  ) : (
                    cards.map(o => (
                      <OrderCard
                        key={o.id}
                        order={o}
                        onEdit={handleEdit}
                        onEmail={handleEmail}
                        onWhatsApp={handleWhatsApp}
                        onPrint={handlePrint}
                        draggable
                        isDragging={draggedOrder?.id === o.id}
                        onDragStart={(e) => handleDragStart(e, o)}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editingOrder && <EditModal order={editingOrder} onClose={() => setEditingOrder(null)} onSaved={refresh} showToast={showToast} />}
      {emailOrder && <EmailModal order={emailOrder} onClose={() => setEmailOrder(null)} showToast={showToast} />}
    </div>
  )
}
