export default function ExtraTab({ config, handleConfigChange }) {
  return (
    <div className="space-y-6 animate-fadeIn">
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

      {/* Gmail / SMTP */}
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
  )
}
