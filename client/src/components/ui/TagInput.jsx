import React, { useState } from 'react'
import { X } from 'lucide-react'

export default function TagInput({ value = [], onChange, placeholder = 'Type and press Enter', maxTags = 10 }) {
  const [input, setInput] = useState('')

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      const tag = input.trim().toLowerCase()
      if (!value.includes(tag) && value.length < maxTags) {
        onChange([...value, tag])
      }
      setInput('')
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const remove = (tag) => onChange(value.filter(t => t !== tag))

  return (
    <div
      className="flex flex-wrap gap-2 p-2 rounded-[10px] min-h-[44px] cursor-text"
      style={{ border: '1.5px solid var(--border-default)', background: 'var(--bg-muted)' }}
      onClick={(e) => e.currentTarget.querySelector('input')?.focus()}
    >
      {value.map(tag => (
        <span
          key={tag}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-medium"
          style={{ background: 'var(--z-purple-100)', color: 'var(--z-purple-700)' }}
        >
          {tag}
          <button type="button" onClick={() => remove(tag)} className="hover:opacity-70">
            <X size={12} />
          </button>
        </span>
      ))}
      {value.length < maxTags && (
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
          style={{ color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}
        />
      )}
    </div>
  )
}
