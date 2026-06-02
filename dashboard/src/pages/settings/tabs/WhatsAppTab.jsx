import { useState, useEffect } from 'react'
import {
  Link2, Plus, Trash2, Check, Copy, Info, Phone, ShieldCheck,
  AlertCircle, Loader2, RefreshCw, ExternalLink, CheckCircle2, XCircle, Database
} from 'lucide-react'
import { api } from '../../../api.js'
import CopyField from '../components/CopyField.jsx'

export default function WhatsAppTab({ config, showToast }) {
  const [accounts, setAccounts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ phone_number_id: '', waba_id: '', access_token: '', verify_token: '', label: '' })
  const [waInfo, setWaInfo] = useState(null)
  const [waLoading, setWaLoading] = useState(true)
  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting] = useState(false)

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  const webhookUrl = `${API_BASE.replace('/api', '')}/api/whatsapp/webhook`

  const loadAccounts = async () => {
    try { setAccounts(await api.getWhatsAppAccounts()) } catch { setAccounts([]) }
  }

  const loadInfo = async () => {
    setWaLoading(true)
    try {
      const info = await api.getWhatsAppInfo()
      setWaInfo(info)
    } catch (e) {
      setWaInfo({ has_credentials: false, source: 'error', database_accounts: [] })
    } finally {
      setWaLoading(false)
    }
  }

  useEffect(() => { loadAccounts(); loadInfo() }, [])

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
      loadInfo()
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
        loadInfo()
      } catch (e) {
        showToast('error', 'فشل الحذف: ' + e.message)
      }
    }
  }

  const runTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await api.testWhatsAppConnection()
      setTestResult(result)
      if (result.success) showToast('success', result.message)
      else showToast('error', result.message)
    } catch (e) {
      setTestResult({ success: false, message: 'فشل: ' + e.message })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Active WhatsApp Account Card (from env or DB) */}
      <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm ${
        waInfo?.has_credentials
          ? 'bg-gradient-to-l from-emerald-50/60 to-white border-emerald-200/60 dark:from-emerald-900/10 dark:to-slate-800/60 dark:border-emerald-800/40'
          : 'bg-gradient-to-l from-amber-50/60 to-white border-amber-200/60 dark:from-amber-900/10 dark:to-slate-800/60 dark:border-amber-800/40'
      }`}>
        <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-white/40 blur-2xl"></div>
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                waInfo?.has_credentials
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30'
                  : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30'
              }`}>
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  {waLoading ? 'جاري التحميل...' : waInfo?.has_credentials ? 'حساب WhatsApp مربوط' : 'لا يوجد حساب مربوط'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {waInfo?.source === 'env' && 'مصدر الإعدادات: ملف البيئة (crm-bot/.env)'}
                  {waInfo?.source === 'database' && `مصدر الإعدادات: قاعدة البيانات (${waInfo.database_accounts.length} حساب)`}
                  {waInfo?.source === 'none' && 'يرجى إعداد WHATSAPP_TOKEN و WHATSAPP_PHONE_ID في ملف .env'}
                  {waInfo?.source === 'error' && 'تعذر الاتصال بالخادم'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadInfo}
                disabled={waLoading}
                className="p-2 rounded-xl bg-white/60 dark:bg-slate-700/40 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                title="تحديث"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${waLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={runTest}
                disabled={testing || !waInfo?.has_credentials}
                className="text-[11px] font-bold text-white bg-gradient-to-l from-emerald-500 to-teal-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl px-3.5 py-2 flex items-center gap-1.5 shadow-md transition-all"
              >
                {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                اختبار الاتصال
              </button>
            </div>
          </div>

          {/* Account details */}
          {waInfo?.has_credentials && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 border border-emerald-100/60 dark:border-emerald-900/30">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone Number ID</p>
                <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-100 mt-1">{waInfo.phone_number_id || '—'}</p>
              </div>
              <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 border border-emerald-100/60 dark:border-emerald-900/30">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Access Token</p>
                <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100 mt-1 truncate" title={waInfo.access_token_preview}>
                  {waInfo.access_token_preview || '—'}
                </p>
              </div>
            </div>
          )}

          {/* Test result */}
          {testResult && (
            <div className={`mt-3 p-3 rounded-xl flex items-start gap-2 text-[11px] ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40'
                : 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-800/40'
            }`}>
              {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />}
              <div className="flex-1">
                <p className={`font-bold ${testResult.success ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                  {testResult.message}
                </p>
                {testResult.phone && (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-slate-300">
                    {testResult.phone.verified_name && <div><b>الاسم:</b> {testResult.phone.verified_name}</div>}
                    {testResult.phone.display_phone_number && <div><b>الرقم:</b> {testResult.phone.display_phone_number}</div>}
                    {testResult.phone.quality_rating && <div><b>الجودة:</b> {testResult.phone.quality_rating}</div>}
                    {testResult.webhook_url && <div className="col-span-2 truncate"><b>Webhook:</b> <code>{testResult.webhook_url}</code></div>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

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
        <a
          href="https://developers.facebook.com/apps/"
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
        >
          فتح Meta Developers <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* DB Accounts List (if any) */}
      {accounts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              الحسابات المربوطة في قاعدة البيانات
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-bold">
                {accounts.length}
              </span>
            </h3>
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
        </div>
      )}

      {/* If no DB accounts and we have env, show prompt to add to DB */}
      {accounts.length === 0 && waInfo?.has_credentials && (
        <div className="p-5 rounded-2xl border border-blue-200/60 dark:border-blue-800/40 bg-blue-50/30 dark:bg-blue-900/10 text-center">
          <Database className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">حسابك يعمل عبر ملف البيئة</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            لإدارة الحساب من الواجهة (إعادة ربط، تشفير، تبديل سريع) أضفه إلى قاعدة البيانات.
          </p>
          <button
            onClick={() => setShowForm(!showForm)}
            className="mt-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> إضافة إلى قاعدة البيانات
          </button>
        </div>
      )}
    </div>
  )
}
