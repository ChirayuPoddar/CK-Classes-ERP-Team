import React from 'react'
import { cn } from '@/utils/cn'

export const Button = React.forwardRef(({
  children,
  className,
  variant = 'primary', // 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  isLoading = false,
  disabled = false,
  type = 'button',
  ...props
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-premium-md transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] border"

  const variants = {
    primary: "bg-brand-blue-500 text-white hover:bg-brand-blue-600 focus:ring-brand-blue-100 border-transparent shadow-premium-1 hover:shadow-premium-2",
    accent: "bg-brand-orange-500 text-white hover:bg-brand-orange-600 focus:ring-brand-orange-100 border-transparent shadow-premium-1 hover:shadow-premium-2",
    secondary: "bg-white text-[var(--text-primary)] border-[var(--border-light)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-strong)] focus:ring-[var(--bg-tertiary)] shadow-premium-1",
    ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] border-transparent focus:ring-transparent active:scale-100",
    danger: "bg-[var(--danger-solid)] text-white hover:bg-red-600 focus:ring-red-100 border-transparent shadow-premium-1 hover:shadow-premium-2"
  }

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base"
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  )
})

Button.displayName = 'Button'
