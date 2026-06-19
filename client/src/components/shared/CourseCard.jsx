import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Clock, Users, Star, CheckCircle2 } from 'lucide-react'
import { cardVariants } from '../../utils/animations.js'
import Badge from '../ui/Badge.jsx'
import ProgressBar from '../ui/ProgressBar.jsx'
import { formatPrice, formatDuration } from '../../utils/formatters.js'
import useAuthStore from '../../store/authStore.js'
import useUIStore from '../../store/uiStore.js'
import { usersAPI } from '../../api/users.js'
import toast from 'react-hot-toast'

export default function CourseCard({ course, showProgress = false, compact = false, progress = 0 }) {
  const { user, isAuthenticated, updateUser } = useAuthStore()
  const { openAuthModal } = useUIStore()
  const isWishlisted = user?.wishlist?.some(id => id.toString() === course._id.toString())
  const isComplete = showProgress && progress >= 100

  const handleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) { openAuthModal('login', 'Log in to save courses to your wishlist'); return }
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
      <Link
        to={`/course/${course.slug}`}
        className="flex gap-3 p-3 rounded-xl transition-colors"
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
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
    <motion.div
      variants={cardVariants}
      className="course-card overflow-hidden flex flex-col"
      style={isComplete ? { border: '2px solid #10B981', boxShadow: '0 0 18px rgba(16,185,129,0.15)' } : undefined}
    >
      <Link to={`/course/${course.slug}`} className="flex flex-col flex-1">
        {/* Thumbnail — fixed 56.25% aspect ratio */}
        <div className="relative overflow-hidden shrink-0" style={{ paddingBottom: '56.25%' }}>
          <img
            src={course.thumbnail || 'https://placehold.co/400x225/EDE9FE/7C3AED?text=Course'}
            alt={course.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
          {course.isFree && (
            <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded shadow-md tracking-wider z-10">
              FREE
            </span>
          )}
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
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm shadow transition-transform hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.88)' }}
            >
              <Heart size={14} fill={isWishlisted ? '#EF4444' : 'none'} color={isWishlisted ? '#EF4444' : '#64748B'} />
            </button>
          )}
        </div>

        {/* Body — flex-col, footer always at bottom */}
        <div className="flex flex-col flex-1 p-4">

          {/* Badges — fixed height */}
          <div className="flex items-center gap-2 flex-wrap" style={{ minHeight: 28 }}>
            <Badge variant="purple">{course.category}</Badge>
            {course.level && <Badge variant="gray">{course.level}</Badge>}
          </div>

          {/* Title — always 2 lines */}
          <h3
            className="font-semibold text-[15px] leading-snug mt-2.5"
            style={{ color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.6em' }}
          >
            {course.title}
          </h3>

          {/* Instructor — fixed height */}
          <div className="flex items-center gap-2 mt-2.5" style={{ minHeight: 24 }}>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', fontSize: 10, fontWeight: 700 }}
            >
              {course.instructor?.fullName?.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {course.instructor?.fullName}
            </span>
          </div>

          {/* Metadata — fixed height, pushed down by flex */}
          <div className="mt-2.5" style={{ minHeight: 20 }}>
            {showProgress ? (
              <>
                <ProgressBar percent={progress} showLabel size="sm" color={isComplete ? 'green' : 'purple'} />
                <div className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Clock size={12} /><span>{formatDuration(course.totalDuration)} total</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span className="flex items-center gap-1">
                  <Star size={12} fill="#F59E0B" color="#F59E0B" />
                  {course.avgRating?.toFixed(1) || '—'} ({course.reviewCount || 0})
                </span>
                <span className="flex items-center gap-1">
                  <Users size={12} />{course.enrolledStudents?.length || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />{formatDuration(course.totalDuration)}
                </span>
              </div>
            )}
          </div>

          {/* Footer — always at bottom */}
          <div className="flex items-center justify-between mt-auto pt-3">
            <span className="font-bold text-lg" style={{ color: course.isFree ? '#10B981' : 'var(--text-primary)' }}>
              {formatPrice(course.price)}
            </span>
            {isComplete ? (
              <span className="text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1" style={{ background: '#10B98120', color: '#10B981' }}>
                <CheckCircle2 size={13} /> Completed
              </span>
            ) : (
              <span className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: 'var(--z-purple-100)', color: '#7C3AED' }}>
                {showProgress ? 'Continue →' : 'Enroll'}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
