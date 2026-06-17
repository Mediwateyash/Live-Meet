import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export default function Select({
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  label,
  error,
  required,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const normalized = options.map(o =>
    typeof o === 'string' ? { value: o, label: o } : o
  )
  const selected = normalized.find(o => o.value === value)

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && (
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: 'var(--text-primary)' }}
        >
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 text-left text-sm font-medium rounded-[10px] border-[1.5px] px-3.5 py-[10px] transition-all"
        style={{
          background: open ? 'var(--bg-surface)' : 'var(--bg-muted)',
          borderColor: open ? '#7C3AED' : error ? '#EF4444' : 'var(--border-default)',
          boxShadow: open ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none',
          color: selected ? 'var(--text-primary)' : 'var(--text-muted)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown
          size={15}
          color="#7C3AED"
          style={{
            flexShrink: 0,
            transition: 'transform 0.18s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute z-[9999] rounded-xl py-1 overflow-hidden"
          style={{
            top: 'calc(100% + 5px)',
            left: 0,
            minWidth: '100%',
            width: 'max-content',
            background: 'var(--bg-surface)',
            border: '1.5px solid var(--border-purple)',
            boxShadow: '0 8px 24px rgba(124,58,237,0.14), 0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          {normalized.map(opt => {
            const isSel = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-left"
                style={{
                  background: isSel ? 'rgba(124,58,237,0.08)' : 'transparent',
                  color: isSel ? '#7C3AED' : 'var(--text-primary)',
                  fontWeight: isSel ? 600 : 400,
                }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'rgba(124,58,237,0.05)' }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = isSel ? 'rgba(124,58,237,0.08)' : 'transparent' }}
              >
                <span>{opt.label}</span>
                {isSel && <Check size={13} color="#7C3AED" style={{ flexShrink: 0 }} />}
              </button>
            )
          })}
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
