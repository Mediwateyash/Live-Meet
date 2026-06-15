import React from 'react'
import { Star } from 'lucide-react'

export default function RatingStars({ rating = 0, count, size = 14, interactive = false, onChange }) {
  const stars = [1, 2, 3, 4, 5]

  return (
    <div className="flex items-center gap-0.5">
      {stars.map(star => {
        const filled = star <= Math.floor(rating)
        const partial = !filled && star <= rating + 0.5
        return (
          <span
            key={star}
            onClick={() => interactive && onChange?.(star)}
            style={{ cursor: interactive ? 'pointer' : 'default' }}
          >
            <Star
              size={size}
              fill={filled || partial ? '#F59E0B' : 'none'}
              color={filled || partial ? '#F59E0B' : '#D1D5DB'}
              strokeWidth={1.5}
            />
          </span>
        )
      })}
      {count !== undefined && (
        <span className="text-xs ml-1" style={{ color: 'var(--text-secondary)' }}>
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  )
}
