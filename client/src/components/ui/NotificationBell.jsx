import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, Radio, Video, BookOpen, Info, Check, Trash2, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { notificationsAPI } from '../../api/notifications.js'
import { motion, AnimatePresence } from 'framer-motion'

const TYPE_ICON = {
  live_scheduled: { Icon: Video,    bg: '#EDE9FE', color: '#7C3AED' },
  live_started:   { Icon: Radio,    bg: '#F0FDF4', color: '#10B981' },
  live_updated:   { Icon: Video,    bg: '#EDE9FE', color: '#7C3AED' },
  course_updated: { Icon: BookOpen, bg: '#FEF2F2', color: '#DC2626' },
  general:        { Icon: Info,     bg: '#EFF6FF', color: '#3B82F6' },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function NotificationBell() {
  const navigate = useNavigate()
  const [open,         setOpen]        = useState(false)
  const [items,        setItems]       = useState([])
  const [unread,       setUnread]      = useState(0)
  const [loading,      setLoading]     = useState(false)
  const panelRef = useRef(null)
  const bellRef  = useRef(null)

  const fetchPreview = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await notificationsAPI.getAll({ limit: 8 })
      setItems(data.data || [])
      setUnread(data.unread || 0)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  // Poll every 30s for new notifications
  useEffect(() => {
    fetchPreview()
    const id = setInterval(fetchPreview, 30000)
    return () => clearInterval(id)
  }, [fetchPreview])

  // Click outside to close
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (!panelRef.current?.contains(e.target) && !bellRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleMarkAllRead = async (e) => {
    e.stopPropagation()
    try {
      await notificationsAPI.markAllRead()
      setItems(prev => prev.map(n => ({ ...n, read: true })))
      setUnread(0)
    } catch { /* silent */ }
  }

  const handleItemClick = async (n) => {
    setOpen(false)
    if (!n.read) {
      try {
        await notificationsAPI.markRead(n._id)
        setItems(prev => prev.map(x => x._id === n._id ? { ...x, read: true } : x))
        setUnread(prev => Math.max(0, prev - 1))
      } catch { /* silent */ }
    }
    if (n.link) navigate(n.link)
  }

  const handleViewAll = () => { setOpen(false); navigate('/notifications') }

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={() => { setOpen(v => !v); if (!open) fetchPreview() }}
        className="relative p-2 rounded-xl transition-all hover:bg-[#F0EEFF]"
        aria-label="Notifications"
      >
        <Bell size={20} color={open ? '#7C3AED' : 'var(--text-secondary)'} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ background: '#7C3AED', padding: '0 3px' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div ref={panelRef}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{   opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 z-50 rounded-2xl shadow-xl overflow-hidden"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-muted)' }}>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Notifications {unread > 0 && <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#7C3AED', color: 'white' }}>{unread}</span>}
              </span>
              {unread > 0 && (
                <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: '#7C3AED' }}>
                  <Check size={12} /> Mark all read
                </button>
              )}
            </div>

            {/* Items */}
            <div className="max-h-72 overflow-y-auto">
              {loading && items.length === 0 ? (
                <div className="space-y-2 p-3">
                  {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }} />)}
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'var(--bg-muted)' }}>
                    <Bell size={20} color="var(--text-muted)" />
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No notifications yet</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>You'll see live lecture alerts & updates here</p>
                </div>
              ) : (
                items.map(n => {
                  const { Icon, bg, color } = TYPE_ICON[n.type] || TYPE_ICON.general
                  return (
                    <button key={n._id} onClick={() => handleItemClick(n)}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left transition-all hover:bg-[#F5F3FF]"
                      style={{ background: n.read ? 'transparent' : '#FAF5FF', borderBottom: '1px solid var(--border-default)' }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                        <Icon size={16} color={color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                        {n.message && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{n.message}</p>}
                        <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ background: '#7C3AED' }} />}
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <button onClick={handleViewAll}
                className="w-full flex items-center justify-center gap-1 py-3 text-xs font-semibold border-t transition-all hover:bg-[#F0EEFF]"
                style={{ color: '#7C3AED', borderColor: 'var(--border-default)' }}>
                View all notifications <ChevronRight size={13} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
