import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Clock, CheckCircle2, Award } from 'lucide-react'
import PageLayout from '../../components/layout/StudentLayout.jsx'
import CourseCard from '../../components/shared/CourseCard.jsx'
import { SkeletonStat, SkeletonCard } from '../../components/ui/Skeleton.jsx'
import useAuthStore from '../../store/authStore.js'
import { usersAPI } from '../../api/users.js'
import { progressAPI } from '../../api/progress.js'
import { getGreeting } from '../../utils/formatters.js'
import { containerVariants } from '../../utils/animations.js'

export default function StudentDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [enrolled,    setEnrolled]    = useState([])
  const [progresses,  setProgresses]  = useState({})
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    if (!user?.enrolledCourses?.length) { setLoading(false); return }
    usersAPI.getEnrolled()
      .then(({ data }) => {
        const courses = data.data || []
        setEnrolled(courses)
        return Promise.all(courses.slice(0, 3).map(c => progressAPI.get(c._id).then(r => ({ id: c._id, p: r.data.data })).catch(() => null)))
      })
      .then(results => {
        if (!results) return
        const map = {}
        results.filter(Boolean).forEach(({ id, p }) => { map[id] = p })
        setProgresses(map)
      })
      .finally(() => setLoading(false))
  }, [user])

  const completed = enrolled.filter(c => progresses[c._id]?.percentComplete === 100).length
  const hoursWatched = Object.values(progresses).reduce((a, p) => a + ((p?.lastWatchedPosition || 0) / 3600), 0)

  const stats = [
    { label: 'Enrolled',      value: user?.enrolledCourses?.length || 0, icon: BookOpen, color: '#7C3AED' },
    { label: 'Hours Watched', value: `${hoursWatched.toFixed(1)}h`,      icon: Clock,    color: '#2563EB' },
    { label: 'Completed',     value: completed,                           icon: CheckCircle2, color: '#10B981' },
    { label: 'Certificates',  value: completed,                           icon: Award,    color: '#F59E0B' },
  ]

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
            {getGreeting()}, {user?.fullName?.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Ready to continue learning?</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
          {loading ? [...Array(4)].map((_, i) => <SkeletonStat key={i} />) : stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="stat-card p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="stat-icon" style={{ background: `${color}15`, color }}>
                  <Icon size={20} />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* My Courses */}
        {user?.enrolledCourses?.length > 0 ? (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Continue Learning</h2>
              <button onClick={() => navigate('/my-learning')} className="text-sm font-medium" style={{ color: '#7C3AED' }}>View all →</button>
            </div>
            <motion.div variants={containerVariants} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {enrolled.slice(0, 3).map(course => (
                <CourseCard key={course._id} course={course} showProgress progress={progresses[course._id]?.percentComplete || 0} />
              ))}
            </motion.div>
          </div>
        ) : !loading ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--z-purple-100)' }}>
              <BookOpen size={36} color="#7C3AED" />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Start your learning journey</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Browse our courses and enroll in something new today.</p>
            <button onClick={() => navigate('/browse')} className="btn-primary">Browse Courses</button>
          </div>
        ) : null}
      </div>
    </PageLayout>
  )
}
