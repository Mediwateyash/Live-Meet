import React from 'react'
import Button from './Button.jsx'

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="mb-4 p-4 rounded-2xl" style={{ background: 'var(--z-purple-100)' }}>
          <Icon size={40} color="var(--z-purple-500)" />
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm mb-6 max-w-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}
