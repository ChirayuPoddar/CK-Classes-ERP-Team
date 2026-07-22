import React from 'react'
import { Calendar, Clock, User, BookOpen, Lock, Unlock, Edit3, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'
import AttendanceProgress from '@/components/attendance/AttendanceProgress'

export default function AttendanceCardView({
  sessions = [],
  loading = false,
  onOpenViewModal,
  onToggleLock,
  onTriggerEdit,
  onDeleteSession
}) {
  if (loading) {
    return (
      <div className="py-24 text-center text-xs font-bold text-slate-400 flex flex-col items-center justify-center gap-2">
        <div className="h-6 w-6 border-2 border-brand-blue-600 border-t-transparent rounded-full animate-spin" />
        <span>Loading attendance cards...</span>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="py-24 text-center text-xs font-black text-slate-400 flex flex-col items-center justify-center gap-2 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
        <Calendar className="h-8 w-8 text-slate-300" />
        <span>No matching attendance sessions found for Card View.</span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 overflow-y-auto custom-scrollbar flex-grow min-h-0 pr-1 p-0.5 select-none">
      {sessions.map((session) => {
        const pct = session.stats?.attendancePercentage || 0
        const isHigh = pct >= 80
        const isMid = pct >= 50 && pct < 80
        const teacherName = session.teacherId
          ? `${session.teacherId.firstName || ''} ${session.teacherId.lastName || ''}`.trim()
          : 'Unassigned'

        return (
          <div
            key={session._id}
            onClick={() => onOpenViewModal(session)}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md hover:border-brand-blue-300 transition-all duration-200 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
          >
            {/* Header: Class & Status Pill */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-brand-blue-700 bg-brand-blue-50 px-2.5 py-0.5 rounded-full border border-brand-blue-200">
                    {session.classId}
                  </span>
                  <span className="text-[11px] font-extrabold text-slate-400">
                    {new Date(session.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-800 tracking-tight mt-1 group-hover:text-brand-blue-600 transition-colors">
                  {session.subjectId?.name || 'Subject Session'}
                </h4>
              </div>

              <span className={cn(
                "px-2.5 py-0.5 text-[10px] font-black rounded-full border uppercase tracking-wider shrink-0",
                session.status === 'Submitted'
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              )}>
                {session.status}
              </span>
            </div>

            {/* Middle: Details */}
            <div className="py-2.5 space-y-1.5 text-xs font-bold text-slate-600">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  Teacher:
                </span>
                <span className="font-extrabold text-slate-700 truncate max-w-[140px]">{teacherName}</span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  Period:
                </span>
                <span className="font-extrabold text-slate-700">
                  {session.periodId?.name || 'Period'} ({session.periodId?.startTime || '09:00'})
                </span>
              </div>
            </div>

            {/* Attendance Progress Bar & Metrics */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 my-1">
              <AttendanceProgress
                percentage={pct}
                presentCount={session.stats?.presentCount || 0}
                absentCount={session.stats?.absentCount || 0}
                lateCount={session.stats?.lateCount || 0}
                status={session.status}
                isLocked={session.isLocked}
                showBadge={false}
              />
            </div>

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-bold" onClick={(e) => e.stopPropagation()}>
              <span className="text-slate-400 text-[10px]">
                {session.isLocked ? '🔒 Locked' : '🔓 Unlocked'}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onToggleLock(session)}
                  className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center transition-colors border",
                    session.isLocked
                      ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                      : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                  )}
                  title={session.isLocked ? "Unlock Session" : "Lock Session"}
                >
                  {session.isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                </button>

                <button
                  onClick={() => onTriggerEdit(session)}
                  className="h-7 w-7 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors"
                  title="Edit Session Records"
                >
                  <Edit3 className="h-3 w-3" />
                </button>

                <button
                  onClick={() => onDeleteSession(session)}
                  className="h-7 w-7 rounded-full border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors"
                  title="Delete Session"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
