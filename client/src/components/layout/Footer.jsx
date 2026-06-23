import React from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, GitFork, Globe, MessageSquare } from 'lucide-react'

const links = {
  Platform: [
    { to: '/browse', label: 'Browse Courses' },
    { to: '/become-instructor', label: 'Teach with Us' }
  ],
  Portal: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/my-learning', label: 'My Learning' },
    { to: '/live-lectures', label: 'Live Lectures' }
  ],
  Support: [
    { to: '/contact', label: 'Contact Us' },
    { to: '/notifications', label: 'Notifications' },
    { to: '/profile', label: 'Profile Settings' }
  ]
}

export default function Footer() {
  return (
    <footer className="border-t mt-auto" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#7C3AED' }}>
                <GraduationCap size={20} color="white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                Zenius AI
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
              Expert-led courses in tech, design, business & more.
            </p>
            <div className="flex gap-3">
              {[MessageSquare, GitFork, Globe].map((Icon, i) => (
                <a key={i} href="#" className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{section}</h4>
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
          ))}
        </div>

        <div className="border-t mt-8 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3" style={{ borderColor: 'var(--border-default)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} Zenius AI. All rights reserved.
          </p>
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
