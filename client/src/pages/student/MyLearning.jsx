import React, { useState, useEffect } from 'react'
import { BookOpen, Heart, CheckCircle2 } from 'lucide-react'
import PageLayout from '../../components/layout/StudentLayout.jsx'
import CourseCard from '../../components/shared/CourseCard.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { SkeletonCard } from '../../components/ui/Skeleton.jsx'
import useAuthStore from '../../store/authStore.js'
import { usersAPI } from '../../api/users.js'
import { progressAPI } from '../../api/progress.js'
import { motion } from 'framer-motion'
import { containerVariants } from '../../utils/animations.js'
import { useNavigate, useSearchParams } from 'react-router-dom'

const TABS = ['In Progress', 'Completed', 'Wishlist']

export default function MyLearning() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [tab, setTab] = useState(tabParam === 'wishlist' ? 2 : 0)
  const [enrolled, setEnrolled] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [progresses, setProgresses] = useState({})
  const [loading, setLoading] = useState(true)
  const [wishlistLoading, setWishlistLoading] = useState(false)

  useEffect(() => {
    if (tabParam === 'wishlist') {
      setTab(2)
    } else {
      setTab(0)
    }
  }, [tabParam])

  useEffect(() => {
    if (!user?.enrolledCourses?.length) { setLoading(false); return }
    usersAPI.getEnrolled()
      .then(async ({ data }) => {
        const courses = data.data || []
        setEnrolled(courses)
        const results = await Promise.all(
          courses.map(c => progressAPI.get(c._id).then(r => ({ id: c._id, p: r.data.data })).catch(() => null))
        )
        const map = {}
        results.filter(Boolean).forEach(({ id, p }) => { map[id] = p })
        setProgresses(map)
      })
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (tab !== 2) return
    setWishlistLoading(true)
    usersAPI.getWishlist()
      .then(({ data }) => setWishlist(data.data || []))
      .catch(() => {})
      .finally(() => setWishlistLoading(false))
  }, [tab])

  const inProgress  = enrolled.filter(c => (progresses[c._id]?.percentComplete || 0) < 100)
  const completed   = enrolled.filter(c => (progresses[c._id]?.percentComplete || 0) === 100)

  const handleTabChange = (index) => {
    setTab(index)
    if (index === 2) {
      setSearchParams({ tab: 'wishlist' })
    } else {
      setSearchParams({})
    }
  }

  const renderCourses = (list, overrideLoading = false) => {
    if (loading || overrideLoading) return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
    if (!list.length) return (
      <EmptyState
        icon={tab === 2 ? Heart : tab === 1 ? CheckCircle2 : BookOpen}
        title={tab === 2 ? 'Your wishlist is empty' : tab === 1 ? 'No completed courses yet' : 'No courses in progress'}
        description={tab === 2 ? 'Save courses you\'re interested in for later.' : tab === 1 ? 'Keep learning — your completed courses will appear here.' : 'Enroll in a course to start learning.'}
        action={tab !== 1 ? { label: 'Browse Courses', onClick: () => navigate('/browse') } : undefined}
      />
    )
    return (
      <motion.div variants={containerVariants} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map(course => (
          <CourseCard
            key={course._id}
            course={course}
            showProgress={tab !== 2}
            progress={progresses[course._id]?.percentComplete || 0}
          />
        ))}
      </motion.div>
    )
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
            My Learning
          </h1>
          <button
            onClick={() => navigate('/browse')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-[#F0EEFF]"
            style={{ color: '#7C3AED', border: '1px solid var(--border-purple)' }}
          >
            <BookOpen size={15} /> Browse Courses
          </button>
        </div>

        <div className="flex gap-1 p-1 rounded-xl mb-8 w-fit" style={{ background: 'var(--z-purple-100)' }}>
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => handleTabChange(i)}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === i ? '#7C3AED' : 'transparent',
                color:      tab === i ? 'white' : 'var(--text-secondary)',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 0 && renderCourses(inProgress)}
        {tab === 1 && renderCourses(completed)}
        {tab === 2 && renderCourses(wishlist, wishlistLoading)}
      </div>
    </PageLayout>
  )
}
