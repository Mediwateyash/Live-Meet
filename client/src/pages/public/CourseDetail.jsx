import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ReactPlayer from 'react-player'
import {
  ChevronDown, ChevronRight, CheckCircle2, Lock, Play, Clock, Globe, Award, Heart, PartyPopper,
  FileText, ClipboardList, Brain, TrendingUp, Video, Menu, X
} from 'lucide-react'
import PageLayout from '../../components/layout/PageLayout.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Modal from '../../components/ui/Modal.jsx'
import RatingStars from '../../components/ui/RatingStars.jsx'
import { SkeletonLine } from '../../components/ui/Skeleton.jsx'
import { coursesAPI } from '../../api/courses.js'
import { usersAPI } from '../../api/users.js'
import { progressAPI } from '../../api/progress.js'
import useAuthStore from '../../store/authStore.js'
import useUIStore from '../../store/uiStore.js'
import { formatPrice, formatDuration, formatDate } from '../../utils/formatters.js'
import toast from 'react-hot-toast'

const COURSE_TOOLS = [
  { path: 'notes',    icon: FileText,      label: 'Notes',         desc: 'Study materials',    iconBg: 'rgba(109,40,217,0.12)',  iconColor: '#7C3AED' },
  { path: 'tests',    icon: ClipboardList, label: 'Tests',         desc: 'Quizzes & exams',    iconBg: 'rgba(37,99,235,0.12)',   iconColor: '#2563EB' },
  { path: 'mcq',      icon: Brain,         label: 'MCQ Generator', desc: 'AI practice',        iconBg: 'rgba(5,150,105,0.12)',   iconColor: '#059669' },
  { path: 'live',     icon: Video,         label: 'Live Lectures', desc: 'Scheduled sessions', iconBg: 'rgba(220,38,38,0.12)',   iconColor: '#DC2626' },
  { path: 'progress', icon: TrendingUp,    label: 'Progress',      desc: 'Track learning',     iconBg: 'rgba(217,119,6,0.12)',   iconColor: '#D97706' },
  { path: 'certificate', icon: Award,   label: 'Certificate',   desc: 'View your certificate', iconBg: 'rgba(234,179,8,0.12)', iconColor: '#F59E0B' },
]

function CourseToolsSidebar({ slug, navigate, progress, onClose }) {
  return (
    <div className="rounded-2xl overflow-hidden py-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
      {/* Header */}
      <div className="px-4 pb-3 mb-1 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-default)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#7C3AED' }}>
            <Brain size={15} color="white" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Learning Center</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#F0EEFF] transition-colors">
            <X size={15} color="var(--text-muted)" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      {(progress?.percentComplete || 0) > 0 && (
        <div className="px-4 py-2 mb-1">
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            <span>Progress</span>
            <span style={{ color: '#7C3AED', fontWeight: 600 }}>{Math.round(progress.percentComplete)}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
            <div className="h-full rounded-full" style={{ width: `${progress.percentComplete}%`, background: 'linear-gradient(90deg, #7C3AED, #A78BFA)' }} />
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="px-2 pt-1 space-y-0.5">
        {COURSE_TOOLS.map(({ path, icon: Icon, label, iconBg, iconColor }) => (
          <button
            key={path}
            onClick={() => { if (path === 'certificate') { navigate(`/certificate/${slug}`); } else { navigate(`/course/${slug}/${path}`); } onClose?.(); } }
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all group"
            style={{ color: 'var(--text-secondary)', fontWeight: 500 }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: iconBg }}>
              <Icon size={14} color={iconColor} />
            </div>
            <span className="flex-1 text-left group-hover:text-[#7C3AED] transition-colors">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default function CourseDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, updateUser } = useAuthStore()
  const { openAuthModal } = useUIStore()

  const [course,        setCourse]        = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [enrolling,     setEnrolling]     = useState(false)
  const [enrolledModal, setEnrolledModal] = useState(false)
  const [open,          setOpen]          = useState({})
  const [progress,      setProgress]      = useState(null)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [rating,        setRating]        = useState(5)
  const [comment,       setComment]       = useState('')
  const [drawerOpen,    setDrawerOpen]    = useState(false)
  const [previewLesson, setPreviewLesson] = useState(null)

  const handlePreviewLesson = (lesson) => {
    if (!lesson.videoUrl) {
      toast.error('No video preview available for this lesson')
      return
    }
    setPreviewLesson(lesson)
  }

  const isEnrolled   = course && user?.enrolledCourses?.some(id => id.toString() === course._id.toString())
  const isWishlisted = course && user?.wishlist?.some(id => id.toString() === course._id.toString())
  const isLessonCompleted = (lessonId) =>
    progress?.completedLessons?.some(id => id.toString() === lessonId?.toString())

  useEffect(() => {
    setLoading(true)
    coursesAPI.getBySlug(slug)
      .then(({ data }) => setCourse(data.data))
      .catch(() => navigate('/browse'))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (course && isAuthenticated && isEnrolled) {
      progressAPI.get(course._id)
        .then(({ data }) => setProgress(data.data))
        .catch(() => {})
    }
  }, [course, isAuthenticated, isEnrolled])

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!comment.trim()) { toast.error('Please add a comment'); return }
    setSubmittingReview(true)
    try {
      await coursesAPI.addReview(course._id, { rating, comment })
      toast.success('Thank you for your review!')
      setComment('')
      const res = await coursesAPI.getBySlug(slug)
      setCourse(res.data.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleEnroll = async () => {
    if (!isAuthenticated) { openAuthModal('login', 'Log in to enroll in this course'); return }
    setEnrolling(true)
    try {
      await coursesAPI.enroll(course._id)
      const freshEnrolled = useAuthStore.getState().user?.enrolledCourses || []
      updateUser({ enrolledCourses: [...freshEnrolled, course._id] })
      setEnrolledModal(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not enroll')
    } finally {
      setEnrolling(false)
    }
  }

  const handleWishlist = async () => {
    if (!isAuthenticated) { openAuthModal('login', 'Log in to save courses to your wishlist'); return }
    
    const previousWishlist = user?.wishlist || []
    const courseIdStr = course._id.toString()
    const isCurrentlyWishlisted = previousWishlist.some(id => id.toString() === courseIdStr)
    const newWishlist = isCurrentlyWishlisted
      ? previousWishlist.filter(id => id.toString() !== courseIdStr)
      : [...previousWishlist, course._id]

    // Optimistically update the store
    updateUser({ wishlist: newWishlist })
    const toastId = toast.success(isCurrentlyWishlisted ? 'Removed from wishlist' : 'Added to wishlist')

    try {
      const { data } = await usersAPI.toggleWishlist(course._id)
      updateUser({ wishlist: data.data })
    } catch {
      // Rollback on error
      updateUser({ wishlist: previousWishlist })
      toast.dismiss(toastId)
      toast.error('Could not update wishlist')
    }
  }

  if (loading) return (
    <PageLayout>
      <div className="w-full px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8" style={{ maxWidth: '1700px', margin: '0 auto' }}>
        <div className="lg:col-span-2 space-y-4">
          {[...Array(6)].map((_, i) => <SkeletonLine key={i} height={i === 0 ? 36 : 16} width={i % 2 === 0 ? '80%' : '60%'} />)}
        </div>
        <div className="skeleton h-80 rounded-2xl" />
      </div>
    </PageLayout>
  )

  if (!course) return null

  const totalLessons = course.curriculum?.reduce((a, s) => a + s.lessons.length, 0) || 0
  const freeLessons = course.curriculum?.flatMap(s => s.lessons || []).filter(l => l.isFree) || []

  return (
    <PageLayout>
      {/* Header band */}
      <div className="py-10 px-8" style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #2E1065 100%)' }}>
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 items-start" style={{ maxWidth: '1700px', margin: '0 auto' }}>
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4 text-sm" style={{ color: '#A78BFA' }}>
              <span>Browse</span><ChevronRight size={14} /><span>{course.category}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3" style={{ fontFamily: 'Outfit, sans-serif', lineHeight: 1.2 }}>
              {course.title}
            </h1>
            {course.subtitle && <p className="text-lg mb-4" style={{ color: '#C4B5FD' }}>{course.subtitle}</p>}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <RatingStars rating={course.avgRating} count={course.reviewCount} size={16} />
              <span className="text-sm" style={{ color: '#A78BFA' }}>{course.enrolledStudents?.length || 0} students</span>
              <Badge variant="purple">{course.level}</Badge>
              <span className="flex items-center gap-1 text-sm" style={{ color: '#A78BFA' }}>
                <Globe size={14} />{course.language}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {course.instructor?.avatar ? (
                <img src={course.instructor.avatar} className="w-9 h-9 rounded-full" alt="" />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: '#7C3AED' }}>
                  {course.instructor?.fullName?.charAt(0)}
                </div>
              )}
              <span className="text-sm" style={{ color: '#C4B5FD' }}>
                Instructor: <span className="text-white font-medium">{course.instructor?.fullName}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Course Tools hamburger (enrolled only) */}
      {isEnrolled && (
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)' }}>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{ color: '#7C3AED', border: '1px solid var(--border-purple)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Menu size={16} />
            Learning Center
          </button>
          {(progress?.percentComplete || 0) > 0 && (
            <span className="text-xs font-semibold" style={{ color: '#7C3AED' }}>
              {Math.round(progress.percentComplete)}% done
            </span>
          )}
        </div>
      )}

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 p-4"
              style={{ background: 'var(--bg-page)' }}
            >
              <CourseToolsSidebar slug={slug} navigate={navigate} progress={progress} onClose={() => setDrawerOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main body */}
      <div className="w-full px-8 py-8" style={{ maxWidth: '1700px', margin: '0 auto' }}>
        <div className={`grid gap-8 items-start ${isEnrolled ? 'grid-cols-1 md:grid-cols-[280px_1fr_340px]' : 'grid-cols-1 lg:grid-cols-[1fr_340px]'}`}>

          {/* LEFT: Course Tools sidebar (desktop, enrolled only) */}
          {isEnrolled && (
            <aside className="hidden md:block sticky top-24">
              <CourseToolsSidebar slug={slug} navigate={navigate} progress={progress} />
            </aside>
          )}

          {/* CENTRE: main content */}
          <div className="min-w-0 space-y-10">

                {/* What you'll learn */}
                {course.whatYouLearn?.length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                      What you'll learn
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-6 rounded-2xl" style={{ border: '1px solid var(--border-purple)', background: 'var(--bg-muted)' }}>
                      {course.whatYouLearn.map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <CheckCircle2 size={16} color="#10B981" className="shrink-0 mt-0.5" />
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Curriculum */}
                <section>
                  <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                    Course Content · {course.curriculum?.length} sections · {totalLessons} lessons · {formatDuration(course.totalDuration)}
                  </h2>
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
                    {course.curriculum?.map((section, si) => (
                      <div key={si} style={{ borderBottom: si < course.curriculum.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                        <button
                          onClick={() => setOpen(o => ({ ...o, [si]: !o[si] }))}
                          className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
                          style={{ background: 'var(--z-purple-100, #F0EEFF)' }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: '#7C3AED' }}>
                              {si + 1}
                            </span>
                            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{section.title}</span>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{section.lessons.length} lesson{section.lessons.length !== 1 ? 's' : ''}</span>
                          </div>
                          <ChevronDown size={16} color="var(--text-secondary)" className={`transition-transform ${open[si] ? 'rotate-180' : ''}`} />
                        </button>
                        {open[si] && (
                          <div style={{ background: 'var(--bg-surface)' }}>
                            {section.lessons.map((lesson, li) => (
                              <div
                                key={li}
                                className={`flex items-center gap-3 px-6 py-3 border-t transition-colors ${(lesson.isFree || isEnrolled) ? 'cursor-pointer hover:bg-[var(--bg-hover)]' : ''}`}
                                style={{ borderColor: 'var(--border-default)', paddingLeft: '3rem' }}
                                onClick={() => (lesson.isFree || isEnrolled) && handlePreviewLesson(lesson)}
                              >
                                <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ background: (lesson.isFree || isEnrolled) ? 'rgba(109,40,217,0.14)' : 'var(--bg-muted)' }}>
                                  {(lesson.isFree || isEnrolled) ? (
                                    <Play size={10} color="#7C3AED" />
                                  ) : (
                                    <Lock size={10} color="var(--text-muted)" />
                                  )}
                                </div>
                                <span className="flex-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{lesson.title}</span>
                                {lesson.isFree && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handlePreviewLesson(lesson)
                                    }}
                                    className="px-3.5 py-1 text-xs font-semibold rounded-full border transition-all duration-200 hover:scale-105 shrink-0"
                                    style={{
                                      background: 'rgba(16,185,129,0.1)',
                                      color: '#10B981',
                                      borderColor: 'rgba(16,185,129,0.3)',
                                      cursor: 'pointer',
                                    }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.background = '#10B981'
                                      e.currentTarget.style.color = 'white'
                                      e.currentTarget.style.borderColor = '#10B981'
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.background = 'rgba(16,185,129,0.1)'
                                      e.currentTarget.style.color = '#10B981'
                                      e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'
                                    }}
                                  >
                                    Free Preview
                                  </button>
                                )}
                                {lesson.duration > 0 && (
                                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDuration(lesson.duration)}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Requirements */}
                {course.requirements?.length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                      Requirements
                    </h2>
                    <ul className="space-y-2">
                      {course.requirements.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#7C3AED' }} />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Reviews */}
                <section className="space-y-6">
                  <h2 className="text-xl font-bold border-t pt-8" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}>
                    Student Reviews
                  </h2>
                  {isEnrolled && progress?.percentComplete === 100 && !course.reviews?.some(r => r.student?._id?.toString() === user?._id?.toString() || r.student?.toString() === user?._id?.toString()) && (
                    <form onSubmit={handleReviewSubmit} className="p-6 rounded-2xl border space-y-4" style={{ background: 'var(--bg-muted)', borderColor: 'var(--border-purple)' }}>
                      <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Share Your Course Experience</h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>You've successfully completed this course! Please leave a rating and feedback below.</p>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Rating:</span>
                        <RatingStars rating={rating} size={22} interactive={true} onChange={setRating} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Feedback Comment</label>
                        <textarea
                          rows={3}
                          value={comment}
                          onChange={e => setComment(e.target.value)}
                          placeholder="Write a comment about your experience with this course..."
                          className="input-field resize-none"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" loading={submittingReview}>Submit Review</Button>
                      </div>
                    </form>
                  )}
                  {course.reviews?.length > 0 ? (
                    <div className="space-y-4">
                      {course.reviews.map((rev, i) => (
                        <div key={i} className="p-5 rounded-2xl border space-y-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {rev.student?.avatar ? (
                                <img src={rev.student.avatar} className="w-9 h-9 rounded-full object-cover" alt="" />
                              ) : (
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
                                  {rev.student?.fullName?.charAt(0).toUpperCase() || 'S'}
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-bold leading-none" style={{ color: 'var(--text-primary)' }}>{rev.student?.fullName || 'Anonymous'}</p>
                                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{formatDate(rev.createdAt)}</span>
                              </div>
                            </div>
                            <RatingStars rating={rev.rating} size={14} />
                          </div>
                          {rev.comment && (
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{rev.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                      No reviews yet. Be the first to complete this course and leave a review!
                    </div>
                  )}
                </section>
          </div>

          {/* RIGHT: sticky enroll card */}
          <div className="sticky top-24 rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-purple)', boxShadow: '0 4px 24px rgba(109,40,217,0.08)' }}>
            {course.thumbnail && (
              <img src={course.thumbnail} alt={course.title} className="w-full" style={{ aspectRatio: '16/9', objectFit: 'cover' }} />
            )}
            <div className="p-6">
              <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                {formatPrice(course.price)}
              </div>
              {isEnrolled ? (
                <>
                  <div className="mt-4 mb-4">
                    <div className="flex justify-between text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      <span>Your progress</span>
                      <span style={{ color: '#7C3AED' }}>{Math.round(progress?.percentComplete || 0)}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                      <div className="h-full rounded-full" style={{ width: `${progress?.percentComplete || 0}%`, background: 'linear-gradient(90deg, #7C3AED, #A78BFA)' }} />
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {Math.min(progress?.completedLessons?.length || 0, totalLessons)} / {totalLessons} lessons done
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button className="w-full" onClick={() => navigate(`/course/${slug}/learn`)}>
                      Continue Learning →
                    </Button>
                    {Math.round(progress?.percentComplete || 0) === 100 && (
                      <Button className="w-full" variant="outline" onClick={() => navigate(`/certificate/${course.slug}`)}>
                        View Certificate
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-4 space-y-3">
                    <Button className="w-full" onClick={handleEnroll} loading={enrolling}>
                      Enroll Now
                    </Button>
                    <Button variant="outline" className="w-full flex gap-2 items-center justify-center" onClick={handleWishlist}>
                      <Heart size={16} fill={isWishlisted ? '#EF4444' : 'none'} color={isWishlisted ? '#EF4444' : 'currentColor'} />
                      {isWishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}
                    </Button>
                  </div>
                  <ul className="mt-5 space-y-2.5">
                    {[
                      [Clock, `${formatDuration(course.totalDuration)} of video`],
                      [Play, `${totalLessons} lessons`],
                      [Award, 'Certificate of completion'],
                      [Globe, 'Lifetime access'],
                    ].map(([Icon, text]) => (
                      <li key={text} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <Icon size={15} color="#7C3AED" />{text}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment success modal */}
      <Modal isOpen={enrolledModal} onClose={() => setEnrolledModal(false)} title="" size="sm">
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(5,150,105,0.12)' }}>
            <PartyPopper size={32} color="#16A34A" />
          </div>
          <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
            Enrolled Successfully!
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            You're now enrolled in <strong>{course?.title}</strong>. Ready to start learning?
          </p>
          <Button className="w-full" onClick={() => { setEnrolledModal(false); navigate(`/course/${slug}/learn`) }}>
            Start Learning →
          </Button>
        </div>
      </Modal>

      {/* Video Preview Modal */}
      <Modal
        isOpen={!!previewLesson}
        onClose={() => setPreviewLesson(null)}
        title={previewLesson ? `Preview: ${previewLesson.title}` : ''}
        size="3xl"
      >
        {previewLesson && (
          <div className={freeLessons.length > 1 ? "grid grid-cols-1 md:grid-cols-10 gap-6" : "w-full"}>
            {/* Player Container */}
            <div className={freeLessons.length > 1 ? "md:col-span-7" : "w-full"}>
              <div className="relative w-full overflow-hidden rounded-xl bg-black" style={{ aspectRatio: '16/9' }}>
                <ReactPlayer
                  src={previewLesson.videoUrl}
                  width="100%"
                  height="100%"
                  controls
                  playing
                />
              </div>
            </div>

            {/* Free Previews Sidebar List */}
            {freeLessons.length > 1 && (
              <div className="md:col-span-3 flex flex-col min-h-0">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-3 shrink-0" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
                  Free Previews ({freeLessons.length})
                </h4>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar" style={{ maxHeight: '350px' }}>
                  {freeLessons.map((les) => {
                    const isCurrent = les._id?.toString() === previewLesson._id?.toString();
                    return (
                      <button
                        key={les._id || les.title}
                        onClick={() => setPreviewLesson(les)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-left border transition-all text-xs"
                        style={{
                          background: isCurrent ? 'rgba(109,40,217,0.08)' : 'var(--bg-muted)',
                          borderColor: isCurrent ? '#7C3AED' : 'var(--border-default)',
                          color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors" style={{ background: isCurrent ? '#7C3AED' : 'rgba(109,40,217,0.1)' }}>
                          <Play size={10} color={isCurrent ? 'white' : '#7C3AED'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate" style={{ color: isCurrent ? '#7C3AED' : 'inherit' }}>{les.title}</p>
                          {les.duration > 0 && (
                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatDuration(les.duration)}</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageLayout>
  )
}
