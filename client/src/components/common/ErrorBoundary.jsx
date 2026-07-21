import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    if (this.props.onReset) {
      this.props.onReset()
    } else {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-h-[400px] h-full flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-3xl border border-slate-200/80 my-4 shadow-sm">
          <div className="max-w-md text-center flex flex-col items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-rose-100/80 text-rose-600 flex items-center justify-center shadow-xs">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">
                {this.props.fallbackTitle || 'Component Error Encountered'}
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-1.5 leading-relaxed">
                {this.state.error?.message || 'An unexpected rendering error occurred. The application recovered safely.'}
              </p>
            </div>

            {this.state.errorInfo && (
              <details className="w-full text-left bg-slate-900 text-slate-200 text-[11px] p-3.5 rounded-xl overflow-x-auto max-h-40 font-mono">
                <summary className="cursor-pointer font-bold text-rose-400 mb-1 select-none">
                  Stack Trace Details
                </summary>
                <pre className="whitespace-pre-wrap">{this.state.error?.stack}</pre>
              </details>
            )}

            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reload Page</span>
              </button>
              <a
                href="/dashboard"
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-2 transition-all shadow-xs"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Back to Dashboard</span>
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
