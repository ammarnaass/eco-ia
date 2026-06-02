export default function Avatar({ name = '', src, size = 'md', status, className = '' }) {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }
  const initials = name
    ? name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
    : '?'

  const palettes = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-violet-500 to-purple-600',
    'from-sky-500 to-cyan-600',
  ]
  const palette = palettes[(name?.charCodeAt(0) || 0) % palettes.length]

  return (
    <div className={`relative shrink-0 ${className}`}>
      {src ? (
        <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover ring-2 ring-white dark:ring-slate-800`} />
      ) : (
        <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${palette} flex items-center justify-center text-white font-bold ring-2 ring-white dark:ring-slate-800 shadow-sm`}>
          {initials}
        </div>
      )}
      {status && (
        <span className={`absolute bottom-0 left-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800 ${
          status === 'online' ? 'bg-emerald-500' :
          status === 'away' ? 'bg-amber-500' : 'bg-slate-400'
        }`}></span>
      )}
    </div>
  )
}
