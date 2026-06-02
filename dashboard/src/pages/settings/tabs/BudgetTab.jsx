export default function BudgetTab({ config, handleConfigChange }) {
  return (
    <div className="space-y-6 animate-fadeIn">
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
  )
}
