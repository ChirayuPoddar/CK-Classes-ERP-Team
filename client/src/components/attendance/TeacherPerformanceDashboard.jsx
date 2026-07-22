import React, { useState, useMemo } from 'react'
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  Search,
  Eye,
  Send,
  Sparkles,
  BookOpen
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'
import AttendanceProgress from '@/components/attendance/AttendanceProgress'
import TeacherDetailDrawer from '@/components/attendance/TeacherDetailDrawer'

export default function TeacherPerformanceDashboard({
  teachers = [],
  sessions = [],
  loading = false,
  onSendReminder
}) {
  const [isExpanded, setIsExpanded] = useState(() => {
    return sessionStorage.getItem('attendance_teacher_performance_expanded') === 'true'
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTeacherForDrawer, setSelectedTeacherForDrawer] = useState(null)

  const toggleExpanded = () => {
    setIsExpanded(prev => {
      const next = !prev
      sessionStorage.setItem('attendance_teacher_performance_expanded', String(next))
      return next
    })
  }

  // 1. Process & Aggregate Performance Metrics for each Teacher
  const performanceAnalysis = useMemo(() => {
    if (!teachers || teachers.length === 0) {
      return { teacherList: [], kpis: { totalTeachers: 0, avgRate: 0, totalPending: 0 } }
    }

    const teacherList = teachers.map(teacher => {
      const tName = `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 'Teacher'
      const tDepartment = teacher.department || 'Academic Faculty'

      // Filter sessions for this teacher
      const tSessions = sessions.filter(s => {
        if (!s.teacherId) return false
        const sId = typeof s.teacherId === 'object' ? s.teacherId._id : s.teacherId
        return sId === teacher._id
      })

      const totalConducted = tSessions.length
      const submitted = tSessions.filter(s => s.status === 'Submitted').length
      const pending = totalConducted - submitted
      const subRate = totalConducted > 0 ? Math.round((submitted / totalConducted) * 100) : 100

      // Assigned Classes
      const assignedClasses = Array.from(new Set(tSessions.map(s => s.classId))).filter(Boolean)

      // Status Evaluation
      let status = 'On Track' // On Track | Needs Attention | Action Required
      if (subRate < 70 || pending >= 3) {
        status = 'Action Required'
      } else if (subRate < 90 || pending > 0) {
        status = 'Needs Attention'
      }

      // Trend Evaluation
      let trend = 'Stable'
      if (subRate >= 95) trend = 'Improving'
      else if (subRate < 75) trend = 'Declining'

      return {
        ...teacher,
        name: tName,
        department: tDepartment,
        assignedClasses,
        totalConducted,
        submitted,
        pending,
        subRate,
        status,
        trend
      }
    })

    const totalTeachers = teacherList.length
    const totalPending = teacherList.reduce((acc, t) => acc + t.pending, 0)
    const avgRate = totalTeachers > 0 ? Math.round(teacherList.reduce((acc, t) => acc + t.subRate, 0) / totalTeachers) : 100

    return {
      teacherList,
      kpis: {
        totalTeachers,
        avgRate,
        totalPending
      }
    }
  }, [teachers, sessions])

  if (loading) return null

  const filteredTeachers = performanceAnalysis.teacherList.filter(t => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return t.name.toLowerCase().includes(q) || t.department.toLowerCase().includes(q)
  })

  return (
    <div className="shrink-0 print:hidden select-none space-y-2 bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80 transition-all">
      {/* 1. Summary Strip Header */}
      <div
        onClick={toggleExpanded}
        className="flex flex-wrap items-center justify-between gap-2 cursor-pointer border-b border-slate-200/60 pb-2 select-none group"
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-blue-600 shrink-0" />
          <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider group-hover:text-brand-blue-600 transition-colors">
            Teacher Performance & Compliance Operations
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Summary Badges Strip */}
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold flex-wrap">
            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-700 shadow-2xs">
              Teachers: <strong className="text-slate-900">{performanceAnalysis.kpis.totalTeachers}</strong>
            </span>
            <span className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-emerald-700">
              Avg Rate: <strong>{performanceAnalysis.kpis.avgRate}%</strong>
            </span>
            {performanceAnalysis.kpis.totalPending > 0 && (
              <span className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-amber-700">
                Pending: <strong>{performanceAnalysis.kpis.totalPending} Sessions</strong>
              </span>
            )}
          </div>

          <button
            type="button"
            className="h-6 w-6 rounded-full hover:bg-slate-200/80 flex items-center justify-center text-slate-500 transition-transform duration-200"
            title={isExpanded ? "Collapse Teacher Performance" : "Expand Teacher Performance"}
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* 2. Animated Collapsible Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden space-y-3 pt-1"
          >
            {/* Search Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2 rounded-xl border border-slate-200/70">
              <span className="text-[11px] font-extrabold text-slate-600">
                Operational Compliance Roster ({filteredTeachers.length})
              </span>

              <div className="relative w-36 sm:w-48 h-7">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search teacher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-full w-full pl-7 pr-2 bg-slate-50 border border-slate-200 text-[10.5px] font-semibold rounded-lg focus:outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Teacher Performance Table */}
            <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
              <div className="max-h-60 overflow-y-auto custom-scrollbar text-left">
                {filteredTeachers.length === 0 ? (
                  <div className="py-8 text-center text-xs font-bold text-slate-400">
                    No teacher records found.
                  </div>
                ) : (
                  <table className="w-full text-left min-w-[700px] border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[9.5px] font-black text-slate-400 uppercase tracking-wider sticky top-0 bg-slate-50 z-10">
                      <tr>
                        <th className="py-2 px-3">Teacher</th>
                        <th className="py-2 px-2">Classes</th>
                        <th className="py-2 px-2 text-center">Sessions</th>
                        <th className="py-2 px-2 text-center">Pending</th>
                        <th className="py-2 px-3 text-center">Submission Rate</th>
                        <th className="py-2 px-2 text-center">Status</th>
                        <th className="py-2 px-2 text-center">Trend</th>
                        <th className="py-2 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {filteredTeachers.map(teacher => {
                        let statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-200"
                        if (teacher.status === 'Needs Attention') statusBadge = "bg-amber-50 text-amber-800 border-amber-200"
                        else if (teacher.status === 'Action Required') statusBadge = "bg-rose-50 text-rose-700 border-rose-200 font-bold"

                        return (
                          <tr key={teacher._id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-brand-blue-50 text-brand-blue-700 text-[10px] font-black flex items-center justify-center shrink-0 border border-brand-blue-100">
                                  {teacher.firstName ? teacher.firstName[0].toUpperCase() : 'T'}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-extrabold text-slate-800 block truncate">{teacher.name}</span>
                                  <span className="text-[9.5px] font-semibold text-slate-400 block truncate">{teacher.department}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-2 px-2 font-black text-brand-blue-700 text-[11px]">
                              {teacher.assignedClasses.length} Assigned
                            </td>

                            <td className="py-2 px-2 text-center font-bold text-slate-700">
                              {teacher.totalConducted}
                            </td>

                            <td className="py-2 px-2 text-center font-bold">
                              {teacher.pending > 0 ? (
                                <span className="text-amber-600 font-black">{teacher.pending}</span>
                              ) : (
                                <span className="text-slate-400">0</span>
                              )}
                            </td>

                            <td className="py-2 px-3 text-center">
                              <AttendanceProgress
                                percentage={teacher.subRate}
                                presentCount={teacher.submitted}
                                absentCount={teacher.pending}
                                totalStudents={teacher.totalConducted}
                                compact
                              />
                            </td>

                            <td className="py-2 px-2 text-center">
                              <span className={cn("px-2 py-0.5 text-[9.5px] rounded-full border uppercase tracking-wider", statusBadge)}>
                                {teacher.status}
                              </span>
                            </td>

                            <td className="py-2 px-2 text-center">
                              {teacher.trend === 'Improving' && (
                                <span className="inline-flex items-center gap-0.5 text-emerald-600 text-[10.5px] font-black">
                                  <TrendingUp className="h-3.5 w-3.5" />
                                  <span>Up</span>
                                </span>
                              )}
                              {teacher.trend === 'Declining' && (
                                <span className="inline-flex items-center gap-0.5 text-rose-600 text-[10.5px] font-black">
                                  <TrendingDown className="h-3.5 w-3.5" />
                                  <span>Down</span>
                                </span>
                              )}
                              {teacher.trend === 'Stable' && (
                                <span className="inline-flex items-center gap-0.5 text-slate-400 text-[10.5px] font-extrabold">
                                  <Minus className="h-3.5 w-3.5" />
                                  <span>Stable</span>
                                </span>
                              )}
                            </td>

                            <td className="py-2 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedTeacherForDrawer(teacher)}
                                  className="h-6 px-2 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10.5px] font-bold flex items-center gap-1 cursor-pointer"
                                  title="View Detailed Performance Drawer"
                                >
                                  <Eye className="h-3 w-3" />
                                  <span>Details</span>
                                </button>

                                {teacher.pending > 0 && onSendReminder && (
                                  <button
                                    type="button"
                                    onClick={() => onSendReminder(teacher)}
                                    className="h-6 w-6 rounded-md border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 flex items-center justify-center cursor-pointer"
                                    title="Send Attendance Reminder"
                                  >
                                    <Send className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TEACHER DETAIL SIDE DRAWER */}
      <AnimatePresence>
        {selectedTeacherForDrawer && (
          <TeacherDetailDrawer
            isOpen={Boolean(selectedTeacherForDrawer)}
            onClose={() => setSelectedTeacherForDrawer(null)}
            teacher={selectedTeacherForDrawer}
            sessions={sessions}
            onSendReminder={onSendReminder}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
