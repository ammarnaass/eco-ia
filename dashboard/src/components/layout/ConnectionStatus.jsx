import { useEffect, useState } from 'react'
import { api } from '../../api.js'

const channelList = [
  { key: 'whatsapp',  label: 'واتساب',  color: 'bg-emerald-500' },
  { key: 'facebook',  label: 'فيسبوك',  color: 'bg-blue-500' },
  { key: 'instagram', label: 'إنستغرام', color: 'bg-pink-500' },
]

export default function ConnectionStatus() {
  const [connected, setConnected] = useState(true)
  const [channelStatus, setChannelStatus] = useState({})

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const cfg = await api.getConfig()
        setChannelStatus({
          whatsapp:  cfg.WHATSAPP_AI_REPLY !== 'false',
          facebook:  cfg.FACEBOOK_AI_REPLY !== 'false',
          instagram: cfg.INSTAGRAM_AI_REPLY !== 'false',
        })
      } catch { /* silent */ }
    }
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800">
      <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse-dot' : 'bg-rose-500'}`}></span>
      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">مباشر</span>
      <div className="w-px h-3 bg-slate-300 dark:bg-slate-600 mx-1"></div>
      {channelList.map(ch => (
        <div key={ch.key} className="flex items-center gap-0.5" title={`${ch.label}: ${channelStatus[ch.key] ? 'مفعل' : 'متوقف'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${channelStatus[ch.key] ? ch.color : 'bg-slate-300 dark:bg-slate-600'}`}></span>
        </div>
      ))}
    </div>
  )
}
