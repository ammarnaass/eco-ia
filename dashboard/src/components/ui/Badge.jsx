import { colorVariants } from '../../lib/design-tokens.js'

export default function Badge({ children, color = 'slate', size = 'md', dot = false, className = '' }) {
  const c = colorVariants[color] || colorVariants.slate
  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${c.bg} ${c.text} ${c.border} dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-200 ${sizes[size]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></span>}
      {children}
    </span>
  )
}
