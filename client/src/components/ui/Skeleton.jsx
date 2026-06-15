import React from 'react'

export function SkeletonLine({ width = '100%', height = 16, className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: 8 }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="course-card p-0 overflow-hidden">
      <div className="skeleton" style={{ height: 180, borderRadius: '20px 20px 0 0' }} />
      <div className="p-4 flex flex-col gap-3">
        <SkeletonLine height={20} width="80%" />
        <SkeletonLine height={14} width="60%" />
        <SkeletonLine height={14} width="40%" />
        <div className="flex justify-between items-center mt-1">
          <SkeletonLine height={22} width="30%" />
          <SkeletonLine height={14} width="25%" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonAvatar({ size = 40 }) {
  return <div className="skeleton rounded-full" style={{ width: size, height: size }} />
}

export function SkeletonStat() {
  return (
    <div className="stat-card flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12 }} />
        <SkeletonLine height={14} width="60%" />
      </div>
      <SkeletonLine height={32} width="50%" />
    </div>
  )
}
