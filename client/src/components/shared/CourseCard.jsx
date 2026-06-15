import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Clock, Users, Star, CheckCircle2 } from 'lucide-react'
import { cardVariants } from '../../utils/animations.js'
import Badge from '../ui/Badge.jsx'
import ProgressBar from '../ui/ProgressBar.jsx'
import { formatPrice, formatDuration } from '../../utils/formatters.js'
import useAuthStore from '../../store/authStore.js'
import { usersAPI } from '../../api/users.js'
import toast from 'react-hot-toast'

export default function CourseCard({ course, showProgress = false, compact = false, progress = 0 }) {
  const { user, isAuthenticated, updateUser } = useAuthStore()
  const isWishlisted = user?.wishlist?.some(id => id.toString() === course._id.toString())
  const isComplete = showProgress && progress >= 100

  const handleWishlist = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) { toast.error('Please login to save courses'); return }
    try {
      const { data } = await usersAPI.toggleWishlist(course._id)
      updateUser({ wishlist: data.data })
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist')
    } catch {
      toast.error('Could not update wishlist')
    }
  }

  if (compact) {
    return (
      <Link to={`/course/${course.slug}`} className="flex gap-3 p-3 rounded-xl transition-colors hover:bg-[#F0EEFF]">
        <img
          src={course.thumbnail || 'https://placehold.co/80x56/EDE9FE/7C3AED?text=Course'}
          alt={course.title}
          className="w-20 h-14 rounded-lg object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold line-clamp-2 leading-snug" style={{ color: 'var(--text-primary)' }}>{course.title}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{course.instructor?.fullName}</p>
          <p className="text-sm font-semibold mt-1" style={{ color: '#7C3AED' }}>{formatPrice(course.price)}</p>
        </div>
      </Link>
    )
  }

  return (
    <motion.div variants={cardVariants} className="course-card overflow-hidden" style={isComplete ? { border: '2px solid #10B981', boxShadow: '0 0 18px rgba(16,185,129,0.15)' } : undefined}>
      <Link to={`/course/${course.slug}`} className="block">
        {/* Thumbnail */}
        <div className="relative overflow-hidden" style={{ paddingBottom: '56.25%' }}>
          <img
            src={course.thumbnail || 'https://placehold.co/400x225/EDE9FE/7C3AED?text=Course'}
            alt={course.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
          {course.isFree && (
            <span className="absolute top-3 left-3 badge badge-green font-semibold">FREE</span>
          )}
          {/* Completed badge overlay */}
          {isComplete && (
            <div
              className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)', backdropFilter: 'blur(6px)' }}
            >
              <CheckCircle2 size={14} /> Completed
            </div>
          )}
          {!showProgress && (
            <button
              onClick={handleWishlist}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-white/90 backdrop-blur-sm shadow transition-transform hover:scale-110"
            >
              <Heart size={14} fill={isWishlisted ? '#EF4444' : 'none'} color={isWishlisted ? '#EF4444' : '#64748B'} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Category + Level */}
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="purple">{course.category}</Badge>
            {course.level && <Badge variant="gray">{course.level}</Badge>}
          </div>

          <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-1" style={{ color: 'var(--text-primary)' }}>
            {course.title}
          </h3>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            {course.instructor?.fullName}
          </p>

          {showProgress ? (
            <div className="mb-3">
              <ProgressBar percent={progress} showLabel size="sm" color={isComplete ? 'green' : 'purple'} />
              {/* Course total duration */}
              <div className="flex items-center gap-1.5 mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Clock size={12} />
                <span>{formatDuration(course.totalDuration)} total</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="flex items-center gap-1">
                <Star size={12} fill="#F59E0B" color="#F59E0B" />
                {course.avgRating?.toFixed(1) || '—'} ({course.reviewCount || 0})
              </span>
              <span className="flex items-center gap-1">
                <Users size={12} />
                {course.enrolledStudents?.length || 0}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatDuration(course.totalDuration)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="font-bold text-base" style={{ color: course.isFree ? '#10B981' : 'var(--text-primary)' }}>
              {formatPrice(course.price)}
            </span>
            {isComplete ? (
              <span className="text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1" style={{ background: '#10B98120', color: '#10B981' }}>
                <CheckCircle2 size={13} /> Completed
              </span>
            ) : (
              <span className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: 'var(--z-purple-100)', color: '#7C3AED' }}>
                {showProgress ? 'Continue →' : 'Enroll'}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
