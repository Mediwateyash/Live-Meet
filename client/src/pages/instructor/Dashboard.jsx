import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Users, IndianRupee, Star, Plus, BarChart2, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import PageLayout from '../../components/layout/PageLayout.jsx'
import { SkeletonStat } from '../../components/ui/Skeleton.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import { instructorAPI } from '../../api/instructor.js'
import { formatPrice } from '../../utils/formatters.js'

export default function InstructorDashboard() {
  const navigate = useNavigate()
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    instructorAPI.dashboard()
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: 'Total Courses',   value: stats?.totalCourses   || 0,    icon: BookOpen,    color: '#7C3AED' },
    { label: 'Total Students',  value: stats?.totalStudents  || 0,    icon: Users,       color: '#2563EB' },
    { label: 'Total Revenue',   value: formatPrice(stats?.totalRevenue || 0, false), icon: IndianRupee, color: '#10B981' },
    { label: 'Avg Rating',      value: (stats?.avgRating     || 0).toFixed(1) + ' ★', icon: Star, color: '#F59E0B' },
  ]

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
            Instructor Dashboard
          </h1>
          <Button onClick={() => navigate('/instructor/courses/new')}>
            <Plus size={16} /> New Course
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {loading ? [...Array(4)].map((_, i) => <SkeletonStat key={i} />) : cards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="stat-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="stat-icon" style={{ background: `${color}18`, color }}>
                  <Icon size={20} />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Revenue chart */}
        <div className="rounded-2xl p-6 mb-8" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-purple)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
            Revenue — Last 30 days
          </h2>
          {stats?.revenueChart?.some(d => d.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => `₹${v}`} />
                <Tooltip
                  formatter={(v) => [`₹${v}`, 'Revenue']}
                  contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-purple)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 12 }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center rounded-xl" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
              <p className="text-sm">No revenue data yet — enrollments will appear here</p>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Create New Course', icon: Plus, to: '/instructor/courses/new', variant: 'primary' },
            { label: 'Manage Courses',    icon: BookOpen, to: '/instructor/courses', variant: 'outline' },
            { label: 'Student Results',   icon: TrendingUp, to: '/instructor/quizzes/results', variant: 'outline' },
            { label: 'View Analytics',    icon: BarChart2, to: '/instructor/courses', variant: 'outline' },
          ].map(({ label, icon: Icon, to, variant }) => (
            <Button key={label} variant={variant} className="w-full justify-center gap-2" onClick={() => navigate(to)}>
              <Icon size={16} /> {label}
            </Button>
          ))}
        </div>
      </div>
    </PageLayout>
  )
}
