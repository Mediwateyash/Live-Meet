import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Code2, BarChart3, Cpu, Palette, Megaphone, Cloud, Shield, Briefcase,
  Users, BookOpen, Star, Award, ChevronRight, CheckCircle2, PlayCircle
} from 'lucide-react'
import PageLayout from '../../components/layout/PageLayout.jsx'
import CourseCard from '../../components/shared/CourseCard.jsx'
import Button from '../../components/ui/Button.jsx'
import { SkeletonCard } from '../../components/ui/Skeleton.jsx'
import { coursesAPI } from '../../api/courses.js'
import { containerVariants, cardVariants } from '../../utils/animations.js'

const CATEGORIES = [
  { label: 'Web Dev',       icon: Code2,      bg: '#EDE9FE', color: '#7C3AED' },
  { label: 'Data Science',  icon: BarChart3,   bg: '#ECFDF5', color: '#059669' },
  { label: 'AI / ML',       icon: Cpu,         bg: '#EFF6FF', color: '#2563EB' },
  { label: 'Design',        icon: Palette,     bg: '#FDF4FF', color: '#9333EA' },
  { label: 'Marketing',     icon: Megaphone,   bg: '#FFFBEB', color: '#D97706' },
  { label: 'Cloud',         icon: Cloud,       bg: '#F0FDF4', color: '#16A34A' },
  { label: 'Cybersecurity', icon: Shield,      bg: '#FEF2F2', color: '#DC2626' },
  { label: 'Business',      icon: Briefcase,   bg: '#F5F3FF', color: '#6D28D9' },
]

const STATS = [
  { value: '50,000+', label: 'Students', icon: Users },
  { value: '1,200+',  label: 'Courses',  icon: BookOpen },
  { value: '200+',    label: 'Instructors', icon: Award },
  { value: '4.8★',   label: 'Avg Rating',  icon: Star },
]

const WHY = [
  { icon: Award,    title: 'Expert Instructors',    desc: 'Learn from industry professionals with real-world experience.' },
  { icon: PlayCircle, title: 'Learn at Your Pace', desc: 'Access courses 24/7 — start, pause, and resume anytime.' },
  { icon: CheckCircle2, title: 'Certificate on Completion', desc: 'Earn a verifiable certificate to showcase your skills.' },
]

export default function Home() {
  const navigate = useNavigate()
  const [featured, setFeatured]   = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    coursesAPI.featured()
      .then(({ data }) => setFeatured(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageLayout>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ background: 'var(--bg-page)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.08) 0%, transparent 70%)'
        }} />
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 text-center relative">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="badge badge-purple mb-6 inline-flex text-sm py-1.5 px-4">
              🎓 Zenius AI — Intelligent Learning
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
              Learn Without<br />
              <span style={{ color: '#7C3AED' }}>Limits.</span>
            </h1>
            <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Expert-led courses in tech, design, business & more. Learn at your pace, earn certificates, build your future.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button size="lg" onClick={() => navigate('/browse')}>
                Start Learning <ChevronRight size={18} />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/become-instructor')}>
                Become an Instructor
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="py-12 px-6 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
          Browse by Category
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(({ label, icon: Icon, bg, color }) => (
            <button
              key={label}
              onClick={() => navigate(`/browse?category=${encodeURIComponent(label)}`)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl shrink-0 transition-all hover:shadow-md border"
              style={{ background: bg, color, borderColor: `${color}20`, fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 14 }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Featured Courses ── */}
      <section className="py-12 px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
            Featured Courses
          </h2>
          <button onClick={() => navigate('/browse')} className="text-sm font-medium flex items-center gap-1" style={{ color: '#7C3AED' }}>
            View all <ChevronRight size={14} />
          </button>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {featured.map(course => <CourseCard key={course._id} course={course} />)}
          </motion.div>
        )}
      </section>



      {/* ── Why Zenius ── */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
          Why Zenius AI?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {WHY.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center p-8 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-purple)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--z-purple-100)' }}>
                <Icon size={26} color="#7C3AED" />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </PageLayout>
  )
}
