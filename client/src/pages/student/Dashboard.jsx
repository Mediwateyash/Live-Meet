import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Clock, CheckCircle2, Award, Sparkles, FileCheck, ArrowRight, XCircle, AlertCircle } from 'lucide-react'
import PageLayout from '../../components/layout/StudentLayout.jsx'
import CourseCard from '../../components/shared/CourseCard.jsx'
import { SkeletonStat, SkeletonCard } from '../../components/ui/Skeleton.jsx'
import useAuthStore from '../../store/authStore.js'
import { usersAPI } from '../../api/users.js'
import { authAPI } from '../../api/auth.js'
import { progressAPI } from '../../api/progress.js'
import { getGreeting } from '../../utils/formatters.js'
import { containerVariants } from '../../utils/animations.js'

export default function StudentDashboard() {
  const { user, setUser } = useAuthStore()
  const navigate = useNavigate()
  const [enrolled, setEnrolled] = useState([])
  const [progresses, setProgresses] = useState({})
  const [loading, setLoading] = useState(true)

  // Instructor Request Status Sync
  const [instRequest, setInstRequest] = useState(null)
  const [instStatus, setInstStatus] = useState(null)

  useEffect(() => {
    // 1. Sync Instructor Request Status automatically
    usersAPI
      .getRequestStatus()
      .then(({ data }) => {
        const reqObj = data.data
        if (reqObj) {
          setInstRequest(reqObj)
          setInstStatus(reqObj.status)
          // If request was approved and user object is not updated yet, refetch me() to grant instructor privileges immediately
          if (reqObj.status === 'approved' && user?.role !== 'instructor') {
            authAPI.me().then(({ data }) => setUser(data.data)).catch(() => {})
          }
        }
      })
      .catch(() => {})

    // 2. Fetch Enrolled Courses & Progress
    if (!user?.enrolledCourses?.length) {
      setLoading(false)
      return
    }
    usersAPI
      .getEnrolled()
      .then(({ data }) => {
        const courses = data.data || []
        setEnrolled(courses)
        return Promise.all(
          courses.slice(0, 3).map((c) =>
            progressAPI
              .get(c._id)
              .then((r) => ({ id: c._id, p: r.data.data }))
              .catch(() => null)
          )
        )
      })
      .then((results) => {
        if (!results) return
        const map = {}
        results.filter(Boolean).forEach(({ id, p }) => {
          map[id] = p
        })
        setProgresses(map)
      })
      .finally(() => setLoading(false))
  }, [user?._id])

  const completed = enrolled.filter((c) => progresses[c._id]?.percentComplete === 100).length
  const hoursWatched = Object.values(progresses).reduce((a, p) => a + (p?.lastWatchedPosition || 0) / 3600, 0)

  const stats = [
    { label: 'Enrolled', value: user?.enrolledCourses?.length || 0, icon: BookOpen, color: '#7C3AED' },
    { label: 'Hours Watched', value: `${hoursWatched.toFixed(1)}h`, icon: Clock, color: '#2563EB' },
    { label: 'Completed', value: completed, icon: CheckCircle2, color: '#10B981' },
    { label: 'Certificates', value: completed, icon: Award, color: '#F59E0B' },
  ]

  const isApprovedInstructor = user?.role === 'instructor' || user?.isApprovedInstructor || instStatus === 'approved'
  const isPendingInstructor = instStatus === 'pending'
  const isRejectedInstructor = instStatus === 'rejected'

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        
        {/* Live Instructor Application Status Banner (Synchronized) */}
        {isApprovedInstructor ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg border border-purple-700/50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-300 block">🟢 Instructor Privileges Active</span>
                <h3 className="text-base font-bold text-white mt-0.5">You are an Approved Instructor on Zenius AI!</h3>
                <p className="text-xs text-purple-200 mt-0.5">Build courses, manage live classes, and empower students worldwide.</p>
              </div>
            </div>
            <button
              onClick={() => navigate(user?.role === 'admin' ? '/admin/dashboard' : '/instructor/dashboard')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white text-purple-900 hover:bg-purple-50 transition-all shadow-md shrink-0 flex items-center justify-center gap-1.5"
            >
              <span>Go to Instructor Dashboard</span>
              <ArrowRight size={14} />
            </button>
          </motion.div>
        ) : isPendingInstructor ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <FileCheck size={22} />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">🟡 Application Under Review</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Instructor Application Received</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Our administrative team is currently evaluating your profile. Typical review time: 2–5 business days.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/become-instructor')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition-all shrink-0 flex items-center justify-center gap-1.5"
            >
              <span>View Tracking Status</span>
              <ArrowRight size={14} />
            </button>
          </motion.div>
        ) : isRejectedInstructor ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                <XCircle size={22} />
              </div>
              <div>
                <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider block">🔴 Application Not Approved</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Instructor Application Update</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Your instructor application was not approved at this time.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/become-instructor')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all shrink-0 flex items-center justify-center gap-1.5"
            >
              <span>View Details</span>
              <ArrowRight size={14} />
            </button>
          </motion.div>
        ) : null}

        {/* Header */}
        <div className="mb-2 sm:mb-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
            {getGreeting()}, {user?.fullName?.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ready to continue learning?</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
          {loading
            ? [...Array(4)].map((_, i) => <SkeletonStat key={i} />)
            : stats.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="stat-card p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="stat-icon p-2 rounded-xl" style={{ background: `${color}15`, color }}>
                      <Icon size={20} />
                    </div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
                  </div>
                  <div className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                    {value}
                  </div>
                </div>
              ))}
        </div>

        {/* My Courses */}
        {user?.enrolledCourses?.length > 0 ? (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                Continue Learning
              </h2>
              <button onClick={() => navigate('/my-learning')} className="text-sm font-medium text-purple-600 hover:text-purple-700">
                View all →
              </button>
            </div>
            <motion.div variants={containerVariants} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {enrolled.slice(0, 3).map((course) => (
                <CourseCard key={course._id} course={course} showProgress progress={progresses[course._id]?.percentComplete || 0} />
              ))}
            </motion.div>
          </div>
        ) : !loading ? (
          <div className="text-center py-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 bg-purple-100 dark:bg-purple-950 text-purple-600">
              <BookOpen size={36} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
              Start your learning journey
            </h3>
            <p className="text-sm mb-6 text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Browse our courses and enroll in something new today.
            </p>
            <button onClick={() => navigate('/browse')} className="px-6 py-2.5 rounded-xl font-semibold bg-purple-600 text-white hover:bg-purple-700 shadow-md">
              Browse Courses
            </button>
          </div>
        ) : null}
      </div>
    </PageLayout>
  )
}
