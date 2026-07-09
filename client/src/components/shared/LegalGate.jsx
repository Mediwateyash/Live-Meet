import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import useLegalStore from '../../store/legalStore.js'

function PageLoader() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold tracking-wide text-[#7C3AED]" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Verifying settings...
        </p>
      </div>
    </div>
  )
}

export default function LegalGate({ pageKey, children }) {
  const { pages, loaded, loading, fetchPages } = useLegalStore()

  useEffect(() => {
    fetchPages()
  }, [fetchPages])

  // If loading and we haven't loaded yet, show the loader
  if (!loaded && loading) {
    return <PageLoader />
  }

  // Get the page configuration. If not found in loaded pages, default to true
  const pageConfig = pages[pageKey]
  const isEnabled = pageConfig ? pageConfig.isEnabled : true

  if (!isEnabled) {
    return (
      <div
        style={{
          background: 'var(--bg-page, #FAF5FF)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'Outfit, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: '500px',
            width: '100%',
            background: 'var(--bg-surface, #FFFFFF)',
            borderRadius: '24px',
            padding: '40px 32px',
            boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.1), 0 8px 10px -6px rgba(124, 58, 237, 0.05)',
            textAlign: 'center',
            border: '1px solid var(--border-default, rgba(124, 58, 237, 0.1))',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'var(--danger-bg, rgba(239, 68, 68, 0.15))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--danger, #EF4444)',
              marginBottom: '24px',
            }}
          >
            <ShieldAlert size={32} />
          </div>

          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text-primary, #1F2937)',
              marginBottom: '12px',
              lineHeight: 1.3,
            }}
          >
            Page Temporarily Unavailable
          </h1>

          <p
            style={{
              fontSize: '15px',
              color: 'var(--text-secondary, #4B5563)',
              lineHeight: 1.6,
              marginBottom: '32px',
            }}
          >
            This legal page is currently offline or undergoing administrative review. Please check back later or contact support if you believe this is an error.
          </p>

          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '15px',
              padding: '12px 24px',
              borderRadius: '12px',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 14px 0 rgba(124, 58, 237, 0.4)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(124, 58, 237, 0.5)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(124, 58, 237, 0.4)'
            }}
          >
            <ArrowLeft size={18} />
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return children
}
