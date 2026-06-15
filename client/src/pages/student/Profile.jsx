import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Camera, Save, Briefcase, Link as LinkIcon } from 'lucide-react'
import PageLayout from '../../components/layout/PageLayout.jsx'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import useAuthStore from '../../store/authStore.js'
import { usersAPI } from '../../api/users.js'
import toast from 'react-hot-toast'

const schema = z.object({
  fullName:   z.string().min(2, 'Name must be at least 2 characters'),
  bio:        z.string().max(500, 'Bio max 500 chars').optional().default(''),
  expertise:  z.string().optional().default(''),
  linkedin:   z.union([z.string().url('Enter a valid URL'), z.literal(''), z.undefined()]).optional(),
  portfolio:  z.union([z.string().url('Enter a valid URL'), z.literal(''), z.undefined()]).optional(),
})

export default function Profile() {
  const { user, updateUser } = useAuthStore()
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName:  user?.fullName  || '',
      bio:       user?.bio       || '',
      expertise: user?.expertise || '',
      linkedin:  user?.linkedin  || '',
      portfolio: user?.portfolio || '',
    }
  })

  const onSubmit = async (values) => {
    setSaving(true)
    try {
      const { data } = await usersAPI.updateProfile(values)
      updateUser(data.data)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
          My Profile
        </h1>

        <div className="bg-white rounded-2xl shadow-card p-6 mb-6" style={{ border: '1px solid var(--border-purple)' }}>
          {/* Avatar */}
          <div className="flex items-center gap-5 mb-8">
            <div className="relative">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.fullName} className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold" style={{ background: '#7C3AED' }}>
                  {user?.fullName?.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                style={{ background: '#7C3AED' }}
                title="Change avatar (coming soon)"
              >
                <Camera size={14} color="white" />
              </button>
            </div>
            <div>
              <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{user?.fullName}</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize" style={{ background: 'var(--z-purple-100)', color: '#7C3AED' }}>
                {user?.role}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
              <Input {...register('fullName')} error={errors.fullName?.message} placeholder="Your full name" />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Bio</label>
              <textarea
                {...register('bio')}
                rows={3}
                placeholder="Tell learners about yourself..."
                className="input-field w-full resize-none"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
              {errors.bio && <p className="text-xs mt-1" style={{ color: '#EF4444' }}>{errors.bio.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Briefcase size={14} className="inline mr-1.5" />
                Expertise / Headline
              </label>
              <Input {...register('expertise')} placeholder="e.g. Full-Stack Developer, Data Scientist" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <LinkIcon size={14} className="inline mr-1.5" />
                  LinkedIn URL
                </label>
                <Input {...register('linkedin')} error={errors.linkedin?.message} placeholder="https://linkedin.com/in/..." />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <LinkIcon size={14} className="inline mr-1.5" />
                  Portfolio URL
                </label>
                <Input {...register('portfolio')} error={errors.portfolio?.message} placeholder="https://yoursite.com" />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" loading={saving} className="flex items-center gap-2">
                <Save size={16} /> Save Changes
              </Button>
            </div>
          </form>
        </div>

        {/* Account info */}
        <div className="bg-white rounded-2xl shadow-card p-6" style={{ border: '1px solid var(--border-default)' }}>
          <h2 className="font-semibold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Account Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Email</span>
              <span style={{ color: 'var(--text-primary)' }}>{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Role</span>
              <span className="capitalize" style={{ color: 'var(--text-primary)' }}>{user?.role}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Enrolled Courses</span>
              <span style={{ color: 'var(--text-primary)' }}>{user?.enrolledCourses?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
