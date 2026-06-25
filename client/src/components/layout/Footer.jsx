import React from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, GitFork, Globe, MessageSquare } from 'lucide-react'

const platformLinks = [
  { to: '/browse', label: 'Browse Courses' },
  { to: '/become-instructor', label: 'Teach with Us' },
]

const portalLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/my-learning', label: 'My Learning' },
  { to: '/live-lectures', label: 'Live Lectures' },
  { to: '/contact', label: 'Contact Us' },
]

const legalLinks = [
  { to: '/privacy-policy', label: 'Privacy Policy' },
  { to: '/terms-and-conditions', label: 'Terms & Conditions' },
  { to: '/cookie-policy', label: 'Cookie Policy' },
  { to: '/refund-policy', label: 'Refund Policy' },
  { to: '/disclaimer', label: 'Disclaimer' },
  { to: '/acceptable-use', label: 'Acceptable Use' },
  { to: '/community-guidelines', label: 'Community Guidelines' },
  { to: '/grievance', label: 'Grievance' },
  { to: '/copyright', label: 'Copyright & IP' },
]

function FooterColumn({ title, items }) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-3" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
        {title}
      </h4>
      <ul className="space-y-2">
        {items.map(({ to, label }) => (
          <li key={label}>
            <Link
              to={to}
              className="text-sm transition-colors hover:text-[#7C3AED]"
              style={{ color: 'var(--text-muted)' }}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="border-t mt-auto" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-6">

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '2rem' }}>

          {/* Brand */}
          <div style={{ gridColumn: 'span 1' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#7C3AED' }}>
                <GraduationCap size={20} color="white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                Zenius AI
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
              AI-powered learning: courses, live lectures, smart quizzes &amp; certificates.
            </p>
            <div className="flex gap-3">
              {[MessageSquare, GitFork, Globe].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Platform" items={platformLinks} />
          <FooterColumn title="Portal" items={portalLinks} />
          <FooterColumn title="Legal" items={legalLinks} />
        </div>

        {/* Bottom bar */}
        <div
          className="border-t mt-10 pt-5 flex flex-col sm:flex-row justify-between items-center gap-3"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} Zenius AI. All rights reserved.
          </p>

          {/* Mini legal links */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {[
              { to: '/privacy-policy', label: 'Privacy' },
              { to: '/terms-and-conditions', label: 'Terms' },
              { to: '/cookie-policy', label: 'Cookies' },
              { to: '/grievance', label: 'Grievance' },
            ].map(({ to, label }) => (
              <Link
                key={label}
                to={to}
                className="text-xs transition-colors hover:text-[#7C3AED]"
                style={{ color: 'var(--text-muted)' }}
              >
                {label}
              </Link>
            ))}
          </div>

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-xs transition-colors hover:text-[#7C3AED] flex items-center gap-1 font-semibold touch-target"
            style={{ color: 'var(--text-muted)' }}
          >
            Back to Top ↑
          </button>
        </div>
      </div>
    </footer>
  )
}
