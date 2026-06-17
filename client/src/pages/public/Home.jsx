import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight, Play, GraduationCap, BookOpen, Star, Globe,
  Bot, BarChart2, ShieldCheck, TrendingUp,
  Clock, Users2, Infinity, Award,
} from 'lucide-react'
import PageLayout from '../../components/layout/PageLayout.jsx'
import CourseCard from '../../components/shared/CourseCard.jsx'
import { SkeletonCard } from '../../components/ui/Skeleton.jsx'
import { containerVariants } from '../../utils/animations.js'
import { coursesAPI } from '../../api/courses.js'


const STATS = [
  { icon: GraduationCap, value: '50K+',   label: 'Students Enrolled' },
  { icon: Play,          value: '1,200+', label: 'Courses' },
  { icon: Star,          value: '4.8',    label: 'Average Rating' },
  { icon: Globe,         value: '100+',   label: 'Countries' },
]

const FEATURES = [
  { icon: Clock,    title: 'Learn at Your Pace',   desc: 'Access courses anytime, anywhere' },
  { icon: Users2,   title: 'Expert Instructors',   desc: 'Learn from industry professionals' },
  { icon: Infinity, title: 'Lifetime Access',      desc: 'Get lifetime access to course materials' },
  { icon: Award,    title: 'Certificates',         desc: 'Earn certificates to boost your career' },
]

const FLOAT_CARDS = [
  {
    icon: Bot,
    title: 'AI Tutor',
    desc: 'Get personalized learning support anytime',
    pos: 'top-8 left-0',
    delay: 0,
  },
  {
    icon: BarChart2,
    title: 'Smart Recommendations',
    desc: 'Courses tailored to your goals',
    pos: 'top-1/2 -translate-y-1/2 left-2',
    delay: 0.6,
  },
  {
    icon: TrendingUp,
    title: 'Track Progress',
    desc: 'Keep track of your learning journey',
    pos: 'top-8 right-0',
    delay: 0.3,
    progress: 75,
  },
  {
    icon: ShieldCheck,
    title: 'Certificate',
    desc: 'Earn certificates and boost your career',
    pos: 'bottom-16 right-0',
    delay: 0.9,
  },
]

/* ── Animated counter ── */
function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const triggered = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !triggered.current) {
        triggered.current = true
        const num = parseFloat(target.replace(/[^0-9.]/g, ''))
        const steps = 40
        let i = 0
        const interval = setInterval(() => {
          i++
          setCount(Math.round((num * i) / steps))
          if (i >= steps) clearInterval(interval)
        }, 30)
      }
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  const display = target.includes('.') ? count.toFixed(1) : count
  const prefix = target.replace(/[0-9.,+K]/g, '').replace(/\d/g, '')
  const hasSuffix = target.includes('+') || target.includes('K')
  return (
    <span ref={ref}>
      {display}{hasSuffix ? '+' : ''}
    </span>
  )
}


export default function Home() {
  const navigate = useNavigate()
  const [apiCourses, setApiCourses] = useState([])

  useEffect(() => {
    coursesAPI.browse({ limit: 100, status: 'published' })
      .then(({ data }) => setApiCourses(data.data || []))
      .catch(() => {})
  }, [])

  return (
    <PageLayout>
      {/* ══════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'var(--bg-page)' }}
      >
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 60% 40%, rgba(124,58,237,0.1) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-[1700px] mx-auto px-8 md:px-12 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

            {/* LEFT: text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Badge chip */}
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6"
                style={{
                  background: 'rgba(124,58,237,0.1)',
                  color: '#7C3AED',
                  border: '1px solid rgba(124,58,237,0.2)',
                }}
              >
                ✦ AI-Powered Learning
              </div>

              {/* Heading */}
              <h1
                className="text-4xl md:text-5xl font-extrabold leading-tight mb-5"
                style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}
              >
                Learn Smarter,<br />
                Achieve More with<br />
                <span
                  style={{
                    background: 'linear-gradient(90deg, #7C3AED, #A78BFA)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Zenius AI
                </span>
              </h1>

              <p
                className="text-base mb-8 max-w-md leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                Discover expert-led courses in tech, business, and more. Learn anytime, anywhere with personalized AI guidance.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap items-center gap-4 mb-10">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/browse')}
                  className="flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-semibold shadow-lg"
                  style={{ background: '#7C3AED', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}
                >
                  Explore Courses <ArrowRight size={16} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold border transition-colors"
                  style={{
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-default)',
                    background: 'var(--bg-surface)',
                  }}
                >
                  <Play size={14} fill="currentColor" /> Watch Demo
                </motion.button>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-6">
                {STATS.map(({ icon: Icon, value, label }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(124,58,237,0.1)' }}
                    >
                      <Icon size={16} color="#7C3AED" />
                    </div>
                    <div>
                      <p className="text-base font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
                        <Counter target={value} />
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* RIGHT: mascot + floating cards */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative hidden md:flex items-center justify-center"
              style={{ minHeight: 500 }}
            >
              {/* Hero illustration area */}
              <div
                className="w-72 h-80 rounded-3xl flex items-center justify-center relative z-10"
                style={{
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(139,92,246,0.06) 100%)',
                  border: '1px solid rgba(124,58,237,0.15)',
                }}
              >
                <div className="text-center select-none">
                  <div
                    className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-4 text-5xl"
                    style={{ background: 'rgba(124,58,237,0.15)' }}
                  >
                    🎓
                  </div>
                  <p className="font-bold text-xl" style={{ fontFamily: 'Outfit, sans-serif', color: '#7C3AED' }}>zenius</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>AI-Powered Learning</p>
                </div>
              </div>

              {/* Floating card: AI Tutor — top left */}
              <FloatCard
                icon={Bot}
                title="AI Tutor"
                desc="Get personalized learning support anytime"
                className="absolute top-4 -left-16 w-64"
                delay={0}
                iconColor="#7C3AED"
                iconBg="rgba(124,58,237,0.12)"
              />

              {/* Floating card: Smart Recommendations — middle left */}
              <FloatCard
                icon={BarChart2}
                title="Smart Recommendations"
                desc="Courses tailored to your goals"
                className="absolute top-1/2 -translate-y-1/2 -left-20 w-64"
                delay={0.6}
                iconColor="#2563EB"
                iconBg="rgba(37,99,235,0.1)"
              />

              {/* Floating card: Track Progress — top right */}
              <FloatCard
                icon={TrendingUp}
                title="Track Progress"
                desc="Keep track of your learning journey"
                className="absolute top-4 -right-16 w-60"
                delay={0.3}
                iconColor="#059669"
                iconBg="rgba(5,150,105,0.1)"
                progress={75}
              />

              {/* Floating card: Certificate — bottom right */}
              <FloatCard
                icon={ShieldCheck}
                title="Certificate"
                desc="Earn certificates and boost your career"
                className="absolute bottom-8 -right-16 w-60"
                delay={0.9}
                iconColor="#D97706"
                iconBg="rgba(217,119,6,0.1)"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          POPULAR COURSES
      ══════════════════════════════════════════ */}
      <section className="py-14 px-8 md:px-12 max-w-[1700px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}
          >
            Popular Courses
          </h2>
          <button
            onClick={() => navigate('/browse')}
            className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:underline"
            style={{ color: '#7C3AED' }}
          >
            View All Courses <ArrowRight size={15} />
          </button>
        </div>

        {apiCourses.length === 0 ? (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="grid gap-5"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
          >
            {apiCourses.map(course => (
              <CourseCard key={course._id} course={course} />
            ))}
          </motion.div>
        )}
      </section>

      {/* ══════════════════════════════════════════
          FEATURES STRIP
      ══════════════════════════════════════════ */}
      <section
        className="py-12 px-6 md:px-10"
        style={{
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-purple)',
          borderBottom: '1px solid var(--border-purple)',
        }}
      >
        <div className="max-w-[1700px] mx-auto px-8 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(124,58,237,0.1)' }}
              >
                <Icon size={22} color="#7C3AED" />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                  {title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageLayout>
  )
}

/* ── Floating glass card component ── */
function FloatCard({ icon: Icon, title, desc, className, delay, iconColor, iconBg, progress }) {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ repeat: Infinity, duration: 3 + delay, ease: 'easeInOut', delay }}
      className={`float-card ${className} p-4 rounded-2xl z-20`}
      style={{
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(124,58,237,0.12)',
        boxShadow: '0 4px 24px rgba(109,40,217,0.1)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: iconBg }}
        >
          <Icon size={18} color={iconColor} />
        </div>
        <div className="min-w-0">
          <p className="float-card-title text-sm font-bold leading-none mb-1.5" style={{ color: 'var(--text-primary)' }}>
            {title}
          </p>
          {progress ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="float-card-desc text-xs" style={{ color: 'var(--text-muted)' }}>Progress</p>
                <p className="text-xs font-bold" style={{ color: iconColor }}>75%</p>
              </div>
              <div className="h-2 rounded-full overflow-hidden w-full" style={{ background: 'rgba(0,0,0,0.08)' }}>
                <div className="h-full rounded-full" style={{ width: '75%', background: iconColor }} />
              </div>
            </div>
          ) : (
            <p className="float-card-desc text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>{desc}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
