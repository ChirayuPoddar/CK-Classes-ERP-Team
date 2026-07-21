import React from 'react'
import { cn } from '@/utils/cn'

export default function DashboardStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-blue-50',
  iconColor = 'text-blue-500',
  valueColor = 'text-slate-800',
  className = ''
}) {
  return (
    <div className={cn("bg-white px-5 py-3 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-default", className)}>
      <div className="text-left min-w-0 flex-1">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block truncate">{title}</span>
        <span className={cn("text-lg font-black leading-tight block mt-0.5 truncate", valueColor)}>{value}</span>
        {subtitle && (
          <span className="text-[8px] font-bold text-slate-450 block mt-0.5 truncate">{subtitle}</span>
        )}
      </div>
      <div className={cn("h-8.5 w-8.5 rounded-xl flex items-center justify-center shrink-0 ml-3", iconBgColor, iconColor)}>
        {Icon && <Icon className="h-4.5 w-4.5" />}
      </div>
    </div>
  )
}
