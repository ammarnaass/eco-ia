import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4" dir="rtl">
          <div className="max-w-lg w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white text-2xl font-extrabold mb-4">
              !
            </div>
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">حدث خطأ غير متوقع</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              نأسف للإزعاج. يمكنك إعادة تحميل الصفحة أو العودة للرئيسية.
            </p>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 mb-4 max-h-40 overflow-auto">
              <p className="text-[11px] font-mono text-rose-600 dark:text-rose-400 break-all">
                {this.state.error?.toString() || 'Unknown error'}
              </p>
              {this.state.errorInfo?.componentStack && (
                <pre className="text-[10px] font-mono text-slate-500 dark:text-slate-500 mt-2 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack.slice(0, 500)}
                </pre>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 text-xs font-bold text-white bg-gradient-to-l from-blue-600 to-indigo-600 hover:opacity-90 rounded-xl px-4 py-2.5 transition-all"
              >
                إعادة تحميل
              </button>
              <button
                onClick={() => { window.location.href = '/dashboard' }}
                className="text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                الرئيسية
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
