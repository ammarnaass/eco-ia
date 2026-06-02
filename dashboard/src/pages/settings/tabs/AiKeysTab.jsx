export default function AiKeysTab({ config, handleConfigChange }) {
  return (
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
  )
}
