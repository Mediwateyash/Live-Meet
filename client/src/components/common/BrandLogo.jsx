import React from 'react'
import { Link } from 'react-router-dom'

export default function BrandLogo({ 
  size = 'md', 
  showSubtitle = false, 
  to = '/', 
  className = '',
  textColor = 'var(--text-primary)',
  onClick 
}) {
  const sizeMap = {
    sm: { img: 'w-7 h-7', text: 'text-base', sub: 'text-[9px]' },
    md: { img: 'w-9 h-9', text: 'text-lg', sub: 'text-[10px]' },
    lg: { img: 'w-11 h-11', text: 'text-2xl', sub: 'text-xs' },
    xl: { img: 'w-14 h-14', text: 'text-3xl', sub: 'text-sm' },
  }

  const s = sizeMap[size] || sizeMap.md

  const content = (
    <div className={`flex items-center gap-2.5 select-none ${className}`} onClick={onClick}>
      <img
        src="/logo.png"
        alt="SMIT Logo"
        className={`${s.img} rounded-xl object-contain shadow-sm shrink-0`}
        onError={(e) => {
          // Fallback to favicon.svg if logo.png fails
          e.currentTarget.src = '/favicon.svg'
        }}
      />
      <div className="flex flex-col leading-tight">
        <span
          className={`font-black tracking-tight ${s.text}`}
          style={{ fontFamily: 'Outfit, sans-serif', color: textColor }}
        >
          SMIT
        </span>
        {showSubtitle && (
          <span 
            className={`font-medium tracking-normal text-slate-500 dark:text-slate-400 ${s.sub} truncate max-w-[200px] sm:max-w-[240px]`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Sandeep More Institute of Technology
          </span>
        )}
      </div>
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center focus:outline-none">
        {content}
      </Link>
    )
  }

  return content
}
