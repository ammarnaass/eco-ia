import { useState, useEffect } from 'react'
import {
  Bot, Key, Globe, DollarSign, Bell, Shield, Phone, Trash2, Plus,
  CheckCircle, AlertCircle, Copy, Check, Info, Settings as SettingsIcon, Link2,
  MessageCircle, Truck, MapPin, Sliders
} from 'lucide-react'
import { api } from '../api.js'

const defaultWilayas = {
  "01": { name: "أدرار", price_home: 700, price_desk: 550 },
  "02": { name: "الشلف", price_home: 500, price_desk: 350 },
  "03": { name: "الأغواط", price_home: 550, price_desk: 400 },
  "04": { name: "أم البواقي", price_home: 500, price_desk: 350 },
  "05": { name: "باتنة", price_home: 550, price_desk: 400 },
  "06": { name: "بجاية", price_home: 500, price_desk: 350 },
  "07": { name: "بسكرة", price_home: 700, price_desk: 550 },
  "08": { name: "بشار", price_home: 700, price_desk: 550 },
  "09": { name: "البليدة", price_home: 400, price_desk: 300 },
  "10": { name: "البويرة", price_home: 500, price_desk: 350 },
  "11": { name: "تمنراست", price_home: 700, price_desk: 550 },
  "12": { name: "تبسة", price_home: 500, price_desk: 350 },
  "13": { name: "تلمسان", price_home: 500, price_desk: 350 },
  "14": { name: "تيارت", price_home: 500, price_desk: 350 },
  "15": { name: "تيزي وزو", price_home: 500, price_desk: 350 },
  "16": { name: "الجزائر", price_home: 400, price_desk: 300 },
  "17": { name: "الجلفة", price_home: 550, price_desk: 400 },
  "18": { name: "جيجل", price_home: 500, price_desk: 350 },
  "19": { name: "سطيف", price_home: 500, price_desk: 350 },
  "20": { name: "سعيدة", price_home: 500, price_desk: 350 },
  "21": { name: "سكيكدة", price_home: 500, price_desk: 350 },
  "22": { name: "سيدي بلعباس", price_home: 500, price_desk: 350 },
  "23": { name: "عنابة", price_home: 500, price_desk: 350 },
  "24": { name: "قالمة", price_home: 500, price_desk: 350 },
  "25": { name: "قسنطينة", price_home: 500, price_desk: 350 },
  "26": { name: "المدية", price_home: 500, price_desk: 350 },
  "27": { name: "مستغانم", price_home: 500, price_desk: 350 },
  "28": { name: "المسيلة", price_home: 550, price_desk: 400 },
  "29": { name: "معسكر", price_home: 500, price_desk: 350 },
  "30": { name: "ورقلة", price_home: 700, price_desk: 550 },
  "31": { name: "وهران", price_home: 500, price_desk: 350 },
  "32": { name: "البيض", price_home: 700, price_desk: 550 },
  "33": { name: "إليزي", price_home: 700, price_desk: 550 },
  "34": { name: "برج بوعريريج", price_home: 550, price_desk: 400 },
  "35": { name: "بومرداس", price_home: 400, price_desk: 300 },
  "36": { name: "الطارف", price_home: 500, price_desk: 350 },
  "37": { name: "تندوف", price_home: 700, price_desk: 550 },
  "38": { name: "تيسمسيلت", price_home: 500, price_desk: 350 },
  "39": { name: "الوادي", price_home: 700, price_desk: 550 },
  "40": { name: "خنشلة", price_home: 500, price_desk: 350 },
  "41": { name: "سوق أهراس", price_home: 500, price_desk: 350 },
  "42": { name: "تيبازة", price_home: 400, price_desk: 300 },
  "43": { name: "ميلة", price_home: 500, price_desk: 350 },
  "44": { name: "عين الدفلى", price_home: 500, price_desk: 350 },
  "45": { name: "النعامة", price_home: 700, price_desk: 550 },
  "46": { name: "عين تموشنت", price_home: 500, price_desk: 350 },
  "47": { name: "غرداية", price_home: 700, price_desk: 550 },
  "48": { name: "غليزان", price_home: 500, price_desk: 350 }
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState('whatsapp')
  const [accounts, setAccounts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ phone_number_id: '', waba_id: '', access_token: '', verify_token: '', label: '' })
  const [config, setConfig] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [copiedField, setCopiedField] = useState(null)
  
  const [wilayaSearch, setWilayaSearch] = useState('')
  const [newWilaya, setNewWilaya] = useState({ code: '', name: '', price_home: '', price_desk: '' })
  const [wilayaPrices, setWilayaPrices] = useState({})

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const getApiWarning = (ch) => {
    const isBotActive = config[ch.replyKey] !== 'false'
    if (!isBotActive) return null
    
    const chosenModel = config[ch.modelKey] || ''
    
    if (chosenModel.startsWith('google/') && !config.GOOGLE_AI_API_KEY) {
      return 'مفتاح Google AI مفقود! يرجى تعيينه في تبويب المفاتيح لتشغيل البوت.'
    }
    if (chosenModel.startsWith('openai/') && !config.OPENAI_API_KEY) {
      return 'مفتاح OpenAI مفقود! يرجى تعيينه في تبويب المفاتيح لتشغيل البوت.'
    }
    if (chosenModel.startsWith('anthropic/') && !config.ANTHROPIC_API_KEY) {
      return 'مفتاح Anthropic مفقود! يرجى تعيينه في تبويب المفاتيح لتشغيل البوت.'
    }
    if (!chosenModel && !config.GOOGLE_AI_API_KEY && !config.OPENAI_API_KEY && !config.ANTHROPIC_API_KEY) {
      return 'يرجى تعيين مفتاح API واحد على الأقل (Google أو OpenAI أو Anthropic) لتشغيل الموجه الذكي الافتراضي.'
    }
    return null
  }

  const handleUpdateWilayaPrice = (code, field, val) => {
    const updated = {
      ...wilayaPrices,
      [code]: {
        ...wilayaPrices[code],
        [field]: val
      }
    }
    setWilayaPrices(updated)
    handleConfigChange('WILAYA_SHIPPING_PRICES', JSON.stringify(updated))
  }

  const handleDeleteWilaya = (code) => {
    if (confirm(`هل أنت متأكد من حذف ولاية (${wilayaPrices[code]?.name || code})؟`)) {
      const updated = { ...wilayaPrices }
      delete updated[code]
      setWilayaPrices(updated)
      handleConfigChange('WILAYA_SHIPPING_PRICES', JSON.stringify(updated))
      showToast('success', 'تم حذف الولاية من القائمة')
    }
  }

  const handleAddWilaya = () => {
    const { code, name, price_home, price_desk } = newWilaya
    if (!code || !name || !price_home || !price_desk) {
      showToast('error', 'يرجى ملء جميع حقول إضافة الولاية')
      return
    }
    if (wilayaPrices[code]) {
      showToast('error', 'رمز هذه الولاية موجود بالفعل!')
      return
    }
    const updated = {
      ...wilayaPrices,
      [code]: {
        name,
        price_home: parseInt(price_home),
        price_desk: parseInt(price_desk)
      }
    }
    setWilayaPrices(updated)
    handleConfigChange('WILAYA_SHIPPING_PRICES', JSON.stringify(updated))
    setNewWilaya({ code: '', name: '', price_home: '', price_desk: '' })
    showToast('success', `تم إدراج ولاية ${name} بنجاح`)
  }

  const filteredWilayas = Object.entries(wilayaPrices).filter(([code, data]) => {
    const search = wilayaSearch.toLowerCase()
    return code.includes(search) || (data.name && data.name.toLowerCase().includes(search))
  }).sort((a, b) => parseInt(a[0]) - parseInt(b[0]))

  useEffect(() => {
    api.getWhatsAppAccounts().then(setAccounts).catch(() => setAccounts([]))
    api.getConfig().then(data => {
      setConfig(data)
      if (data.WILAYA_SHIPPING_PRICES) {
        try {
          setWilayaPrices(JSON.parse(data.WILAYA_SHIPPING_PRICES))
        } catch (e) {
          setWilayaPrices(defaultWilayas)
        }
      } else {
        setWilayaPrices(defaultWilayas)
      }
    }).catch(() => setConfig({}))
  }, [])

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

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const entries = Object.entries(config).map(([key, value]) => ({ key, value }))
      await api.saveConfig(entries)
      showToast('success', 'تم حفظ جميع التغييرات وتحديث السيرفر فوراً')
    } catch (e) {
      showToast('error', 'فشل الحفظ: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Get active API Base URL to construct dynamic Webhook URL helper
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  const webhookUrl = `${API_BASE.replace('/api', '')}/api/whatsapp/webhook`

  const tabs = [
    { id: 'whatsapp', name: 'قنوات واتساب', icon: Phone },
    { id: 'facebook_instagram', name: 'فيسبوك وإنستغرام', icon: MessageCircle },
    { id: 'channels', name: 'الردود التلقائية والقنوات', icon: Bot },
    { id: 'ai_keys', name: 'مفاتيح الـ API ومزودي الخدمة', icon: Key },
    { id: 'shipping', name: 'الشحن والتوصيل', icon: DollarSign },
    { id: 'budget', name: 'الميزانية والأمان', icon: Shield },
    { id: 'extra', name: 'خدمات إضافية', icon: Globe },
  ]

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      {/* Premium Toast Notification */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl text-white transition-all duration-300 transform ${toast ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-10 opacity-0 scale-95 pointer-events-none'} ${toast?.type === 'success' ? 'bg-emerald-600 border border-emerald-500/30' : 'bg-red-500 border border-red-400/30'}`}>
        {toast?.type === 'success' ? <CheckCircle className="w-5 h-5 animate-bounce" /> : <AlertCircle className="w-5 h-5 animate-pulse" />}
        <span className="text-sm font-semibold">{toast?.message}</span>
      </div>

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <SettingsIcon className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">إعدادات المنظومة</h1>
            <p className="text-xs text-gray-400 mt-0.5">اضبط مفاتيح الـ API، حسابات واتساب، وأسعار الشحن وسيرفر البوت</p>
          </div>
        </div>
        
        {activeTab !== 'whatsapp' && (
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full md:w-auto text-sm font-semibold bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-6 py-3 shadow-md hover:shadow-lg disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <span>حفظ جميع التغييرات</span>
            )}
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Tab Sidebar switcher */}
        <div className="w-full lg:w-64 bg-white p-3 rounded-2xl border border-gray-100 shadow-xs flex flex-row lg:flex-col gap-1 overflow-x-auto shrink-0 scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer text-right whitespace-nowrap lg:w-full ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 shadow-xs border-r-4 border-blue-600' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="flex-1 w-full bg-white rounded-2xl border border-gray-100 p-6 shadow-xs min-h-[400px]">
          
          {/* TAB 1: WhatsApp Configuration */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-6">
              
              {/* API Integration Guide Card */}
              <div className="p-4 bg-linear-to-l from-emerald-50/50 to-white border border-emerald-100 rounded-2xl">
                <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-1.5 mb-2.5">
                  <Link2 className="w-4 h-4" />
                  بيانات الـ Webhook لتسجيلها في فيسبوك (Meta)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-emerald-700 mb-1">رابط استدعاء الـ Webhook (Callback URL)</label>
                    <div className="flex items-center gap-2 bg-white border border-emerald-100 rounded-lg p-2 font-mono text-xs text-gray-700 select-all relative">
                      <span className="truncate flex-1">{webhookUrl}</span>
                      <button 
                        onClick={() => handleCopy(webhookUrl, 'url')}
                        className="p-1 hover:bg-gray-100 rounded-sm text-gray-400 hover:text-emerald-600 transition-colors"
                        title="نسخ الرابط"
                      >
                        {copiedField === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-700 mb-1">رمز التحقق (Verify Token) المتطابق في فيسبوك</label>
                    <div className="flex items-center gap-2 bg-white border border-emerald-100 rounded-lg p-2 font-mono text-xs text-gray-700 select-all relative">
                      <span className="truncate flex-1">{config.FB_VERIFY_TOKEN || '0555220620'}</span>
                      <button 
                        onClick={() => handleCopy(config.FB_VERIFY_TOKEN || '0555220620', 'token')}
                        className="p-1 hover:bg-gray-100 rounded-sm text-gray-400 hover:text-emerald-600 transition-colors"
                        title="نسخ الرمز"
                      >
                        {copiedField === 'token' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-emerald-600/80 mt-2.5 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  <span>تأكد من تحديد خيار <b>messages</b> تحت حقول الـ Webhook في Meta Developer لتلقي الرسائل وتفعيل البوت!</span>
                </p>
              </div>

              {/* Accounts Card List */}
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
                          onChange={e => setForm({ ...form, 'access_token': e.target.value })}
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
                            {a.label ? a.label.slice(0,2) : 'WA'}
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
          )}

          {/* TAB 1.5: Facebook & Instagram Configuration */}
          {activeTab === 'facebook_instagram' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* API Integration Guide Card */}
              <div className="p-5 bg-linear-to-l from-blue-50/50 to-white border border-blue-100 rounded-2xl">
                <h3 className="text-sm font-bold text-blue-800 flex items-center gap-1.5 mb-3">
                  <Link2 className="w-4 h-4" />
                  بيانات الـ Webhook لتسجيلها في فيسبوك للقرّاء والمطورين (Meta Developers)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-blue-700 mb-1">رابط استدعاء فيسبوك (Facebook Callback URL)</label>
                    <div className="flex items-center gap-2 bg-white border border-blue-100 rounded-lg p-2 font-mono text-xs text-gray-700 select-all relative">
                      <span className="truncate flex-1">{`${API_BASE.replace('/api', '')}/webhook/facebook`}</span>
                      <button 
                        onClick={() => handleCopy(`${API_BASE.replace('/api', '')}/webhook/facebook`, 'fb_url')}
                        className="p-1 hover:bg-gray-100 rounded-sm text-gray-400 hover:text-blue-600 transition-colors"
                        title="نسخ الرابط"
                      >
                        {copiedField === 'fb_url' ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-700 mb-1">رابط استدعاء إنستغرام (Instagram Callback URL)</label>
                    <div className="flex items-center gap-2 bg-white border border-blue-100 rounded-lg p-2 font-mono text-xs text-gray-700 select-all relative">
                      <span className="truncate flex-1">{`${API_BASE.replace('/api', '')}/webhook/instagram`}</span>
                      <button 
                        onClick={() => handleCopy(`${API_BASE.replace('/api', '')}/webhook/instagram`, 'ig_url')}
                        className="p-1 hover:bg-gray-100 rounded-sm text-gray-400 hover:text-blue-600 transition-colors"
                        title="نسخ الرابط"
                      >
                        {copiedField === 'ig_url' ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-white border border-blue-50 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-gray-800">خطوات إعداد الـ API في Meta Developers:</h4>
                  <ul className="list-decimal list-inside text-xs text-gray-600 space-y-1.5 leading-relaxed">
                    <li>قم بإنشاء تطبيق من نوع <b>Business</b> في لوحة مطوري فيسبوك.</li>
                    <li>أضف منتج <b>Messenger</b> ومنتج <b>Instagram Graph API</b> إلى تطبيقك.</li>
                    <li>في إعدادات الـ Webhooks لمنتج <b>Messenger</b>، أضف رابط فيسبوك أعلاه مع رمز التحقق، واشترك في حقل <code>messages</code> و <code>messaging_postbacks</code>.</li>
                    <li>في إعدادات الـ Webhooks لمنتج <b>Instagram</b>، أضف رابط إنستغرام أعلاه مع رمز التحقق، واشترك في حقل <code>messages</code> و <code>comments</code>.</li>
                    <li>قم بتوليد <b>رمز وصول الصفحة (Page Access Token)</b> للمسنجر، وانسخ <b>معرف حساب إنستغرام التجاري (Instagram Business ID)</b>، ثم أدخلهما أدناه.</li>
                  </ul>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-800">بيانات الربط والمفاتيح</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700">رمز وصول الصفحة (Page Access Token)</label>
                    <textarea 
                      value={config.FB_PAGE_TOKEN || ''} 
                      onChange={e => handleConfigChange('FB_PAGE_TOKEN', e.target.value)}
                      placeholder="رمز طويل يبدأ بـ EAAL..."
                      className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-2xs font-mono h-20 resize-none" 
                    />
                    <span className="text-[10px] text-gray-400 block">مفتاح الوصول الدائم للصفحة المراد استقبال وإرسال رسائلها.</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700">معرف حساب إنستغرام التجاري (Instagram Business ID)</label>
                    <input 
                      type="text" 
                      value={config.INSTAGRAM_BUSINESS_ID || ''} 
                      onChange={e => handleConfigChange('INSTAGRAM_BUSINESS_ID', e.target.value)}
                      placeholder="مثال: 17841400000000000"
                      className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-2xs font-mono" 
                    />
                    <span className="text-[10px] text-gray-400 block">المعرف الرقمي لحساب Instagram Business المرتبط بصفحتك.</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700">رمز التحقق للويب هوك (Verify Token)</label>
                    <input 
                      type="text" 
                      value={config.FB_VERIFY_TOKEN || ''} 
                      onChange={e => handleConfigChange('FB_VERIFY_TOKEN', e.target.value)}
                      placeholder="Verify Token المختار"
                      className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-2xs font-mono" 
                    />
                    <span className="text-[10px] text-gray-400 block">الرمز الذي تضعه في لوحة Meta للتحقق من هوية السيرفر الخاص بك.</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700">مفتاح التطبيق السري (Meta App Secret)</label>
                    <input 
                      type="password" 
                      value={config.META_APP_SECRET || ''} 
                      onChange={e => handleConfigChange('META_APP_SECRET', e.target.value)}
                      placeholder="••••••••••••••••••••••••••••••••"
                      className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-2xs font-mono" 
                    />
                    <span className="text-[10px] text-gray-400 block">يُستخدم للتحقق من صحة التوقيع الوارد (SHA256) وتأمين الاتصال تماماً.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Bot Auto-Reply & Channels */}
          {activeTab === 'channels' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-1">الردود الذكية وتوجيه البوت للقنوات</h3>
                <p className="text-xs text-gray-400 mb-6">حدد القنوات التي يمتلك البوت الصلاحية للرد عليها آلياً، واشترط نماذج مخصصة لكل قناة عند الحاجة</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      id: 'whatsapp',
                      name: 'واتساب (WhatsApp)',
                      replyKey: 'WHATSAPP_AI_REPLY',
                      modelKey: 'WHATSAPP_AI_MODEL',
                      color: 'border-emerald-100 bg-emerald-50/10 text-emerald-700 hover:bg-emerald-50/20',
                      badgeColor: 'bg-emerald-50 border-emerald-100 text-emerald-600',
                    },
                    {
                      id: 'facebook',
                      name: 'فيسبوك (Messenger)',
                      replyKey: 'FACEBOOK_AI_REPLY',
                      modelKey: 'FACEBOOK_AI_MODEL',
                      color: 'border-blue-100 bg-blue-50/10 text-blue-700 hover:bg-blue-50/20',
                      badgeColor: 'bg-blue-50 border-blue-100 text-blue-600',
                    },
                    {
                      id: 'instagram',
                      name: 'إنستغرام (Instagram)',
                      replyKey: 'INSTAGRAM_AI_REPLY',
                      modelKey: 'INSTAGRAM_AI_MODEL',
                      color: 'border-purple-100 bg-purple-50/10 text-purple-700 hover:bg-purple-50/20',
                      badgeColor: 'bg-purple-50 border-purple-100 text-purple-600',
                    }
                  ].map(ch => (
                    <div key={ch.id} className="p-5 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-4 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-gray-800">{ch.name}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${ch.badgeColor}`}>
                          {ch.id}
                        </span>
                      </div>
                      
                      {/* Toggle control */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-gray-500">حالة الرد التلقائي</label>
                        <div className="flex rounded-lg overflow-hidden border border-gray-200 p-0.5 bg-gray-50/80 max-w-full">
                          <button
                            type="button"
                            onClick={() => handleConfigChange(ch.replyKey, 'true')}
                            className={`flex-1 text-center py-1.5 px-3 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                              config[ch.replyKey] !== 'false'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            تفعيل البوت
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfigChange(ch.replyKey, 'false')}
                            className={`flex-1 text-center py-1.5 px-3 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                              config[ch.replyKey] === 'false'
                                ? 'bg-rose-500 text-white shadow-xs'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            إيقاف الرد
                          </button>
                        </div>
                      </div>

                      {/* Custom model select */}
                      <div className="space-y-1.5 pt-2 border-t border-gray-100">
                        <label className="block text-[11px] font-bold text-gray-500">النموذج المخصص للقناة</label>
                        <select
                          value={config[ch.modelKey] || ''}
                          onChange={e => handleConfigChange(ch.modelKey, e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-semibold"
                        >
                          <option value="">استخدام الموجه التلقائي (Router)...</option>
                          {[
                            { value: 'google/gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
                            { value: 'google/gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
                            { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
                            { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
                            { value: 'openai/gpt-4o', label: 'GPT-4o' },
                            { value: 'anthropic/claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
                            { value: 'anthropic/claude-3-5-sonnet', label: 'Claude 3.5 Sonnet' },
                          ].map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <span className="text-[9px] text-gray-400 block mt-1 leading-normal">
                          في حال تحديد خيار (الموجه التلقائي)، سيقوم محرك التوجيه باختيار النموذج الأنسب لمحتوى المحادثة تلقائياً.
                        </span>
                      </div>

                      {/* API warning alert if active and key is missing */}
                      {getApiWarning(ch) && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-[10px] text-red-600 leading-normal animate-pulse-once mt-3">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{getApiWarning(ch)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2.5: API Credentials & Providers */}
          {activeTab === 'ai_keys' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-1">مفاتيح مزودي الذكاء الاصطناعي</h3>
                <p className="text-xs text-gray-400 mb-4">ادخل مفاتيح الـ API الخاصة بالشركات لتفعيل النماذج الخارجية والربط الذكي</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Google AI API Key (Gemini)', key: 'GOOGLE_AI_API_KEY', type: 'password', desc: 'مفتاح شركة جوجل لتشغيل نموذج Gemini' },
                    { label: 'OpenAI API Key (GPT)', key: 'OPENAI_API_KEY', type: 'password', desc: 'مفتاح شركة OpenAI لتشغيل نموذج ChatGPT' },
                    { label: 'Anthropic API Key (Claude)', key: 'ANTHROPIC_API_KEY', type: 'password', desc: 'مفتاح شركة Anthropic لتشغيل نموذج Claude' },
                  ].map(f => (
                    <div key={f.key} className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-700">{f.label}</label>
                      <input 
                        type={f.type} 
                        value={config[f.key] || ''} 
                        onChange={e => handleConfigChange(f.key, e.target.value)}
                        placeholder="••••••••••••••••••••••••••••••••"
                        className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-2xs font-mono" 
                      />
                      <span className="text-[10px] text-gray-400 block">{f.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-bold text-gray-800 mb-1">النماذج الافتراضية المفعلة</h3>
                <p className="text-xs text-gray-400 mb-4">اختر النماذج الافتراضية التي سيعمل بها الموجه الذكي (AI Router) حسب متطلبات المحادثة</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'نموذج Gemini الافتراضي', key: 'GOOGLE_DEFAULT_MODEL', options: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'] },
                    { label: 'نموذج ChatGPT الافتراضي', key: 'OPENAI_DEFAULT_MODEL', options: ['gpt-4o-mini', 'gpt-4o'] },
                    { label: 'نموذج Claude الافتراضي', key: 'CLAUDE_DEFAULT_MODEL', options: ['claude-sonnet-4-5', 'claude-opus-4-5', 'claude-3-5-sonnet'] },
                  ].map(f => (
                    <div key={f.key} className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-700">{f.label}</label>
                      <select 
                        value={config[f.key] || ''} 
                        onChange={e => handleConfigChange(f.key, e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-2xs font-semibold"
                      >
                        <option value="">اختر النموذج...</option>
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Shipping & Delivery with Dynamic Wilaya CRUD */}
          {activeTab === 'shipping' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-1">إدارة شحن الولايات التفاعلي</h3>
                <p className="text-xs text-gray-400 mb-6">اضبط أسعار الشحن لكل ولاية على حدة بشكل منفصل للتوصيل للمنزل أو الاستلام من المكتب. يمكنك إضافة ولايات جديدة، تعديل الأسعار، أو حذفها ديناميكياً.</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  
                  {/* Right side: Wilaya CRUD table/grid (2 cols span) */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-5">
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h4 className="text-xs font-bold text-gray-800">قائمة تسعير الولايات النشطة</h4>
                          <span className="text-[10px] text-gray-400 block mt-0.5">اضبط أسعار شحن وتوصيل الطرود للولايات؛ سيتم حفظ التعديلات مباشرة.</span>
                        </div>
                        
                        {/* Search Input */}
                        <div className="relative w-full sm:w-64">
                          <input
                            type="text"
                            placeholder="بحث عن ولاية بالاسم أو الرمز..."
                            value={wilayaSearch}
                            onChange={e => setWilayaSearch(e.target.value)}
                            className="w-full text-xs border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-right transition-all"
                          />
                        </div>
                      </div>

                      {/* Premium Add Wilaya Sub-Form */}
                      <div className="bg-gray-50/70 border border-gray-100 p-4 rounded-xl space-y-3.5 shadow-2xs">
                        <h5 className="text-[10px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          إدراج ولاية مخصصة جديدة للمنظومة
                        </h5>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[9px] font-bold text-gray-500 mb-1">رمز الولاية (مثال: 58)</label>
                            <input
                              type="text"
                              placeholder="مثال: 58"
                              value={newWilaya.code}
                              onChange={e => setNewWilaya({ ...newWilaya, code: e.target.value })}
                              className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-gray-500 mb-1">اسم الولاية (مثال: المنيعة)</label>
                            <input
                              type="text"
                              placeholder="اسم الولاية"
                              value={newWilaya.name}
                              onChange={e => setNewWilaya({ ...newWilaya, name: e.target.value })}
                              className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-gray-500 mb-1">سعر التوصيل للمنزل (دج)</label>
                            <input
                              type="number"
                              placeholder="سعر المنزل"
                              value={newWilaya.price_home}
                              onChange={e => setNewWilaya({ ...newWilaya, price_home: e.target.value })}
                              className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-gray-500 mb-1">سعر التوصيل للمكتب (دج)</label>
                            <input
                              type="number"
                              placeholder="سعر المكتب"
                              value={newWilaya.price_desk}
                              onChange={e => setNewWilaya({ ...newWilaya, price_desk: e.target.value })}
                              className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddWilaya}
                          className="text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all rounded-lg px-4 py-2.5 cursor-pointer shadow-sm hover:shadow-md flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إدراج وتفعيل الولاية</span>
                        </button>
                      </div>

                      {/* Dynamic Table Layout */}
                      <div className="max-h-[380px] overflow-y-auto border border-gray-100 rounded-xl bg-white shadow-3xs overflow-x-auto scrollbar-thin">
                        <table className="w-full text-xs text-right border-collapse">
                          <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-semibold sticky top-0 bg-gray-50 z-10">
                              <th className="p-3 font-semibold text-center w-16">الرمز</th>
                              <th className="p-3 font-semibold">اسم الولاية</th>
                              <th className="p-3 font-semibold text-center w-48">توصيل للمنزل (دج)</th>
                              <th className="p-3 font-semibold text-center w-48">توصيل للمكتب (دج)</th>
                              <th className="p-3 font-semibold text-center w-16">إجراءات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {filteredWilayas.length === 0 ? (
                              <tr>
                                <td colSpan="5" className="p-8 text-center text-xs text-gray-400">
                                  لا توجد نتائج بحث مطابقة للمدخلات الحالية
                                </td>
                              </tr>
                            ) : (
                              filteredWilayas.map(([code, data]) => (
                                <tr key={code} className="hover:bg-blue-50/10 transition-colors group">
                                  <td className="p-3 text-center font-bold text-gray-500 font-mono">{code}</td>
                                  <td className="p-3 font-bold text-gray-800">{data.name}</td>
                                  
                                  {/* Home Delivery Input Cell */}
                                  <td className="p-3">
                                    <div className="flex items-center gap-1.5 max-w-[150px] mx-auto">
                                      <input
                                        type="number"
                                        value={data.price_home}
                                        onChange={e => handleUpdateWilayaPrice(code, 'price_home', e.target.value)}
                                        className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-center font-bold text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono"
                                      />
                                      <span className="text-[9px] text-gray-400 font-semibold">دج</span>
                                    </div>
                                  </td>

                                  {/* Desk Delivery Input Cell */}
                                  <td className="p-3">
                                    <div className="flex items-center gap-1.5 max-w-[150px] mx-auto">
                                      <input
                                        type="number"
                                        value={data.price_desk}
                                        onChange={e => handleUpdateWilayaPrice(code, 'price_desk', e.target.value)}
                                        className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-center font-bold text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono"
                                      />
                                      <span className="text-[9px] text-gray-400 font-semibold">دج</span>
                                    </div>
                                  </td>

                                  {/* Action Delete Cell */}
                                  <td className="p-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteWilaya(code)}
                                      className="p-1.5 border border-transparent hover:border-red-100 hover:bg-red-50 text-gray-300 hover:text-red-600 rounded-lg transition-all cursor-pointer inline-flex items-center"
                                      title="حذف الولاية"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                    </div>
                  </div>

                  {/* Left side: Free shipping config & Integrations */}
                  <div className="space-y-4">
                    
                    {/* Free shipping minimum */}
                    <div className="p-5 rounded-2xl border border-dashed border-gray-200 bg-white space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                          الشحن المجاني
                        </h4>
                        <span className="text-[10px] text-gray-400 block mt-0.5">شحن مجاني بالكامل إذا تجاوز المجموع هذا المبلغ</span>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-500">الحد الأدنى للشحن المجاني</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={config.FREE_SHIPPING_MIN !== undefined ? config.FREE_SHIPPING_MIN : ''} 
                            onChange={e => handleConfigChange('FREE_SHIPPING_MIN', e.target.value)}
                            placeholder="مثال: 5000"
                            className="w-full text-xs border border-gray-200 rounded-lg pl-8 pr-3 py-2.5 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-bold text-emerald-700" 
                          />
                          <span className="absolute left-3 top-2.5 text-[9px] font-bold text-gray-400">دج</span>
                        </div>
                      </div>
                    </div>

                    {/* Shipping Integrations API Keys */}
                    <div className="p-5 rounded-2xl border border-gray-100 bg-white space-y-4 shadow-3xs">
                      <h4 className="text-xs font-bold text-gray-800">تكامل شركات التوصيل</h4>
                      {[
                        { label: 'Yalidine Express API Key', key: 'YALIDINE_KEY', type: 'password', desc: 'مفتاح Yalidine Express لتوليد الباركود' },
                        { label: 'Maystro Delivery API Key', key: 'MAYSTRO_KEY', type: 'password', desc: 'مفتاح منصة Maystro للتحديث المباشر' },
                      ].map(f => (
                        <div key={f.key} className="space-y-1">
                          <label className="block text-[10px] font-bold text-gray-700">{f.label}</label>
                          <input 
                            type={f.type} 
                            value={config[f.key] || ''} 
                            onChange={e => handleConfigChange(f.key, e.target.value)}
                            placeholder="••••••••••••••••••••••••••••••••"
                            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white outline-none focus:ring-1 focus:ring-blue-500 font-mono" 
                          />
                          <span className="text-[9px] text-gray-400 block">{f.desc}</span>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Budget & Security */}
          {activeTab === 'budget' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-1">الميزانيات والتحكم بالتكلفة</h3>
                <p className="text-xs text-gray-400 mb-4">اضبط الحدود المالية لتفادي الفواتير المرتفعة لمزودي الذكاء الاصطناعي</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'الميزانية اليومية القصوى', key: 'DAILY_BUDGET', desc: 'حد الصرف الأقصى بالدولار يومياً' },
                    { label: 'الميزانية الشهرية القصوى', key: 'MONTHLY_BUDGET', desc: 'حد الصرف الأقصى بالدولار شهرياً' },
                    { label: 'الحد الأقصى لكل محادثة', key: 'MODEL_BUDGET', desc: 'تكلفة الرموز المسموح بها للعميل الواحد' },
                  ].map(f => (
                    <div key={f.key} className="space-y-1.5 bg-gray-50/50 p-3 rounded-xl border border-gray-50">
                      <label className="block text-xs font-bold text-gray-700">{f.label}</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={config[f.key] || ''} 
                          onChange={e => handleConfigChange(f.key, e.target.value)}
                          placeholder="مثال: 10"
                          className="w-full text-xs border border-gray-200 rounded-lg pl-8 pr-3 py-2.5 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" 
                        />
                        <span className="absolute left-3 top-2.5 text-[10px] font-bold text-gray-400">USD</span>
                      </div>
                      <span className="text-[9px] text-gray-400 block">{f.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-bold text-gray-800 mb-1">أمان النظام والوصول</h3>
                <p className="text-xs text-gray-400 mb-4">إعدادات خصوصية وأمان لوحة التحكم لمنع الاختراق أو الدخول غير المصرح</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700">صلاحية جلسة تسجيل الدخول</label>
                    <select 
                      value={config.SESSION_TTL || ''} 
                      onChange={e => handleConfigChange('SESSION_TTL', e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-2xs font-semibold"
                    >
                      <option value="">اختر...</option>
                      {['ساعة', '24 ساعة', '7 أيام', '30 يوم'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700">المصادقة الثنائية (2FA)</label>
                    <select 
                      value={config.MFA || ''} 
                      onChange={e => handleConfigChange('MFA', e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-2xs font-semibold"
                    >
                      <option value="">اختر...</option>
                      {['مفعل', 'معطل'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Extra Configurations */}
          {activeTab === 'extra' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-1">خدمات تخزين وسحابية إضافية</h3>
                <p className="text-xs text-gray-400 mb-4">اربط الخدمات الخارجية المساندة لتخزين الصور والملفات وتحديث السجلات</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Cloudinary API Key / URL', key: 'CLOUDINARY_KEY', type: 'password', desc: 'لرفع وتخزين صور المنتجات وحفظ لقطات فواتير الشحن سحابياً' },
                    { label: 'سجلات Google Sheets Spreadsheet ID', key: 'GOOGLE_SHEETS_ID', type: 'text', desc: 'رابط ملف جوجل شيتس الذي سيتم إدراج الطلبات المؤكدة فيه تلقائياً' },
                  ].map(f => (
                    <div key={f.key} className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-700">{f.label}</label>
                      <input 
                        type={f.type} 
                        value={config[f.key] || ''} 
                        onChange={e => handleConfigChange(f.key, e.target.value)}
                        placeholder={f.type === 'password' ? '••••••••••••••••••••••••••••••••' : 'ادخل القيمة...'}
                        className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-2xs font-mono" 
                      />
                      <span className="text-[10px] text-gray-400 block">{f.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gmail / SMTP Email Settings */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-bold text-gray-800 mb-1">إعدادات البريد الإلكتروني (Gmail SMTP)</h3>
                <p className="text-xs text-gray-400 mb-4">
                  اضبط إعدادات Gmail لإرسال الفواتير مرفقة عبر البريد. استخدم <b>App Password</b> من حساب Google (لا كلمة المرور الأصلية).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'SMTP Host', key: 'SMTP_HOST', type: 'text', placeholder: 'smtp.gmail.com', desc: 'خادم البريد (smtp.gmail.com لـ Gmail)' },
                    { label: 'SMTP Port', key: 'SMTP_PORT', type: 'text', placeholder: '465', desc: '465 لـ SSL أو 587 لـ TLS' },
                    { label: 'البريد المُرسِل (SMTP User)', key: 'SMTP_USER', type: 'text', placeholder: 'your@gmail.com', desc: 'بريد Gmail المستخدم للإرسال' },
                    { label: 'كلمة مرور التطبيق (App Password)', key: 'SMTP_PASS', type: 'password', placeholder: 'xxxx xxxx xxxx xxxx', desc: 'App Password من إعدادات أمان Google' },
                    { label: 'اسم المُرسِل (SMTP From)', key: 'SMTP_FROM', type: 'text', placeholder: 'متجر الذكاء الاصطناعي', desc: 'الاسم الظاهر في حقل "من" للمرسل إليه' },
                  ].map(f => (
                    <div key={f.key} className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-700">{f.label}</label>
                      <input
                        type={f.type}
                        value={config[f.key] || ''}
                        onChange={e => handleConfigChange(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-2xs font-mono"
                      />
                      <span className="text-[10px] text-gray-400 block">{f.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab Footer Save Button */}
          {activeTab !== 'whatsapp' && (
            <div className="flex items-center justify-end mt-8 pt-5 border-t border-gray-100">
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="w-full sm:w-auto text-xs font-bold bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-6 py-3.5 shadow-xs hover:shadow-md disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>جاري حفظ البيانات...</span>
                  </>
                ) : (
                  <span>حفظ وإعادة مزامنة السيرفر</span>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
