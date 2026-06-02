import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, CheckCircle, AlertCircle, X, Package } from 'lucide-react'
import { api } from '../api.js'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    id: '',
    name_ar: '',
    name_fr: '',
    price_dzd: '',
    stock: '',
    category: '',
    active: true
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

  useEffect(() => {
    loadProducts()
  }, [])

  const handleOpenAdd = () => {
    setIsEditing(false)
    setForm({
      id: '',
      name_ar: '',
      name_fr: '',
      price_dzd: '',
      stock: '',
      category: '',
      active: true
    })
    setShowModal(true)
  }

  const handleOpenEdit = (p) => {
    setIsEditing(true)
    setForm({
      id: p.id,
      name_ar: p.name_ar || '',
      name_fr: p.name_fr || '',
      price_dzd: p.price_dzd || '',
      stock: p.stock || '',
      category: p.category || '',
      active: p.active !== false && p.active !== 'false'
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً؟')) return
    try {
      await api.deleteProduct(id)
      showToast('success', 'تم حذف المنتج بنجاح')
      loadProducts()
    } catch (err) {
      showToast('error', 'فشل حذف المنتج: ' + err.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.id || !form.name_ar || !form.price_dzd || form.stock === '') {
      showToast('error', 'يرجى ملء جميع الحقول الإلزامية')
      return
    }

    const payload = {
      id: form.id.toUpperCase().trim(),
      name_ar: form.name_ar.trim(),
      name_fr: form.name_fr.trim(),
      price_dzd: parseFloat(form.price_dzd),
      stock: parseInt(form.stock),
      category: form.category.trim() || 'عام',
      active: form.active
    }

    try {
      if (isEditing) {
        await api.updateProduct(form.id, payload)
        showToast('success', 'تم تحديث المنتج بنجاح')
      } else {
        // Check if ID already exists
        if (products.some(p => p.id === payload.id)) {
          showToast('error', 'معرّف المنتج (SKU) موجود بالفعل!')
          return
        }
        await api.createProduct(payload)
        showToast('success', 'تمت إضافة المنتج بنجاح')
      }
      setShowModal(false)
      loadProducts()
    } catch (err) {
      showToast('error', 'فشل حفظ المنتج: ' + err.message)
    }
  }

  const filtered = products.filter(p =>
    !search || 
    p.name_ar?.toLowerCase().includes(search.toLowerCase()) || 
    p.name_fr?.toLowerCase().includes(search.toLowerCase()) || 
    p.id?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Toast Notification */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl text-white transition-all duration-300 transform ${toast ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'} ${toast?.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'}`}>
        {toast?.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
        <span className="text-sm font-medium">{toast?.message}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة المنتجات</h1>
          <p className="text-sm text-gray-500">عرض وإضافة وتعديل وحذف المنتجات من قاعدة البيانات الحقيقية.</p>
        </div>
        <div className="flex gap-2 self-end sm:self-auto">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="بحث باسم المنتج أو الرمز..." value={search} onChange={e => setSearch(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl pr-9 pl-3 py-2 w-56 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all" />
          </div>
          <button onClick={handleOpenAdd}
            className="text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl px-4 py-2 hover:from-blue-700 hover:to-indigo-700 flex items-center gap-1.5 shadow-md shadow-blue-500/10 hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0">
            <Plus className="w-4 h-4" /> إضافة منتج
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
          <p className="text-sm">جاري تحميل المنتجات الحقيقية...</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-sm">
          <Package className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">لم يتم العثور على أي منتجات</p>
          <p className="text-xs text-gray-400 mt-1">تأكد من إعدادات البحث أو قم بإضافة أول منتج للمتجر.</p>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!loading && filtered.map((p) => {
          const isActive = p.active !== false && p.active !== 'false';
          return (
            <div key={p.id} 
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wider">{p.id}</span>
                    <h3 className="font-semibold text-gray-800 text-base mt-1 group-hover:text-blue-600 transition-colors">{p.name_ar}</h3>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">{p.name_fr || '—'} • <span className="text-gray-500">{p.category || 'عام'}</span></p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {isActive ? 'نشط' : 'موقوف'}
                  </span>
                </div>

                <div className="my-4">
                  <span className="text-2xl font-black text-gray-800">{parseFloat(p.price_dzd || 0).toLocaleString()} دج</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-2">
                <span className={`text-xs font-semibold ${parseInt(p.stock) < 10 ? 'text-rose-600 bg-rose-50 px-2 py-1 rounded-lg' : 'text-gray-500 bg-gray-50 px-2 py-1 rounded-lg'}`}>
                  المخزون: {p.stock} {parseInt(p.stock) < 10 ? '⚠️ (قارب على النفاد)' : ''}
                </span>
                <div className="flex gap-1.5">
                  <button onClick={() => handleOpenEdit(p)}
                    className="p-2 border border-gray-100 text-gray-600 hover:text-blue-600 hover:border-blue-100 rounded-xl hover:bg-blue-50/50 transition-all">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(p.id)}
                    className="p-2 border border-gray-100 text-gray-400 hover:text-rose-600 hover:border-rose-100 rounded-xl hover:bg-rose-50/50 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Beautiful Glassmorphic Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          
          {/* Modal Container */}
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <div>
                <h3 className="font-bold text-lg">{isEditing ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}</h3>
                <p className="text-xs text-blue-100 mt-0.5">أدخل البيانات لحفظها مباشرة في قاعدة البيانات.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">رمز المنتج (SKU) *</label>
                  <input type="text" value={form.id} onChange={e => setForm({ ...form, id: e.target.value })}
                    disabled={isEditing}
                    placeholder="مثال: P06"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">الفئة</label>
                  <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    placeholder="مثال: أحذية، ملابس"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">الاسم باللغة العربية *</label>
                <input type="text" value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })}
                  placeholder="اسم المنتج باللغة العربية"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-sm" required />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">الاسم باللغة الفرنسية</label>
                <input type="text" value={form.name_fr} onChange={e => setForm({ ...form, name_fr: e.target.value })}
                  placeholder="Nom du produit en français"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-sm" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">السعر (دج) *</label>
                  <input type="number" value={form.price_dzd} onChange={e => setForm({ ...form, price_dzd: e.target.value })}
                    placeholder="السعر بالدينار الجزائري"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">الكمية في المخزون *</label>
                  <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                    placeholder="الكمية المتوفرة"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-sm" required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">الحالة النشطة للمنتج</label>
                <select value={form.active ? 'true' : 'false'} onChange={e => setForm({ ...form, active: e.target.value === 'true' })}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-sm">
                  <option value="true">نشط (يظهر للذكاء الاصطناعي وللعملاء)</option>
                  <option value="false">موقوف (مخفي مؤقتاً)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)}
                  className="text-sm border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors text-gray-600">
                  إلغاء
                </button>
                <button type="submit"
                  className="text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl px-5 py-2 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/10 hover:shadow-lg transition-all">
                  {isEditing ? 'تحديث المنتج' : 'إضافة المنتج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
