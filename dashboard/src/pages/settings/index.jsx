import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Save, Loader2, Bot, Phone, MessageCircle, Key, DollarSign, Shield, Globe, Sliders, Search } from 'lucide-react'
import { api } from '../../api.js'
import { gradients, colorVariants } from '../../lib/design-tokens.js'

import Toast from './components/Toast.jsx'
import TabSidebar from './components/TabSidebar.jsx'

import WhatsAppTab from './tabs/WhatsAppTab.jsx'
import MetaTab from './tabs/MetaTab.jsx'
import ChannelsTab from './tabs/ChannelsTab.jsx'
import AiKeysTab from './tabs/AiKeysTab.jsx'
import ShippingTab from './tabs/ShippingTab.jsx'
import BudgetTab from './tabs/BudgetTab.jsx'
import ExtraTab from './tabs/ExtraTab.jsx'

const tabInfo = {
  whatsapp:  { title: 'إدارة قنوات واتساب',     desc: 'ربط الحسابات وإعدادات Webhook',        icon: Phone },
  meta:      { title: 'فيسبوك وإنستغرام',       desc: 'إعدادات Meta APIs (Messenger + IG)',   icon: MessageCircle },
  channels:  { title: 'الردود التلقائية',         desc: 'تفعيل AI لكل قناة واختيار النماذج',   icon: Bot },
  ai_keys:   { title: 'مفاتيح الذكاء الاصطناعي', desc: 'Google / OpenAI / Anthropic API Keys', icon: Key },
  shipping:  { title: 'الشحن والتوصيل',          desc: 'أسعار الولايات الجزائرية',             icon: DollarSign },
  budget:    { title: 'الميزانية والأمان',       desc: 'حدود الصرف وإعدادات الخصوصية',        icon: Shield },
  extra:     { title: 'خدمات إضافية',            desc: 'Cloudinary, Sheets, Gmail SMTP',       icon: Globe },
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('whatsapp')
  const [config, setConfig] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    api.getConfig().then(data => setConfig(data || {})).catch(() => setConfig({}))
  }, [])

  // Handle ?tab=... from URL (from Command Palette)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab && tabInfo[tab]) setActiveTab(tab)
  }, [])

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

  const tabComponents = {
    whatsapp: <WhatsAppTab config={config} showToast={showToast} />,
    meta:     <MetaTab config={config} handleConfigChange={handleConfigChange} showToast={showToast} />,
    channels: <ChannelsTab config={config} handleConfigChange={handleConfigChange} />,
    ai_keys:  <AiKeysTab config={config} handleConfigChange={handleConfigChange} />,
    shipping: <ShippingTab config={config} handleConfigChange={handleConfigChange} showToast={showToast} />,
    budget:   <BudgetTab config={config} handleConfigChange={handleConfigChange} />,
    extra:    <ExtraTab config={config} handleConfigChange={handleConfigChange} />,
  }

  const current = tabInfo[activeTab]
  const CurrentIcon = current.icon
  const needsSaveButton = activeTab !== 'whatsapp'

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      <Toast toast={toast} />

      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl ${gradients.brand} flex items-center justify-center shadow-lg shadow-blue-500/30`}>
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">إعدادات المنظومة</h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{current.desc}</p>
            </div>
          </div>
          {needsSaveButton && (
            <button onClick={handleSave} disabled={saving}
              className="text-xs font-bold text-white bg-gradient-to-l from-blue-600 to-indigo-600 hover:opacity-90 rounded-xl px-5 py-2.5 flex items-center gap-2 shadow-md disabled:opacity-50 transition-all">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <TabSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="flex-1 w-full bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-sm min-h-[500px]">
          {/* Section title */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${colorVariants[activeTab === 'meta' ? 'blue' : activeTab === 'channels' ? 'violet' : activeTab === 'shipping' ? 'orange' : activeTab === 'ai_keys' ? 'amber' : 'emerald'].bg} ${colorVariants[activeTab === 'meta' ? 'blue' : activeTab === 'channels' ? 'violet' : activeTab === 'shipping' ? 'orange' : activeTab === 'ai_keys' ? 'amber' : 'emerald'].text} flex items-center justify-center`}>
              <CurrentIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">{current.title}</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">{current.desc}</p>
            </div>
          </div>

          <div className="p-5">
            {tabComponents[activeTab]}
          </div>

          {needsSaveButton && (
            <div className="flex items-center justify-end p-5 border-t border-slate-100 dark:border-slate-700/50">
              <button onClick={handleSave} disabled={saving}
                className="text-xs font-bold text-white bg-gradient-to-l from-blue-600 to-indigo-600 hover:opacity-90 rounded-xl px-5 py-2.5 flex items-center gap-2 shadow-md disabled:opacity-50 transition-all">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? 'جاري الحفظ...' : 'حفظ ومزامنة السيرفر'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
