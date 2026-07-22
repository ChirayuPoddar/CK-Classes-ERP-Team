import React, { useEffect } from 'react'
import {
  X,
  User,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Mail,
  Phone,
  Send
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'
import AttendanceProgress from '@/components/attendance/AttendanceProgress'

export default function TeacherDetailDrawer({
  isOpen,
  onClose,
  teacher,
  sessions = [],
  onSendReminder
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !teacher) return null

  const teacherName = `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 'Teacher Details'
  const teacherEmail = teacher.email || 'N/A'
  const teacherPhone = teacher.phone || 'N/A'
  const department = teacher.department || 'Academic Faculty'

  // Filter sessions assigned to this teacher
  const teacherSessions = sessions.filter(s => {
    if (!s.teacherId) return false
    const tId = typeof s.teacherId === 'object' ? s.teacherId._id : s.teacherId
    return tId === teacher._id
  })

  const totalSessions = teacherSessions.length
  const submittedCount = teacherSessions.filter(s => s.status === 'Submitted').length
  const pendingCount = totalSessions - submittedCount
  const subRate = totalSessions > 0 ? Math.round((submittedCount / totalSessions) * 100) : 100

  const assignedClasses = Array.from(new Set(teacherSessions.map(s => s.classId))).filter(Boolean)

  return (
    <div className="fixed inset-0 z-[100] flex justify-end select-none print:hidden">
      {/* Backdrop Dimming */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-[2px] transition-opacity"
      />

      {/* Right Slide-Over Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 350, damping: 32 }}
        className="relative w-full sm:w-[480px] lg:w-[540px] bg-white h-full shadow-2xl flex flex-col justify-between z-10 border-l border-slate-200"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                {teacher.firstName ? teacher.firstName[0].toUpperCase() : 'T'}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight leading-tight">
                  {teacherName}
                </h3>
                <span className="text-[11px] font-bold text-slate-500 block mt-0.5">
                  {department}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
              title="Close Panel (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Contact & Progress Summary */}
          <div className="mt-3 pt-3 border-t border-slate-200/60 space-y-2">
            <AttendanceProgress
              percentage={subRate}
              presentCount={submittedCount}
              absentCount={pendingCount}
              totalStudents={totalSessions}
              status={subRate >= 90 ? 'Submitted' : 'Pending'}
            />
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-4 flex-grow overflow-y-auto custom-scrollbar space-y-4 text-left min-h-0">
          {/* Contact Details Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{teacherEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{teacherPhone}</span>
            </div>
          </div>

          {/* Assigned Classes */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Assigned Classes ({assignedClasses.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {assignedClasses.length === 0 ? (
                <span className="text-xs font-semibold text-slate-400">No active classes assigned.</span>
              ) : (
                assignedClasses.map(c => (
                  <span key={c} className="h-6 px-2.5 rounded-full bg-brand-blue-50 border border-brand-blue-200 text-brand-blue-700 text-[10.5px] font-black">
                    {c}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Recent Attendance Session Activity */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Recent Session Submissions ({teacherSessions.length})
            </h4>
            {teacherSessions.length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No recent attendance sessions logged for this teacher.
              </div>
            ) : (
              <div className="space-y-2">
                {teacherSessions.map(session => (
                  <div key={session._id} className="p-3 rounded-xl border border-slate-200/80 bg-white hover:border-brand-blue-300 transition-colors flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-800">{session.subjectId?.name || 'Subject'}</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[9.5px] font-bold">{session.classId}</span>
                      </div>
                      <span className="text-[10.5px] font-semibold text-slate-400 block mt-0.5">
                        {new Date(session.date).toLocaleDateString()} • {session.periodId?.name || 'Period'}
                      </span>
                    </div>

                    <span className={cn(
                      "px-2 py-0.5 text-[9.5px] font-black rounded-full border uppercase tracking-wider shrink-0",
                      session.status === 'Submitted' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                    )}>
                      {session.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 transition-colors cursor-pointer"
          >
            Close
          </button>

          {onSendReminder && pendingCount > 0 && (
            <button
              type="button"
              onClick={() => onSendReminder(teacher)}
              className="h-9 px-4 bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send Attendance Reminder</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
