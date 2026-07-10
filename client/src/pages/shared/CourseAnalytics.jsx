import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, PlayCircle, Clock, CheckCircle, BarChart2, Star, ShieldAlert } from 'lucide-react'
import PageLayout from '../../components/layout/PageLayout.jsx'
import Select from '../../components/ui/Select.jsx'
import { analyticsAPI } from '../../api/analytics.js'
import toast from 'react-hot-toast'
import { 
  PieChart, Pie, Cell, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts'

export default function CourseAnalytics() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  
  const [course, setCourse] = useState(null)
  const [kpis, setKpis] = useState(null)
  const [progressDist, setProgressDist] = useState(null)
  const [learningFunnel, setLearningFunnel] = useState(null)
  const [attendanceTrend, setAttendanceTrend] = useState(null)
  const [assessmentTrend, setAssessmentTrend] = useState(null)
  const [performanceDist, setPerformanceDist] = useState(null)
  const [videoAnalytics, setVideoAnalytics] = useState(null)
  const [lectureVideoPerformance, setLectureVideoPerformance] = useState(null)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters state
  const [dateRange, setDateRange] = useState('7d')
  const [batch, setBatch] = useState('')
  const [module, setModule] = useState('')

  useEffect(() => {
    setLoading(true)
    
    analyticsAPI.getCourseStats(courseId)
      .then(res => {
        setCourse(res.data.course)
        setKpis(res.data.kpis)
        setProgressDist(res.data.progressDistribution)
        setLearningFunnel(res.data.learningFunnel)
        setAttendanceTrend(res.data.attendanceTrend)
        setAssessmentTrend(res.data.assessmentTrend)
        setPerformanceDist(res.data.performanceDistribution)
        setVideoAnalytics(res.data.videoAnalytics)
        setLectureVideoPerformance(res.data.lectureVideoPerformance)
      })
      .catch(err => {
        console.error(err)
        setError('Failed to load course analytics data')
        toast.error('Failed to load course analytics data')
      })
      .finally(() => setLoading(false))
  }, [courseId])

  const goBack = () => {
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

  // Chart Data Preparation
  const pieData = [
    { name: 'Completed', value: progressDist?.completed || 0, color: '#10B981' },
    { name: 'In Progress', value: progressDist?.inProgress || 0, color: '#F59E0B' },
    { name: 'Not Started', value: progressDist?.notStarted || 0, color: '#E5E7EB' }
  ]
  const pieTotal = pieData.reduce((acc, cur) => acc + cur.value, 0)

  const perfBarData = [
    { name: 'Excellent', count: performanceDist?.excellent || 0, color: '#10B981' },
    { name: 'Good', count: performanceDist?.good || 0, color: '#3B82F6' },
    { name: 'Average', count: performanceDist?.average || 0, color: '#F59E0B' },
    { name: 'At Risk', count: performanceDist?.atRisk || 0, color: '#EF4444' },
    { name: 'No Data', count: performanceDist?.noAssessmentData || 0, color: '#9CA3AF' }
  ]

  const funnelData = [
    { label: 'Enrolled', value: learningFunnel?.enrolled || 0 },
    { label: 'Started', value: learningFunnel?.started || 0 },
    { label: 'Reached 50%', value: learningFunnel?.reached50 || 0 },
    { label: 'Reached 75%', value: learningFunnel?.reached75 || 0 },
    { label: 'Completed', value: learningFunnel?.completed || 0 }
  ]

  const formatTime = (seconds) => {
    if (!seconds) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

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

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Total Enrollments', value: kpis.totalEnrollments, icon: Users, color: '#2563EB', bg: '#EFF6FF' },
            { label: 'Avg Watch Time', value: formatTime(kpis.averageWatchTime), icon: PlayCircle, color: '#10B981', bg: '#F0FDF4' },
            { label: 'Avg Attendance', value: `${kpis.averageAttendanceRate.toFixed(1)}%`, icon: CheckCircle, color: '#8B5CF6', bg: '#F5F3FF' },
            { label: 'Avg Progress', value: `${kpis.averageProgressPercentage.toFixed(1)}%`, icon: BarChart2, color: '#F59E0B', bg: '#FFFBEB' },
            { label: 'Assessment Avg', value: `${kpis.assessmentAverage.toFixed(1)}%`, icon: ShieldAlert, color: '#EC4899', bg: '#FDF2F8' },
            { label: 'Health Score', value: `${kpis.courseHealthScore.toFixed(1)} / 100`, icon: Star, color: '#14B8A6', bg: '#F0FDFA' },
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

        {/* Charts and Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* 1. Course Progress Distribution */}
          <div className="p-6 rounded-2xl border flex flex-col h-[380px]" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Course Progress Distribution</h3>
            <div className="flex-1 w-full relative">
              {pieTotal === 0 ? (
                 <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">No enrollment data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={2} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value, name) => [`${value} Students (${((value/pieTotal)*100).toFixed(1)}%)`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {pieTotal > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold">{pieTotal}</span>
                  <span className="text-xs text-gray-500 uppercase">Enrolled</span>
                </div>
              )}
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                  {d.name}
                </div>
              ))}
            </div>
          </div>

          {/* 2. Course Learning Funnel */}
          <div className="p-6 rounded-2xl border flex flex-col h-[380px]" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
            <h3 className="text-lg font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Course Learning Funnel</h3>
            <div className="flex-1 flex flex-col justify-center space-y-4">
              {pieTotal === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-gray-500">No enrollment data</div>
              ) : (
                funnelData.map((item, index) => {
                  const percentage = pieTotal > 0 ? (item.value / pieTotal) * 100 : 0
                  return (
                    <div key={index} className="w-full">
                      <div className="flex justify-between text-sm font-medium mb-1.5">
                        <span className="text-gray-700">{item.label}</span>
                        <span className="text-gray-900">{item.value} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div 
                          className="h-3 rounded-full transition-all duration-1000" 
                          style={{ width: `${percentage}%`, backgroundColor: '#8B5CF6', opacity: 1 - (index * 0.15) }}
                        ></div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* 3. Attendance Trend */}
          <div className="p-6 rounded-2xl border flex flex-col h-[380px]" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Attendance Trend</h3>
            <div className="flex-1 w-full">
              {attendanceTrend && attendanceTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <RechartsTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-white p-3 border rounded-xl shadow-lg text-sm">
                              <p className="font-bold mb-1">{data.lectureTitle}</p>
                              <p className="text-gray-500 mb-2">{data.date}</p>
                              <p className="text-[#8B5CF6] font-semibold">Rate: {data.attendanceRate.toFixed(1)}%</p>
                              <p className="text-gray-700">Attendees: {data.attendeeCount}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line type="monotone" dataKey="attendanceRate" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, fill: '#8B5CF6' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-500 border border-dashed rounded-xl">No lectures hosted yet</div>
              )}
            </div>
          </div>

          {/* 4. Assessment Performance Trend */}
          <div className="p-6 rounded-2xl border flex flex-col h-[380px]" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Assessment Performance Trend</h3>
            <div className="flex-1 w-full">
              {assessmentTrend && assessmentTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={assessmentTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <RechartsTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-white p-3 border rounded-xl shadow-lg text-sm">
                              <p className="font-bold mb-1">{data.quizTitle}</p>
                              <p className="text-gray-500 mb-2">{data.date}</p>
                              <p className="text-[#EC4899] font-semibold">Avg Score: {data.averageScore.toFixed(1)}%</p>
                              <p className="text-gray-700">Attempts: {data.attempts}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line type="monotone" dataKey="averageScore" stroke="#EC4899" strokeWidth={3} dot={{ r: 4, fill: '#EC4899' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-500 border border-dashed rounded-xl">No assessment data available</div>
              )}
            </div>
          </div>

          {/* 5. Student Performance Distribution */}
          <div className="p-6 rounded-2xl border flex flex-col h-[380px]" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Student Performance</h3>
              <button className="text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] px-3 py-1.5 rounded-lg hover:bg-[#DBEAFE] transition-colors">
                View Student Analysis
              </button>
            </div>
            <div className="flex-1 w-full">
              {pieTotal === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-gray-500 border border-dashed rounded-xl">No enrollment data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perfBarData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }} tickLine={false} axisLine={false} width={80} />
                    <RechartsTooltip 
                      cursor={{ fill: '#F3F4F6' }}
                      formatter={(value, name, props) => [`${value} Students (${((value/pieTotal)*100).toFixed(1)}%)`, 'Count']}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                      {perfBarData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* 6. Video Learning Analytics (Phase 3B) */}
          <div className="p-6 rounded-2xl border flex flex-col min-h-[380px] lg:col-span-2" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
             <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Video Learning Analytics</h3>
             
             {!videoAnalytics || videoAnalytics.engagedLearners === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-sm font-medium rounded-xl border border-dashed p-6 text-center" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface-hover)' }}>
                  <Clock size={32} className="mb-2 opacity-50" />
                  <p>No video engagement data recorded yet</p>
                  <p className="text-xs mt-1 opacity-75">Learners must watch videos to generate engagement metrics.</p>
               </div>
             ) : (
               <div className="flex flex-col xl:flex-row gap-6 w-full h-full">
                 
                 {/* Mini KPIs */}
                 <div className="flex flex-col gap-3 w-full xl:w-64 shrink-0">
                   <div className="p-4 rounded-xl border border-[rgba(37,99,235,0.2)] bg-[rgba(37,99,235,0.02)]">
                     <p className="text-xs font-bold text-gray-500 uppercase">Avg Watch Time</p>
                     <p className="text-xl font-bold text-blue-600 mt-1">{formatTime(videoAnalytics.averageWatchTime)}</p>
                     <p className="text-[10px] text-gray-400 mt-0.5">Unique: {formatTime(videoAnalytics.averageUniqueWatchTime)}</p>
                   </div>
                   <div className="p-4 rounded-xl border border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.02)]">
                     <p className="text-xs font-bold text-gray-500 uppercase">Avg Video Completion</p>
                     <p className="text-xl font-bold text-emerald-600 mt-1">{videoAnalytics.averageVideoCompletion.toFixed(1)}%</p>
                   </div>
                   <div className="p-4 rounded-xl border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.02)]">
                     <p className="text-xs font-bold text-gray-500 uppercase">Video Completion Rate</p>
                     <p className="text-xl font-bold text-amber-600 mt-1">{videoAnalytics.videoCompletionRate.toFixed(1)}%</p>
                   </div>
                   <div className="p-4 rounded-xl border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.02)]">
                     <p className="text-xs font-bold text-gray-500 uppercase">Engaged Learners</p>
                     <p className="text-xl font-bold text-purple-600 mt-1">{videoAnalytics.engagedLearners}</p>
                   </div>
                 </div>

                 {/* Lecture Chart */}
                 <div className="flex-1 w-full h-[300px] xl:h-auto min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={lectureVideoPerformance} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                        <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} domain={[0, 100]} />
                        <YAxis dataKey="lessonTitle" type="category" tick={{ fontSize: 11, fill: '#374151' }} tickLine={false} axisLine={false} width={120} />
                        <RechartsTooltip 
                          cursor={{ fill: '#F3F4F6' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div className="bg-white p-3 border rounded-xl shadow-lg text-sm z-10 relative">
                                  <p className="font-bold mb-2">{data.lessonTitle}</p>
                                  <p className="text-gray-600">Completion: <span className="font-semibold text-emerald-600">{data.averageCompletionPercentage.toFixed(1)}%</span></p>
                                  <p className="text-gray-600">Avg Watch: <span className="font-semibold text-blue-600">{formatTime(data.averageWatchTime)}</span></p>
                                  <p className="text-gray-600">Engaged: <span className="font-semibold">{data.engagedLearners} learners</span></p>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Bar dataKey="averageCompletionPercentage" radius={[0, 4, 4, 0]} barSize={20}>
                          {lectureVideoPerformance?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill="#10B981" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                 </div>
               </div>
             )}
          </div>

        </div>
      </div>
    </PageLayout>
  )
}
