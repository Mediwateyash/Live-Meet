import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import ReactPlayer from 'react-player'
import { ArrowLeft, CheckCircle2, ChevronDown, Check, FileText, ClipboardList, Brain, TrendingUp, Video } from 'lucide-react'
import { coursesAPI } from '../../api/courses.js'
import { progressAPI } from '../../api/progress.js'
import ProgressBar from '../../components/ui/ProgressBar.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import toast from 'react-hot-toast'
import { formatDuration } from '../../utils/formatters.js'
import CourseQuizzes from '../../components/quizzes/CourseQuizzes.jsx'

export default function CoursePlayer() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const playerRef = useRef(null)

  const [course,     setCourse]     = useState(null)
  const [progress,   setProgress]   = useState(null)
  const [currentLesson, setCurrent] = useState(null)
  const [openSections, setOpenSec]  = useState({})
  const [loading,    setLoading]    = useState(true)
  const [tab,        setTab]        = useState(() => searchParams.get('tab') || 'overview')
  const [marking,    setMarking]    = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: courseData } = await coursesAPI.getBySlug(slug)
        const courseId = courseData.data._id
        const [learnRes, progressRes] = await Promise.all([
          coursesAPI.getLearn(courseId),
          progressAPI.get(courseId),
        ])
        setCourse(learnRes.data.data)
        setProgress(progressRes.data.data)
      } catch {
        navigate('/my-learning')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  useEffect(() => {
    if (course?.curriculum?.[0]?.lessons?.[0]) {
      const first = course.curriculum[0].lessons[0]
      setCurrent(first)
      setOpenSec({ 0: true })
    }
  }, [course])

  useEffect(() => {
    setVideoEnded(false)
  }, [currentLesson])

  const isCompleted = (lessonId) => progress?.completedLessons?.some(id => id.toString() === lessonId?.toString())

  const markComplete = async () => {
    if (!currentLesson || !course) return
    setMarking(true)
    try {
      const { data } = await progressAPI.markLesson(course._id, currentLesson._id)
      setProgress(data.data)
      toast.success('Lesson marked complete!')
    } catch {
      toast.error('Could not mark lesson')
    } finally {
      setMarking(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F0F0F' }}>
      <Spinner size={40} color="#7C3AED" />
    </div>
  )

  const TABS = [
    { id: 'overview',  label: 'Overview' },
    { id: 'notes',     label: 'Notes',         icon: FileText },
    { id: 'tests',     label: 'Tests',          icon: ClipboardList },
    { id: 'mcq',       label: 'MCQ Generator',  icon: Brain },
    { id: 'progress',  label: 'Progress',       icon: TrendingUp },
    { id: 'live',      label: 'Live Lectures',  icon: Video },
  ]

  return (
    <div className="flex flex-col" style={{ height: '100vh', background: '#0F0F0F' }}>
      {/* Top bar */}
      <div className="h-16 flex items-center px-6 gap-4 shrink-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-base font-medium" style={{ color: '#A78BFA' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <span className="text-base font-semibold text-white truncate flex-1">{course?.title || 'Course Player'}</span>
        <div className="w-48">
          <ProgressBar percent={progress?.percentComplete || 0} size="sm" />
          <p className="text-sm mt-1.5 font-medium" style={{ color: '#A78BFA' }}>{Math.round(progress?.percentComplete || 0)}% complete</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Video + tabs */}
        <div className="flex-1 flex flex-col overflow-auto">
          {/* Video */}
          <div style={{ background: '#000', aspectRatio: '16/9', maxHeight: '60vh' }}>
            {currentLesson?.videoUrl ? (
              <ReactPlayer
                ref={playerRef}
                src={currentLesson.videoUrl}
                width="100%"
                height="100%"
                controls
                onProgress={({ playedSeconds, played }) => {
                  if (course) progressAPI.savePosition(course._id, { lessonId: currentLesson._id, position: Math.floor(playedSeconds) }).catch(() => {})
                  if (played >= 0.9 && !videoEnded) {
                    setVideoEnded(true)
                    if (!isCompleted(currentLesson?._id) && !marking) {
                      markComplete()
                    }
                  }
                }}
                onEnded={() => {
                  if (!videoEnded) {
                    setVideoEnded(true)
                    if (!isCompleted(currentLesson?._id) && !marking) {
                      markComplete()
                    }
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-base" style={{ color: '#666' }}>
                No video available
              </div>
            )}
          </div>

          {/* Below player */}
          <div className="p-8 max-w-4xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">{currentLesson?.title}</h2>
              <button
                onClick={markComplete}
                disabled={marking || isCompleted(currentLesson?._id) || (currentLesson?.videoUrl && !videoEnded)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-semibold transition-all"
                style={{
                  background: isCompleted(currentLesson?._id) ? '#10B981' : '#7C3AED',
                  color: 'white',
                  opacity: (marking || (currentLesson?.videoUrl && !videoEnded && !isCompleted(currentLesson?._id))) ? 0.5 : 1,
                  cursor: (isCompleted(currentLesson?._id) || (currentLesson?.videoUrl && !videoEnded)) ? 'not-allowed' : 'pointer',
                }}
              >
                {isCompleted(currentLesson?._id) ? <><Check size={18} /> Completed</> : <><CheckCircle2 size={18} /> Mark Complete</>}
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b overflow-x-auto" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors shrink-0"
                  style={{
                    color:        tab === id ? '#A78BFA' : '#666',
                    borderBottom: tab === id ? '2px solid #7C3AED' : '2px solid transparent',
                  }}
                >
                  {Icon && <Icon size={14} />}
                  {label}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <div className="prose prose-invert max-w-none text-sm" style={{ color: '#999' }}>
                <p>{course?.description?.replace(/<[^>]*>/g, '') || 'No description.'}</p>
              </div>
            )}
            {tab === 'notes' && (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(124,58,237,0.15)' }}>
                  <FileText size={22} color="#A78BFA" />
                </div>
                <p className="text-base font-semibold text-white mb-1">Notes & Study Material</p>
                <p className="text-sm" style={{ color: '#666' }}>Instructor notes for this course will appear here.</p>
              </div>
            )}
            {tab === 'tests' && (
              <CourseQuizzes courseId={course?._id} />
            )}
            {tab === 'mcq' && (
              <CourseQuizzes courseId={course?._id} />
            )}
            {tab === 'progress' && (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(124,58,237,0.15)' }}>
                  <TrendingUp size={22} color="#A78BFA" />
                </div>
                <p className="text-base font-semibold text-white mb-2">Your Progress</p>
                <div className="w-48 mb-2">
                  <ProgressBar percent={progress?.percentComplete || 0} size="sm" />
                </div>
                <p className="text-sm" style={{ color: '#A78BFA' }}>{Math.round(progress?.percentComplete || 0)}% complete</p>
                <p className="text-xs mt-1" style={{ color: '#666' }}>
                  {progress?.completedLessons?.length || 0} lessons completed
                </p>
              </div>
            )}
            {tab === 'live' && (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(124,58,237,0.15)' }}>
                  <Video size={22} color="#A78BFA" />
                </div>
                <p className="text-base font-semibold text-white mb-1">Live Scheduled Lectures</p>
                <p className="text-sm" style={{ color: '#666' }}>Upcoming live sessions scheduled by the instructor will appear here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Curriculum panel */}
        <aside className="w-96 shrink-0 overflow-y-auto" style={{ background: '#1A1A2E', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-5 py-4 text-base font-bold text-white border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            Course Content
          </div>
          {course?.curriculum?.map((section, si) => (
            <div key={si}>
              <button
                onClick={() => setOpenSec(o => ({ ...o, [si]: !o[si] }))}
                className="w-full px-5 py-3.5 flex items-center justify-between text-left"
                style={{ background: 'rgba(124,58,237,0.08)' }}
              >
                <span className="text-base font-semibold text-white">{section.title}</span>
                <ChevronDown size={16} color="#666" className={`transition-transform ${openSections[si] ? 'rotate-180' : ''}`} />
              </button>
              {openSections[si] && section.lessons.map((lesson, li) => (
                <button
                  key={li}
                  onClick={() => setCurrent(lesson)}
                  className="w-full px-5 py-3 flex items-center gap-3.5 text-left border-b transition-colors"
                  style={{
                    background:  currentLesson?._id === lesson._id ? 'rgba(124,58,237,0.2)' : 'transparent',
                    borderColor: 'rgba(255,255,255,0.04)',
                    borderLeft:  currentLesson?._id === lesson._id ? '3px solid #7C3AED' : '3px solid transparent',
                  }}
                >
                  {isCompleted(lesson._id) ? (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 animate-in fade-in" style={{ background: '#10B981' }}>
                      <Check size={12} color="white" strokeWidth={3.5} className="shrink-0" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border shrink-0" style={{ borderColor: '#555' }} />
                  )}
                  <span className="text-sm flex-1 text-left" style={{ color: currentLesson?._id === lesson._id ? '#A78BFA' : '#999', lineHeight: 1.4 }}>
                    {lesson.title}
                  </span>
                  {lesson.duration > 0 && <span className="text-sm shrink-0" style={{ color: '#555' }}>{formatDuration(lesson.duration)}</span>}
                </button>
              ))}
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}
