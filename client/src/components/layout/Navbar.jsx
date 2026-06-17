import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, BookOpen, ChevronDown, LogOut, User, LayoutDashboard, GraduationCap, Heart, Bell, Sun, Moon, Video } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useAuthStore from '../../store/authStore.js'
import useUIStore from '../../store/uiStore.js'
import { authAPI } from '../../api/auth.js'

import toast from 'react-hot-toast'
import Button from '../ui/Button.jsx'
import Modal from '../ui/Modal.jsx'
import NotificationBell from '../ui/NotificationBell.jsx'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const { darkMode, toggleDarkMode, openAuthModal } = useUIStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [logoutModal, setLogoutModal] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/browse?q=${encodeURIComponent(search.trim())}`)
    }
  }

  const handleLogout = async () => {
    setLogoutModal(false)
    try {
      await authAPI.logout()
    } catch (_) {}
    logout()
    navigate('/')
    toast.success('Logged out')
  }

  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin/dashboard'
    if (user?.role === 'instructor' && user?.isApprovedInstructor) return '/instructor/dashboard'
    return '/dashboard'
  }

  return (
    <>
      <nav className="navbar h-16 px-6 flex items-center justify-between gap-6 backdrop-blur-md sticky top-0 z-50 border-b" style={{ borderColor: 'rgba(124, 58, 237, 0.1)' }}>
        {/* Left: Logo + Browse */}
        <div className="flex items-center gap-6 shrink-0">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#7C3AED' }}>
              <GraduationCap size={20} color="white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
              Zenius AI
            </span>
          </Link>
          <Link
            to="/browse"
            className="px-3 py-2 rounded-lg text-sm font-semibold transition-colors hover:text-[#7C3AED]"
            style={{ color: location.pathname === '/browse' ? '#7C3AED' : 'var(--text-secondary)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Browse
          </Link>
        </div>

        {/* Middle: Search */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-4">
          <div className="relative w-full">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" color="var(--text-secondary)" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search courses..."
              className="w-full pl-11 pr-4 py-2 rounded-xl text-sm outline-none transition-all border font-medium placeholder:text-[#94A3B8]"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
                fontFamily: 'Inter, sans-serif',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              }}
              onFocus={e => { e.target.style.borderColor = '#7C3AED'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)' }}
              onBlur={e =>  { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
        </form>

        {/* Right: Auth area */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl transition-all"
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{ color: 'var(--text-secondary)' }}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to="/my-learning"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors hover:text-[#7C3AED]"
                style={{ color: location.pathname === '/my-learning' ? '#7C3AED' : 'var(--text-secondary)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <BookOpen size={16} />
                My Learning
              </Link>

              <Link
                to="/my-learning?tab=wishlist"
                className="relative p-2 rounded-xl transition-all"
                title="Wishlist"
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                style={{ color: location.pathname === '/my-learning' && location.search.includes('wishlist') ? '#7C3AED' : 'var(--text-secondary)' }}
              >
                <Heart size={20} />
              </Link>

              <NotificationBell />

              <div className="relative">
                <button
                  onClick={() => setProfileOpen(p => !p)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all border border-transparent"
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  style={{ borderColor: profileOpen ? 'rgba(124, 58, 237, 0.15)' : 'transparent' }}
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.fullName} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
                      {user?.fullName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden md:block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {user?.fullName?.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} color="var(--text-secondary)" className={`transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-14 w-56 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden border"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-purple)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
                      onMouseLeave={() => setProfileOpen(false)}
                    >
                      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{user?.fullName}</p>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                      </div>
                      <DropItem to="/my-learning" icon={BookOpen} label="My Learning" onClick={() => setProfileOpen(false)} />
                      <DropItem to="/my-learning?tab=wishlist" icon={Heart} label="Wishlist" onClick={() => setProfileOpen(false)} />
                      <DropItem to="/live-lectures" icon={Video} label="Live Lectures" onClick={() => setProfileOpen(false)} />
                      <DropItem to="/notifications" icon={Bell} label="Notifications" onClick={() => setProfileOpen(false)} />
                      <DropItem to={getDashboardLink()} icon={LayoutDashboard} label="Dashboard" onClick={() => setProfileOpen(false)} />
                      <DropItem to="/profile" icon={User} label="Profile" onClick={() => setProfileOpen(false)} />
                      {user?.role === 'student' && (
                        <DropItem to="/become-instructor" icon={GraduationCap} label="Teach on Zenius" onClick={() => setProfileOpen(false)} />
                      )}
                      <div className="border-t mt-1.5 pt-1.5" style={{ borderColor: 'var(--border-default)' }}>
                        <button
                          onClick={() => { setProfileOpen(false); setLogoutModal(true) }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm font-semibold transition-colors"
                          style={{ color: '#EF4444' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <LogOut size={15} />
                          Log out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Button variant="outline" size="sm" onClick={() => openAuthModal('login')}>Log in</Button>
              <Button variant="primary" size="sm" onClick={() => openAuthModal('register')}>Sign up</Button>
            </div>
          )}
        </div>
      </nav>

      {/* Logout confirmation modal */}
      <Modal isOpen={logoutModal} onClose={() => setLogoutModal(false)} title="Log out" size="sm">
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
          Are you sure you want to log out?
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" size="sm" onClick={() => setLogoutModal(false)}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={handleLogout}>Yes, log out</Button>
        </div>
      </Modal>
    </>
  )
}

function DropItem({ to, icon: Icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium transition-colors"
      style={{ color: 'var(--text-secondary)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <Icon size={15} />
      {label}
    </Link>
  )
}
