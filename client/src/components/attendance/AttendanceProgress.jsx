import React from 'react'
import { CheckCircle2, AlertCircle, Play, Lock } from 'lucide-react'
import { cn } from '@/utils/cn'

export default function AttendanceProgress({
  percentage = 0,
  presentCount = 0,
  absentCount = 0,
  lateCount = 0,
  leaveCount = 0,
  totalStudents = 0,
  status = 'Pending',
  isLocked = false,
  compact = false,
  showBadge = true,
  showStats = true,
  className = ''
}) {
  const pct = Math.round(Number(percentage) || 0)

  // Color selection based on rules:
  // 100% -> Green, 80-99% -> Blue, 60-79% -> Amber, <60% -> Rose, Locked -> Slate
  let barColor = 'bg-rose-500'
  let textColor = 'text-rose-600'
  if (isLocked) {
    barColor = 'bg-slate-400'
    textColor = 'text-slate-600'
  } else if (pct === 100) {
    barColor = 'bg-emerald-500'
    textColor = 'text-emerald-600'
  } else if (pct >= 80) {
    barColor = 'bg-blue-500'
    textColor = 'text-blue-600'
  } else if (pct >= 60) {
    barColor = 'bg-amber-500'
    textColor = 'text-amber-600'
  }

  // Status Badge Selection
  let statusBadge = { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertCircle }
  if (isLocked) {
    statusBadge = { label: 'Locked', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Lock }
  } else if (status === 'Submitted') {
    statusBadge = { label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 }
  } else if (presentCount > 0 || absentCount > 0 || lateCount > 0) {
    statusBadge = { label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Play }
  }

  const StatusIcon = statusBadge.icon

  // Tooltip content
  const tooltipText = `Present: ${presentCount} | Absent: ${absentCount} | Late: ${lateCount} | Leave: ${leaveCount} | Rate: ${pct}%`

  if (compact) {
    return (
      <div
        className={cn("relative group flex items-center gap-2", className)}
        title={tooltipText}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Attendance progress ${pct}%`}
      >
        <div className="h-2 w-16 sm:w-20 bg-slate-150 rounded-full overflow-hidden shrink-0">
          <div
            className={cn("h-full rounded-full transition-all duration-300", barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={cn("text-[11px] font-black shrink-0", textColor)}>
          {pct}%
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn("relative group space-y-1.5 text-left select-none", className)}
      title={tooltipText}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Attendance progress ${pct}%`}
    >
      {/* Top Meta Header: Status Badge & Rate */}
      <div className="flex items-center justify-between gap-2">
        {showBadge && (
          <span className={cn(
            "px-2 py-0.5 text-[9.5px] font-black rounded-full border flex items-center gap-1 shrink-0",
            statusBadge.color
          )}>
            <StatusIcon className="h-3 w-3" />
            <span>{statusBadge.label}</span>
          </span>
        )}

        <span className={cn("text-xs font-black ml-auto", textColor)}>
          {pct}%
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-0.5">
        <div
          className={cn("h-full rounded-full transition-all duration-300", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Bottom Statistics Counts */}
      {showStats && (
        <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-500 pt-0.5">
          <span className="text-emerald-700 font-bold">{presentCount} Present</span>
          <span className="text-rose-600 font-bold">{absentCount} Absent</span>
          {lateCount > 0 && <span className="text-amber-600 font-bold">{lateCount} Late</span>}
        </div>
      )}
    </div>
  )
}
