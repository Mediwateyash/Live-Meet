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
import api from '../../api/axios.js'

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

  // Quick Quiz State
  const [quickQuizLoading, setQuickQuizLoading] = useState(false)
  const [quickQuizActive, setQuickQuizActive]   = useState(false)
  const [quickQuizMCQs, setQuickQuizMCQs]       = useState([])
  const [quickQuizAnswers, setQuickQuizAnswers] = useState({})
  const [quickQuizSubmitted, setQuickQuizSubmitted] = useState(false)
  const [quickQuizScore, setQuickQuizScore]     = useState(0)

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
    setQuickQuizActive(false)
    setQuickQuizMCQs([])
    setQuickQuizAnswers({})
    setQuickQuizSubmitted(false)
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

  const handleGenerateQuickQuiz = async () => {
    if (!currentLesson?.resources?.[0]?.url) return;
    setQuickQuizActive(true);
    setQuickQuizLoading(true);
    setQuickQuizSubmitted(false);
    setQuickQuizAnswers({});
    try {
        const res = await api.post('/quick-quiz/generate', {
            resourceUrl: currentLesson.resources[0].url,
            title: currentLesson.title,
            numQuestions: 5
        });
        setQuickQuizMCQs(res.data.questions);
    } catch (error) {
        toast.error('Failed to generate quick quiz');
        setQuickQuizActive(false);
    } finally {
        setQuickQuizLoading(false);
    }
  };

  const handleQuickQuizSubmit = () => {
      let score = 0;
      quickQuizMCQs.forEach((mcq, idx) => {
          if (quickQuizAnswers[idx] === mcq.correctAnswer) {
              score++;
          }
      });
      setQuickQuizScore(Math.round((score / quickQuizMCQs.length) * 100));
      setQuickQuizSubmitted(true);
  };

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
          {/* Video / PDF / Quiz */}
          <div style={{ background: '#000', aspectRatio: '16/9', maxHeight: '60vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {quickQuizActive ? (
                <div className="w-full h-full bg-[#1A1A2E] text-white p-8 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold">Quick Quiz: {currentLesson?.title}</h3>
                        <button onClick={() => setQuickQuizActive(false)} className="text-gray-400 hover:text-white">Close</button>
                    </div>
                    {quickQuizLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4">
                            <Spinner size={40} color="#7C3AED" />
                            <p className="text-[#A78BFA] animate-pulse font-medium">AI is generating your quiz...</p>
                        </div>
                    ) : quickQuizSubmitted ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4 bg-[rgba(124,58,237,0.1)] rounded-xl p-8 border border-[rgba(124,58,237,0.3)]">
                            <h4 className="text-3xl font-bold text-white">Score: {quickQuizScore}%</h4>
                            <p className="text-gray-400">{quickQuizScore >= 70 ? 'Great job! You grasped the key concepts.' : 'You might want to review the notes again.'}</p>
                            <button onClick={() => setQuickQuizActive(false)} className="mt-4 bg-[#7C3AED] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#6D28D9]">Back to Lesson</button>
                        </div>
                    ) : (
                        <div className="space-y-8 pb-8">
                            {quickQuizMCQs.map((mcq, idx) => (
                                <div key={idx} className="bg-[rgba(255,255,255,0.03)] p-6 rounded-xl border border-[rgba(255,255,255,0.05)]">
                                    <p className="text-lg font-medium mb-4"><span className="text-[#A78BFA] mr-2">Q{idx + 1}.</span> {mcq.question}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {mcq.options.map((opt, oIdx) => (
                                            <button
                                                key={oIdx}
                                                onClick={() => setQuickQuizAnswers(prev => ({ ...prev, [idx]: opt }))}
                                                className={`p-3 rounded-lg text-left transition-all ${quickQuizAnswers[idx] === opt ? 'bg-[rgba(124,58,237,0.2)] border-[#7C3AED] border' : 'bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.05)]'}`}
                                            >
                                                {String.fromCharCode(65 + oIdx)}. {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <div className="flex justify-end">
                                <button
                                    onClick={handleQuickQuizSubmit}
                                    disabled={Object.keys(quickQuizAnswers).length < quickQuizMCQs.length}
                                    className="bg-[#7C3AED] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#6D28D9] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Submit Quick Quiz
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : currentLesson?.videoUrl ? (
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
            ) : currentLesson?.resources?.length > 0 ? (
                <div className="w-full h-full bg-white flex flex-col">
                    <iframe src={currentLesson.resources[0].url} width="100%" height="100%" className="flex-1" title="Notes Viewer" />
                </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-base" style={{ color: '#666' }}>
                No video or notes available
              </div>
            )}
          </div>

          {/* Below player */}
          <div className="p-8 max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <h2 className="text-xl font-bold text-white">{currentLesson?.title}</h2>
              <div className="flex gap-3">
                  {!currentLesson?.videoUrl && currentLesson?.resources?.length > 0 && (
                      <button
                        onClick={handleGenerateQuickQuiz}
                        disabled={quickQuizActive}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-semibold transition-all bg-[rgba(124,58,237,0.15)] text-[#A78BFA] hover:bg-[rgba(124,58,237,0.25)] border border-[rgba(124,58,237,0.3)] disabled:opacity-50"
                      >
                        <Brain size={18} /> Take a Quick Quiz
                      </button>
                  )}
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
