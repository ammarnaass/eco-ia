import { useState, useEffect, useMemo } from 'react'
import {
  Search, Plus, Edit2, Trash2, CheckCircle, AlertCircle, X, Package,
  Tag, DollarSign, Boxes, Eye, EyeOff, Filter, Loader2
} from 'lucide-react'
import { api } from '../api.js'
import { gradients, colorVariants } from '../lib/design-tokens.js'
import EmptyState from '../components/ui/EmptyState.jsx'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [toast, setToast] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    id: '', name_ar: '', name_fr: '', price_dzd: '', stock: '', category: '', active: true
  })

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const loadProducts = () => {
    setLoading(true)
    api.getProducts()
      .then(setProducts)
      .catch((err) => {
        showToast('error', 'فشل تحميل المنتجات: ' + err.message)
        setProducts([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadProducts() }, [])

  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category || 'عام'))]
    return cats
  }, [products])

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !search ||
        p.name_ar?.toLowerCase().includes(search.toLowerCase()) ||
        p.name_fr?.toLowerCase().includes(search.toLowerCase()) ||
        p.id?.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || (p.category || 'عام') === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [products, search, categoryFilter])

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter(p => p.active !== false && p.active !== 'false').length,
    lowStock: products.filter(p => parseInt(p.stock) < 10).length,
    totalValue: products.reduce((sum, p) => sum + (parseFloat(p.price_dzd) || 0) * (parseInt(p.stock) || 0), 0),
  }), [products])

  const handleOpenAdd = () => {
    setIsEditing(false)
    setForm({ id: '', name_ar: '', name_fr: '', price_dzd: '', stock: '', category: '', active: true })
    setShowModal(true)
  }

  const handleOpenEdit = (p) => {
    setIsEditing(true)
    setForm({
      id: p.id, name_ar: p.name_ar || '', name_fr: p.name_fr || '',
      price_dzd: p.price_dzd || '', stock: p.stock || '',
      category: p.category || '', active: p.active !== false && p.active !== 'false'
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً؟')) return
    try {
      await api.deleteProduct(id)
      showToast('success', 'تم حذف المنتج بنجاح')
      loadProducts()
    } catch (err) { showToast('error', 'فشل حذف المنتج: ' + err.message) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.id || !form.name_ar || !form.price_dzd || form.stock === '') {
      showToast('error', 'يرجى ملء جميع الحقول الإلزامية')
      return
    }
    const payload = {
      id: form.id.toUpperCase().trim(),
      name_ar: form.name_ar.trim(), name_fr: form.name_fr.trim(),
      price_dzd: parseFloat(form.price_dzd), stock: parseInt(form.stock),
      category: form.category.trim() || 'عام', active: form.active
    }
    try {
      if (isEditing) {
        await api.updateProduct(form.id, payload)
        showToast('success', 'تم تحديث المنتج بنجاح')
      } else {
        if (products.some(p => p.id === payload.id)) {
          showToast('error', 'معرّف المنتج (SKU) موجود بالفعل!')
          return
        }
        await api.createProduct(payload)
        showToast('success', 'تمت إضافة المنتج بنجاح')
      }
      setShowModal(false)
      loadProducts()
    } catch (err) { showToast('error', 'فشل حفظ المنتج: ' + err.message) }
  }

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-bold animate-slide-in ${toast.type === 'success' ? 'bg-gradient-to-l from-emerald-500 to-teal-600' : 'bg-gradient-to-l from-rose-500 to-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">إدارة المنتجات</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{stats.total} منتج • {stats.active} نشط</p>
          </div>
          <button onClick={handleOpenAdd}
            className="text-xs font-bold text-white bg-gradient-to-l from-blue-600 to-indigo-600 hover:opacity-90 rounded-xl px-4 py-2 flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all">
            <Plus className="w-3.5 h-3.5" /> إضافة منتج
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" placeholder="بحث بالاسم أو الرمز..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 font-semibold">
            <option value="all">جميع الفئات</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي المنتجات', value: stats.total, color: 'blue' },
          { label: 'منتجات نشطة', value: stats.active, color: 'emerald' },
          { label: 'مخزون منخفض', value: stats.lowStock, color: 'rose' },
          { label: 'قيمة المخزون', value: `${(stats.totalValue / 1000).toFixed(1)}k دج`, color: 'violet' },
        ].map((s, i) => (
          <div key={i} className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
            <p className={`text-xl font-extrabold mt-1 ${colorVariants[s.color].text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          جاري التحميل...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-6">
          <EmptyState icon={Package} title="لا توجد منتجات" description="أضف منتجك الأول للبدء" action={
            <button onClick={handleOpenAdd} className="text-xs font-bold text-white bg-gradient-to-l from-blue-600 to-indigo-600 rounded-xl px-4 py-2 flex items-center gap-1.5 mx-auto">
              <Plus className="w-3.5 h-3.5" /> إضافة منتج
            </button>
          } />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((p, i) => {
            const isActive = p.active !== false && p.active !== 'false'
            const stock = parseInt(p.stock) || 0
            const isLowStock = stock < 10
            return (
              <div
                key={p.id}
                className="group relative overflow-hidden bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 animate-slide-in"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {/* Product image placeholder */}
                <div className={`relative h-32 ${gradients.brand} overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package className="w-12 h-12 text-white/30" strokeWidth={1.5} />
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="text-[9px] font-bold bg-white/20 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-md">
                      {p.id}
                    </span>
                  </div>
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${isActive ? 'bg-emerald-500/30 text-white' : 'bg-rose-500/30 text-white'}`}>
                      {isActive ? 'نشط' : 'موقوف'}
                    </span>
                    {isLowStock && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/30 text-white">
                        ⚠️ {stock}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{p.name_ar}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                    {p.name_fr || '—'} <span className="text-slate-300 dark:text-slate-600">•</span> {p.category || 'عام'}
                  </p>
                  <div className="mt-2 flex items-end justify-between">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">السعر</p>
                      <p className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                        {parseFloat(p.price_dzd || 0).toLocaleString()}
                        <span className="text-[10px] font-bold text-slate-400 mr-0.5">دج</span>
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">المخزون</p>
                      <p className={`text-sm font-extrabold ${isLowStock ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                        {stock}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                    <button onClick={() => handleOpenEdit(p)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-[11px] font-bold transition-colors">
                      <Edit2 className="w-3 h-3" /> تعديل
                    </button>
                    <button onClick={() => handleDelete(p.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-scale-in">
            <div className={`${gradients.brand} px-6 py-4 flex items-center justify-between text-white`}>
              <div>
                <h3 className="font-bold text-base">{isEditing ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}</h3>
                <p className="text-[10px] text-blue-100 mt-0.5">أدخل البيانات للحفظ المباشر</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-full hover:bg-white/10 text-white/90 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">رمز المنتج (SKU) *</label>
                  <input type="text" value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} disabled={isEditing}
                    placeholder="P06"
                    className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900/40 disabled:opacity-60 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none font-mono" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">الفئة</label>
                  <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    placeholder="أحذية، ملابس..."
                    className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900/40 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">الاسم بالعربية *</label>
                <input type="text" value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })}
                  placeholder="اسم المنتج بالعربية"
                  className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900/40 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">الاسم بالفرنسية</label>
                <input type="text" value={form.name_fr} onChange={e => setForm({ ...form, name_fr: e.target.value })}
                  placeholder="Nom du produit"
                  className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900/40 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">السعر (دج) *</label>
                  <input type="number" value={form.price_dzd} onChange={e => setForm({ ...form, price_dzd: e.target.value })}
                    placeholder="2500"
                    className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900/40 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none font-mono" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">المخزون *</label>
                  <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                    placeholder="50"
                    className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900/40 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none font-mono" required />
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">المنتج نشط</span>
                <button type="button" onClick={() => setForm({ ...form, active: !form.active })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${form.active ? 'right-0.5' : 'right-5'}`}></span>
                </button>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  إلغاء
                </button>
                <button type="submit"
                  className="flex-1 text-xs font-bold text-white bg-gradient-to-l from-blue-600 to-indigo-600 hover:opacity-90 rounded-xl px-4 py-2.5 shadow-md transition-all">
                  {isEditing ? 'حفظ التغييرات' : 'إضافة المنتج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
