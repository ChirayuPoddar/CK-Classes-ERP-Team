import React from 'react'
import {
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Lock,
  Play,
  Eye,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react'
import { cn } from '@/utils/cn'
import AttendanceProgress from '@/components/attendance/AttendanceProgress'

export default function LiveSessionDashboard({
  sessions = [],
  loading = false,
  onOpenViewModal,
  onSelectSlot,
  onTriggerEdit
}) {
  if (loading) return null
  if (!sessions || sessions.length === 0) return null

  // Live Summary Calculations from filteredSessions
  const totalCount = sessions.length
  const completedCount = sessions.filter(s => s.status === 'Submitted').length
  const lockedCount = sessions.filter(s => s.isLocked).length
  const pendingCount = sessions.filter(s => s.status === 'Pending' && !s.isLocked).length
  const inProgressCount = sessions.filter(s => (s.stats?.presentCount > 0 || s.stats?.absentCount > 0) && s.status !== 'Submitted').length

  return (
    <div className="shrink-0 print:hidden select-none space-y-2 bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80">
      {/* 1. Summary Strip Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500 fill-amber-400" />
          <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider">
            Live Session Operations
          </h3>
        </div>

        {/* Summary Badges Strip */}
        <div className="flex items-center gap-1.5 text-[10px] font-extrabold flex-wrap">
          <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-700 shadow-2xs">
            Sessions: <strong className="text-slate-900">{totalCount}</strong>
          </span>
          <span className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-emerald-700">
            Completed: <strong>{completedCount}</strong>
          </span>
          {inProgressCount > 0 && (
            <span className="bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full text-blue-700">
              In Progress: <strong>{inProgressCount}</strong>
            </span>
          )}
          <span className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-amber-700">
            Pending: <strong>{pendingCount}</strong>
          </span>
          {lockedCount > 0 && (
            <span className="bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-rose-700">
              Locked: <strong>{lockedCount}</strong>
            </span>
          )}
        </div>
      </div>

      {/* 2. Horizontally Scrollable Live Session Cards */}
      <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar py-1 pr-1 scroll-smooth">
        {sessions.map((session) => {
          const teacherName = session.teacherId
            ? `${session.teacherId.firstName || ''} ${session.teacherId.lastName || ''}`.trim()
            : 'Unassigned'
          const pct = session.stats?.attendancePercentage || 0
          const present = session.stats?.presentCount || 0
          const absent = session.stats?.absentCount || 0
          const late = session.stats?.lateCount || 0
          const totalMarked = present + absent + late

          // Determine Card Status Badge
          let statusBadge = { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertCircle }
          if (session.isLocked) {
            statusBadge = { label: 'Locked', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: Lock }
          } else if (session.status === 'Submitted') {
            statusBadge = { label: 'Submitted', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 }
          } else if (totalMarked > 0) {
            statusBadge = { label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Play }
          }

          const StatusIcon = statusBadge.icon

          // Determine Action Button Label & Function
          let actionLabel = 'Take Attendance'
          let actionHandler = () => onTriggerEdit(session)
          if (session.isLocked) {
            actionLabel = 'View Only'
            actionHandler = () => onOpenViewModal(session)
          } else if (session.status === 'Submitted') {
            actionLabel = 'View / Edit'
            actionHandler = () => onOpenViewModal(session)
          } else if (totalMarked > 0) {
            actionLabel = 'Continue'
            actionHandler = () => onTriggerEdit(session)
          }

          return (
            <div
              key={session._id}
              onClick={() => onOpenViewModal(session)}
              className="min-w-[250px] max-w-[280px] bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs hover:shadow-md hover:border-brand-blue-300 transition-all duration-200 shrink-0 flex flex-col justify-between cursor-pointer group text-left"
            >
              {/* Top: Class Badge & Status Pill */}
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[10px] font-black text-brand-blue-700 bg-brand-blue-50 px-2 py-0.5 rounded-md border border-brand-blue-200 uppercase tracking-wider">
                  {session.classId}
                </span>
                <span className={cn(
                  "px-2 py-0.5 text-[9.5px] font-extrabold rounded-full border flex items-center gap-1 shrink-0",
                  statusBadge.color
                )}>
                  <StatusIcon className="h-3 w-3" />
                  <span>{statusBadge.label}</span>
                </span>
              </div>

              {/* Subject Title & Details */}
              <div className="my-2 space-y-0.5">
                <h4 className="text-xs font-black text-slate-800 tracking-tight truncate group-hover:text-brand-blue-600 transition-colors">
                  {session.subjectId?.name || 'Subject Session'}
                </h4>
                <div className="flex items-center justify-between text-[10.5px] font-extrabold text-slate-500">
                  <span className="truncate max-w-[130px]">{teacherName}</span>
                  <span className="text-slate-400 font-mono text-[9.5px]">
                    {session.periodId?.startTime || '09:00'}
                  </span>
                </div>
              </div>

              {/* Live Attendance Progress Bar */}
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 mb-2">
                <AttendanceProgress
                  percentage={pct}
                  presentCount={present}
                  absentCount={absent}
                  lateCount={late}
                  status={session.status}
                  isLocked={session.isLocked}
                  showBadge={false}
                />
              </div>

              {/* Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  actionHandler()
                }}
                className="w-full h-7 bg-slate-50 hover:bg-brand-blue-600 hover:text-white text-slate-700 text-[10.5px] font-black rounded-lg border border-slate-200 flex items-center justify-center gap-1 transition-all cursor-pointer group-hover:bg-brand-blue-600 group-hover:text-white group-hover:border-brand-blue-600"
              >
                <span>{actionLabel}</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
