import React, { useState, useMemo } from 'react'
import {
  AlertOctagon,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  User,
  History,
  FileText,
  Bell,
  Search,
  Filter,
  CheckCircle2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'
import AttendanceProgress from '@/components/attendance/AttendanceProgress'

export default function StudentRiskMonitor({
  sessions = [],
  loading = false,
  onOpenHistory,
  onOpenProfile
}) {
  const [isExpanded, setIsExpanded] = useState(() => {
    return sessionStorage.getItem('attendance_risk_monitor_expanded') === 'true'
  })

  const [riskFilter, setRiskFilter] = useState('All') // 'All' | 'Critical' | 'High Risk' | 'Warning' | 'Improving'
  const [searchQuery, setSearchQuery] = useState('')

  const toggleExpanded = () => {
    setIsExpanded(prev => {
      const next = !prev
      sessionStorage.setItem('attendance_risk_monitor_expanded', String(next))
      return next
    })
  }

  // 1. Process & Aggregate Risk Metrics from Attendance Sessions
  const riskAnalysis = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return { studentList: [], kpis: { totalAtRisk: 0, critical: 0, warning: 0, improving: 0 } }
    }

    const studentMap = {}

    sessions.forEach(session => {
      const records = session.records || []
      records.forEach(r => {
        const sObj = r.studentId
        if (!sObj) return
        const sId = typeof sObj === 'object' ? sObj._id : sObj
        const sName = typeof sObj === 'object' ? `${sObj.firstName || ''} ${sObj.lastName || ''}`.trim() : `Student ${sId.slice(-4)}`
        const rollNo = typeof sObj === 'object' ? sObj.rollNumber || sObj.studentId || 'N/A' : 'N/A'
        const sClass = session.classId || 'Class'

        if (!studentMap[sId]) {
          studentMap[sId] = {
            id: sId,
            name: sName,
            rollNo,
            class: sClass,
            totalSessions: 0,
            presentCount: 0,
            absentCount: 0,
            lateCount: 0,
            consecutiveAbsences: 0,
            currentAbsenceStreak: 0,
            history: []
          }
        }

        studentMap[sId].totalSessions += 1
        const status = r.status || 'Present'
        studentMap[sId].history.push(status)

        if (status === 'Present') {
          studentMap[sId].presentCount += 1
          studentMap[sId].currentAbsenceStreak = 0
        } else if (status === 'Absent') {
          studentMap[sId].absentCount += 1
          studentMap[sId].currentAbsenceStreak += 1
          if (studentMap[sId].currentAbsenceStreak > studentMap[sId].consecutiveAbsences) {
            studentMap[sId].consecutiveAbsences = studentMap[sId].currentAbsenceStreak
          }
        } else if (status === 'Late') {
          studentMap[sId].lateCount += 1
          studentMap[sId].currentAbsenceStreak = 0
        }
      })
    })

    const studentList = Object.values(studentMap).map(st => {
      const rate = st.totalSessions > 0 ? Math.round((st.presentCount / st.totalSessions) * 100) : 100
      let riskLevel = 'Normal' // Normal | Warning | High Risk | Critical
      const reasons = []

      // Rules Evaluation
      if (rate < 60 || st.consecutiveAbsences >= 3) {
        riskLevel = 'Critical'
        if (rate < 60) reasons.push(`Attendance rate (${rate}%) below 60% critical threshold`)
        if (st.consecutiveAbsences >= 3) reasons.push(`Absent for ${st.consecutiveAbsences} consecutive classes`)
      } else if (rate < 70 || st.consecutiveAbsences === 2) {
        riskLevel = 'High Risk'
        if (rate < 70) reasons.push(`Attendance rate (${rate}%) below 70% threshold`)
        if (st.consecutiveAbsences === 2) reasons.push('Absent for 2 consecutive classes')
      } else if (rate < 75 || st.lateCount >= 2) {
        riskLevel = 'Warning'
        if (rate < 75) reasons.push(`Attendance rate (${rate}%) below 75% warning threshold`)
        if (st.lateCount >= 2) reasons.push(`Frequently arriving late (${st.lateCount} times)`)
      }

      if (reasons.length === 0) {
        reasons.push('Regular attendance record')
      }

      // Trend Calculation
      let trend = 'Stable' // Improving | Stable | Declining
      if (st.history.length >= 3) {
        const last3 = st.history.slice(-3)
        const presentInLast3 = last3.filter(x => x === 'Present').length
        if (presentInLast3 === 3) trend = 'Improving'
        else if (presentInLast3 <= 1) trend = 'Declining'
      }

      return {
        ...st,
        rate,
        riskLevel,
        reasons,
        trend
      }
    })

    const kpis = {
      totalAtRisk: studentList.filter(s => s.riskLevel !== 'Normal').length,
      critical: studentList.filter(s => s.riskLevel === 'Critical').length,
      warning: studentList.filter(s => s.riskLevel === 'Warning' || s.riskLevel === 'High Risk').length,
      improving: studentList.filter(s => s.trend === 'Improving').length
    }

    return { studentList, kpis }
  }, [sessions])

  if (loading) return null

  // Filter students by active tab & search query
  const filteredStudents = riskAnalysis.studentList.filter(s => {
    if (riskFilter === 'Critical' && s.riskLevel !== 'Critical') return false
    if (riskFilter === 'High Risk' && s.riskLevel !== 'High Risk') return false
    if (riskFilter === 'Warning' && s.riskLevel !== 'Warning') return false
    if (riskFilter === 'Improving' && s.trend !== 'Improving') return false
    if (riskFilter === 'At Risk' && s.riskLevel === 'Normal') return false

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q) || s.class.toLowerCase().includes(q)
    }

    return true
  })

  return (
    <div className="shrink-0 print:hidden select-none space-y-2 bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80 transition-all">
      {/* 1. Summary Strip Header */}
      <div
        onClick={toggleExpanded}
        className="flex flex-wrap items-center justify-between gap-2 cursor-pointer border-b border-slate-200/60 pb-2 select-none group"
      >
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0" />
          <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider group-hover:text-brand-blue-600 transition-colors">
            Student Risk Monitor & Early Intervention
          </h3>
          {riskAnalysis.kpis.totalAtRisk > 0 && (
            <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-200">
              {riskAnalysis.kpis.totalAtRisk} At Risk
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Summary KPI Badges Strip */}
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold flex-wrap">
            <span
              onClick={(e) => { e.stopPropagation(); setRiskFilter('At Risk'); setIsExpanded(true); }}
              className={cn(
                "px-2 py-0.5 rounded-full border cursor-pointer transition-all",
                riskFilter === 'At Risk' ? "bg-rose-600 text-white border-rose-600" : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
              )}
            >
              At Risk: <strong>{riskAnalysis.kpis.totalAtRisk}</strong>
            </span>
            <span
              onClick={(e) => { e.stopPropagation(); setRiskFilter('Critical'); setIsExpanded(true); }}
              className={cn(
                "px-2 py-0.5 rounded-full border cursor-pointer transition-all",
                riskFilter === 'Critical' ? "bg-rose-800 text-white border-rose-800" : "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100"
              )}
            >
              Critical: <strong>{riskAnalysis.kpis.critical}</strong>
            </span>
            <span
              onClick={(e) => { e.stopPropagation(); setRiskFilter('Warning'); setIsExpanded(true); }}
              className={cn(
                "px-2 py-0.5 rounded-full border cursor-pointer transition-all",
                riskFilter === 'Warning' ? "bg-amber-600 text-white border-amber-600" : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
              )}
            >
              Warning: <strong>{riskAnalysis.kpis.warning}</strong>
            </span>
            <span
              onClick={(e) => { e.stopPropagation(); setRiskFilter('Improving'); setIsExpanded(true); }}
              className={cn(
                "px-2 py-0.5 rounded-full border cursor-pointer transition-all",
                riskFilter === 'Improving' ? "bg-emerald-600 text-white border-emerald-600" : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              )}
            >
              Improving: <strong>{riskAnalysis.kpis.improving}</strong>
            </span>
          </div>

          <button
            type="button"
            className="h-6 w-6 rounded-full hover:bg-slate-200/80 flex items-center justify-center text-slate-500 transition-transform duration-200"
            title={isExpanded ? "Collapse Risk Monitor" : "Expand Risk Monitor"}
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* 2. Animated Collapsible Risk Monitor Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden space-y-3 pt-1"
          >
            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2 rounded-xl border border-slate-200/70">
              <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar text-[11px] font-extrabold">
                {['All', 'At Risk', 'Critical', 'High Risk', 'Warning', 'Improving'].map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setRiskFilter(tab)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg transition-colors cursor-pointer border shrink-0",
                      riskFilter === tab
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="relative w-36 sm:w-48 h-7">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Find student..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-full w-full pl-7 pr-2 bg-slate-50 border border-slate-200 text-[10.5px] font-semibold rounded-lg focus:outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Student Risk List Table */}
            <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {filteredStudents.length === 0 ? (
                  <div className="py-8 text-center text-xs font-bold text-slate-400">
                    No students match the current risk monitor criteria.
                  </div>
                ) : (
                  <table className="w-full text-left min-w-[700px] border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[9.5px] font-black text-slate-400 uppercase tracking-wider sticky top-0 bg-slate-50 z-10">
                      <tr>
                        <th className="py-2 px-3">Student</th>
                        <th className="py-2 px-2">Class</th>
                        <th className="py-2 px-3 text-center">Attendance %</th>
                        <th className="py-2 px-2 text-center">Risk Level</th>
                        <th className="py-2 px-2 text-center">Trend</th>
                        <th className="py-2 px-3">Primary Reason</th>
                        <th className="py-2 px-3 text-center">Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {filteredStudents.map(student => {
                        let riskBadge = "bg-slate-100 text-slate-700 border-slate-200"
                        if (student.riskLevel === 'Critical') riskBadge = "bg-rose-100 text-rose-800 border-rose-300 font-black"
                        else if (student.riskLevel === 'High Risk') riskBadge = "bg-rose-50 text-rose-700 border-rose-200"
                        else if (student.riskLevel === 'Warning') riskBadge = "bg-amber-50 text-amber-800 border-amber-200"
                        else if (student.riskLevel === 'Normal') riskBadge = "bg-emerald-50 text-emerald-700 border-emerald-200"

                        return (
                          <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-black flex items-center justify-center shrink-0">
                                  {student.name[0]}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-extrabold text-slate-800 block truncate">{student.name}</span>
                                  <span className="text-[9.5px] font-semibold text-slate-400">ID: {student.rollNo}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-2 px-2 font-black text-brand-blue-700 text-[11px]">
                              {student.class}
                            </td>

                            <td className="py-2 px-3 text-center">
                              <AttendanceProgress
                                percentage={student.rate}
                                presentCount={student.presentCount}
                                absentCount={student.absentCount}
                                lateCount={student.lateCount}
                                compact
                              />
                            </td>

                            <td className="py-2 px-2 text-center">
                              <span className={cn("px-2 py-0.5 text-[9.5px] rounded-full border uppercase tracking-wider", riskBadge)}>
                                {student.riskLevel}
                              </span>
                            </td>

                            <td className="py-2 px-2 text-center">
                              {student.trend === 'Improving' && (
                                <span className="inline-flex items-center gap-0.5 text-emerald-600 text-[10.5px] font-black">
                                  <TrendingUp className="h-3.5 w-3.5" />
                                  <span>Up</span>
                                </span>
                              )}
                              {student.trend === 'Declining' && (
                                <span className="inline-flex items-center gap-0.5 text-rose-600 text-[10.5px] font-black">
                                  <TrendingDown className="h-3.5 w-3.5" />
                                  <span>Down</span>
                                </span>
                              )}
                              {student.trend === 'Stable' && (
                                <span className="inline-flex items-center gap-0.5 text-slate-400 text-[10.5px] font-extrabold">
                                  <Minus className="h-3.5 w-3.5" />
                                  <span>Stable</span>
                                </span>
                              )}
                            </td>

                            <td className="py-2 px-3 text-slate-600 text-[10.5px] truncate max-w-[200px]">
                              {student.reasons[0]}
                            </td>

                            <td className="py-2 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {onOpenHistory && (
                                  <button
                                    onClick={() => onOpenHistory(student)}
                                    className="h-6 w-6 rounded-md border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
                                    title="View Student Attendance History"
                                  >
                                    <History className="h-3 w-3" />
                                  </button>
                                )}

                                {onOpenProfile && (
                                  <button
                                    onClick={() => onOpenProfile(student)}
                                    className="h-6 w-6 rounded-md border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
                                    title="Open Student Profile"
                                  >
                                    <User className="h-3 w-3" />
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
    </div>
  )
}
