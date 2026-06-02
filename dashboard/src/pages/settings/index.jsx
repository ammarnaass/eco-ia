import { useState, useEffect } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import { api } from '../../api.js'

import Toast from './components/Toast.jsx'
import TabSidebar from './components/TabSidebar.jsx'

import WhatsAppTab from './tabs/WhatsAppTab.jsx'
import MetaTab from './tabs/MetaTab.jsx'
import ChannelsTab from './tabs/ChannelsTab.jsx'
import AiKeysTab from './tabs/AiKeysTab.jsx'
import ShippingTab from './tabs/ShippingTab.jsx'
import BudgetTab from './tabs/BudgetTab.jsx'
import ExtraTab from './tabs/ExtraTab.jsx'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('whatsapp')
  const [config, setConfig] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    api.getConfig().then(data => setConfig(data)).catch(() => setConfig({}))
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
    meta: <MetaTab config={config} handleConfigChange={handleConfigChange} showToast={showToast} />,
    channels: <ChannelsTab config={config} handleConfigChange={handleConfigChange} />,
    ai_keys: <AiKeysTab config={config} handleConfigChange={handleConfigChange} />,
    shipping: <ShippingTab config={config} handleConfigChange={handleConfigChange} showToast={showToast} />,
    budget: <BudgetTab config={config} handleConfigChange={handleConfigChange} />,
    extra: <ExtraTab config={config} handleConfigChange={handleConfigChange} />,
  }

  const needsSaveButton = activeTab !== 'whatsapp'

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <Toast toast={toast} />

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

        {needsSaveButton && (
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
        <TabSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Tab Content Panel */}
        <div className="flex-1 w-full bg-white rounded-2xl border border-gray-100 p-6 shadow-xs min-h-[400px]">
          {tabComponents[activeTab]}

          {needsSaveButton && (
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
