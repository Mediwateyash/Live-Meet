import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Render Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-body, #0B0B0F)', color: 'var(--text-primary, #fff)' }}>
          <div className="max-w-md w-full p-8 rounded-2xl border text-center shadow-2xl" style={{ background: 'var(--bg-surface, #13131A)', borderColor: 'var(--border-default, #272732)' }}>
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              ⚡
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Something went wrong</h2>
            <p className="text-sm opacity-80 mb-6 text-red-400">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: '#7C3AED', color: '#ffffff' }}
              >
                Return to Home
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                style={{ borderColor: 'var(--border-default, #272732)', color: 'var(--text-primary, #fff)' }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
