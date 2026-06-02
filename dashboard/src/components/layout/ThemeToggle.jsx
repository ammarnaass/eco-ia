import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext.jsx'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      title={theme === 'light' ? 'الوضع الداكن' : 'الوضع الفاتح'}
      className={`
        relative p-2 rounded-xl
        bg-slate-100 dark:bg-slate-800
        text-slate-600 dark:text-slate-300
        hover:bg-slate-200 dark:hover:bg-slate-700
        transition-all duration-200
        ${className}
      `}
    >
      <Sun className={`w-4 h-4 absolute inset-0 m-auto transition-all duration-300 ${theme === 'light' ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
      <Moon className={`w-4 h-4 transition-all duration-300 ${theme === 'dark' ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
    </button>
  )
}
