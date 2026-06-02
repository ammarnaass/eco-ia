import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'

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
  "48": { name: "غليزان", price_home: 500, price_desk: 350 },
}

export default function ShippingTab({ config, handleConfigChange, showToast }) {
  const [wilayaSearch, setWilayaSearch] = useState('')
  const [newWilaya, setNewWilaya] = useState({ code: '', name: '', price_home: '', price_desk: '' })
  const [wilayaPrices, setWilayaPrices] = useState({})

  useEffect(() => {
    if (config.WILAYA_SHIPPING_PRICES) {
      try {
        setWilayaPrices(JSON.parse(config.WILAYA_SHIPPING_PRICES))
      } catch (e) {
        setWilayaPrices(defaultWilayas)
      }
    } else {
      setWilayaPrices(defaultWilayas)
    }
  }, [config.WILAYA_SHIPPING_PRICES])

  const handleUpdateWilayaPrice = (code, field, val) => {
    const updated = { ...wilayaPrices, [code]: { ...wilayaPrices[code], [field]: val } }
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
      [code]: { name, price_home: parseInt(price_home), price_desk: parseInt(price_desk) }
    }
    setWilayaPrices(updated)
    handleConfigChange('WILAYA_SHIPPING_PRICES', JSON.stringify(updated))
    setNewWilaya({ code: '', name: '', price_home: '', price_desk: '' })
    showToast('success', `تم إدراج ولاية ${name} بنجاح`)
  }

  const filteredWilayas = Object.entries(wilayaPrices)
    .filter(([code, data]) => {
      const search = wilayaSearch.toLowerCase()
      return code.includes(search) || (data.name && data.name.toLowerCase().includes(search))
    })
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-1">إدارة شحن الولايات التفاعلي</h3>
        <p className="text-xs text-gray-400 mb-6">اضبط أسعار الشحن لكل ولاية على حدة بشكل منفصل للتوصيل للمنزل أو الاستلام من المكتب. يمكنك إضافة ولايات جديدة، تعديل الأسعار، أو حذفها ديناميكياً.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Wilaya Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-5">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-800">قائمة تسعير الولايات النشطة</h4>
                  <span className="text-[10px] text-gray-400 block mt-0.5">اضبط أسعار شحن وتوصيل الطرود للولايات؛ سيتم حفظ التعديلات مباشرة.</span>
                </div>
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

              {/* Add Wilaya Form */}
              <div className="bg-gray-50/70 border border-gray-100 p-4 rounded-xl space-y-3.5 shadow-2xs">
                <h5 className="text-[10px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  إدراج ولاية مخصصة جديدة للمنظومة
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 mb-1">رمز الولاية</label>
                    <input
                      type="text" placeholder="مثال: 58"
                      value={newWilaya.code}
                      onChange={e => setNewWilaya({ ...newWilaya, code: e.target.value })}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 mb-1">اسم الولاية</label>
                    <input
                      type="text" placeholder="اسم الولاية"
                      value={newWilaya.name}
                      onChange={e => setNewWilaya({ ...newWilaya, name: e.target.value })}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 mb-1">سعر المنزل (دج)</label>
                    <input
                      type="number" placeholder="سعر المنزل"
                      value={newWilaya.price_home}
                      onChange={e => setNewWilaya({ ...newWilaya, price_home: e.target.value })}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 mb-1">سعر المكتب (دج)</label>
                    <input
                      type="number" placeholder="سعر المكتب"
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

              {/* Table */}
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
                      <tr><td colSpan="5" className="p-8 text-center text-xs text-gray-400">لا توجد نتائج بحث مطابقة للمدخلات الحالية</td></tr>
                    ) : (
                      filteredWilayas.map(([code, data]) => (
                        <tr key={code} className="hover:bg-blue-50/10 transition-colors group">
                          <td className="p-3 text-center font-bold text-gray-500 font-mono">{code}</td>
                          <td className="p-3 font-bold text-gray-800">{data.name}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 max-w-[150px] mx-auto">
                              <input
                                type="number" value={data.price_home}
                                onChange={e => handleUpdateWilayaPrice(code, 'price_home', e.target.value)}
                                className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-center font-bold text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono"
                              />
                              <span className="text-[9px] text-gray-400 font-semibold">دج</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 max-w-[150px] mx-auto">
                              <input
                                type="number" value={data.price_desk}
                                onChange={e => handleUpdateWilayaPrice(code, 'price_desk', e.target.value)}
                                className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-center font-bold text-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono"
                              />
                              <span className="text-[9px] text-gray-400 font-semibold">دج</span>
                            </div>
                          </td>
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

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Free shipping */}
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

            {/* Shipping APIs */}
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
  )
}
