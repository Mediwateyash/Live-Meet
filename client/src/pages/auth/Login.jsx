import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, GraduationCap } from 'lucide-react'
import { motion } from 'framer-motion'
import { authAPI } from '../../api/auth.js'
import useAuthStore from '../../store/authStore.js'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import toast from 'react-hot-toast'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function Login() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { setUser } = useAuthStore()
  const [showPwd, setShowPwd] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })
  const onSubmit = async (values) => {
    try {
      const { data } = await authAPI.login(values)
      setUser(data.data)
      toast.success(`Welcome back, ${data.data.fullName.split(' ')[0]}!`)
      
      const user = data.data
      if (user?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else if (user?.role === 'instructor') {
        navigate('/instructor/dashboard', { replace: true })
      } else {
        const from = location.state?.from?.pathname || '/dashboard'
        navigate(from, { replace: true })
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-page)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
            <img
              src="/logo.png"
              alt="SMIT Logo"
              className="w-10 h-10 rounded-xl object-contain shadow-sm shrink-0 transition-transform group-hover:scale-105"
              onError={(e) => { e.currentTarget.src = '/favicon.svg' }}
            />
            <div className="flex flex-col text-left leading-none">
              <span className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>SMIT</span>
              <span className="text-[9px] font-semibold text-purple-600 dark:text-purple-400">Sandeep More Institute</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
            Welcome back
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Log in to continue your learning journey</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-glass" style={{ border: '1px solid var(--border-purple)' }}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
              <button
                type="button"
                onClick={() => setShowPwd(p => !p)}
                className="mt-1.5 flex items-center gap-1 text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                {showPwd ? <EyeOff size={12} /> : <Eye size={12} />}
                {showPwd ? 'Hide' : 'Show'} password
              </button>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs" style={{ color: '#7C3AED' }}>
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" loading={isSubmitting}>
              Log in
            </Button>
          </form>

          <p className="text-center mt-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#7C3AED', fontWeight: 600 }}>Sign up</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
