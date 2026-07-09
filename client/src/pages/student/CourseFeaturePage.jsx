import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, FileText, ClipboardList, Brain, TrendingUp, Video, Calendar, Clock, ExternalLink, Radio, Monitor } from 'lucide-react'
import PageLayout from '../../components/layout/PageLayout.jsx'
import { coursesAPI } from '../../api/courses.js'
import { liveLecturesAPI } from '../../api/liveLectures.js'
import useAuthStore from '../../store/authStore.js'
import CourseQuizzes from '../../components/quizzes/CourseQuizzes.jsx'
import CourseNotes from '../../components/quizzes/CourseNotes.jsx'

const FEATURES = {
  notes:    { icon: FileText,      label: 'Notes',          desc: 'Study materials uploaded by your instructor will appear here.' },
  tests:    { icon: ClipboardList, label: 'Tests',          desc: 'Quizzes and assessments for this course will appear here.' },
  mcq:      { icon: Brain,         label: 'MCQ Generator',  desc: 'AI-generated multiple choice questions for this course will appear here.' },
  progress: { icon: TrendingUp,    label: 'Progress',       desc: 'Your detailed learning progress and analytics will appear here.' },
  live:     { icon: Video,         label: 'Live Lectures',  desc: 'Scheduled live sessions by your instructor will appear here.' },
}

const NAV_COLORS = {
  notes:    { iconBg: '#EDE9FE', iconColor: '#7C3AED' },
  tests:    { iconBg: '#EFF6FF', iconColor: '#2563EB' },
  mcq:      { iconBg: '#F0FDF4', iconColor: '#059669' },
  progress: { iconBg: '#FFFBEB', iconColor: '#D97706' },
  live:     { iconBg: '#FEF2F2', iconColor: '#DC2626' },
}

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

function LiveLecturesList({ courseId }) {
  const navigate   = useNavigate()
  const { user }   = useAuthStore()
  const [lectures, setLectures] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!courseId) return
    liveLecturesAPI.getForCourse(courseId)
      .then(({ data }) => setLectures(data.data || []))
      .catch(() => setLectures([]))
      .finally(() => setLoading(false))
  }, [courseId])

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
    </div>
  )

  if (lectures.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 rounded-2xl"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5" style={{ background: '#FEF2F2' }}>
        <Video size={38} color="#DC2626" />
      </div>
      <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
        No live lectures yet
      </h3>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Your instructor hasn't scheduled any live sessions for this course yet.
      </p>
    </div>
  )

  return (
    <div className="space-y-4 w-full">
      {lectures.map(lec => {
        const s = STATUS_COLORS[lec.status] || STATUS_COLORS.scheduled
        const isEnded = lec.status === 'ended'
        const didAttend = lec.attendance?.some(att => {
          const attUserId = att.user?._id || att.user
          return attUserId?.toString() === user?._id?.toString()
        })
        return (
          <div
            key={lec._id}
            className="rounded-2xl p-5 flex gap-4 items-center"
            style={{ background: 'var(--bg-surface)', border: lec.status === 'live' ? '1.5px solid #BBF7D0' : '1px solid var(--border-default)' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: lec.status === 'live' ? '#F0FDF4' : '#FEF2F2' }}>
              {lec.status === 'live' ? <Radio size={22} color="#10B981" /> : <Video size={22} color="#DC2626" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{lec.title}</h3>
              {lec.description && (
                <p className="text-sm mb-2 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{lec.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span className="flex items-center gap-1.5"><Calendar size={12} /> {fmtDate(lec.scheduledAt)} at {fmtTime(lec.scheduledAt)}</span>
                <span className="flex items-center gap-1.5"><Clock size={12} /> {lec.duration} min</span>
                {lec.instructor && (
                  <span className="flex items-center gap-1.5">by {lec.instructor.fullName}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
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
                <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: s.bg, color: s.color }}>
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
          </div>
        )
      })}
    </div>
  )
}

export default function CourseFeaturePage({ feature }) {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)

  const { icon: Icon, label, desc } = FEATURES[feature] || {}
  const { iconBg, iconColor } = NAV_COLORS[feature] || {}

  useEffect(() => {
    coursesAPI.getBySlug(slug)
      .then(({ data }) => setCourse(data.data || null))
      .catch(() => {})
  }, [slug])

  const isLive = feature === 'live'

  return (
    <PageLayout>
      <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* Top bar */}
        <div className="px-8 pt-6 pb-0" style={{ background: 'var(--bg-page)' }}>
          <div className="flex items-center gap-2 mb-5 text-sm" style={{ color: 'var(--text-muted)' }}>
            <Link to="/my-learning" className="hover:text-[#7C3AED] transition-colors">My Learnings</Link>
            <span>›</span>
            <Link to={`/course/${slug}`} className="hover:text-[#7C3AED] transition-colors">
              {course?.title || slug}
            </Link>
            <span>›</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{label}</span>
          </div>

          {/* Feature nav tabs */}
          <div className="flex gap-1 border-b" style={{ borderColor: 'var(--border-default)' }}>
            {Object.entries(FEATURES).map(([key, { icon: NavIcon, label: navLabel }]) => {
              const active = key === feature
              const { iconColor: c } = NAV_COLORS[key]
              return (
                <button
                  key={key}
                  onClick={() => navigate(`/course/${slug}/${key}`)}
                  className="flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all"
                  style={{
                    color: active ? c : 'var(--text-secondary)',
                    borderBottom: active ? `2px solid ${c}` : '2px solid transparent',
                    marginBottom: -1,
                  }}
                >
                  <NavIcon size={15} />
                  {navLabel}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content area */}
        <div className={`flex-1 px-8 py-10 ${!isLive ? 'flex flex-col items-center justify-center' : ''}`}>
          {isLive ? (
            <div className="max-w-3xl mx-auto w-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
                  <Video size={20} color={iconColor} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Live Lectures</h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {course?.title || 'Loading…'}
                  </p>
                </div>
              </div>
              <LiveLecturesList courseId={course?._id} />
            </div>
          ) : feature === 'tests' || feature === 'mcq' ? (
            <div className="max-w-4xl mx-auto w-full">
               <CourseQuizzes courseId={course?._id} />
            </div>
          ) : feature === 'notes' ? (
            <div className="max-w-4xl mx-auto w-full">
               <CourseNotes />
            </div>
          ) : (
            <div className="w-full max-w-3xl flex flex-col items-center justify-center py-32 rounded-2xl mx-auto"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6" style={{ background: iconBg }}>
                {Icon && <Icon size={44} color={iconColor} />}
              </div>
              <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                {label}
              </h2>
              <p className="text-base text-center max-w-md mb-4" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
              <span className="text-sm font-semibold px-4 py-1.5 rounded-full" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                Coming soon
              </span>
            </div>
          )}

          <button
            onClick={() => navigate(`/course/${slug}`)}
            className="mt-6 flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#7C3AED] mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={15} /> Back to course
          </button>
        </div>
      </div>
    </PageLayout>
  )
}
