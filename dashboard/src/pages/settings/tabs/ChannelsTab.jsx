import { AlertCircle } from 'lucide-react'

const channels = [
  {
    id: 'whatsapp',
    name: 'واتساب (WhatsApp)',
    replyKey: 'WHATSAPP_AI_REPLY',
    modelKey: 'WHATSAPP_AI_MODEL',
    activeColor: 'bg-emerald-600',
    badgeColor: 'bg-emerald-50 border-emerald-100 text-emerald-600',
  },
  {
    id: 'facebook',
    name: 'فيسبوك (Messenger)',
    replyKey: 'FACEBOOK_AI_REPLY',
    modelKey: 'FACEBOOK_AI_MODEL',
    activeColor: 'bg-blue-600',
    badgeColor: 'bg-blue-50 border-blue-100 text-blue-600',
  },
  {
    id: 'instagram',
    name: 'إنستغرام (Instagram)',
    replyKey: 'INSTAGRAM_AI_REPLY',
    modelKey: 'INSTAGRAM_AI_MODEL',
    activeColor: 'bg-purple-600',
    badgeColor: 'bg-purple-50 border-purple-100 text-purple-600',
  },
]

const modelOptions = [
  { value: 'google/gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'google/gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'openai/gpt-4o', label: 'GPT-4o' },
  { value: 'anthropic/claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
  { value: 'anthropic/claude-3-5-sonnet', label: 'Claude 3.5 Sonnet' },
]

export default function ChannelsTab({ config, handleConfigChange }) {
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

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-1">الردود الذكية وتوجيه البوت للقنوات</h3>
        <p className="text-xs text-gray-400 mb-6">حدد القنوات التي يمتلك البوت الصلاحية للرد عليها آلياً، واشترط نماذج مخصصة لكل قناة عند الحاجة</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {channels.map(ch => (
            <div key={ch.id} className="p-5 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-4 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-800">{ch.name}</h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${ch.badgeColor}`}>
                  {ch.id}
                </span>
              </div>

              {/* Toggle */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-500">حالة الرد التلقائي</label>
                <div className="flex rounded-lg overflow-hidden border border-gray-200 p-0.5 bg-gray-50/80 max-w-full">
                  <button
                    type="button"
                    onClick={() => handleConfigChange(ch.replyKey, 'true')}
                    className={`flex-1 text-center py-1.5 px-3 rounded-md text-[10px] font-bold transition-all cursor-pointer ${config[ch.replyKey] !== 'false' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    تفعيل البوت
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfigChange(ch.replyKey, 'false')}
                    className={`flex-1 text-center py-1.5 px-3 rounded-md text-[10px] font-bold transition-all cursor-pointer ${config[ch.replyKey] === 'false' ? 'bg-rose-500 text-white shadow-xs' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    إيقاف الرد
                  </button>
                </div>
              </div>

              {/* Model Select */}
              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <label className="block text-[11px] font-bold text-gray-500">النموذج المخصص للقناة</label>
                <select
                  value={config[ch.modelKey] || ''}
                  onChange={e => handleConfigChange(ch.modelKey, e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-semibold"
                >
                  <option value="">استخدام الموجه التلقائي (Router)...</option>
                  {modelOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <span className="text-[9px] text-gray-400 block mt-1 leading-normal">
                  في حال تحديد خيار (الموجه التلقائي)، سيقوم محرك التوجيه باختيار النموذج الأنسب لمحتوى المحادثة تلقائياً.
                </span>
              </div>

              {/* API Warning */}
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
  )
}
