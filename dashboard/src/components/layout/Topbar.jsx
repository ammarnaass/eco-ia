import { Menu, Search } from 'lucide-react'
import ThemeToggle from './ThemeToggle.jsx'
import NotificationsDropdown from './NotificationsDropdown.jsx'
import ProfileMenu from './ProfileMenu.jsx'
import ConnectionStatus from './ConnectionStatus.jsx'

export default function Topbar({ onMobileMenuToggle, onSearchOpen }) {
  return (
    <header className="h-16 sticky top-0 z-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
      <div className="h-full px-4 lg:px-6 flex items-center gap-3">
        {/* Mobile menu */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>

        {/* Page title placeholder (will be set per page) */}
        <div className="hidden md:flex flex-col">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">مرحباً بعودتك 👋</p>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">لوحة التحكم</h2>
        </div>

        <div className="flex-1"></div>

        {/* Search trigger */}
        <button
          onClick={onSearchOpen}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors min-w-[200px]"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="text-xs">بحث...</span>
          <kbd className="mr-auto px-1.5 py-0.5 text-[9px] font-mono bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">⌘K</kbd>
        </button>

        {/* Connection status */}
        <ConnectionStatus />

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <NotificationsDropdown />

        {/* Profile */}
        <ProfileMenu />
      </div>
    </header>
  )
}
