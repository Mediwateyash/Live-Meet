import React from 'react'
import { motion } from 'framer-motion'

export default function ProgressBar({
  percent = 0,
  showLabel = false,
  size = 'md',
  color = 'purple',
}) {
  const heights = { sm: 4, md: 8, lg: 12 }
  const colors = {
    purple: '#7C3AED',
    green:  '#10B981',
  }

  return (
    <div className="w-full">
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: heights[size], background: 'var(--z-purple-100)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percent, 100)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: colors[color],
            borderRadius: 'inherit',
          }}
        />
      </div>
      {showLabel && (
        <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
          {Math.round(percent)}% complete
        </p>
      )}
    </div>
  )
}
