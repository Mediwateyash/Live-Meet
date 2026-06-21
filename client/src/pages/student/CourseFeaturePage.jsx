import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, FileText, ClipboardList, Brain, TrendingUp, Video, Calendar, Clock, ExternalLink, Radio, Monitor, Award, CheckCircle2, Play, Download } from 'lucide-react'
import PageLayout from '../../components/layout/PageLayout.jsx'
import { coursesAPI } from '../../api/courses.js'
import { liveLecturesAPI } from '../../api/liveLectures.js'
import useAuthStore from '../../store/authStore.js'
import CourseQuizzes from '../../components/quizzes/CourseQuizzes.jsx'
import api from '../../api/axios.js'

const FEATURES = {
  notes:       { icon: FileText,      label: 'Notes',          desc: 'Study materials uploaded by your instructor will appear here.' },
  tests:       { icon: ClipboardList, label: 'Tests',          desc: 'Quizzes and assessments for this course will appear here.' },
  mcq:         { icon: Brain,         label: 'MCQ Generator',  desc: 'AI-generated multiple choice questions for this course will appear here.' },
  live:        { icon: Video,         label: 'Live Lectures',  desc: 'Scheduled live sessions by your instructor will appear here.' },
  progress:    { icon: TrendingUp,    label: 'Progress',       desc: 'Your detailed learning progress and analytics will appear here.' },
  certificate: { icon: Award,         label: 'Certificate',    desc: 'View and download your certificate after completing the course.' },
}

const NAV_COLORS = {
  notes:       { iconBg: '#EDE9FE', iconColor: '#7C3AED' },
  tests:       { iconBg: '#EFF6FF', iconColor: '#2563EB' },
  mcq:         { iconBg: '#F0FDF4', iconColor: '#059669' },
  live:        { iconBg: '#FEF2F2', iconColor: '#DC2626' },
  progress:    { iconBg: '#FFFBEB', iconColor: '#D97706' },
  certificate: { iconBg: '#FFFBEB', iconColor: '#F59E0B' },
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
function getDownloadUrl(url) {
  if (!url) return '';
  if (url.includes('cloudinary.com')) {
    if (url.includes('/image/upload/')) {
      return url.replace('/image/upload/', '/image/upload/fl_attachment/');
    }
    if (url.includes('/raw/upload/')) {
      return url.replace('/raw/upload/', '/raw/upload/fl_attachment/');
    }
  }
  return url;
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

function NotesList({ course, selectedNote, onSelectNote }) {
  const sections = course?.curriculum || []
  
  // Check if there are any notes at all
  let hasNotes = false
  for (const section of sections) {
    if (section.lessons?.some(l => l.resources?.length > 0)) {
      hasNotes = true
      break
    }
  }

  if (!hasNotes) {
    return (
      <div className="flex flex-col items-center justify-center py-20 rounded-2xl w-full"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#EDE9FE' }}>
          <FileText size={28} color="#7C3AED" />
        </div>
        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          No notes uploaded yet
        </h3>
        <p className="text-sm text-center max-w-xs" style={{ color: 'var(--text-muted)' }}>
          Your instructor hasn't uploaded any study materials or notes for this course yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full text-left">
      {sections.map((section, sIdx) => {
        const lessonsWithNotes = section.lessons?.filter(l => l.resources?.length > 0) || []
        if (lessonsWithNotes.length === 0) return null

        return (
          <div key={sIdx} className="space-y-2.5">
            <h3 className="text-sm font-bold uppercase tracking-wider pl-1" style={{ color: '#7C3AED' }}>
              Section {sIdx + 1}: {section.title}
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {lessonsWithNotes.map((lesson) => 
                lesson.resources.map((res, rIdx) => {
                  const isSelected = selectedNote?.url === res.url;
                  return (
                    <div 
                      key={`${lesson._id}-${rIdx}`} 
                      onClick={() => onSelectNote({ name: res.name || `Notes for ${lesson.title}`, url: res.url, lessonTitle: lesson.title })}
                      className={`rounded-2xl p-5 border flex justify-between items-center gap-4 transition-all duration-200 cursor-pointer ${
                        isSelected 
                          ? 'border-[#7C3AED] bg-[rgba(124,58,237,0.08)] shadow-[0_0_15px_rgba(124,58,237,0.15)]' 
                          : 'border-gray-150 dark:border-[var(--border-default)] bg-white dark:bg-[var(--bg-surface)] hover:bg-gray-50 dark:hover:bg-[rgba(255,255,255,0.02)]'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[rgba(124,58,237,0.15)] text-[#A78BFA]' : 'bg-purple-50 dark:bg-purple-950/20 text-[#7C3AED]'
                        }`}>
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }} title={res.name || `Notes for ${lesson.title}`}>
                            {res.name || `Notes for ${lesson.title}`}
                          </h4>
                          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>Lesson: {lesson.title}</p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <span 
                          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all shadow-sm ${
                            isSelected 
                              ? 'bg-transparent border border-[#7C3AED] text-[#A78BFA]' 
                              : 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white'
                          }`}
                        >
                          {isSelected ? 'Viewing' : 'Open'}
                        </span>
                      </div>
                    </div>
                  );
                })
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
  const [progress, setProgress] = useState(null)
  const [results, setResults] = useState([])
  const [loadingProgress, setLoadingProgress] = useState(true)
  const [selectedNote, setSelectedNote] = useState(null)

  // Auto-select first note when course curriculum is loaded
  useEffect(() => {
    if (course?.curriculum && !selectedNote) {
      for (const section of course.curriculum) {
        const lessonWithNotes = section.lessons?.find(l => l.resources?.length > 0)
        if (lessonWithNotes) {
          const res = lessonWithNotes.resources[0]
          setSelectedNote({
            name: res.name || `Notes for ${lessonWithNotes.title}`,
            url: res.url,
            lessonTitle: lessonWithNotes.title
          })
          break
        }
      }
    }
  }, [course])

  useEffect(() => {
    // Reset selection only if switching away from notes
    if (feature !== 'notes') {
      setSelectedNote(null)
    }
  }, [feature])

  const { icon: Icon, label, desc } = FEATURES[feature] || {}
  const { iconBg, iconColor } = NAV_COLORS[feature] || {}

  useEffect(() => {
    coursesAPI.getBySlug(slug)
      .then(({ data }) => setCourse(data.data || null))
      .catch(() => {})
  }, [slug])

  useEffect(() => {
    if (!course || feature !== 'progress') return
    
    const fetchProgressAndResults = async () => {
      try {
        setLoadingProgress(true)
        const [progRes, resultsRes] = await Promise.all([
          api.get(`/progress/${course._id}`),
          api.get('/result/my-results')
        ])
        setProgress(progRes.data.data)
        
        const quizzesRes = await api.get(`/quiz?courseId=${course._id}`)
        const courseQuizIds = new Set(quizzesRes.data.map(q => q._id.toString()))
        
        const courseResults = resultsRes.data.filter(r => {
          const quizId = r.quizId?._id || r.quizId
          return quizId && courseQuizIds.has(quizId.toString())
        })
        
        setResults(courseResults)
      } catch {
      } finally {
        setLoadingProgress(false)
      }
    }
    
    fetchProgressAndResults()
  }, [course, feature])

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
                  onClick={() => key === 'certificate' ? navigate(`/certificate/${slug}`) : navigate(`/course/${slug}/${key}`)}
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
        <div className={`flex-1 px-8 py-10 ${(!isLive && feature !== 'notes' && feature !== 'progress') ? 'flex flex-col items-center justify-center' : ''}`}>
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
          ) : feature === 'notes' ? (
            <div className="max-w-7xl mx-auto w-full space-y-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
                  <FileText size={20} color={iconColor} />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Course Study Notes</h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {course?.title || 'Loading…'}
                  </p>
                </div>
              </div>

              {/* Side-by-side Dual Pane Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start text-left">
                
                {/* Left Panel: Notes list (col-span-5) */}
                <div className="md:col-span-5 space-y-4">
                  <NotesList 
                    course={course} 
                    selectedNote={selectedNote} 
                    onSelectNote={setSelectedNote} 
                  />
                </div>

                {/* Right Panel: Inline PDF viewer (col-span-7) */}
                <div className="md:col-span-7 w-full">
                  {selectedNote ? (
                    <div className="space-y-4 rounded-2xl p-5 border border-gray-800 bg-[#121222]/80 backdrop-blur-md animate-in fade-in duration-200">
                      
                      {/* Active File Info and Action Buttons */}
                      <div className="flex items-center justify-between pb-3 border-b border-gray-850">
                        <div className="text-left min-w-0 pr-4">
                          <h3 className="text-sm font-bold text-white truncate" title={selectedNote.name}>
                            {selectedNote.name}
                          </h3>
                          <p className="text-xs text-gray-400 truncate">Lesson: {selectedNote.lessonTitle}</p>
                        </div>
                        
                        <a 
                          href={getDownloadUrl(selectedNote.url)}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
                        >
                          <Download size={13} />
                          Download PDF
                        </a>
                      </div>

                      {/* PDF iframe frame */}
                      <div className="rounded-xl overflow-hidden border border-gray-850 bg-white" style={{ height: '60vh' }}>
                        <iframe 
                          src={`https://docs.google.com/viewer?url=${encodeURIComponent(getDownloadUrl(selectedNote.url))}&embedded=true`} 
                          width="100%" 
                          height="100%" 
                          className="border-none"
                          title={selectedNote.name}
                        />
                      </div>
                      
                      {/* Help & Cloudinary configuration tip */}
                      <div className="flex flex-col gap-2 text-center text-xs text-gray-400 mt-2">
                        <div className="text-[11px] text-gray-400 bg-gray-900/60 p-3.5 rounded-xl leading-relaxed text-left border border-gray-850/80">
                          <p className="font-semibold text-yellow-500 mb-1 flex items-center gap-1">
                            ⚠️ Cloudinary Configuration Tip:
                          </p>
                          <p>
                            If the PDF fails to load or returns a 401 ACL error, please log into your <strong>Cloudinary Console</strong> and go to <strong>Settings ➔ Security ➔ PDF and ZIP files delivery</strong>. Make sure you enable the option to <strong>"Allow delivery of PDF and ZIP files"</strong> and save.
                          </p>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-32 rounded-2xl border border-dashed border-gray-800 bg-[#121222]/30 text-gray-500">
                      <FileText size={40} className="text-gray-700 mb-3 animate-pulse" />
                      <p className="text-sm font-medium">Select a note from the left to view it here</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          ) : feature === 'tests' || feature === 'mcq' ? (
            <div className="max-w-4xl mx-auto w-full">
               <CourseQuizzes courseId={course?._id} />
            </div>
          ) : feature === 'progress' ? (
            loadingProgress ? (
              <div className="w-full py-24 flex justify-center items-center">
                <div className="w-12 h-12 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto w-full space-y-8 animate-fadeIn">
                {/* Header card with progress statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Progress Card */}
                  <div className="md:col-span-2 bg-white dark:bg-[var(--bg-surface)] p-6 rounded-2xl shadow-md border border-gray-150 dark:border-[var(--border-default)] flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Course Completion</h3>
                      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Track your lesson viewing progress</p>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      {/* Radial Progress / Text percent */}
                      <div className="relative w-24 h-24 shrink-0 flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/20 rounded-full border border-indigo-100 dark:border-indigo-900/30">
                        <span className="text-2xl font-black text-[#7C3AED] dark:text-indigo-400">
                          {progress?.percentComplete || 0}%
                        </span>
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#7C3AED] to-indigo-500 rounded-full transition-all duration-1000" 
                            style={{ width: `${progress?.percentComplete || 0}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                          <span>{progress?.completedLessons?.length || 0} Lessons Completed</span>
                          <span>{progress?.percentComplete >= 100 ? 'Completed' : 'In Progress'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Certificate / Award Card */}
                  <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-2xl shadow-md border border-gray-150 dark:border-[var(--border-default)] flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Certification</h3>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Earn yours by finishing the course</p>
                      </div>
                      <div className={`p-2.5 rounded-xl ${progress?.percentComplete >= 100 ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-500' : 'bg-gray-50 dark:bg-gray-800 text-gray-400'}`}>
                        <Award size={24} />
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      {progress?.percentComplete >= 100 ? (
                        <div className="space-y-3">
                          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 size={14} /> Congratulations! You are certified.
                          </p>
                          <Link 
                            to={`/certificate/${course?._id}`}
                            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                          >
                            View Certificate
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Complete all course lessons to unlock your official verified certificate.
                          </p>
                          <div className="w-full py-2 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-xl text-xs font-semibold text-center border border-dashed border-gray-200 dark:border-gray-700">
                            Locked ({progress?.percentComplete || 0}% Done)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional milestones */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Milestones Card */}
                  <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-2xl shadow-md border border-gray-150 dark:border-[var(--border-default)]">
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Milestones</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <span className={`w-2.5 h-2.5 rounded-full ${progress?.percentComplete >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <div>
                            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Lessons Completed</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Watch all learning videos</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
                          {progress?.completedLessons?.length || 0} done
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <span className={`w-2.5 h-2.5 rounded-full ${progress?.hasPassedFinalExam ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`} />
                          <div>
                            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Course Assessments</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Complete all course tests</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${progress?.hasPassedFinalExam ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-450 dark:text-gray-550'}`}>
                          {progress?.hasPassedFinalExam ? 'Passed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Activity Details Card */}
                  <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-2xl shadow-md border border-gray-150 dark:border-[var(--border-default)] flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Resume Learning</h3>
                      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Pick up right where you left off in this course.</p>
                    </div>
                    <button 
                      onClick={() => navigate(`/course/${slug}/learn`)}
                      className="w-full py-3 bg-[#7C3AED] hover:bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-indigo-200 dark:hover:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                      <Play size={16} /> Open Course Player
                    </button>
                  </div>
                </div>

                {/* Quiz & Assessment Performance */}
                <div className="bg-white dark:bg-[var(--bg-surface)] p-6 rounded-2xl shadow-md border border-gray-150 dark:border-[var(--border-default)]">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <ClipboardList size={18} className="text-[#7C3AED]" /> Assessment Performance
                  </h3>
                  
                  {results.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900/30">
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>You haven't attempted any quizzes for this course yet.</p>
                      <Link to={`/course/${slug}/tests`} className="mt-2 inline-block text-xs font-bold text-[#7C3AED] hover:underline">
                        Go to Tests Tab &rarr;
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-150 dark:border-gray-850">
                            <th className="pb-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Quiz Title</th>
                            <th className="pb-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Score</th>
                            <th className="pb-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Status</th>
                            <th className="pb-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Date Taken</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                          {results.map((res) => {
                            const passed = res.score >= 50
                            return (
                              <tr key={res._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/20">
                                <td className="py-3.5 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                  {res.quizId?.title || 'Practice Quiz'}
                                </td>
                                <td className="py-3.5 text-sm font-mono font-bold">
                                  <span className={passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                    {res.score}%
                                  </span>
                                </td>
                                <td className="py-3.5">
                                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${passed ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'}`}>
                                    {passed ? 'Passed' : 'Failed'}
                                  </span>
                                </td>
                                <td className="py-3.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                                  {new Date(res.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )
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
