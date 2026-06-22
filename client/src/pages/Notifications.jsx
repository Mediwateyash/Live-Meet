import React, { useEffect, useState, useCallback } from 'react'
import { Bell, Radio, Video, BookOpen, Info, Trash2, CheckCheck, Inbox } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PageLayout from '../components/layout/PageLayout.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import { notificationsAPI } from '../api/notifications.js'
import toast from 'react-hot-toast'

const TYPE_ICON = {
  live_scheduled: { Icon: Video,    bg: 'rgba(124,58,237,0.12)', color: '#7C3AED', label: 'Live Scheduled' },
  live_started:   { Icon: Radio,    bg: 'rgba(16,185,129,0.12)', color: '#10B981', label: 'Now Live' },
  live_updated:   { Icon: Video,    bg: 'rgba(124,58,237,0.12)', color: '#7C3AED', label: 'Live Updated' },
  course_updated: { Icon: BookOpen, bg: 'rgba(220,38,38,0.12)',  color: '#DC2626', label: 'Course Update' },
  general:        { Icon: Info,     bg: 'rgba(59,130,246,0.12)', color: '#3B82F6', label: 'Info' },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs} hr${hrs > 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Notifications() {
  const navigate = useNavigate()
  const [items,    setItems]   = useState([])
  const [total,    setTotal]   = useState(0)
  const [unread,   setUnread]  = useState(0)
  const [page,     setPage]    = useState(1)
  const [pages,    setPages]   = useState(1)
  const [loading,  setLoading] = useState(true)
  const [clearing, setClearing]= useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const load = useCallback(async (p = 1, append = false) => {
    setLoading(true)
    try {
      const { data } = await notificationsAPI.getAll({ page: p, limit: 20 })
      setItems(prev => append ? [...prev, ...(data.data || [])] : (data.data || []))
      setTotal(data.total || 0)
      setUnread(data.unread || 0)
      setPage(data.page || 1)
      setPages(data.pages || 1)
    } catch { toast.error('Failed to load notifications') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(1) }, [load])

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead()
      setItems(prev => prev.map(n => ({ ...n, read: true })))
      setUnread(0)
      toast.success('All marked as read')
    } catch { toast.error('Failed to mark all read') }
  }

  const handleClearAll = async () => {
    setShowClearConfirm(false)
    setClearing(true)
    try {
      await notificationsAPI.clearAll()
      setItems([]); setTotal(0); setUnread(0)
      toast.success('All notifications cleared')
    } catch { toast.error('Failed to clear') }
    finally { setClearing(false) }
  }

  const handleItemClick = async (n) => {
    if (!n.read) {
      try {
        await notificationsAPI.markRead(n._id)
        setItems(prev => prev.map(x => x._id === n._id ? { ...x, read: true } : x))
        setUnread(prev => Math.max(0, prev - 1))
      } catch { /* silent */ }
    }
    if (n.link) navigate(n.link)
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    try {
      await notificationsAPI.remove(id)
      setItems(prev => { const next = prev.filter(x => x._id !== id); setTotal(t => t - 1); return next })
    } catch { toast.error('Failed to delete') }
  }

  const loadMore = () => load(page + 1, true)

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
              Notifications
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {total > 0 ? `${total} total · ${unread} unread` : 'All caught up!'}
            </p>
          </div>
          {items.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {unread > 0 && (
                <button onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all touch-target"
                  style={{ background: 'rgba(124,58,237,0.12)', color: '#7C3AED', border: '1px solid var(--border-purple)' }}>
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
              <button onClick={() => setShowClearConfirm(true)} disabled={clearing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all touch-target"
                style={{ background: 'rgba(220,38,38,0.1)', color: '#DC2626', border: '1px solid rgba(220,38,38,0.25)' }}>
                <Trash2 size={13} /> Clear all
              </button>
            </div>
          )}
        </div>

        {/* List */}
        {loading && items.length === 0 ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(124,58,237,0.12)' }}>
              <Inbox size={28} color="#7C3AED" />
            </div>
            <p className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No notifications</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Live lectures and course updates will appear here</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <AnimatePresence>
                {items.map(n => {
                  const { Icon, bg, color, label } = TYPE_ICON[n.type] || TYPE_ICON.general
                  return (
                    <motion.div key={n._id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                      onClick={() => handleItemClick(n)}
                      className="flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all group"
                      style={{ background: n.read ? 'var(--bg-surface)' : 'rgba(124,58,237,0.07)',
                        border: n.read ? '1px solid var(--border-default)' : '1px solid var(--border-purple)' }}>

                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                        <Icon size={20} color={color} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                              style={{ background: bg, color }}>
                              {label}
                            </span>
                            <p className="text-sm font-semibold mt-1 leading-tight" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                          </div>
                          <button onClick={e => handleDelete(e, n._id)}
                            className="p-1.5 rounded-lg transition-colors shrink-0"
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            title="Delete">
                            <Trash2 size={13} color="#EF4444" />
                          </button>
                        </div>
                        {n.message && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{timeAgo(n.createdAt)}</span>
                          {n.actorName && <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>· {n.actorName}</span>}
                          {n.link && <span className="text-[11px] font-medium" style={{ color: '#7C3AED' }}>→ View</span>}
                        </div>
                      </div>

                      {!n.read && <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-2" style={{ background: '#7C3AED' }} />}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {page < pages && (
              <div className="mt-6 text-center">
                <Button variant="outline" size="sm" onClick={loadMore} loading={loading}>Load more</Button>
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} title="Clear all notifications?" size="sm">
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          This will permanently remove all your notifications. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowClearConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleClearAll} loading={clearing}>
            Clear all
          </Button>
        </div>
      </Modal>
    </PageLayout>
  )
}
