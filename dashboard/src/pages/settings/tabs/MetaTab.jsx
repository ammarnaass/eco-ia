import { useState } from 'react'
import { Link2, Globe, MessageSquare, Camera, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import CopyField from '../components/CopyField.jsx'

export default function MetaTab({ config, handleConfigChange, showToast }) {
  const [testing, setTesting] = useState({ facebook: false, instagram: false })
  const [testResult, setTestResult] = useState({ facebook: null, instagram: null })

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  const facebookWebhook = `${API_BASE.replace('/api', '')}/webhook/facebook`
  const instagramWebhook = `${API_BASE.replace('/api', '')}/webhook/instagram`

  const runTest = async (platform) => {
    setTesting(prev => ({ ...prev, [platform]: true }))
    setTestResult(prev => ({ ...prev, [platform]: null }))
    try {
      const res = await fetch(`${API_BASE}/test-connection?platform=${platform}`, { method: 'POST' })
      const data = await res.json()
      setTestResult(prev => ({ ...prev, [platform]: data.success ? 'success' : 'error' }))
      showToast(data.success ? 'success' : 'error', data.message || (data.success ? 'تم التحقق بنجاح' : 'فشل الاتصال'))
    } catch (e) {
      setTestResult(prev => ({ ...prev, [platform]: 'error' }))
      showToast('error', 'فشل اختبار الاتصال: ' + e.message)
    }
    setTesting(prev => ({ ...prev, [platform]: false }))
  }

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* Webhook URLs Banner */}
      <div className="p-5 bg-linear-to-l from-blue-50/50 to-white border border-blue-100 rounded-2xl">
        <h3 className="text-sm font-bold text-blue-800 flex items-center gap-1.5 mb-3">
          <Link2 className="w-4 h-4" />
          روابط Webhook للتسجيل في Meta Developers
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CopyField label="فيسبوك ماسنجر (Facebook Callback URL)" value={facebookWebhook} fieldKey="fb_url" color="blue" />
          <CopyField label="إنستغرام (Instagram Callback URL)" value={instagramWebhook} fieldKey="ig_url" color="purple" />
        </div>
      </div>

      {/* Facebook Messenger Section */}
      <div className="p-6 rounded-2xl border border-blue-100 bg-white shadow-xs space-y-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-800">فيسبوك ماسنجر (Facebook Messenger)</h3>
            <p className="text-[11px] text-gray-400">إعدادات API فيسبوك لاستقبال وإرسال الرسائل</p>
          </div>
        </div>

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
            <label className="block text-xs font-bold text-gray-700">معرف الصفحة (Page ID) - اختياري</label>
            <input
              type="text"
              value={config.FB_PAGE_ID || ''}
              onChange={e => handleConfigChange('FB_PAGE_ID', e.target.value)}
              placeholder="مثال: 123456789012345"
              className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-2xs font-mono"
            />
            <span className="text-[10px] text-gray-400 block">معرف الصفحة على فيسبوك (يُستخدم للتعريف فقط).</span>
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
            <span className="text-[10px] text-gray-400 block">الرمز الذي تضعه في لوحة Meta للتحقق من هوية السيرفر.</span>
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

        {/* Facebook Test Connection */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => runTest('facebook')}
            disabled={testing.facebook}
            className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {testing.facebook ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
            اختبار اتصال فيسبوك
          </button>
          {testResult.facebook === 'success' && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
              <CheckCircle className="w-3.5 h-3.5" /> الاتصال ناجح
            </span>
          )}
          {testResult.facebook === 'error' && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-red-500">
              <AlertCircle className="w-3.5 h-3.5" /> فشل الاتصال
            </span>
          )}
        </div>
      </div>

      {/* Instagram Section */}
      <div className="p-6 rounded-2xl border border-purple-100 bg-white shadow-xs space-y-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-800">إنستغرام (Instagram)</h3>
            <p className="text-[11px] text-gray-400">إعدادات API إنستغرام لاستقبال الرسائل والتعليقات</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">معرف حساب إنستغرام التجاري (Instagram Business ID)</label>
            <input
              type="text"
              value={config.INSTAGRAM_BUSINESS_ID || ''}
              onChange={e => handleConfigChange('INSTAGRAM_BUSINESS_ID', e.target.value)}
              placeholder="مثال: 17841400000000000"
              className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none shadow-2xs font-mono"
            />
            <span className="text-[10px] text-gray-400 block">المعرف الرقمي لحساب Instagram Business المرتبط بصفحتك.</span>
          </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700">رمز وصول إنستغرام (Instagram Access Token)</label>
                    <textarea
                      value={config.INSTAGRAM_ACCESS_TOKEN || ''}
                      onChange={e => handleConfigChange('INSTAGRAM_ACCESS_TOKEN', e.target.value)}
                      placeholder="رمز طويل يبدأ بـ EAAL... (يمكن استخدام نفس رمز فيسبوك إذا كان مشتركاً)"
                      className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none shadow-2xs font-mono h-20 resize-none"
                    />
                    <span className="text-[10px] text-gray-400 block">مفتاح الوصول الخاص بـ Instagram Graph API. إذا كان التطبيق مشتركاً يمكن ترك هذا الحقل فارغاً وسيُستخدم رمز فيسبوك.</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700">اسم المستخدم (Username) - اختياري</label>
                    <input
                      type="text"
                      value={config.INSTAGRAM_USERNAME || ''}
                      onChange={e => handleConfigChange('INSTAGRAM_USERNAME', e.target.value)}
                      placeholder="مثال: mybusiness"
                      className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none shadow-2xs"
                    />
                    <span className="text-[10px] text-gray-400 block">للتعريف والعرض فقط داخل لوحة التحكم.</span>
                  </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">رمز التحقق (Verify Token) — مشترك مع فيسبوك</label>
            <input
              type="text"
              value={config.FB_VERIFY_TOKEN || ''}
              onChange={e => handleConfigChange('FB_VERIFY_TOKEN', e.target.value)}
              placeholder="نفس رمز التحقق المسجل في فيسبوك"
              className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none shadow-2xs font-mono"
            />
            <span className="text-[10px] text-gray-400 block">يمكن استخدام نفس Verify Token المستخدم لفيسبوك.</span>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">مفتاح التطبيق السري (App Secret) — مشترك</label>
            <input
              type="password"
              value={config.META_APP_SECRET || ''}
              onChange={e => handleConfigChange('META_APP_SECRET', e.target.value)}
              placeholder="••••••••••••••••••••••••••••••••"
              className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none shadow-2xs font-mono"
            />
            <span className="text-[10px] text-gray-400 block">نفس App Secret المستخدم لفيسبوك ماسنجر.</span>
          </div>
        </div>

        {/* Instagram Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50/30 border border-purple-100">
            <div>
              <p className="text-xs font-bold text-gray-800">الرد على الرسائل (DM)</p>
              <p className="text-[10px] text-gray-400">الرد التلقائي على الرسائل الواردة</p>
            </div>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 p-0.5 bg-gray-50/80">
              <button
                onClick={() => handleConfigChange('INSTAGRAM_DM_REPLY', 'true')}
                className={`flex-1 text-center py-1.5 px-3 rounded-md text-[10px] font-bold transition-all cursor-pointer ${config.INSTAGRAM_DM_REPLY !== 'false' ? 'bg-purple-600 text-white shadow-xs' : 'text-gray-400 hover:text-gray-600'}`}
              >
                مفعل
              </button>
              <button
                onClick={() => handleConfigChange('INSTAGRAM_DM_REPLY', 'false')}
                className={`flex-1 text-center py-1.5 px-3 rounded-md text-[10px] font-bold transition-all cursor-pointer ${config.INSTAGRAM_DM_REPLY === 'false' ? 'bg-rose-500 text-white shadow-xs' : 'text-gray-400 hover:text-gray-600'}`}
              >
                معطل
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50/30 border border-purple-100">
            <div>
              <p className="text-xs font-bold text-gray-800">الرد على التعليقات</p>
              <p className="text-[10px] text-gray-400">الرد التلقائي على تعليقات المنشورات</p>
            </div>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 p-0.5 bg-gray-50/80">
              <button
                onClick={() => handleConfigChange('INSTAGRAM_COMMENT_REPLY', 'true')}
                className={`flex-1 text-center py-1.5 px-3 rounded-md text-[10px] font-bold transition-all cursor-pointer ${config.INSTAGRAM_COMMENT_REPLY !== 'false' ? 'bg-purple-600 text-white shadow-xs' : 'text-gray-400 hover:text-gray-600'}`}
              >
                مفعل
              </button>
              <button
                onClick={() => handleConfigChange('INSTAGRAM_COMMENT_REPLY', 'false')}
                className={`flex-1 text-center py-1.5 px-3 rounded-md text-[10px] font-bold transition-all cursor-pointer ${config.INSTAGRAM_COMMENT_REPLY === 'false' ? 'bg-rose-500 text-white shadow-xs' : 'text-gray-400 hover:text-gray-600'}`}
              >
                معطل
              </button>
            </div>
          </div>
        </div>

        {/* Instagram Test Connection */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => runTest('instagram')}
            disabled={testing.instagram}
            className="text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2.5 cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {testing.instagram ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            اختبار اتصال إنستغرام
          </button>
          {testResult.instagram === 'success' && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
              <CheckCircle className="w-3.5 h-3.5" /> الاتصال ناجح
            </span>
          )}
          {testResult.instagram === 'error' && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-red-500">
              <AlertCircle className="w-3.5 h-3.5" /> فشل الاتصال
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
