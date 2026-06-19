import React, { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GraduationCap, CheckCircle2 } from 'lucide-react'
import { authAPI } from '../../api/auth.js'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const token = new URLSearchParams(window.location.hash.slice(1)).get('token')
  const navigate  = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form,    setForm]    = useState({ password: '', confirmPassword: '' })
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await authAPI.resetPassword(token, { password: form.password, confirmPassword: form.confirmPassword })
      setDone(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reset password. Link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-page)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#7C3AED' }}>
              <GraduationCap size={22} color="white" />
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Zenius AI</span>
          </Link>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-glass" style={{ border: '1px solid var(--border-purple)' }}>
          {done ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#ECFDF5' }}>
                <CheckCircle2 size={30} color="#10B981" />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Password reset!</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Your password has been updated successfully.</p>
              <Button onClick={() => navigate('/login')} className="w-full">Log in now</Button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Set new password</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Choose a strong password (min 8 characters).</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="New Password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" required />
                <Input label="Confirm Password" type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Re-enter password" error={error} required />
                <Button type="submit" className="w-full" loading={loading}>Reset Password</Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
