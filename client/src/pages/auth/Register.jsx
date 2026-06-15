import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  fullName:        z.string().min(2, 'Name must be at least 2 characters'),
  email:           z.string().email('Enter a valid email'),
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  terms:           z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export default function Register() {
  const navigate  = useNavigate()
  const { setUser } = useAuthStore()
  const [showPwd, setShowPwd] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ fullName, email, password }) => {
    try {
      const { data } = await authAPI.register({ fullName, email, password })
      setUser(data.data)
      toast.success('Account created! Welcome to Zenius AI 🎓')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'var(--bg-page)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#7C3AED' }}>
              <GraduationCap size={22} color="white" />
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Zenius AI</span>
          </Link>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
            Create your account
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Join 50,000+ learners on Zenius AI</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-glass" style={{ border: '1px solid var(--border-purple)' }}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Full Name" placeholder="Your name" error={errors.fullName?.message} required {...register('fullName')} />
            <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} required {...register('email')} />
            <div>
              <Input
                label="Password"
                type={showPwd ? 'text' : 'password'}
                placeholder="Min 8 characters"
                error={errors.password?.message}
                required
                {...register('password')}
              />
              <button type="button" onClick={() => setShowPwd(p => !p)} className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                {showPwd ? <EyeOff size={12} /> : <Eye size={12} />} {showPwd ? 'Hide' : 'Show'} password
              </button>
            </div>
            <Input label="Confirm Password" type={showPwd ? 'text' : 'password'} placeholder="Re-enter password" error={errors.confirmPassword?.message} required {...register('confirmPassword')} />

            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" className="mt-0.5 rounded" style={{ accentColor: '#7C3AED' }} {...register('terms')} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                I agree to the{' '}
                <Link to="/" style={{ color: '#7C3AED' }}>Terms of Service</Link>
                {' '}and{' '}
                <Link to="/" style={{ color: '#7C3AED' }}>Privacy Policy</Link>
              </span>
            </label>
            {errors.terms && <p className="text-xs text-red-500">{errors.terms.message}</p>}

            <Button type="submit" className="w-full" loading={isSubmitting}>
              Create Account
            </Button>
          </form>

          <p className="text-center mt-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#7C3AED', fontWeight: 600 }}>Log in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
