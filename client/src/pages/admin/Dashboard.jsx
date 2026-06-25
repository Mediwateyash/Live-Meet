import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, BookOpen, GraduationCap, TrendingUp,
  AlertCircle, ChevronRight, Shield, ClipboardList, Star, MessageSquare
} from 'lucide-react'

import PageLayout from '../../components/layout/PageLayout.jsx'
import { SkeletonStat } from '../../components/ui/Skeleton.jsx'
import { adminAPI } from '../../api/admin.js'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.dashboard()
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Total Users',        value: stats?.totalUsers        || 0, icon: Users,         color: '#7C3AED', bg: '#F0EEFF' },
    { label: 'Total Courses',      value: stats?.totalCourses      || 0, icon: BookOpen,       color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Active Instructors', value: stats?.totalInstructors  || 0, icon: GraduationCap,  color: '#10B981', bg: '#F0FDF4' },
    { label: 'Enrollments (month)',value: stats?.monthlyEnrollments || 0, icon: TrendingUp,     color: '#F59E0B', bg: '#FFFBEB' },
  ]

  const quickLinks = [
    { label: 'Manage Users',        desc: 'View, edit and manage all users',           icon: Users,          path: '/admin/users',               color: '#7C3AED', bg: '#F0EEFF' },
    { label: 'All Courses',         desc: 'Review and moderate all courses',            icon: BookOpen,       path: '/admin/courses',             color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Manage Instructors',  desc: 'Manage instructors and their courses',       icon: GraduationCap,  path: '/admin/instructors',         color: '#10B981', bg: '#F0FDF4' },
    { label: 'Instructor Requests', desc: 'Review pending instructor applications',     icon: ClipboardList,  path: '/admin/instructor-requests', color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Manage Reviews',      desc: 'Update platform testimonials and reviews',   icon: Star,           path: '/admin/testimonials',        color: '#EC4899', bg: '#FDF2F8' },
    { label: 'Student Feedback',    desc: 'Read and respond to student reports/feedback', icon: MessageSquare, path: '/admin/support',            color: '#F43F5E', bg: '#FFF1F2' },
    { label: 'Legal Page Flags',    desc: 'Enable/disable terms and policies feature flags', icon: Shield,        path: '/admin/legal',               color: '#0D9488', bg: '#F0FDFA' },
  ]


  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#7C3AED' }}>
              <Shield size={20} color="white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                Admin Dashboard
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Platform overview and management</p>
            </div>
          </div>
        </div>

        {/* Pending alert */}
        {!loading && stats?.pendingRequests > 0 && (
          <div
            onClick={() => navigate('/admin/instructor-requests')}
            className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4 rounded-2xl cursor-pointer mb-6 transition-all hover:shadow-md border border-amber-300"
            style={{ background: '#FFFBEB' }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FEF3C7' }}>
              <AlertCircle size={17} color="#D97706" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: '#92400E' }}>
                {stats.pendingRequests} instructor application{stats.pendingRequests !== 1 ? 's' : ''} pending review
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#B45309' }}>Approve or reject instructor requests</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold shrink-0" style={{ color: '#D97706' }}>
              Review <ChevronRight size={14} />
            </div>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {loading
            ? [...Array(4)].map((_, i) => <SkeletonStat key={i} />)
            : statCards.map(({ label, value, icon: Icon, color, bg }) => (
              <div
                key={label}
                className="rounded-2xl p-4 sm:p-5 transition-all"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: bg }}>
                  <Icon size={19} color={color} />
                </div>
                <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                  {value}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))
          }
        </div>

        {/* Quick nav section */}
        <div className="mb-2">
          <h2 className="text-base font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickLinks.map(({ label, desc, icon: Icon, path, color, bg }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="flex items-center gap-4 p-5 rounded-2xl text-left group transition-all hover:shadow-lg"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${color}50`}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105" style={{ background: bg }}>
                  <Icon size={22} color={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                    {label}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" className="shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>

      </div>
    </PageLayout>
  )
}
