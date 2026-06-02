import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function CopyField({ label, value, fieldKey, color = 'blue' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const colorClasses = {
    blue: 'border-blue-100 text-blue-700',
    emerald: 'border-emerald-100 text-emerald-700',
    purple: 'border-purple-100 text-purple-700',
  }

  const iconColors = {
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    purple: 'text-purple-600',
  }

  return (
    <div>
      <label className="block text-xs font-semibold mb-1">{label}</label>
      <div className={`flex items-center gap-2 bg-white border rounded-lg p-2 font-mono text-xs text-gray-700 select-all relative ${colorClasses[color] || colorClasses.blue}`}>
        <span className="truncate flex-1">{value || '—'}</span>
        <button
          onClick={handleCopy}
          className="p-1 hover:bg-gray-100 rounded-sm text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          title="نسخ"
        >
          {copied ? <Check className={`w-3.5 h-3.5 ${iconColors[color] || iconColors.blue}`} /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  )
}
