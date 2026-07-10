import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, PlayCircle, Clock, CheckCircle, BarChart2, Star } from 'lucide-react'
import PageLayout from '../../components/layout/PageLayout.jsx'
import Select from '../../components/ui/Select.jsx'
import { coursesAPI } from '../../api/courses.js'
import toast from 'react-hot-toast'

export default function CourseAnalytics() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters state
  const [dateRange, setDateRange] = useState('7d')
  const [batch, setBatch] = useState('')
  const [module, setModule] = useState('')

  useEffect(() => {
    setLoading(true)
    // Note: since coursesAPI.getBySlug takes a slug, we will use coursesAPI.browse which returns all,
    // or simulate finding the right course. If the API doesn't support fetching a single course by ID easily for admins,
    // this acts as a robust fallback for Phase 1.
    coursesAPI.browse({ limit: 100 })
      .then(res => {
        const found = res.data?.data?.find(c => c._id === courseId)
        if (found) {
          setCourse(found)
        } else {
          // If not found (maybe draft/archived and not returned by browse), use fallback name
          setCourse({ title: 'Course Analytics (Data pending)', _id: courseId })
        }
      })
      .catch(err => {
        setError('Failed to load course details')
        toast.error('Failed to load course details')
      })
      .finally(() => setLoading(false))
  }, [courseId])

  const goBack = () => {
    // Navigate back to exactly where the user came from (Manage Courses / Instructor Manage)
    navigate(-1)
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="skeleton h-10 w-48 mb-6 rounded-lg"></div>
          <div className="skeleton h-24 w-full rounded-2xl mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-32 rounded-2xl"></div>)}
          </div>
        </div>
      </PageLayout>
    )
  }

  if (error || !course) {
    return (
      <PageLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
          <p className="text-red-500 mb-4">{error || 'Course not found'}</p>
          <button onClick={goBack} className="text-[#7C3AED] hover:underline font-medium">
            ← Go Back
          </button>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header Section */}
        <div className="mb-8">
          <button 
            onClick={goBack}
            className="flex items-center gap-2 text-sm font-medium hover:text-[#7C3AED] transition-colors mb-4"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={16} /> Back to Courses
          </button>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold mb-1 tracking-wide" style={{ color: '#7C3AED' }}>Course Analytics Dashboard</p>
              <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                {course.title}
              </h1>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <Select 
                value={dateRange} 
                onChange={setDateRange}
                options={[
                  { value: '7d', label: 'Last 7 Days' },
                  { value: '30d', label: 'Last 30 Days' },
                  { value: 'all', label: 'All Time' }
                ]}
                className="w-40"
              />
              <Select 
                value={batch} 
                onChange={setBatch}
                options={[
                  { value: '', label: 'All Batches' }
                ]}
                className="w-40"
              />
              <Select 
                value={module} 
                onChange={setModule}
                options={[
                  { value: '', label: 'All Modules' }
                ]}
                className="w-40"
              />
            </div>
          </div>
        </div>

        {/* Top KPI Cards (Placeholders for Phase 1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Total Enrollments', value: '--', icon: Users, color: '#2563EB', bg: '#EFF6FF' },
            { label: 'Active Learners', value: '--', icon: PlayCircle, color: '#10B981', bg: '#F0FDF4' },
            { label: 'Avg Watch Time', value: '--', icon: Clock, color: '#F59E0B', bg: '#FFFBEB' },
            { label: 'Avg Attendance', value: '--', icon: CheckCircle, color: '#8B5CF6', bg: '#F5F3FF' },
            { label: 'Completion Rate', value: '--', icon: BarChart2, color: '#EC4899', bg: '#FDF2F8' },
            { label: 'Health Score', value: '--', icon: Star, color: '#14B8A6', bg: '#F0FDFA' },
          ].map((kpi, i) => (
            <div key={i} className="p-4 rounded-2xl border flex flex-col justify-between hover:shadow-sm transition-shadow" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{kpi.label}</span>
                <div className="p-2 rounded-xl" style={{ backgroundColor: kpi.bg }}>
                  <kpi.icon size={16} color={kpi.color} />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Charts and Analysis Section (Placeholders for Phase 1) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {[
            'Learning Activity Trend',
            'Course Progress Distribution',
            'Module Performance Analysis',
            'Video Learning Analytics',
            'Lecture-wise Video Completion',
            'Attendance Trend',
            'Assessment Performance',
            'Course Learning Funnel',
            'Student Performance Distribution',
            'AI Course Insights and Recommendations'
          ].map((title, i) => (
            <div key={i} className="p-6 rounded-2xl border min-h-[300px] flex flex-col" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
              <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                {title}
              </h3>
              <div className="flex-1 flex flex-col items-center justify-center text-sm font-medium rounded-xl border border-dashed p-6 text-center" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface-hover)' }}>
                <BarChart2 size={32} className="mb-2 opacity-50" />
                <p>Chart data pending implementation.</p>
                <p className="text-xs mt-1 opacity-75">Connects to backend aggregation API in Phase 3.</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </PageLayout>
  )
}
