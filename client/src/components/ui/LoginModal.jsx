import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, GraduationCap, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { authAPI } from '../../api/auth.js'
import useAuthStore from '../../store/authStore.js'
import Button from './Button.jsx'
import Input from './Input.jsx'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const registerSchema = z.object({
  fullName:        z.string().min(2, 'Name must be at least 2 characters'),
  email:           z.string().email('Enter a valid email'),
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role:            z.enum(['student', 'instructor']),
  terms:           z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

function LoginForm({ onSuccess, onClose, switchToRegister }) {
  const { setUser } = useAuthStore()
  const navigate = useNavigate()
  const [showPwd, setShowPwd] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values) => {
    try {
      const { data } = await authAPI.login(values)
      setUser(data.data)
      toast.success(`Welcome back, ${data.data.fullName.split(' ')[0]}!`)
      reset()
      onClose()
      
      const user = data.data
      if (user?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else if (user?.role === 'instructor') {
        navigate('/instructor/dashboard', { replace: true })
      } else {
        onSuccess?.()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        required
        {...register('email')}
      />
      <div>
        <Input
          label="Password"
          type={showPwd ? 'text' : 'password'}
          placeholder="••••••••"
          error={errors.password?.message}
          required
          {...register('password')}
        />
        <button type="button" onClick={() => setShowPwd(p => !p)}
          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:12, marginTop:6, display:'flex', alignItems:'center', gap:4 }}>
          {showPwd ? <EyeOff size={12}/> : <Eye size={12}/>}
          {showPwd ? 'Hide' : 'Show'} password
        </button>
      </div>
      <div style={{ textAlign:'right' }}>
        <Link to="/forgot-password" onClick={onClose} style={{ fontSize:12, color:'#7C3AED' }}>
          Forgot password?
        </Link>
      </div>
      <Button type="submit" className="w-full" loading={isSubmitting}>Log in</Button>
      <p style={{ textAlign:'center', fontSize:13, color:'var(--text-secondary)', marginTop:8 }}>
        Don't have an account?{' '}
        <button type="button" onClick={switchToRegister}
          style={{ background:'none', border:'none', cursor:'pointer', color:'#7C3AED', fontWeight:600, fontSize:13, padding:0 }}>
          Sign up free
        </button>
      </p>
    </form>
  )
}

/* ── Register form ── */
function RegisterForm({ onSuccess, onClose, switchToLogin }) {
  const { setUser } = useAuthStore()
  const [showPwd, setShowPwd] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'student' }
  })

  const onSubmit = async ({ fullName, email, password, role }) => {
    try {
      const { data } = await authAPI.register({ fullName, email, password, role })
      setUser(data.data)
      toast.success('Account created! Welcome to Zenius AI 🎓')
      reset()
      onClose()
      onSuccess?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('role')} value="student" />
      <Input
        label="Full Name"
        placeholder="Your name"
        error={errors.fullName?.message}
        required
        {...register('fullName')}
      />
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        required
        {...register('email')}
      />
      <div>
        <Input
          label="Password"
          type={showPwd ? 'text' : 'password'}
          placeholder="Min 8 characters"
          error={errors.password?.message}
          required
          {...register('password')}
        />
        <button type="button" onClick={() => setShowPwd(p => !p)}
          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:12, marginTop:6, display:'flex', alignItems:'center', gap:4 }}>
          {showPwd ? <EyeOff size={12}/> : <Eye size={12}/>}
          {showPwd ? 'Hide' : 'Show'} password
        </button>
      </div>
      <Input
        label="Confirm Password"
        type={showPwd ? 'text' : 'password'}
        placeholder="Re-enter password"
        error={errors.confirmPassword?.message}
        required
        {...register('confirmPassword')}
      />
      <label style={{ display:'flex', alignItems:'flex-start', gap:8, cursor:'pointer' }}>
        <input type="checkbox" style={{ marginTop:2, accentColor:'#7C3AED' }} {...register('terms')} />
        <span style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5 }}>
          I agree to the{' '}
          <Link to="/" onClick={onClose} style={{ color:'#7C3AED' }}>Terms</Link>
          {' '}and{' '}
          <Link to="/" onClick={onClose} style={{ color:'#7C3AED' }}>Privacy Policy</Link>
        </span>
      </label>
      {errors.terms && <p style={{ fontSize:11, color:'#EF4444', marginTop:-8 }}>{errors.terms.message}</p>}
      <Button type="submit" className="w-full" loading={isSubmitting}>Create Account</Button>
      <p style={{ textAlign:'center', fontSize:13, color:'var(--text-secondary)', marginTop:8 }}>
        Already have an account?{' '}
        <button type="button" onClick={switchToLogin}
          style={{ background:'none', border:'none', cursor:'pointer', color:'#7C3AED', fontWeight:600, fontSize:13, padding:0 }}>
          Log in
        </button>
      </p>
    </form>
  )
}

/* ════════════════════════════════════════════
   LoginModal — glass overlay with Login / Register tabs
   Props:
     isOpen      boolean
     onClose     () => void
     onSuccess   () => void  — called after successful login OR register
     hint        string      — shown below the heading
     defaultTab  'login' | 'register'  (default: 'login')
   ════════════════════════════════════════════ */
export default function LoginModal({ isOpen, onClose, onSuccess, hint, defaultTab = 'login' }) {
  const [tab, setTab] = useState(defaultTab)

  // Sync tab to defaultTab whenever the modal opens
  useEffect(() => { if (isOpen) setTab(defaultTab) }, [isOpen, defaultTab])

  const handleClose = () => { onClose() }

  const headings = {
    login:    { title: 'Welcome back',      sub: hint || 'Log in to continue your learning journey' },
    register: { title: 'Create your account', sub: hint || 'Join 50,000+ learners on Zenius AI' },
  }

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>

          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            transition={{ duration:0.2 }}
            onClick={handleClose}
            style={{
              position:'absolute', inset:0,
              background:'rgba(10,8,24,0.62)',
              backdropFilter:'blur(14px) saturate(160%)',
              WebkitBackdropFilter:'blur(14px) saturate(160%)',
            }}
          />

          {/* Card */}
          <motion.div
            key="card"
            initial={{ opacity:0, y:28, scale:0.96 }}
            animate={{ opacity:1, y:0,  scale:1 }}
            exit={{ opacity:0, y:16, scale:0.97 }}
            transition={{ duration:0.26, ease:[0.34,1.1,0.64,1] }}
            style={{
              position:'relative',
              width:'100%',
              maxWidth: tab === 'register' ? 440 : 420,
              maxHeight: '90vh',
              overflowY: 'auto',
              background:'var(--bg-surface)',
              border:'1px solid var(--border-purple)',
              borderRadius:24,
              padding:'clamp(16px, 5vw, 32px)',
              boxShadow:'0 24px 64px rgba(109,40,217,0.2), 0 4px 24px rgba(0,0,0,0.12)',
              transition:'max-width 0.25s ease, padding 0.25s ease',
            }}
          >
            {/* Close */}
            <button onClick={handleClose}
              className="touch-target flex items-center justify-center"
              style={{ position:'absolute', top:12, right:12, background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'inline-flex', borderRadius:8, padding:6 }}
              onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background='none'}>
              <X size={17}/>
            </button>

            {/* Logo */}
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <div style={{ width:36, height:36, borderRadius:11, background:'#7C3AED', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <GraduationCap size={19} color="white"/>
                </div>
                <span style={{ fontSize:17, fontWeight:800, fontFamily:'Outfit,sans-serif', color:'var(--text-primary)' }}>Zenius AI</span>
              </div>



              <h2 style={{ fontSize:20, fontWeight:700, fontFamily:'Outfit,sans-serif', color:'var(--text-primary)', marginBottom:4 }}>
                {headings[tab].title}
              </h2>
              <p style={{ fontSize:13, color:'var(--text-secondary)' }}>{headings[tab].sub}</p>
            </div>

            {/* Forms — animate between tabs */}
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity:0, x: tab==='login' ? -16 : 16 }}
                animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x: tab==='login' ? 16 : -16 }}
                transition={{ duration:0.18 }}
              >
                {tab === 'login' ? (
                  <LoginForm
                    onSuccess={onSuccess}
                    onClose={handleClose}
                    switchToRegister={() => setTab('register')}
                  />
                ) : (
                  <RegisterForm
                    onSuccess={onSuccess}
                    onClose={handleClose}
                    switchToLogin={() => setTab('login')}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(modal, document.body)
}
