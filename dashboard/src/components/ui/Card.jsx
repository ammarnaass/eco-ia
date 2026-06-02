export default function Card({ children, hover = false, glow = false, glass = true, padding = 'p-5', className = '', ...rest }) {
  return (
    <div
      {...rest}
      className={`
        ${glass ? 'glass' : ''}
        bg-white/80 dark:bg-slate-800/60
        border border-slate-200/60 dark:border-slate-700/60
        rounded-2xl shadow-sm
        ${padding}
        ${hover ? 'transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5' : ''}
        ${glow ? 'shadow-blue-500/10 hover:shadow-blue-500/20' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
