import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, DollarSign, Users, BookOpen } from 'lucide-react'
import PageLayout from '../../components/layout/PageLayout.jsx'
import Input from '../../components/ui/Input.jsx'
import Button from '../../components/ui/Button.jsx'
import TagInput from '../../components/ui/TagInput.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { usersAPI } from '../../api/users.js'
import useAuthStore from '../../store/authStore.js'
import toast from 'react-hot-toast'

const schema = z.object({
  phone:      z.string().min(10, 'Enter a valid phone number'),
  department: z.string().min(2, 'Enter your department'),
  motivation: z.string().min(100, 'Please write at least 100 characters'),
  linkedin:   z.union([z.string().url('Enter a valid LinkedIn URL'), z.literal(''), z.undefined()]).optional(),
  portfolio:  z.union([z.string().url('Enter a valid URL'), z.literal(''), z.undefined()]).optional(),
})

const BENEFITS = [
  { icon: Users,     text: 'Reach 50,000+ learners globally' },
  { icon: DollarSign,text: 'Earn from every enrollment' },
  { icon: Clock,     text: 'Teach on your own schedule' },
  { icon: BookOpen,  text: 'Full course-building tools provided' },
]

export default function BecomeInstructor() {
  const { user, updateUser } = useAuthStore()
  const [status,   setStatus]   = useState(null)
  const [tags,     setTags]     = useState([])
  const [loading,  setLoading]  = useState(true)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  useEffect(() => {
    usersAPI.getRequestStatus()
      .then(({ data }) => setStatus(data.data?.status || 'none'))
      .catch(() => setStatus('none'))
      .finally(() => setLoading(false))
  }, [])

  const onSubmit = async (values) => {
    if (!tags.length) { toast.error('Add at least one topic you want to teach'); return }
    try {
      await usersAPI.becomeInstructor({ ...values, expertise: tags, fullName: user.fullName, email: user.email })
      setStatus('pending')
      updateUser({ instructorRequestStatus: 'pending' })
      toast.success('Application submitted!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
    }
  }

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left */}
          <div>
            <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
              Teach on Zenius AI
            </h1>
            <p className="text-base mb-8" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Share your expertise with thousands of students. Create courses, set your price, and earn.
            </p>
            <div className="space-y-4">
              {BENEFITS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--z-purple-100)' }}>
                    <Icon size={18} color="#7C3AED" />
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — form or status */}
          <div>
            {loading ? <div className="skeleton h-96 rounded-2xl" /> : status === 'pending' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-8 shadow-card text-center" style={{ border: '1px solid var(--border-purple)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#EDE9FE' }}>
                  <CheckCircle2 size={30} color="#7C3AED" />
                </div>
                <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Application Submitted!</h2>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>We'll review your application within 2-3 business days.</p>
                <Badge variant="amber">PENDING REVIEW</Badge>
              </motion.div>
            ) : status === 'rejected' ? (
              <div className="bg-white rounded-2xl p-8 shadow-card" style={{ border: '1px solid var(--border-purple)' }}>
                <div className="mb-4 p-4 rounded-xl" style={{ background: 'var(--warning-bg)', border: '1px solid #F59E0B' }}>
                  <p className="text-sm font-medium" style={{ color: '#D97706' }}>Your previous application was not approved. You may re-apply.</p>
                </div>
                <InstructorForm register={register} handleSubmit={handleSubmit} errors={errors} isSubmitting={isSubmitting} tags={tags} setTags={setTags} user={user} onSubmit={onSubmit} />
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 shadow-card" style={{ border: '1px solid var(--border-purple)' }}>
                <h3 className="text-lg font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Instructor Application</h3>
                <InstructorForm register={register} handleSubmit={handleSubmit} errors={errors} isSubmitting={isSubmitting} tags={tags} setTags={setTags} user={user} onSubmit={onSubmit} />
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

function InstructorForm({ register, handleSubmit, errors, isSubmitting, tags, setTags, user, onSubmit }) {
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Full Name" value={user?.fullName || ''} readOnly containerClass="opacity-70" />
      <Input label="Email" value={user?.email || ''} readOnly containerClass="opacity-70" />
      <Input label="Phone" placeholder="+91 98765 43210" error={errors.phone?.message} required {...register('phone')} />
      <Input label="Department / Subject Area" placeholder="e.g. Computer Science" error={errors.department?.message} required {...register('department')} />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Topics to teach <span className="text-red-500">*</span></label>
        <TagInput value={tags} onChange={setTags} placeholder="e.g. react, javascript — press Enter" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Why do you want to teach? <span className="text-red-500">*</span></label>
        <textarea
          className="input-field resize-none"
          rows={4}
          placeholder="Tell us about your teaching experience and motivation (min 100 characters)..."
          {...register('motivation')}
        />
        {errors.motivation && <p className="text-xs text-red-500">{errors.motivation.message}</p>}
      </div>
      <Input label="LinkedIn URL" placeholder="https://linkedin.com/in/..." error={errors.linkedin?.message} {...register('linkedin')} />
      <Input label="Portfolio / GitHub" placeholder="https://github.com/..." error={errors.portfolio?.message} {...register('portfolio')} />
      <Button type="submit" className="w-full" loading={isSubmitting}>Submit Application</Button>
    </form>
  )
}
