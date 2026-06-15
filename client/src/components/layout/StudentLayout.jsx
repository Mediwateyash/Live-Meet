import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, BookOpen, GraduationCap } from 'lucide-react'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import { motion } from 'framer-motion'
import { pageVariants } from '../../utils/animations.js'

const NAV = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/my-learning', icon: GraduationCap,   label: 'My Learnings' },
]

export default function StudentLayout({ children }) {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-page)' }}>
      <Navbar />
      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 py-6 gap-6">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-52 shrink-0">
          <div className="sticky top-24 rounded-2xl overflow-hidden py-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
            <div className="px-4 pb-3 mb-1" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#7C3AED' }}>
                  <GraduationCap size={15} color="white" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Student Portal</span>
              </div>
            </div>
            <nav className="px-2 pt-2 space-y-0.5">
              {NAV.map(({ to, icon: Icon, label }) => {
                const active = pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all"
                    style={{
                      background: active ? 'rgba(124,58,237,0.1)' : 'transparent',
                      color: active ? '#7C3AED' : 'var(--text-secondary)',
                      fontWeight: active ? 600 : 500,
                    }}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Main */}
        <motion.main
          variants={pageVariants}
          initial="initial"
          animate="animate"
          className="flex-1 min-w-0"
        >
          {children}
        </motion.main>
      </div>
      <Footer />
    </div>
  )
}
