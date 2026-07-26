import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, PlayCircle, Clock, CheckCircle, BarChart2, Star, ShieldAlert } from 'lucide-react'
import PageLayout from '../../components/layout/PageLayout.jsx'
import Select from '../../components/ui/Select.jsx'
import { analyticsAPI } from '../../api/analytics.js'
import toast from 'react-hot-toast'
import useUIStore from '../../store/uiStore.js'
import { 
  PieChart, Pie, Cell, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, ComposedChart
} from 'recharts'

export default function CourseAnalytics() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const darkMode = useUIStore(state => state.darkMode)
  
  const [course, setCourse] = useState(null)
  const [kpis, setKpis] = useState(null)
  const [progressDist, setProgressDist] = useState(null)
  const [learningFunnel, setLearningFunnel] = useState(null)
  const [attendanceTrend, setAttendanceTrend] = useState(null)
  const [assessmentTrend, setAssessmentTrend] = useState(null)
  const [performanceDist, setPerformanceDist] = useState(null)
  const [videoAnalytics, setVideoAnalytics] = useState(null)
  const [lectureVideoPerformance, setLectureVideoPerformance] = useState(null)
  
  const [aiInsights, setAiInsights] = useState(null)
  const [loadingAi, setLoadingAi] = useState(false)
  const [aiError, setAiError] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters state
  const [dateRange, setDateRange] = useState('7d')
  const [batch, setBatch] = useState('')
  const [module, setModule] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!course) setLoading(true)
    else setIsRefreshing(true)
    
    analyticsAPI.getCourseStats(courseId, dateRange)
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
        setError(err.response?.data?.message || 'Failed to fetch analytics')
      })
      .finally(() => {
        setLoading(false)
        setIsRefreshing(false)
      })
  }, [courseId, dateRange])

  useEffect(() => {
    // Automatically attempt to load a cached AI insight for the new dateRange
    if (course) {
      setAiInsights(null) // clear stale insights immediately
      fetchAiInsights(false)
    }
  }, [dateRange, courseId])

  const fetchAiInsights = async (forceRefresh = false) => {
    setLoadingAi(true);
    setAiError(null);
    try {
      const res = await analyticsAPI.getCourseAIInsights(courseId, forceRefresh, dateRange);
      setAiInsights(res.data);
    } catch (err) {
      console.error(err);
      setAiError(err.response?.data?.message || 'Failed to retrieve AI Insights');
    } finally {
      setLoadingAi(false);
    }
  };

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
    { name: 'Not Started', value: progressDist?.notStarted || 0, color: darkMode ? '#374151' : '#E5E7EB' }
  ]
  const pieTotal = pieData.reduce((acc, cur) => acc + cur.value, 0)

  const perfBarData = [
    { name: 'Excellent', count: performanceDist?.excellent || 0, color: '#10B981' },
    { name: 'Good', count: performanceDist?.good || 0, color: '#3B82F6' },
    { name: 'Average', count: performanceDist?.average || 0, color: '#F59E0B' },
    { name: 'At Risk', count: performanceDist?.atRisk || 0, color: '#EF4444' },
    { name: 'No Data', count: performanceDist?.noAssessmentData || 0, color: darkMode ? '#4B5563' : '#9CA3AF' }
  ]

  const funnelData = [
    { label: 'Enrolled', value: learningFunnel?.enrolled || 0 },
    { label: 'Started', value: learningFunnel?.started || 0 },
    { label: 'Reached 50%', value: learningFunnel?.reached50 || 0 },
    { label: 'Reached 75%', value: learningFunnel?.reached75 || 0 },
    { label: 'Completed', value: learningFunnel?.completed || 0 }
  ]

  const safeFixed = (num, decimals = 1) => {
    const val = Number(num);
    return isNaN(val) ? '0' : val.toFixed(decimals);
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return '< 1m';
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
              {isRefreshing && <span className="ml-3 text-sm font-medium text-blue-500 animate-pulse">Updating...</span>}
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
              <div title="Batch analytics is unavailable because course-specific batch membership is not currently mapped." className="opacity-60 cursor-not-allowed">
                <Select 
                  value={batch} 
                  onChange={() => {}}
                  options={[
                    { value: '', label: 'All Batches' }
                  ]}
                  className="w-40 pointer-events-none"
                />
              </div>
              <div title="Module analytics requires module mapping for assessments and live lectures." className="opacity-60 cursor-not-allowed">
                <Select 
                  value={module} 
                  onChange={() => {}}
                  options={[
                    { value: '', label: 'All Modules' }
                  ]}
                  className="w-40 pointer-events-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          {[
            { label: 'Total Enrollments', value: kpis?.totalEnrollments || 0, icon: Users, color: darkMode ? '#60A5FA' : '#2563EB', bg: darkMode ? 'rgba(96, 165, 250, 0.15)' : '#EFF6FF' },
            { label: 'Total Duration', value: formatTime(kpis?.totalCourseDuration), icon: Clock, color: darkMode ? '#C084FC' : '#9333EA', bg: darkMode ? 'rgba(192, 132, 252, 0.15)' : '#F3E8FF' },
            { label: 'Avg Watch Time', value: !kpis?.averageWatchTime ? '0m' : formatTime(kpis?.averageWatchTime), icon: PlayCircle, color: darkMode ? '#34D399' : '#10B981', bg: darkMode ? 'rgba(52, 211, 153, 0.15)' : '#F0FDF4' },
            { label: 'Avg Attendance', value: kpis?.averageAttendanceRate === null || kpis?.averageAttendanceRate === undefined ? 'No Lectures' : `${safeFixed(kpis?.averageAttendanceRate)}%`, icon: CheckCircle, color: darkMode ? '#A78BFA' : '#8B5CF6', bg: darkMode ? 'rgba(167, 139, 250, 0.15)' : '#F5F3FF' },
            { label: 'Avg Progress', value: `${safeFixed(kpis?.averageProgressPercentage)}%`, icon: BarChart2, color: darkMode ? '#FBBF24' : '#F59E0B', bg: darkMode ? 'rgba(251, 191, 36, 0.15)' : '#FFFBEB' },
            { label: 'Assessment Avg', value: kpis?.assessmentAverage === null || kpis?.assessmentAverage === undefined ? 'No Quizzes' : `${safeFixed(kpis?.assessmentAverage)}%`, icon: ShieldAlert, color: darkMode ? '#F472B6' : '#EC4899', bg: darkMode ? 'rgba(244, 114, 182, 0.15)' : '#FDF2F8' },
            { label: 'Health Score', value: `${safeFixed(kpis?.courseHealthScore)} / 100`, icon: Star, color: darkMode ? '#2DD4BF' : '#14B8A6', bg: darkMode ? 'rgba(45, 212, 191, 0.15)' : '#F0FDFA' },
          ].map((kpi, i) => (
            <div key={i} className="p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all hover:shadow-sm" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: kpi.bg, color: kpi.color }}>
                <kpi.icon size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{kpi.label}</p>
                <h3 className={`font-black leading-tight ${kpi.value.toString().length > 10 ? 'text-sm' : 'text-xl'}`} style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>{kpi.value}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className={`transition-opacity duration-300 ${isRefreshing ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
          {/* AI Course Insights Panel */}
        <div className="mb-8 p-6 rounded-2xl border shadow-sm relative overflow-hidden" style={{ background: 'linear-gradient(145deg, var(--bg-surface) 0%, rgba(124, 58, 237, 0.03) 100%)', borderColor: 'var(--border-default)' }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b pb-4" style={{ borderColor: 'var(--border-default)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                        <Star size={20} className="fill-current" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Zenius AI Course Analysis</h2>
                        <p className="text-sm opacity-80" style={{ color: 'var(--text-muted)' }}>Intelligent interpretation of course health and performance metrics</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {aiInsights && (
                        <p className="text-xs text-gray-500 mr-2">
                            {aiInsights.cached ? 'Cached Analysis' : 'Fresh Analysis'} ({new Date(aiInsights.generatedAt).toLocaleTimeString()})
                        </p>
                    )}
                    <button 
                        onClick={() => fetchAiInsights(aiInsights ? true : false)}
                        disabled={loadingAi}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
                        style={{ background: '#7C3AED', color: '#fff', opacity: loadingAi ? 0.7 : 1 }}
                    >
                        {loadingAi ? <span className="animate-spin text-lg leading-none">↻</span> : <CheckCircle size={16} />}
                        {aiInsights ? 'Refresh Analysis' : 'Generate AI Analysis'}
                    </button>
                </div>
            </div>

            {aiError && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl mb-4 text-sm font-medium border border-red-100 dark:border-red-900/30 flex items-center gap-2">
                    <ShieldAlert size={18} /> {aiError}
                </div>
            )}

            {!aiInsights && !loadingAi && !aiError && (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                    <Star size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="font-medium">Click 'Generate AI Analysis' to interpret your course metrics.</p>
                </div>
            )}

            {loadingAi && !aiInsights && (
                <div className="py-12 text-center text-purple-500 dark:text-purple-400 animate-pulse">
                    <div className="w-8 h-8 rounded-full border-4 border-current border-t-transparent animate-spin mx-auto mb-3"></div>
                    <p className="font-medium">Analyzing course data...</p>
                </div>
            )}

            {aiInsights && (
                <div className="space-y-6">
                    <div className="p-5 rounded-xl border" style={{ backgroundColor: 'var(--bg-body)', borderColor: 'var(--border-default)' }}>
                        <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Overall Summary</h4>
                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-medium">{aiInsights.summary}</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Key Insights</h4>
                            <div className="space-y-3">
                                {aiInsights.insights?.map((insight, idx) => (
                                    <div key={idx} className="p-4 rounded-xl border flex gap-3 items-start" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                          insight.type === 'warning' 
                                            ? 'bg-red-100 dark:bg-red-950/40 text-red-650 dark:text-red-400' 
                                            : insight.type === 'positive' 
                                              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400' 
                                              : 'bg-blue-100 dark:bg-blue-950/40 text-blue-650 dark:text-blue-400'
                                        }`}>
                                            {insight.type === 'warning' ? <ShieldAlert size={16} /> : insight.type === 'positive' ? <CheckCircle size={16} /> : <BarChart2 size={16} />}
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">{insight.title}</h5>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">{insight.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Recommended Actions</h4>
                            <div className="space-y-3">
                                {aiInsights.recommendations?.map((rec, idx) => (
                                    <div key={idx} className="p-4 rounded-xl border flex gap-3 items-start relative overflow-hidden" style={{ backgroundColor: 'var(--bg-body)', borderColor: 'var(--border-default)' }}>
                                        <div className={`absolute top-0 left-0 w-1 h-full ${rec.priority === 'high' ? 'bg-red-500' : rec.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 ml-1">
                                            <Star size={16} />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">{rec.title}</h5>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">{rec.reason}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Charts and Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* 1. Course Progress Distribution */}
          <div className="p-6 rounded-2xl border flex flex-col h-[380px]" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Course Progress Distribution</h3>
            <div className="flex-1 w-full relative">
              {pieTotal === 0 ? (
                 <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">No enrollment data</div>
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
                  <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{pieTotal}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Enrolled</span>
                </div>
              )}
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
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
                <div className="flex items-center justify-center h-full text-sm text-gray-500 dark:text-gray-400">No enrollment data</div>
              ) : (
                funnelData.map((item, index) => {
                  const percentage = pieTotal > 0 ? (item.value / pieTotal) * 100 : 0
                  return (
                    <div key={index} className="w-full">
                      <div className="flex justify-between text-sm font-medium mb-1.5">
                        <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                        <span className="text-gray-900 dark:text-gray-100">{item.value} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3">
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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#E5E7EB'} />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: darkMode ? '#9CA3AF' : '#6B7280' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: darkMode ? '#9CA3AF' : '#6B7280' }} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <RechartsTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-white dark:bg-[#1E1E24] p-3 border border-gray-200 dark:border-[#2D2D35] rounded-xl shadow-lg text-sm">
                              <p className="font-bold mb-1 text-gray-900 dark:text-gray-100">{data.lectureTitle}</p>
                              <p className="text-gray-500 dark:text-gray-400 mb-2">{data.date}</p>
                              <p className="text-[#8B5CF6] dark:text-[#A78BFA] font-semibold">Rate: {data.attendanceRate.toFixed(1)}%</p>
                              <p className="text-gray-700 dark:text-gray-300">Attendees: {data.attendeeCount}</p>
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
                <div className="flex items-center justify-center h-full text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">No lectures hosted yet</div>
              )}
            </div>
          </div>

          {/* 4. Assessment Performance Trend */}
          <div className="p-6 rounded-2xl border flex flex-col h-[380px]" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Assessment Performance Trend</h3>
            <div className="flex-1 w-full">
              {assessmentTrend && assessmentTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={assessmentTrend} margin={{ top: 20, right: 30, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#E5E7EB'} />
                    <XAxis 
                      dataKey="quizTitle" 
                      tick={{ fontSize: 11, fill: darkMode ? '#9CA3AF' : '#6B7280' }} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => val.length > 12 ? val.substring(0, 12) + '...' : val}
                      angle={-25}
                      textAnchor="end"
                      dy={10}
                    />
                    <YAxis 
                      yAxisId="left"
                      tick={{ fontSize: 12, fill: darkMode ? '#9CA3AF' : '#6B7280' }} 
                      tickLine={false} 
                      axisLine={false} 
                      domain={[0, 100]} 
                      tickFormatter={(val) => `${val}%`}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 12, fill: darkMode ? '#9CA3AF' : '#6B7280' }} 
                      tickLine={false} 
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <RechartsTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-white dark:bg-[#1E1E24] p-3 border border-gray-200 dark:border-[#2D2D35] rounded-xl shadow-lg text-sm">
                              <p className="font-bold mb-1 text-gray-800 dark:text-gray-200">{data.quizTitle}</p>
                              <p className="text-gray-500 dark:text-gray-400 mb-2 text-xs">{data.date}</p>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="w-3 h-3 rounded-full bg-[#EC4899]"></span>
                                <p className="text-[#EC4899] dark:text-[#F472B6] font-semibold">Avg Score: {data.averageScore.toFixed(1)}%</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-[#E9D5FF] dark:bg-[#C084FC]"></span>
                                <p className="text-gray-700 dark:text-gray-300 font-medium">People Attempted: {data.attempts}</p>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar yAxisId="right" dataKey="attempts" fill={darkMode ? '#4A2A6B' : '#E9D5FF'} radius={[4, 4, 0, 0]} barSize={40} />
                    <Line yAxisId="left" type="monotone" dataKey="averageScore" stroke="#EC4899" strokeWidth={3} dot={{ r: 4, fill: '#EC4899' }} activeDot={{ r: 6 }} label={{ position: 'top', fill: darkMode ? '#F472B6' : '#EC4899', fontSize: 12, formatter: (val) => `${val.toFixed(0)}%`, dy: -10 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">No assessment data available</div>
              )}
            </div>
          </div>

          {/* 5. Student Performance Distribution */}
          <div className="p-6 rounded-2xl border flex flex-col h-[380px]" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Student Performance</h3>
              <button className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] bg-[#EFF6FF] dark:bg-blue-950/30 px-3 py-1.5 rounded-lg hover:bg-[#DBEAFE] dark:hover:bg-blue-900/40 transition-colors">
                View Student Analysis
              </button>
            </div>
            <div className="flex-1 w-full">
              {pieTotal === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">No enrollment data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perfBarData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#374151' : '#E5E7EB'} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: darkMode ? '#9CA3AF' : '#6B7280' }} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: darkMode ? '#E5E7EB' : '#374151', fontWeight: 500 }} tickLine={false} axisLine={false} width={80} />
                    <RechartsTooltip 
                      cursor={{ fill: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6' }}
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
                  <div className="flex flex-col gap-3 w-full xl:w-64 shrink-0">
                    <div className="p-4 rounded-xl border border-[rgba(37,99,235,0.2)] dark:border-[rgba(59,130,246,0.3)] bg-[rgba(37,99,235,0.02)] dark:bg-[rgba(59,130,246,0.05)]">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Avg Watch Time</p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{formatTime(videoAnalytics.averageWatchTime)}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Unique: {formatTime(videoAnalytics.averageUniqueWatchTime)}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-[rgba(16,185,129,0.2)] dark:border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.02)] dark:bg-[rgba(16,185,129,0.05)]">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Avg Video Completion</p>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{safeFixed(videoAnalytics?.averageVideoCompletion)}%</p>
                    </div>
                    <div className="p-4 rounded-xl border border-[rgba(245,158,11,0.2)] dark:border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.02)] dark:bg-[rgba(245,158,11,0.05)]">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Video Completion Rate</p>
                      <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{safeFixed(videoAnalytics?.videoCompletionRate)}%</p>
                    </div>
                    <div className="p-4 rounded-xl border border-[rgba(139,92,246,0.2)] dark:border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.02)] dark:bg-[rgba(139,92,246,0.05)]">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Engaged Learners</p>
                      <p className="text-xl font-bold text-purple-600 dark:text-[#A78BFA] mt-1">{videoAnalytics?.engagedLearners || 0}</p>
                    </div>
                  </div>

                  {/* Lecture Chart */}
                  <div className="flex-1 w-full h-[300px] xl:h-auto min-h-[300px]">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={lectureVideoPerformance} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#374151' : '#E5E7EB'} />
                         <XAxis type="number" tick={{ fontSize: 12, fill: darkMode ? '#9CA3AF' : '#6B7280' }} tickLine={false} axisLine={false} domain={[0, 100]} />
                         <YAxis dataKey="lessonTitle" type="category" tick={{ fontSize: 11, fill: darkMode ? '#E5E7EB' : '#374151' }} tickLine={false} axisLine={false} width={120} />
                         <RechartsTooltip 
                           cursor={{ fill: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6' }}
                           content={({ active, payload }) => {
                             if (active && payload && payload.length) {
                               const data = payload[0].payload
                               return (
                                 <div className="bg-white dark:bg-[#1E1E24] p-3 border border-gray-200 dark:border-[#2D2D35] rounded-xl shadow-lg text-sm z-10 relative">
                                   <p className="font-bold mb-2 text-gray-900 dark:text-gray-100">{data.lessonTitle}</p>
                                   <p className="text-gray-600 dark:text-gray-400">Completion: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{safeFixed(data.averageCompletionPercentage)}%</span></p>
                                   <p className="text-gray-600 dark:text-gray-400">Avg Watch: <span className="font-semibold text-blue-600 dark:text-blue-400">{formatTime(data.averageWatchTime)}</span></p>
                                   <p className="text-gray-600 dark:text-gray-400">Engaged: <span className="font-semibold text-gray-900 dark:text-gray-200">{data.engagedLearners} learners</span></p>
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
      </div>
    </PageLayout>
  )
}
