import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import ReactPlayer from 'react-player'
import { ArrowLeft, CheckCircle2, ChevronDown, Check, FileText, ClipboardList, Brain, TrendingUp, Video, Award, Download, X, Link2, ExternalLink } from 'lucide-react'
import { coursesAPI } from '../../api/courses.js'
import { progressAPI } from '../../api/progress.js'
import ProgressBar from '../../components/ui/ProgressBar.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import useAuthStore from '../../store/authStore.js'
import toast from 'react-hot-toast'
import { formatDuration } from '../../utils/formatters.js'
import CourseQuizzes from '../../components/quizzes/CourseQuizzes.jsx'
import CertificateTemplate from '../../components/certificate/CertificateTemplate.jsx'
import api from '../../api/axios.js'
import { motion, AnimatePresence } from 'framer-motion'

function normalizeYouTubeUrl(url) {
  if (!url || typeof url !== 'string') return url
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/watch?v=${match[2]}`
    }
  } catch {
    // fallback
  }
  return url
}

function isLinkResource(url) {
  if (!url) return false
  if (url.includes('cloudinary.com') || url.includes('s3.amazonaws.com') || url.includes('/upload/')) {
    return false
  }
  const ext = url.split('.').pop().toLowerCase()
  if (['pdf', 'docx', 'doc', 'txt', 'pptx', 'ppt'].includes(ext)) {
    return false
  }
  return true
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

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="rounded-xl border border-[rgba(124,58,237,0.3)] bg-[rgba(124,58,237,0.05)] overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full p-4 flex items-start justify-between text-left transition-colors hover:bg-[rgba(124,58,237,0.08)]"
      >
        <span className="text-sm font-semibold text-indigo-300 pr-4 mt-0.5">Q: {question}</span>
        <ChevronDown size={18} className={`shrink-0 text-indigo-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 text-sm text-gray-300 mt-1">
              <div className="pt-3 border-t border-[rgba(124,58,237,0.1)]">
                <span className="font-semibold text-emerald-400 mr-2">A:</span>{answer}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function CoursePlayer() {
  const { slug } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const playerRef = useRef(null)

  const [course, setCourse] = useState(null)
  const [progress, setProgress] = useState(null)
  const [currentLesson, setCurrent] = useState(null)
  const [openSections, setOpenSec] = useState({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(() => searchParams.get('tab') || 'overview')
  const [marking, setMarking] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  // Quick Quiz State
  const [quickQuizLoading, setQuickQuizLoading] = useState(false)
  const [quickQuizActive, setQuickQuizActive] = useState(false)
  const [quickQuizMCQs, setQuickQuizMCQs] = useState([])
  const [quickQuizAnswers, setQuickQuizAnswers] = useState({})
  const [quickQuizSubmitted, setQuickQuizSubmitted] = useState(false)
  const [quickQuizScore, setQuickQuizScore] = useState(0)

  // Feedback State
  const [feedbackContent, setFeedbackContent] = useState('')
  const [feedbackRating, setFeedbackRating] = useState(5)
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  // Video Tracking Refs
  const trackingRef = useRef({
    currentInterval: null,
    pendingBatches: [],
    isNewSession: true,
    videoDuration: 0,
    courseId: null,
    lessonId: null,
  })

  const flushEngagement = async () => {
    const state = trackingRef.current;
    if (!state.courseId || !state.lessonId) return;
    
    if (state.currentInterval) {
      const syncId = (window.crypto && window.crypto.randomUUID) 
        ? window.crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      state.pendingBatches.push({
        syncId,
        intervals: [state.currentInterval],
        lastPlaybackPosition: playerRef.current?.getCurrentTime() || 0,
        videoDuration: state.videoDuration,
        isNewSession: state.isNewSession
      });
      state.currentInterval = null;
      state.isNewSession = false;
    }
    
    if (state.pendingBatches.length === 0) return;
    
    const currentBatch = state.pendingBatches[0];

    try {
      const res = await progressAPI.syncVideoProgress({
        courseId: state.courseId,
        lessonId: state.lessonId,
        ...currentBatch
      });
      
      // On success, remove from queue
      state.pendingBatches.shift();

      // Legacy Completion consistency - strictly depend on backend
      if (res.data?.isCompleted && !isCompleted(state.lessonId) && !marking && currentLesson?._id === state.lessonId) {
        markComplete();
      }

      // Save legacy playback position periodically (to avoid network spam in onProgress)
      if (course) {
        progressAPI.savePosition(course._id, { lessonId: state.lessonId, position: Math.floor(currentBatch.lastPlaybackPosition) }).catch(() => {});
      }

      // If more exist, flush again
      if (state.pendingBatches.length > 0) {
        setTimeout(flushEngagement, 100);
      }
    } catch (err) {
      console.warn('Video sync failed, retaining batch for retry', err);
    }
  };

  useEffect(() => {
    const handleUnload = () => {
      flushEngagement();
    };

    const handleVisibility = () => {
      if (document.hidden) {
        flushEngagement();
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    document.addEventListener('visibilitychange', handleVisibility);

    const timer = setInterval(() => {
       flushEngagement();
    }, 15000);

    return () => {
       clearInterval(timer);
       window.removeEventListener('beforeunload', handleUnload);
       window.removeEventListener('pagehide', handleUnload);
       document.removeEventListener('visibilitychange', handleVisibility);
       flushEngagement();
    };
  }, []);

  useEffect(() => {
    trackingRef.current.courseId = course?._id;
  }, [course]);

  // Polling / Refetch Progress
  const refetchProgress = async () => {
    if (!course) return;
    try {
      const res = await progressAPI.get(course._id)
      setProgress(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    refetchProgress()
  }, [course])

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
    if (currentLesson) {
      flushEngagement();
      trackingRef.current.lessonId = currentLesson._id;
      trackingRef.current.currentInterval = null;
      trackingRef.current.pendingIntervals = [];
      trackingRef.current.isNewSession = true;
      trackingRef.current.videoDuration = 0;

      if (!currentLesson.videoUrl && currentLesson.resources?.length > 0) {
        setTab('notes');
      }
    }
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

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackContent.trim()) return;
    setSubmittingFeedback(true);
    try {
      await api.post('/testimonials/student', {
        courseId: course._id,
        content: feedbackContent,
        rating: feedbackRating,
        role: 'Student'
      });
      toast.success('Feedback submitted successfully!');
      await refetchProgress();
    } catch (err) {
      toast.error('Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F0F0F' }}>
      <Spinner size={40} color="#7C3AED" />
    </div>
  )

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'tests', label: 'Tests', icon: ClipboardList },
    { id: 'mcq', label: 'MCQ Generator', icon: Brain },
    { id: 'live', label: 'Live Lectures', icon: Video },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'certificate', label: 'Certificate', icon: Award },
  ]

  return (
    <div className="flex flex-col" style={{ height: '100vh', background: '#0F0F0F' }}>
      {/* Top bar */}
      <div className="h-16 flex items-center px-4 md:px-6 gap-3 md:gap-4 shrink-0 pt-safe" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-base font-medium touch-target" style={{ color: '#A78BFA' }}>
          <ArrowLeft size={18} /> <span className="hidden xs:inline">Back</span>
        </button>
        <span className="text-sm md:text-base font-semibold text-white truncate flex-1">{course?.title || 'Course Player'}</span>

        {/* Course content toggle button for mobile */}
        <button
          onClick={() => setShowMobileSidebar(true)}
          className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.15)] text-white text-xs font-semibold transition-colors touch-target"
        >
          Content
        </button>

        <div className="w-24 sm:w-48 hidden xs:block">
          <ProgressBar percent={progress?.percentComplete || 0} size="sm" />
          <p className="text-xs sm:text-sm mt-1 sm:mt-1.5 font-medium text-right sm:text-left" style={{ color: '#A78BFA' }}>{Math.round(progress?.percentComplete || 0)}% complete</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Video + tabs */}
        <div className="flex-1 flex flex-col overflow-auto">
          {/* Video / PDF / Quiz */}
          <div style={{ background: '#000', aspectRatio: '16/9', maxHeight: 'min(60vh, calc(100vw * 9/16))', display: 'flex', flexDirection: 'column', position: 'relative' }}>
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
                url={normalizeYouTubeUrl(currentLesson.videoUrl)}
                width="100%"
                height="100%"
                controls
                config={{
                  youtube: {
                    playerVars: {
                      origin: typeof window !== 'undefined' ? window.location.origin : '',
                      enablejsapi: 1,
                      modestbranding: 1,
                      rel: 0
                    }
                  }
                }}
                onDuration={(dur) => {
                   trackingRef.current.videoDuration = dur;
                }}
                onPause={() => {
                   flushEngagement();
                }}
                onProgress={({ playedSeconds, played }) => {
                  // Tracking logic
                  const state = trackingRef.current;
                  if (!state.currentInterval) {
                    state.currentInterval = { start: playedSeconds, end: playedSeconds };
                  } else {
                    if (playedSeconds >= state.currentInterval.end && playedSeconds <= state.currentInterval.end + 2) {
                      state.currentInterval.end = playedSeconds;
                    } else {
                      // Seek occurred - push immediately to batch queue
                      const syncId = (window.crypto && window.crypto.randomUUID) 
                        ? window.crypto.randomUUID() 
                        : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                      state.pendingBatches.push({
                        syncId,
                        intervals: [{ ...state.currentInterval }],
                        lastPlaybackPosition: playerRef.current?.getCurrentTime() || 0,
                        videoDuration: state.videoDuration,
                        isNewSession: state.isNewSession
                      });
                      state.isNewSession = false;
                      state.currentInterval = { start: playedSeconds, end: playedSeconds };
                    }
                  }

                  if (played >= 0.9 && !videoEnded) {
                    setVideoEnded(true)
                  }
                }}
                onEnded={() => {
                  flushEngagement();
                  if (!videoEnded) {
                    setVideoEnded(true)
                  }
                }}
              />
            ) : currentLesson?.resources?.length > 0 ? (
              <div className="w-full h-full bg-gradient-to-br from-[#1e1b4b]/60 via-[#111827] to-[#0f0f13] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-[#A78BFA] flex items-center justify-center mb-4 border border-[rgba(124,58,237,0.2)] animate-pulse">
                  {isLinkResource(currentLesson.resources[0].url) ? <Link2 size={30} /> : <FileText size={30} />}
                </div>
                <h4 className="text-xl font-bold text-white mb-2">{currentLesson.title}</h4>
                <p className="text-sm text-gray-400 max-w-md mb-6 leading-relaxed">
                  This lesson is text-based. You can view or download the study notes and resources in the <strong>Notes</strong> tab below.
                </p>
                <button
                  onClick={() => setTab('notes')}
                  className="px-6 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold rounded-xl transition-all shadow-md active:scale-95"
                >
                  Go to Notes Tab
                </button>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-base" style={{ color: '#666' }}>
                No video or notes available
              </div>
            )}
          </div>

          {/* Below player */}
          <div className="p-4 sm:p-8 max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <h2 className="text-lg sm:text-xl font-bold text-white">{currentLesson?.title}</h2>
              <div className="flex flex-wrap gap-2 sm:gap-3">
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
                    color: tab === id ? '#A78BFA' : '#666',
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
              <div className="py-6">
                {currentLesson?.resources?.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white mb-4">Lesson Resources</h3>
                    {currentLesson.resources.map((res, i) => {
                      const isLink = isLinkResource(res.url);
                      return (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-[rgba(124,58,237,0.3)] bg-[rgba(124,58,237,0.05)]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[rgba(124,58,237,0.15)]">
                              {isLink ? <Link2 size={20} color="#A78BFA" /> : <FileText size={20} color="#A78BFA" />}
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-white">{res.name || `Notes for ${currentLesson.title}`}</h4>
                              <p className="text-xs text-gray-400">{isLink ? "External Link Notes" : "PDF Document"}</p>
                            </div>
                          </div>
                          {isLink ? (
                            <a href={res.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1">
                              <ExternalLink size={13} /> Visit Link
                            </a>
                          ) : (
                            <a href={getDownloadUrl(res.url)} download target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1">
                              <Download size={13} /> Download
                            </a>
                          )}
                        </div>
                      );
                    })}

                    {/* WH Questions FAQ Accordion */}
                    {currentLesson?.whQuestions?.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.1)]">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Brain size={18} color="#A78BFA" /> Key Questions to Remember
                        </h3>
                        <div className="space-y-3">
                          {currentLesson.whQuestions.map((q, idx) => (
                            <FAQItem key={idx} question={q.question} answer={q.answer} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-12 text-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(124,58,237,0.15)' }}>
                      <FileText size={22} color="#A78BFA" />
                    </div>
                    <p className="text-base font-semibold text-white mb-1">Notes & Study Material</p>
                    <p className="text-sm" style={{ color: '#666' }}>No notes have been added to this lesson yet.</p>
                  </div>
                )}
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
            {tab === 'certificate' && (
              <div className="py-6">
                {(progress?.percentComplete || 0) < 100 ? (
                  <div className="flex justify-center">
                    <div className="rounded-2xl p-6 max-w-xs w-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-white mb-1">Certification</h3>
                          <p className="text-sm" style={{ color: '#999' }}>Earn yours by finishing the course</p>
                        </div>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <Award size={20} color="#666" />
                        </div>
                      </div>
                      <p className="text-xs mb-4" style={{ color: '#666' }}>Complete all course lessons to unlock your official verified certificate.</p>
                      <button
                        disabled
                        className="w-full py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: 'rgba(255,255,255,0.06)', color: '#888', cursor: 'not-allowed' }}
                      >
                        Locked ({Math.round(progress?.percentComplete || 0)}% Done)
                      </button>
                    </div>
                  </div>
                ) : !progress?.hasGivenFeedback ? (
                  <div className="max-w-xl mx-auto bg-[#1A1A2E] p-8 rounded-xl border border-[rgba(255,255,255,0.1)] shadow-xl">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto" style={{ background: 'rgba(16,185,129,0.1)' }}>
                        <CheckCircle2 size={32} color="#10B981" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">Course Complete!</h3>
                      <p className="text-gray-400 text-sm">Please leave a review for the course to unlock your certificate.</p>
                    </div>
                    <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} type="button" onClick={() => setFeedbackRating(star)} className={`text-2xl transition-colors ${star <= feedbackRating ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-200'}`}>
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Your Review</label>
                        <textarea
                          required
                          value={feedbackContent}
                          onChange={e => setFeedbackContent(e.target.value)}
                          className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg p-3 text-white focus:outline-none focus:border-[#7C3AED] resize-none"
                          rows={4}
                          placeholder="What did you think of this course?..."
                        />
                      </div>
                      <button disabled={submittingFeedback} type="submit" className="w-full py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-lg transition-colors disabled:opacity-50">
                        {submittingFeedback ? 'Submitting...' : 'Submit & Claim Certificate'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="py-4">
                    <CertificateTemplate
                      studentName={user?.fullName || 'Student'}
                      courseTitle={course?.title || 'Course'}
                      instructorName={course?.instructor?.fullName}
                      issueDate={progress?.certificateIssuedAt}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Curriculum panel */}
        <aside className="hidden md:block w-96 shrink-0 overflow-y-auto" style={{ background: '#1A1A2E', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
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
                    background: currentLesson?._id === lesson._id ? 'rgba(124,58,237,0.2)' : 'transparent',
                    borderColor: 'rgba(255,255,255,0.04)',
                    borderLeft: currentLesson?._id === lesson._id ? '3px solid #7C3AED' : '3px solid transparent',
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

      {/* Mobile Curriculum Drawer */}
      <AnimatePresence>
        {showMobileSidebar && (
          <div className="fixed inset-0 z-50 flex justify-end md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileSidebar(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Sidebar Drawer */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="relative w-80 max-w-[85vw] h-full flex flex-col z-10 shadow-2xl"
              style={{ background: '#1A1A2E', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="px-5 py-4 text-base font-bold text-white border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <span>Course Content</span>
                <button onClick={() => setShowMobileSidebar(false)} className="text-gray-400 hover:text-white p-1 touch-target flex items-center justify-center">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pb-safe">
                {/* Render Curriculum */}
                {course?.curriculum?.map((section, si) => (
                  <div key={si}>
                    <button
                      onClick={() => setOpenSec(o => ({ ...o, [si]: !o[si] }))}
                      className="w-full px-5 py-3.5 flex items-center justify-between text-left"
                      style={{ background: 'rgba(124,58,237,0.08)' }}
                    >
                      <span className="text-sm font-semibold text-white">{section.title}</span>
                      <ChevronDown size={14} color="#666" className={`transition-transform ${openSections[si] ? 'rotate-180' : ''}`} />
                    </button>
                    {openSections[si] && section.lessons.map((lesson, li) => (
                      <button
                        key={li}
                        onClick={() => { setCurrent(lesson); setShowMobileSidebar(false) }}
                        className="w-full px-5 py-3 flex items-center gap-3 text-left border-b transition-colors touch-target"
                        style={{
                          background: currentLesson?._id === lesson._id ? 'rgba(124,58,237,0.2)' : 'transparent',
                          borderColor: 'rgba(255,255,255,0.04)',
                          borderLeft: currentLesson?._id === lesson._id ? '3px solid #7C3AED' : '3px solid transparent',
                        }}
                      >
                        {isCompleted(lesson._id) ? (
                          <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: '#10B981' }}>
                            <Check size={10} color="white" strokeWidth={3.5} />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border shrink-0" style={{ borderColor: '#555' }} />
                        )}
                        <span className="text-xs flex-1 text-left" style={{ color: currentLesson?._id === lesson._id ? '#A78BFA' : '#999', lineHeight: 1.4 }}>
                          {lesson.title}
                        </span>
                        {lesson.duration > 0 && <span className="text-xs shrink-0" style={{ color: '#555' }}>{formatDuration(lesson.duration)}</span>}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
