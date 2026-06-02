import { useState } from 'react'
import { Link2, Plus, Trash2, Check, Copy, Info } from 'lucide-react'
import { api } from '../../../api.js'
import CopyField from '../components/CopyField.jsx'

export default function WhatsAppTab({ config, showToast }) {
  const [accounts, setAccounts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ phone_number_id: '', waba_id: '', access_token: '', verify_token: '', label: '' })
  const [copiedField, setCopiedField] = useState(null)

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  const webhookUrl = `${API_BASE.replace('/api', '')}/api/whatsapp/webhook`

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleAdd = async () => {
    if (!form.phone_number_id || !form.access_token || !form.verify_token) {
      showToast('error', 'يرجى ملء جميع الحقول الإلزامية')
      return
    }
    try {
      await api.createWhatsAppAccount(form)
      setAccounts(await api.getWhatsAppAccounts())
      setShowForm(false)
      setForm({ phone_number_id: '', waba_id: '', access_token: '', verify_token: '', label: '' })
      showToast('success', 'تم ربط حساب واتساب بنجاح')
    } catch (e) {
      showToast('error', 'فشل الربط: ' + e.message)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا الحساب؟ سيتم إلغاء تفعيل الـ Webhook له.')) {
      try {
        await api.deleteWhatsAppAccount(id)
        setAccounts(await api.getWhatsAppAccounts())
        showToast('success', 'تم حذف الحساب بنجاح')
      } catch (e) {
        showToast('error', 'فشل الحذف: ' + e.message)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Webhook Guide Card */}
      <div className="p-4 bg-linear-to-l from-emerald-50/50 to-white border border-emerald-100 rounded-2xl">
        <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-1.5 mb-2.5">
          <Link2 className="w-4 h-4" />
          بيانات الـ Webhook لتسجيلها في فيسبوك (Meta)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CopyField label="رابط استدعاء الـ Webhook (Callback URL)" value={webhookUrl} fieldKey="url" color="emerald" />
          <CopyField label="رمز التحقق (Verify Token)" value={config.FB_VERIFY_TOKEN || '0555220620'} fieldKey="token" color="emerald" />
        </div>
        <p className="text-[11px] text-emerald-600/80 mt-2.5 flex items-center gap-1">
          <Info className="w-3 h-3" />
          <span>تأكد من تحديد خيار <b>messages</b> تحت حقول الـ Webhook في Meta Developer لتلقي الرسائل وتفعيل البوت!</span>
        </p>
      </div>

      {/* Accounts List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-800">الحسابات المربوطة حالياً</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 transition-all rounded-lg px-3.5 py-2 cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{showForm ? 'إلغاء الإضافة' : 'إضافة حساب جديد'}</span>
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-50/60 border border-gray-100 rounded-2xl p-5 mb-5 space-y-4 animate-fadeIn">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">إعدادات الحساب الجديد</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'معرف رقم الهاتف (Phone Number ID) *', key: 'phone_number_id', type: 'text', placeholder: 'مثال: 1211917795327372' },
                { label: 'معرف الحساب التجاري (WABA ID) - اختياري', key: 'waba_id', type: 'text', placeholder: 'مثال: 1008195798326294' },
                { label: 'تسمية الحساب (Label) - اختياري', key: 'label', type: 'text', placeholder: 'مثال: An SHOP' },
                { label: 'رمز التحقق المخصص (Verify Token) *', key: 'verify_token', type: 'text', placeholder: 'مثال: 0555220620' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-2xs"
                  />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-600 mb-1.5">رمز الوصول الدائم (System User Access Token) *</label>
                <textarea
                  placeholder="الرمز الطويل الخاص بفيسبوك EAAL..."
                  value={form.access_token}
                  onChange={e => setForm({ ...form, access_token: e.target.value })}
                  className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-2xs h-20 resize-none font-mono"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 cursor-pointer shadow-sm"
              >
                حفظ وربط الحساب
              </button>
            </div>
          </div>
        )}

        {accounts.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 text-sm">
            لا توجد حسابات واتساب مهيأة في قاعدة البيانات بعد. أضف حسابك للبدء في استقبال وإرسال الرسائل.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {accounts.map(a => (
              <div key={a.id} className="flex items-center justify-between p-4 bg-gray-50/50 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                    {a.label ? a.label.slice(0, 2) : 'WA'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-800">{a.label || 'حساب بدون اسم'}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 font-semibold">مفعل ونشط</span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                      Phone ID: <span className="text-gray-600 font-bold">{a.phone_number_id}</span>
                      {a.waba_id && ` | WABA: ${a.waba_id}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="p-2 border border-gray-100 hover:border-red-100 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-all cursor-pointer"
                  title="حذف هذا الحساب"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
