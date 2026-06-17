import React, { useState, useEffect, useMemo } from 'react'
import { Calendar, Clock, Video, ExternalLink, Radio, Monitor, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../components/layout/StudentLayout.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { liveLecturesAPI } from '../../api/liveLectures.js'
import { containerVariants, cardVariants } from '../../utils/animations.js'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore.js'

const TABS = ['Upcoming & Live', 'Past Sessions']

const STATUS_COLORS = {
  scheduled: { bg: '#EFF6FF', color: '#2563EB', label: 'Scheduled' },
  live:      { bg: '#F0FDF4', color: '#10B981', label: '● Live now' },
  ended:     { bg: '#F3F4F6', color: '#6B7280', label: 'Ended' },
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtTime(d) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export default function StudentLiveLectures() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [lectures, setLectures] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)

  useEffect(() => {
    liveLecturesAPI.getForCourse()
      .then(({ data }) => {
        setLectures(data.data || [])
      })
      .catch(() => {
        toast.error('Failed to fetch scheduled live lectures')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const now = new Date()

  const upcomingLectures = useMemo(() => {
    return lectures
      .filter(l => {
        if (l.status === 'ended') return false
        const end = new Date(l.scheduledAt).getTime() + (l.duration || 60) * 60000
        return end > now.getTime()
      })
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
  }, [lectures])

  const pastLectures = useMemo(() => {
    return lectures
      .filter(l => {
        if (l.status === 'ended') return true
        const end = new Date(l.scheduledAt).getTime() + (l.duration || 60) * 60000
        return end <= now.getTime()
      })
      .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
  }, [lectures])

  const currentList = tab === 0 ? upcomingLectures : pastLectures

  const renderLectures = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      )
    }

    if (currentList.length === 0) {
      return (
        <EmptyState
          icon={Video}
          title={tab === 0 ? 'No upcoming live lectures' : 'No past live lectures'}
          description={
            tab === 0
              ? "You don't have any upcoming live lectures scheduled. Keep an eye out for updates from your instructors."
              : "You haven't attended or missed any past live lectures yet."
          }
          action={tab === 0 ? { label: 'Browse Courses', onClick: () => navigate('/browse') } : undefined}
        />
      )
    }

    return (
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="space-y-4 w-full"
      >
        {currentList.map(lec => {
          const s = STATUS_COLORS[lec.status] || STATUS_COLORS.scheduled
          const isEnded = lec.status === 'ended'
          const didAttend = lec.attendance?.some(att => {
            const attUserId = att.user?._id || att.user
            return attUserId?.toString() === user?._id?.toString()
          })
          return (
            <motion.div
              key={lec._id}
              variants={cardVariants}
              className="rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between transition-all"
              style={{
                background: 'var(--bg-surface)',
                border: lec.status === 'live' ? '1.5px solid #BBF7D0' : '1px solid var(--border-default)',
              }}
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: lec.status === 'live' ? '#F0FDF4' : '#FEF2F2' }}
                >
                  {lec.status === 'live' ? (
                    <Radio size={22} color="#10B981" />
                  ) : (
                    <Video size={22} color="#DC2626" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(124,58,237,0.08)', color: '#7C3AED' }}
                    >
                      {lec.courseId?.title || 'General Session'}
                    </span>
                  </div>
                  <h3
                    className="text-lg font-bold mb-1"
                    style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}
                  >
                    {lec.title}
                  </h3>
                  {lec.description && (
                    <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                      {lec.description}
                    </p>
                  )}
                  <div
                    className="flex items-center gap-4 text-xs flex-wrap"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} /> {fmtDate(lec.scheduledAt)} at {fmtTime(lec.scheduledAt)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} /> {lec.duration} min
                    </span>
                    {lec.instructor && (
                      <span className="flex items-center gap-1.5">
                        {lec.instructor.avatar ? (
                          <img
                            src={lec.instructor.avatar}
                            alt={lec.instructor.fullName}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                            style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
                          >
                            {lec.instructor.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span>by {lec.instructor.fullName}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col items-end gap-3 shrink-0 w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-start">
                {isEnded ? (
                  didAttend ? (
                    <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full animate-fadeIn"
                      style={{ background: '#D1FAE5', color: '#065F46' }}>
                      ✓ Attended
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full animate-fadeIn"
                      style={{ background: '#FEE2E2', color: '#991B1B' }}>
                      ✗ Missed
                    </span>
                  )
                ) : (
                  <span
                    className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {s.label}
                  </span>
                )}
                {(lec.status === 'scheduled' || lec.status === 'live') && (
                  lec.type === 'inapp' ? (
                    <button
                      disabled={lec.status === 'scheduled'}
                      onClick={() => navigate(`/live/${lec._id}`)}
                      className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        lec.status === 'scheduled' ? 'cursor-not-allowed opacity-70' : 'hover:shadow-md'
                      }`}
                      style={{
                        background: lec.status === 'live' ? '#10B981' : 'var(--bg-muted)',
                        color: lec.status === 'live' ? '#FFFFFF' : 'var(--text-muted)',
                        border: lec.status === 'scheduled' ? '1px solid var(--border-default)' : 'none',
                      }}
                    >
                      <Monitor size={14} />
                      {lec.status === 'live' ? 'Join Live' : 'Join Session'}
                    </button>
                  ) : (
                    <button
                      disabled={lec.status === 'scheduled'}
                      onClick={() => {
                        liveLecturesAPI.attend(lec._id).catch(() => {})
                        window.open(lec.meetingUrl, '_blank', 'noopener,noreferrer')
                      }}
                      className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        lec.status === 'scheduled' ? 'cursor-not-allowed opacity-70' : 'hover:shadow-md'
                      }`}
                      style={{
                        background: lec.status === 'live' ? '#10B981' : 'var(--bg-muted)',
                        color: lec.status === 'live' ? '#FFFFFF' : 'var(--text-muted)',
                        border: lec.status === 'scheduled' ? '1px solid var(--border-default)' : 'none',
                      }}
                    >
                      <ExternalLink size={14} />
                      {lec.status === 'live' ? 'Join Now' : 'Join'}
                    </button>
                  )
                )}
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    )
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}
          >
            Live Lectures
          </h1>
          <button
            onClick={() => navigate('/my-learning')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#F0EEFF]"
            style={{ color: '#7C3AED', border: '1px solid var(--border-purple)' }}
          >
            <BookOpen size={15} /> My Learnings
          </button>
        </div>

        <div
          className="flex gap-1 p-1 rounded-xl mb-8 w-fit"
          style={{ background: 'var(--z-purple-100)' }}
        >
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === i ? '#7C3AED' : 'transparent',
                color: tab === i ? 'white' : 'var(--text-secondary)',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {renderLectures()}
      </div>
    </PageLayout>
  )
}
