import React from 'react'
import { cn } from '@/utils/cn'

export const Card = ({
  children,
  className,
  isInteractive = false,
  padding = 'normal', // 'none' | 'small' | 'normal' | 'large'
  ...props
}) => {
  const paddings = {
    none: 'p-0',
    small: 'p-4',
    normal: 'p-6',
    large: 'p-8'
  }

  return (
    <div
      className={cn(
        "bg-white border border-[var(--border-light)] rounded-premium-xl shadow-premium-1 overflow-hidden transition-all duration-200",
        isInteractive && "hover:shadow-premium-2 hover:-translate-y-0.5 cursor-pointer",
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

Card.Header = ({ children, className }) => (
  <div className={cn("border-b border-b-[var(--border-light)] pb-4 mb-4", className)}>
    {children}
  </div>
)

Card.Title = ({ children, className }) => (
  <h3 className={cn("text-base font-bold text-[var(--text-primary)] tracking-tight", className)}>
    {children}
  </h3>
)

Card.Description = ({ children, className }) => (
  <p className={cn("text-xs text-[var(--text-tertiary)] mt-1", className)}>
    {children}
  </p>
)

Card.Footer = ({ children, className }) => (
  <div className={cn("border-t border-t-[var(--border-light)] pt-4 mt-4 flex items-center justify-end gap-3", className)}>
    {children}
  </div>
)
