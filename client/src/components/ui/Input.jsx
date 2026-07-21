import React from 'react'
import { cn } from '@/utils/cn'

export const Input = React.forwardRef(({
  className,
  type = 'text',
  label,
  error,
  helperText,
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label 
          htmlFor={inputId} 
          className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide select-none"
        >
          {label}
        </label>
      )}

      <input
        id={inputId}
        ref={ref}
        type={type}
        className={cn(
          "w-full h-10 px-3 rounded-premium-md border border-[var(--border-light)] bg-white text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] shadow-premium-1 focus:border-brand-blue-500 focus:outline-none focus:ring-4 focus:ring-brand-blue-50/50 transition-all duration-200",
          error && "border-[var(--danger-solid)] focus:border-[var(--danger-solid)] focus:ring-red-50/50",
          props.disabled && "bg-[var(--bg-secondary)] border-[var(--border-light)] text-[var(--text-tertiary)] cursor-not-allowed shadow-none",
          className
        )}
        {...props}
      />

      {error ? (
        <p className="text-[11px] font-medium text-[var(--danger-text)] mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{helperText}</p>
      ) : null}
    </div>
  )
})

Input.displayName = 'Input'
