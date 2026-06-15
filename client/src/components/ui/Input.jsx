import React from 'react'

const Input = React.forwardRef(function Input({
  label,
  error,
  hint,
  type = 'text',
  className = '',
  containerClass = '',
  required = false,
  ...props
}, ref) {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClass}`}>
      {label && (
        <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`input-field ${error ? 'error' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  )
})

export default Input
