import React from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'

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
]

const InstagramIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

const YoutubeIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
)

const GithubIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
)

const socialLinks = [
  { Icon: InstagramIcon, href: 'https://instagram.com', label: 'Instagram' },
  { Icon: YoutubeIcon, href: 'https://youtube.com', label: 'YouTube' },
  { Icon: GithubIcon, href: 'https://github.com', label: 'GitHub' },
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
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Icon />
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
