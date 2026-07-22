import React from 'react'
import { Calendar as CalendarIcon, Clock, User, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import AttendanceProgress from '@/components/attendance/AttendanceProgress'

export default function AttendanceCalendarView({
  sessions = [],
  loading = false,
  onOpenViewModal
}) {
  if (loading) {
    return (
      <div className="py-24 text-center text-xs font-bold text-slate-400 flex flex-col items-center justify-center gap-2">
        <div className="h-6 w-6 border-2 border-brand-blue-600 border-t-transparent rounded-full animate-spin" />
        <span>Loading calendar view...</span>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="py-24 text-center text-xs font-black text-slate-400 flex flex-col items-center justify-center gap-2 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
        <CalendarIcon className="h-8 w-8 text-slate-300" />
        <span>No matching attendance sessions found for Calendar View.</span>
      </div>
    )
  }

  // Group sessions by date string YYYY-MM-DD
  const groupedByDate = sessions.reduce((acc, session) => {
    const dStr = new Date(session.date).toISOString().split('T')[0]
    if (!acc[dStr]) acc[dStr] = []
    acc[dStr].push(session)
    return acc
  }, {})

  // Sorted date keys descending (latest date first)
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-y-auto custom-scrollbar flex-grow min-h-0 pr-1 p-0.5 select-none text-left">
      {sortedDates.map((dStr) => {
        const daySessions = groupedByDate[dStr]
        const formattedDate = new Date(dStr).toLocaleDateString(undefined, {
          weekday: 'long',
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
        const submittedCount = daySessions.filter(s => s.status === 'Submitted').length
        const pendingCount = daySessions.length - submittedCount

        return (
          <div
            key={dStr}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col gap-3"
          >
            {/* Date Group Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center font-black">
                  <CalendarIcon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-850 leading-tight">
                    {formattedDate}
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">
                    {daySessions.length} Total Sessions
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-extrabold">
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  {submittedCount} Done
                </span>
                {pendingCount > 0 && (
                  <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                    {pendingCount} Pending
                  </span>
                )}
              </div>
            </div>

            {/* List of Sessions for this Day */}
            <div className="space-y-2">
              {daySessions.map((session) => {
                const teacherName = session.teacherId
                  ? `${session.teacherId.firstName || ''} ${session.teacherId.lastName || ''}`.trim()
                  : 'Unassigned'
                const pct = session.stats?.attendancePercentage || 0

                return (
                  <div
                    key={session._id}
                    onClick={() => onOpenViewModal(session)}
                    className="p-3 rounded-xl border border-slate-100 hover:border-brand-blue-300 bg-slate-50/50 hover:bg-white shadow-2xs hover:shadow-sm transition-all duration-200 flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-white border border-slate-200/80 text-slate-700 font-mono text-[10px] font-black flex flex-col items-center justify-center shrink-0">
                        <span>{session.periodId?.name || 'P'}</span>
                        <span className="text-[8px] font-bold text-slate-400 leading-tight">
                          {session.periodId?.startTime || '09:00'}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-800 truncate leading-tight group-hover:text-brand-blue-600 transition-colors">
                            {session.subjectId?.name || 'Subject'}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 text-[9px] font-black shrink-0">
                            {session.classId}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 block truncate mt-0.5">
                          {teacherName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <AttendanceProgress
                        percentage={pct}
                        presentCount={session.stats?.presentCount || 0}
                        absentCount={session.stats?.absentCount || 0}
                        lateCount={session.stats?.lateCount || 0}
                        status={session.status}
                        isLocked={session.isLocked}
                        compact
                      />
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-brand-blue-600 transition-colors" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
