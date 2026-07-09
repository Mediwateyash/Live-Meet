import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Camera, Save, Briefcase, Link as LinkIcon, Lock, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../components/layout/PageLayout.jsx'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import Modal from '../../components/ui/Modal.jsx'
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

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ["confirmPassword"]
})

export default function Profile() {
  const { user, updateUser, logout } = useAuthStore()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await usersAPI.deleteAccount()
      toast.success('Your account has been deleted permanently.')
      logout()
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete account')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

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

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPasswordForm, formState: { errors: passwordErrors } } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
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

  const onPasswordSubmit = async (values) => {
    setPasswordSaving(true)
    try {
      await usersAPI.updatePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      })
      toast.success('Password updated successfully!')
      resetPasswordForm()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update password')
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
          My Profile
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Left Column: Profile form */}
          <div className="bg-white rounded-2xl shadow-card p-4 sm:p-6" style={{ border: '1px solid var(--border-purple)' }}>
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

          {/* Right Column: Account Details & Update Password */}
          <div className="space-y-6">
            {/* Account Details */}
            <div className="bg-white rounded-2xl shadow-card p-4 sm:p-6" style={{ border: '1px solid var(--border-default)' }}>
              <h2 className="font-semibold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Account Details</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Email</span>
                  <span style={{ color: 'var(--text-primary)' }} className="truncate max-w-[200px]">{user?.email}</span>
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

            {/* Update Password */}
            <div className="bg-white rounded-2xl shadow-card p-4 sm:p-6" style={{ border: '1px solid var(--border-purple)' }}>
              <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                <Lock size={18} /> Update Password
              </h2>
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Current Password</label>
                  <Input type="password" {...registerPassword('currentPassword')} error={passwordErrors.currentPassword?.message} placeholder="••••••••" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>New Password</label>
                  <Input type="password" {...registerPassword('newPassword')} error={passwordErrors.newPassword?.message} placeholder="••••••••" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Confirm Password</label>
                  <Input type="password" {...registerPassword('confirmPassword')} error={passwordErrors.confirmPassword?.message} placeholder="••••••••" />
                </div>
                <div className="pt-2">
                  <Button type="submit" loading={passwordSaving} className="w-full">
                    Update Password
                  </Button>
                </div>
              </form>
            </div>

            {/* Danger Zone */}
            {(user?.role === 'student' || user?.role === 'instructor') && (
              <div className="bg-white rounded-2xl shadow-card p-4 sm:p-6" style={{ border: '1px solid #FECACA' }}>
                <h2 className="font-semibold mb-2 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#DC2626' }}>
                  Danger Zone
                </h2>
                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                  Permanently delete your account and all associated learning data from the database. This action is irreversible.
                </p>
                <Button 
                  onClick={() => setShowDeleteModal(true)} 
                  variant="danger" 
                  className="w-full"
                >
                  Delete Account Permanently
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Account Permanently" size="sm">
        <div className="flex items-center gap-3 mb-5 p-4 rounded-xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-red-100">
            <AlertTriangle size={20} color="#DC2626" />
          </div>
          <div>
            <p className="text-sm font-bold text-red-800">Are you sure?</p>
            <p className="text-xs text-red-700 mt-0.5">
              This will permanently delete your account <strong>{user?.fullName}</strong> and erase all of your progress.
            </p>
          </div>
        </div>
        <p className="text-xs mb-5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          All database records linked to your email will be permanently deleted. This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" size="sm" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleDeleteAccount} loading={deleting}>
            Delete Permanently
          </Button>
        </div>
      </Modal>
    </PageLayout>
  )
}

