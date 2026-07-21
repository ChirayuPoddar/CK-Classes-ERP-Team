import React from 'react'
import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/utils/cn'

export default function ConflictBadge({ type = 'warning', message, className = '' }) {
  if (!message) return null

  const isDanger = type === 'danger' || type === 'error'
  const isWarning = type === 'warning'

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all animate-pulse",
        isDanger && "bg-red-50 text-red-700 border-red-200",
        isWarning && "bg-amber-50 text-amber-700 border-amber-200",
        !isDanger && !isWarning && "bg-blue-50 text-blue-700 border-blue-200",
        className
      )}
      title={message}
    >
      {isDanger ? (
        <AlertCircle className="h-3 w-3 text-red-500 shrink-0" />
      ) : isWarning ? (
        <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
      ) : (
        <Info className="h-3 w-3 text-blue-500 shrink-0" />
      )}
      <span className="truncate max-w-[180px]">{message}</span>
    </div>
  )
}
