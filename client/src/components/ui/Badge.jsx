import React from 'react'

const variants = {
  purple: 'badge-purple',
  green:  'badge-green',
  amber:  'badge-amber',
  red:    'badge-red',
  gray:   'badge-gray',
  blue:   'badge-blue',
}

export default function Badge({ children, variant = 'gray', className = '' }) {
  return (
    <span className={`badge ${variants[variant] || 'badge-gray'} ${className}`}>
      {children}
    </span>
  )
}
