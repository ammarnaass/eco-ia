import { useState } from 'react'
import { Link2, Globe, MessageSquare, Camera, AlertCircle, CheckCircle, Loader2, Info, X, ExternalLink } from 'lucide-react'
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
      setTestResult(prev => ({
        ...prev,
        [platform]: {
          status: data.success ? 'success' : 'error',
          message: data.message,
          code: data.code,
          type: data.type,
          subcode: data.subcode,
          hint: data.hint,
          debug: data.debug,
          account: data.account,
        }
      }))
      if (data.success) {
        showToast('success', data.message || 'تم التحقق بنجاح')
      } else {
        showToast('error', data.message || 'فشل الاتصال')
      }
    } catch (e) {
      setTestResult(prev => ({ ...prev, [platform]: { status: 'error', message: 'فشل اختبار الاتصال: ' + e.message } }))
      showToast('error', 'فشل اختبار الاتصال: ' + e.message)
    }
    setTesting(prev => ({ ...prev, [platform]: false }))
  }

  const TestResultPanel = ({ result, platform }) => {
    if (!result) return null
    const isSuccess = result.status === 'success'
    return (
      <div className={`mt-3 p-3 rounded-xl flex items-start gap-2 text-[11px] ${
        isSuccess
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60'
          : 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200/60'
      }`}>
        {isSuccess ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <X className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
        <div className="flex-1 min-w-0">
          <p className={`font-bold ${isSuccess ? 'text-emerald-700' : 'text-rose-700'}`}>{result.message}</p>
          {result.hint && <p className="text-rose-600 mt-1 text-[10px]">{result.hint}</p>}
          {result.code && (
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-1 text-[10px] text-slate-600">
              {result.code && <span><b>Code:</b> {result.code}</span>}
              {result.subcode && <span><b>Subcode:</b> {result.subcode}</span>}
              {result.type && <span><b>Type:</b> {result.type}</span>}
            </div>
          )}
          {result.debug?.token_preview && (
            <p className="mt-1 text-[10px] text-slate-500 font-mono">Token: {result.debug.token_preview} | Business ID: {result.debug.business_id}</p>
          )}
          {result.account && (
            <div className="mt-2 text-[10px] text-slate-600 space-y-0.5">
              {result.account.username && <p><b>@username:</b> @{result.account.username}</p>}
              {result.account.name && <p><b>Name:</b> {result.account.name}</p>}
            </div>
          )}
        </div>
      </div>
    )
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
        </div>
        <TestResultPanel result={testResult.facebook} platform="facebook" />
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

        {/* Instagram App Info Banner */}
        <div className="p-3 rounded-xl bg-gradient-to-l from-pink-50/50 to-purple-50/30 border border-purple-100/60 flex items-start gap-2 text-[11px]">
          <Info className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-slate-700">
              <b>للاتصال بـ Instagram Graph API تحتاج:</b>
            </p>
            <ol className="list-decimal list-inside mt-1 space-y-0.5 text-slate-600">
              <li>تطبيق من نوع <b>Business</b> في Meta Developer (App ID: <code className="bg-white px-1 rounded">{config.INSTAGRAM_APP_ID || '—'}</code>)</li>
              <li>إضافة منتج <b>Instagram Graph API</b> للتطبيق</li>
              <li>ربط حساب Instagram Business بصفحتك على Facebook</li>
              <li>توليد <b>System User Token</b> بالأذونات: <code className="bg-white px-1 rounded">instagram_basic, instagram_manage_messages, pages_manage_metadata</code></li>
            </ol>
            <details className="mt-2">
              <summary className="cursor-pointer text-purple-700 font-bold hover:underline">
                📋 خطوات توليد Token الصحيح
              </summary>
              <ol className="list-decimal list-inside mt-1 space-y-0.5 text-slate-600 bg-white/60 rounded-lg p-2 mt-1">
                <li>اذهب لـ <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noopener noreferrer" className="text-purple-700 underline">business.facebook.com/settings/system-users</a></li>
                <li>أنشئ System User أو اختر موجود، ثم "Add Assets" → اختر تطبيقك (App ID: {config.INSTAGRAM_APP_ID || '—'})</li>
                <li>فعّل "Full Control" أو الأذونات المطلوبة</li>
                <li>اضغط "Generate New Token" → اختر التطبيق → فعّل <b>instagram_basic</b> و <b>instagram_manage_messages</b></li>
                <li><b className="text-rose-600">انسخ الرمز كاملاً</b> (200+ حرف عادةً). احذر من النسخ المبتور!</li>
              </ol>
            </details>
            <div className="flex items-center gap-3 mt-2">
              <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-purple-700 font-bold hover:underline">
                Meta Developers <ExternalLink className="w-3 h-3" />
              </a>
              <a href="https://www.instagram.com/accounts/manage_access/" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-purple-700 font-bold hover:underline">
                ربط Instagram <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">معرف تطبيق إنستغرام (Instagram App ID)</label>
            <input
              type="text"
              value={config.INSTAGRAM_APP_ID || ''}
              onChange={e => handleConfigChange('INSTAGRAM_APP_ID', e.target.value)}
              placeholder="مثال: 3948712362101332"
              className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none shadow-2xs font-mono"
            />
            <span className="text-[10px] text-gray-400 block">معرف تطبيق Instagram Business في Meta Developer (App Dashboard → Settings → Basic).</span>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">معرف حساب إنستغرام التجاري (Instagram Business ID)</label>
            <input
              type="text"
              value={config.INSTAGRAM_BUSINESS_ID || ''}
              onChange={e => handleConfigChange('INSTAGRAM_BUSINESS_ID', e.target.value)}
              placeholder="مثال: 17841400000000000"
              className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none shadow-2xs font-mono"
            />
            <span className="text-[10px] text-gray-400 block">المعرف الرقمي لحساب Instagram Business (يبدأ بـ 17841...).</span>
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">رمز وصول إنستغرام (Instagram Access Token)</label>
            <textarea
              value={config.INSTAGRAM_ACCESS_TOKEN || ''}
              onChange={e => handleConfigChange('INSTAGRAM_ACCESS_TOKEN', e.target.value)}
              placeholder="IGAA... أو EAAL... (200+ حرف عادةً)"
              className={`w-full text-xs border rounded-xl px-4 py-3 focus:bg-white focus:ring-1 transition-all outline-none shadow-2xs font-mono h-20 resize-none ${
                config.INSTAGRAM_ACCESS_TOKEN && config.INSTAGRAM_ACCESS_TOKEN.length < 100
                  ? 'border-rose-300 bg-rose-50 focus:ring-rose-500 focus:border-rose-500'
                  : config.INSTAGRAM_ACCESS_TOKEN && /^(IGAA|EAAL|IGQVJ)/.test(config.INSTAGRAM_ACCESS_TOKEN)
                  ? 'border-emerald-200 bg-gray-50 focus:ring-purple-500 focus:border-purple-500'
                  : 'border-gray-200 bg-gray-50 focus:ring-purple-500 focus:border-purple-500'
              }`}
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-gray-400 block flex-1">
                مفتاح الوصول لـ Instagram Graph API. إذا لم يكن موجوداً، يُستخدم رمز فيسبوك تلقائياً (FB_PAGE_TOKEN).
              </span>
              {config.INSTAGRAM_ACCESS_TOKEN && (
                <span className={`text-[10px] font-bold shrink-0 ${
                  config.INSTAGRAM_ACCESS_TOKEN.length < 100
                    ? 'text-rose-600'
                    : /^(IGAA|EAAL|IGQVJ)/.test(config.INSTAGRAM_ACCESS_TOKEN)
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}>
                  {config.INSTAGRAM_ACCESS_TOKEN.length} حرف
                  {config.INSTAGRAM_ACCESS_TOKEN.length < 100 && ' ⚠️ قصير جداً'}
                </span>
              )}
            </div>
            {config.INSTAGRAM_ACCESS_TOKEN && config.INSTAGRAM_ACCESS_TOKEN.length < 100 && (
              <div className="text-[10px] text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2 mt-1">
                ⚠️ <b>الرمز قصير جداً (مبتور).</b> انسخه كاملاً بدون أي فقاعة نسخ.
                الرمز الصحيح عادةً 200+ حرف.
              </div>
            )}
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
        </div>
        <TestResultPanel result={testResult.instagram} platform="instagram" />
      </div>
    </div>
  )
}
