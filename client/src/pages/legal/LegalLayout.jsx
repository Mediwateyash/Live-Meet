import React, { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Printer, ArrowUp } from 'lucide-react'

/**
 * LegalLayout — shared wrapper for all Zenius AI legal pages.
 *
 * Props:
 *   title        string   — page h1 and document title
 *   description  string   — meta description
 *   sections     Array<{ id, title }> — drives auto-TOC
 *   version      string   — e.g. "1.0"
 *   effectiveDate string
 *   lastUpdated  string
 *   children     ReactNode
 */
export default function LegalLayout({
  title,
  description,
  sections = [],
  version = '1.0',
  effectiveDate,
  lastUpdated,
  children,
}) {
  const location = useLocation()
  const BASE_URL = 'https://live-meet.onrender.com'
  const canonicalUrl = `${BASE_URL}${location.pathname}`

  useEffect(() => {
    // Title
    document.title = `${title} | Zenius AI`

    // Meta description
    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.name = 'description'
      document.head.appendChild(metaDesc)
    }
    metaDesc.content = description

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = canonicalUrl

    // JSON-LD schemas
    const schemaId = 'legal-page-schema'
    document.getElementById(schemaId)?.remove()

    const schemas = [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${BASE_URL}/#organization`,
        name: 'Zenius AI',
        url: BASE_URL,
        logo: `${BASE_URL}/favicon.svg`,
        description:
          'Zenius AI is an AI-powered Learning Management System offering smart quiz generation, live classes, notes, and certificates.',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        name: `${title} | Zenius AI`,
        description,
        url: canonicalUrl,
        isPartOf: { '@id': `${BASE_URL}/#website` },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Legal', item: `${BASE_URL}/legal` },
          { '@type': 'ListItem', position: 3, name: title, item: canonicalUrl },
        ],
      },
    ]

    const script = document.createElement('script')
    script.id = schemaId
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(schemas)
    document.head.appendChild(script)

    return () => document.getElementById(schemaId)?.remove()
  }, [title, description, canonicalUrl])

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 90
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .legal-content { max-width: 100% !important; padding: 0 !important; }
          body { background: #fff !important; color: #000 !important; font-size: 12pt; line-height: 1.6; }
          a { color: #7C3AED !important; text-decoration: underline; }
          h1, h2, h3, h4 { color: #000 !important; break-after: avoid; }
          section { break-inside: avoid; margin-bottom: 24pt; }
          .legal-hero { background: #f5f3ff !important; color: #1E1B4B !important; -webkit-print-color-adjust: exact; }
        }
        @media (min-width: 900px) { #legal-toc-sidebar { display: block !important; } }
      `}</style>

      <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
        {/* ── Hero ── */}
        <div
          className="legal-hero"
          style={{
            background: 'linear-gradient(135deg, #1E1B4B 0%, #2E1065 55%, #7C3AED 100%)',
            padding: 'clamp(40px,7vw,72px) clamp(16px,4vw,40px) clamp(28px,5vw,56px)',
          }}
        >
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            {/* Breadcrumb */}
            <nav
              className="no-print"
              aria-label="Breadcrumb"
              style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 18, flexWrap: 'wrap' }}
            >
              {[
                { to: '/', label: 'Home' },
                { label: 'Legal' },
                { label: title },
              ].map((item, i, arr) => (
                <React.Fragment key={i}>
                  {item.to ? (
                    <Link to={item.to} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
                      {item.label}
                    </Link>
                  ) : (
                    <span style={{ fontSize: 13, color: i === arr.length - 1 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)' }}>
                      {item.label}
                    </span>
                  )}
                  {i < arr.length - 1 && <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />}
                </React.Fragment>
              ))}
            </nav>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: 'clamp(26px, 5vw, 42px)',
                fontWeight: 800,
                color: '#fff',
                margin: '0 0 18px',
                lineHeight: 1.15,
              }}
            >
              {title}
            </motion.h1>

            {/* Metadata row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.18 }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', alignItems: 'center' }}
            >
              {[
                { label: 'Version', value: version },
                effectiveDate && { label: 'Effective Date', value: effectiveDate },
                lastUpdated && { label: 'Last Updated', value: lastUpdated },
              ]
                .filter(Boolean)
                .map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.45)' }}>
                      {label}
                    </span>
                    <span style={{
                      fontSize: 12, fontWeight: 600, color: '#C4B5FD',
                      background: 'rgba(124,58,237,0.35)',
                      border: '1px solid rgba(196,181,253,0.2)',
                      borderRadius: 6, padding: '2px 10px',
                    }}>{value}</span>
                  </div>
                ))}

              <button
                className="no-print"
                onClick={() => window.print()}
                style={{
                  marginLeft: 'auto',
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >
                <Printer size={13} /> Print / Save PDF
              </button>
            </motion.div>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(28px, 5vw, 48px) clamp(16px, 4vw, 24px)' }}>
          <div style={{ display: 'flex', gap: 44, alignItems: 'flex-start' }}>

            {/* TOC Sidebar — shown ≥900px via <style> above */}
            {sections.length > 0 && (
              <aside
                id="legal-toc-sidebar"
                className="no-print"
                style={{
                  display: 'none',
                  width: 236,
                  flexShrink: 0,
                  position: 'sticky',
                  top: 88,
                  maxHeight: 'calc(100vh - 108px)',
                  overflowY: 'auto',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-purple)',
                  borderRadius: 16,
                  padding: '18px 14px',
                }}
              >
                <p style={{
                  fontFamily: 'Outfit, sans-serif', fontSize: 10, fontWeight: 800,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: 'var(--text-muted)', margin: '0 0 12px',
                }}>Contents</p>
                <nav>
                  <ol style={{ listStyle: 'none', padding: 0, margin: 0, counterReset: 'toc' }}>
                    {sections.map((s, i) => (
                      <li key={s.id} style={{ marginBottom: 2 }}>
                        <button
                          onClick={() => scrollTo(s.id)}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%',
                            background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                            padding: '6px 8px', borderRadius: 8,
                            fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.45,
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = '#7C3AED' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                        >
                          <span style={{ color: '#7C3AED', fontWeight: 800, fontSize: 10, marginTop: 2, flexShrink: 0, minWidth: 18 }}>
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          {s.title}
                        </button>
                      </li>
                    ))}
                  </ol>
                </nav>
              </aside>
            )}

            {/* Main content */}
            <main className="legal-content" style={{ flex: 1, minWidth: 0 }}>
              {/* Mobile TOC */}
              {sections.length > 0 && (
                <details
                  className="no-print"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-purple)',
                    borderRadius: 12, padding: '12px 16px', marginBottom: 28,
                  }}
                >
                  <summary style={{
                    cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                    fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', userSelect: 'none',
                  }}>
                    📋 Table of Contents — {sections.length} sections
                  </summary>
                  <ol style={{ margin: '12px 0 4px', paddingLeft: 22, lineHeight: 2 }}>
                    {sections.map(s => (
                      <li key={s.id}>
                        <button
                          onClick={() => scrollTo(s.id)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#7C3AED', fontSize: 13, fontWeight: 600,
                            padding: 0, textDecoration: 'underline', textAlign: 'left',
                          }}
                        >{s.title}</button>
                      </li>
                    ))}
                  </ol>
                </details>
              )}

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                {children}
              </motion.div>
            </main>
          </div>

          {/* Back to top */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'center', marginTop: 52 }}>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 600, color: '#7C3AED',
                background: 'var(--bg-surface)', border: '1px solid var(--border-purple)',
                borderRadius: 10, padding: '10px 22px', cursor: 'pointer',
              }}
            >
              <ArrowUp size={14} /> Back to Top
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

/* ─────────────────────────────────────────────
   Exports for page authors
───────────────────────────────────────────── */

/** h2-level section block with anchor link */
export function LegalSection({ id, title, children }) {
  return (
    <section id={id} style={{ marginBottom: 44, scrollMarginTop: 92 }}>
      <h2 style={{
        fontFamily: 'Outfit, sans-serif',
        fontSize: 'clamp(18px, 2.8vw, 22px)',
        fontWeight: 700,
        color: 'var(--text-primary)',
        margin: '0 0 14px',
        paddingBottom: 10,
        borderBottom: '2px solid var(--border-purple)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 26, height: 26, borderRadius: 7,
          background: 'rgba(124,58,237,0.12)', color: '#7C3AED',
          fontSize: 14, fontWeight: 800, flexShrink: 0,
        }}>§</span>
        <a
          href={`#${id}`}
          style={{ color: 'inherit', textDecoration: 'none' }}
          onClick={e => {
            e.preventDefault()
            window.history.pushState(null, '', `#${id}`)
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
        >{title}</a>
      </h2>
      <div style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.8 }}>
        {children}
      </div>
    </section>
  )
}

/** h3-level subsection */
export function LegalSubSection({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{
        fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700,
        color: 'var(--text-primary)', margin: '0 0 8px',
      }}>{title}</h3>
      <div style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.8 }}>{children}</div>
    </div>
  )
}

/** Yellow warning callout for TODO items */
export function LegalTodo({ children }) {
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.35)',
      borderRadius: 10, padding: '12px 16px', margin: '14px 0',
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--warning, #B45309)', lineHeight: 1.65 }}>
        <strong>TODO (fill before going live):</strong> {children}
      </p>
    </div>
  )
}

/** Styled unordered list */
export function LegalList({ items }) {
  return (
    <ul style={{ margin: '10px 0 10px 0', paddingLeft: 22, lineHeight: 1.9 }}>
      {items.map((item, i) => (
        <li key={i} style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 4 }}>{item}</li>
      ))}
    </ul>
  )
}

/** Info highlight box */
export function LegalInfo({ children }) {
  return (
    <div style={{
      background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)',
      borderRadius: 10, padding: '14px 18px', margin: '16px 0',
      fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7,
    }}>
      {children}
    </div>
  )
}
