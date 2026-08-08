import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users, BookOpen, GraduationCap, TrendingUp,
  AlertCircle, ChevronRight, Shield, ClipboardList, Star, MessageSquare, ArrowUpRight, Activity, CreditCard
} from 'lucide-react'

import PageLayout from '../../components/layout/PageLayout.jsx'
import { SkeletonStat } from '../../components/ui/Skeleton.jsx'
import { adminAPI } from '../../api/admin.js'
import useAuthStore from '../../store/authStore.js'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [paymentEnabled, setPaymentEnabled] = useState(true)

  useEffect(() => {
    adminAPI.dashboard()
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
      
    adminAPI.getSettings()
      .then(({ data }) => {
        if (data.data.paymentGatewayEnabled !== undefined) {
          setPaymentEnabled(data.data.paymentGatewayEnabled)
        }
      })
      .catch(() => {})
  }, [])

  const togglePaymentGateway = async () => {
    const newValue = !paymentEnabled
    setPaymentEnabled(newValue)
    try {
      await adminAPI.updateSetting({ key: 'paymentGatewayEnabled', value: newValue })
    } catch (err) {
      setPaymentEnabled(!newValue)
    }
  }

  const statCards = [
    { label: 'Total Users',        value: stats?.totalUsers        || 0, icon: Users,         color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)', change: '+5% this week' },
    { label: 'Total Courses',      value: stats?.totalCourses      || 0, icon: BookOpen,       color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', change: '12 new modules' },
    { label: 'Active Instructors', value: stats?.totalInstructors  || 0, icon: GraduationCap,  color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', change: 'Verified team' },
    { label: 'Enrollments (month)',value: stats?.monthlyEnrollments || 0, icon: TrendingUp,     color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', change: 'Growing catalog' },
  ]

  const quickLinks = [
    { label: 'Manage Users',        desc: 'View, edit, search and moderate user profiles and roles.',           icon: Users,          path: '/admin/users',               color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
    { label: 'All Courses',         desc: 'Review, moderate, approve, or delete courses across all subjects.',   icon: BookOpen,       path: '/admin/courses',             color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
    { label: 'Manage Instructors',  desc: 'Monitor instructors, view profiles, and manage active educators.',  icon: GraduationCap,  path: '/admin/instructors',         color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
    { label: 'Instructor Requests', desc: 'Review, approve, or reject applications for new instructors.',       icon: ClipboardList,  path: '/admin/instructor-requests', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', alertCount: stats?.pendingRequests || 0 },
    { label: 'Manage Reviews',      desc: 'Moderate public testimonials, stars, and landing page reviews.',     icon: Star,           path: '/admin/testimonials',        color: '#EC4899', bg: 'rgba(236, 72, 153, 0.1)' },
    { label: 'Student Feedback',    desc: 'Read, sort, and reply to support inquiries and feedback tickets.',   icon: MessageSquare, path: '/admin/support',            color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.1)' },
    { label: 'Feature Flags',       desc: 'Toggle platform feature flags, terms, and document page visibilities.', icon: Shield,        path: '/admin/feature-flags',       color: '#0D9488', bg: 'rgba(13, 148, 136, 0.1)' },
  ]

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 relative">
        
        {/* Glow ambient background element */}
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }} />

        {/* Header Console */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}>
              <Shield size={22} color="white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                Admin Dashboard
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Welcome back, <span className="font-semibold text-purple-500">{user?.fullName || 'Admin'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (Stats & Alerts) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Pending alert */}
            {!loading && stats?.pendingRequests > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate('/admin/instructor-requests')}
                className="flex items-center gap-4 px-4 py-3.5 rounded-2xl cursor-pointer transition-all hover:shadow-lg border"
                style={{ 
                  background: 'rgba(245, 158, 11, 0.08)', 
                  borderColor: 'rgba(245, 158, 11, 0.3)',
                  boxShadow: '0 4px 20px rgba(245, 158, 11, 0.04)'
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245, 158, 11, 0.18)' }}>
                  <AlertCircle size={20} color="#F59E0B" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {stats.pendingRequests} Request{stats.pendingRequests !== 1 ? 's' : ''} Pending
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>Pending instructor registrations.</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold shrink-0 text-amber-500 hover:text-amber-400">
                  Review <ChevronRight size={14} />
                </div>
              </motion.div>
            )}

            {/* Stat cards grid (2x2) - Informational Panels (Not Buttons) */}
            <div className="grid grid-cols-2 gap-4">
              {loading
                ? [...Array(4)].map((_, i) => <SkeletonStat key={i} />)
                : statCards.map(({ label, value, icon: Icon, color, bg, change }) => (
                  <div
                    key={label}
                    className="rounded-2xl p-5 relative overflow-hidden"
                    style={{ 
                      background: 'var(--bg-surface)', 
                      border: '1px solid var(--border-default)',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    {/* Background ambient light */}
                    <div 
                      className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none" 
                      style={{ background: color }}
                    />
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                        <Icon size={20} color={color} />
                      </div>
                    </div>
                    
                    <div className="text-3xl font-extrabold mb-1 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                      {value}
                    </div>
                    <div className="text-[11px] font-bold tracking-wide uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
                      {label}
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: color }}>
                      {change}
                    </span>
                  </div>
                ))
              }
            </div>

          </div>

          {/* Right Column (Quick Actions Command Console) */}
          <div className="lg:col-span-7">
            
            <div className="flex items-center gap-2 mb-6">
              <Activity size={18} color="#8B5CF6" className="animate-pulse" />
              <h2 className="text-lg font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                Quick Actions
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickLinks.map(({ label, desc, icon: Icon, path, color, bg, alertCount }) => (
                <motion.button
                  key={label}
                  whileHover={{ y: -3, transition: { duration: 0.15 } }}
                  onClick={() => navigate(path)}
                  className="flex items-center gap-4 p-5 rounded-2xl text-left group transition-all relative overflow-hidden"
                  style={{ 
                    background: 'var(--bg-surface)', 
                    border: '1px solid var(--border-default)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${color}40`;
                    e.currentTarget.style.boxShadow = `0 10px 30px rgba(${parseInt(color.slice(1,3),16)}, ${parseInt(color.slice(3,5),16)}, ${parseInt(color.slice(5,7),16)}, 0.04)`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.02)';
                  }}
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
                    style={{ background: `radial-gradient(circle at 10% 20%, ${color}0c 0%, transparent 80%)` }}
                  />

                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105 relative" style={{ background: bg, border: `1px solid ${color}20` }}>
                    <Icon size={22} color={color} />
                    {alertCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center shadow-md animate-bounce">
                        {alertCount}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 z-10">
                    <div className="flex items-center gap-1 mb-0.5">
                      <p className="font-extrabold text-sm tracking-wide" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                        {label}
                      </p>
                      <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: color }} />
                    </div>
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                  </div>
                  
                  <ChevronRight size={16} color="var(--text-muted)" className="shrink-0 transition-transform group-hover:translate-x-1" />
                </motion.button>
              ))}
            </div>

            <div className="mt-6 p-5 rounded-2xl flex items-center justify-between" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: paymentEnabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)' }}>
                  <CreditCard size={20} color={paymentEnabled ? '#10B981' : '#EF4444'} />
                </div>
                <div>
                  <p className="font-extrabold text-sm tracking-wide" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                    Payment Gateway
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {paymentEnabled ? 'Live: Process payments via Razorpay.' : 'Disabled: Courses bypass payment automatically.'}
                  </p>
                </div>
              </div>
              <button
                onClick={togglePaymentGateway}
                className={`w-12 h-6 rounded-full p-1 transition-colors relative flex items-center ${paymentEnabled ? 'bg-green-500' : 'bg-red-500'}`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${paymentEnabled ? 'translate-x-6' : 'translate-x-0'}`}
                  style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                />
              </button>
            </div>

          </div>

        </div>

      </div>
    </PageLayout>
  )
}
