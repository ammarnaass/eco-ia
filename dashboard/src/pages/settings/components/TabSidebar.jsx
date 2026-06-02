import {
  Phone, MessageCircle, Bot, Key, DollarSign, Shield, Globe
} from 'lucide-react'

const tabs = [
  { id: 'whatsapp', name: 'قنوات واتساب', icon: Phone, color: 'emerald' },
  { id: 'meta', name: 'فيسبوك وإنستغرام', icon: MessageCircle, color: 'blue' },
  { id: 'channels', name: 'الردود التلقائية', icon: Bot, color: 'violet' },
  { id: 'ai_keys', name: 'مفاتيح API الذكاء', icon: Key, color: 'amber' },
  { id: 'shipping', name: 'الشحن والتوصيل', icon: DollarSign, color: 'orange' },
  { id: 'budget', name: 'الميزانية والأمان', icon: Shield, color: 'rose' },
  { id: 'extra', name: 'خدمات إضافية', icon: Globe, color: 'cyan' },
]

const colorMap = {
  emerald: { active: 'bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-600' },
  blue: { active: 'bg-blue-50 text-blue-600 border-r-4 border-blue-500', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-600' },
  violet: { active: 'bg-violet-50 text-violet-600 border-r-4 border-violet-500', icon: 'text-violet-600', badge: 'bg-violet-100 text-violet-600' },
  amber: { active: 'bg-amber-50 text-amber-600 border-r-4 border-amber-500', icon: 'text-amber-600', badge: 'bg-amber-100 text-amber-600' },
  orange: { active: 'bg-orange-50 text-orange-600 border-r-4 border-orange-500', icon: 'text-orange-600', badge: 'bg-orange-100 text-orange-600' },
  rose: { active: 'bg-rose-50 text-rose-600 border-r-4 border-rose-500', icon: 'text-rose-600', badge: 'bg-rose-100 text-rose-600' },
  cyan: { active: 'bg-cyan-50 text-cyan-600 border-r-4 border-cyan-500', icon: 'text-cyan-600', badge: 'bg-cyan-100 text-cyan-600' },
}

export default function TabSidebar({ activeTab, setActiveTab }) {
  return (
    <div className="w-full lg:w-64 bg-white p-3 rounded-2xl border border-gray-100 shadow-xs flex flex-row lg:flex-col gap-1 overflow-x-auto shrink-0 scrollbar-none">
      {tabs.map(tab => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        const colors = colorMap[tab.color]
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer text-right whitespace-nowrap lg:w-full ${
              isActive
                ? colors.active
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? colors.icon : 'text-gray-400'}`} />
            <span>{tab.name}</span>
          </button>
        )
      })}
    </div>
  )
}
