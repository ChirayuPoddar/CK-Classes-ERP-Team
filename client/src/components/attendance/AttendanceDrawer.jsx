import React, { useState, useEffect } from 'react'
import {
  X,
  User,
  Check,
  AlertCircle,
  Clock,
  Calendar,
  BookOpen,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  MessageSquare,
  Save,
  Send,
  AlertTriangle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

export default function AttendanceDrawer({
  isOpen,
  onClose,
  selectedSlot,
  modalClass,
  modalDate,
  editSessionId,
  students = [],
  markedRecords = {},
  setMarkedRecords,
  remarks = {},
  setRemarks,
  onSubmit,
  submitting
}) {
  const [studentSearch, setStudentSearch] = useState('')
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false)
  const [initialStateSnapshot, setInitialStateSnapshot] = useState('')

  // Capture snapshot on open to detect unsaved changes
  useEffect(() => {
    if (isOpen) {
      setInitialStateSnapshot(JSON.stringify(markedRecords))
      setStudentSearch('')
    }
  }, [isOpen])

  // Detect if form has dirty unsaved changes
  const isDirty = JSON.stringify(markedRecords) !== initialStateSnapshot && initialStateSnapshot !== ''

  const handleAttemptClose = () => {
    if (isDirty && !submitting) {
      setShowUnsavedConfirm(true)
    } else {
      onClose()
    }
  }

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (showUnsavedConfirm) {
          setShowUnsavedConfirm(false)
        } else {
          handleAttemptClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, showUnsavedConfirm, isDirty, submitting])

  if (!isOpen) return null

  // Quick Action Handlers
  const handleMarkAll = (status) => {
    const next = {}
    students.forEach(st => {
      next[st._id] = status
    })
    setMarkedRecords(next)
  }

  const handleResetAll = () => {
    const next = {}
    students.forEach(st => {
      next[st._id] = 'Present'
    })
    setMarkedRecords(next)
  }

  // Filter students by name/roll
  const filteredStudents = students.filter(st => {
    if (!studentSearch) return true
    const q = studentSearch.toLowerCase()
    const name = `${st.firstName || ''} ${st.lastName || ''}`.toLowerCase()
    const roll = (st.rollNumber || st.studentId || '').toLowerCase()
    return name.includes(q) || roll.includes(q)
  })

  // Live Summary Calculations
  const presentCount = Object.values(markedRecords).filter(s => s === 'Present').length
  const absentCount = Object.values(markedRecords).filter(s => s === 'Absent').length
  const lateCount = Object.values(markedRecords).filter(s => s === 'Late').length
  const leaveCount = Object.values(markedRecords).filter(s => s === 'Leave').length
  const unmarkedCount = students.length - (presentCount + absentCount + lateCount + leaveCount)

  const subjectName = selectedSlot?.subject?.name || selectedSlot?.subject || 'Lecture Session'
  const teacherName = selectedSlot?.teacher
    ? `${selectedSlot.teacher.firstName || ''} ${selectedSlot.teacher.lastName || ''}`.trim()
    : 'Assigned Teacher'
  const periodName = selectedSlot?.period?.name || 'Period'
  const timeString = selectedSlot?.period?.startTime ? `${selectedSlot.period.startTime} - ${selectedSlot.period.endTime || ''}` : 'Scheduled'

  return (
    <div className="fixed inset-0 z-[100] flex justify-end select-none print:hidden">
      {/* Backdrop Dimming */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleAttemptClose}
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-[2px] transition-opacity"
      />

      {/* Right Slide-Over Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 350, damping: 32 }}
        className="relative w-full sm:w-[480px] lg:w-[560px] bg-white h-full shadow-2xl flex flex-col justify-between z-10 border-l border-slate-200"
      >
        {/* 1. DRAWER HEADER */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-brand-blue-700 bg-brand-blue-100/70 px-2.5 py-0.5 rounded-full border border-brand-blue-200 uppercase tracking-wider">
                  {modalClass}
                </span>
                <span className="text-[11px] font-extrabold text-slate-400">
                  {new Date(modalDate).toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' })}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-800 tracking-tight mt-1">
                {subjectName}
              </h3>
              <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2 mt-0.5">
                <span>Teacher: <strong className="text-slate-700">{teacherName}</strong></span>
                <span>•</span>
                <span>{periodName} ({timeString})</span>
              </p>
            </div>

            <button
              onClick={handleAttemptClose}
              className="h-8 w-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
              title="Close Drawer (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 2. LIVE SUMMARY BAR */}
          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-200/60 text-center">
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-1.5">
              <span className="text-[9.5px] font-black uppercase text-emerald-600 block">Present</span>
              <span className="text-sm font-black text-emerald-700">{presentCount}</span>
            </div>
            <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-1.5">
              <span className="text-[9.5px] font-black uppercase text-rose-600 block">Absent</span>
              <span className="text-sm font-black text-rose-700">{absentCount}</span>
            </div>
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-1.5">
              <span className="text-[9.5px] font-black uppercase text-amber-600 block">Late</span>
              <span className="text-sm font-black text-amber-700">{lateCount}</span>
            </div>
            <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-1.5">
              <span className="text-[9.5px] font-black uppercase text-blue-600 block">Leave</span>
              <span className="text-sm font-black text-blue-700">{leaveCount}</span>
            </div>
          </div>
        </div>

        {/* 3. QUICK ACTIONS & SEARCH TOOLBAR */}
        <div className="px-4 py-2.5 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleMarkAll('Present')}
              className="h-7 px-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[10.5px] font-extrabold cursor-pointer transition-colors active:scale-95"
            >
              All Present
            </button>
            <button
              onClick={() => handleMarkAll('Absent')}
              className="h-7 px-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-[10.5px] font-extrabold cursor-pointer transition-colors active:scale-95"
            >
              All Absent
            </button>
            <button
              onClick={handleResetAll}
              className="h-7 px-2.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-650 hover:bg-slate-200 text-[10.5px] font-extrabold cursor-pointer transition-colors active:scale-95"
            >
              Reset
            </button>
          </div>

          <div className="relative w-36 sm:w-44 h-7">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
            <input
              type="text"
              placeholder="Find student..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="h-full w-full pl-7 pr-2.5 bg-slate-50 border border-slate-200 focus:bg-white text-[10.5px] font-semibold rounded-lg focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* 4. SCROLLABLE STUDENT LIST */}
        <div className="p-4 flex-grow overflow-y-auto custom-scrollbar space-y-2 text-left min-h-0">
          {filteredStudents.length === 0 ? (
            <div className="py-16 text-center text-xs font-extrabold text-slate-400">
              No matching students found.
            </div>
          ) : (
            filteredStudents.map((st, idx) => {
              const currentStatus = markedRecords[st._id] || 'Present'
              const studentName = `${st.firstName || ''} ${st.lastName || ''}`.trim()
              const rollNo = st.rollNumber || st.studentId || `Roll #${idx + 1}`

              return (
                <div
                  key={st._id}
                  className="p-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-brand-blue-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                >
                  {/* Student Info */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-extrabold text-xs flex items-center justify-center shrink-0">
                      {st.firstName ? st.firstName[0].toUpperCase() : 'S'}
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-black text-slate-800 truncate leading-tight">
                        {studentName}
                      </h5>
                      <span className="text-[10px] font-bold text-slate-400 block truncate">
                        ID: {rollNo}
                      </span>
                    </div>
                  </div>

                  {/* Status Toggle Pills */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setMarkedRecords(prev => ({ ...prev, [st._id]: 'Present' }))}
                      className={cn(
                        "h-7 px-2.5 rounded-lg text-[10.5px] font-black transition-all cursor-pointer border",
                        currentStatus === 'Present'
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-2xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                      )}
                    >
                      Present
                    </button>

                    <button
                      type="button"
                      onClick={() => setMarkedRecords(prev => ({ ...prev, [st._id]: 'Absent' }))}
                      className={cn(
                        "h-7 px-2.5 rounded-lg text-[10.5px] font-black transition-all cursor-pointer border",
                        currentStatus === 'Absent'
                          ? "bg-rose-600 border-rose-600 text-white shadow-2xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                      )}
                    >
                      Absent
                    </button>

                    <button
                      type="button"
                      onClick={() => setMarkedRecords(prev => ({ ...prev, [st._id]: 'Late' }))}
                      className={cn(
                        "h-7 px-2.5 rounded-lg text-[10.5px] font-black transition-all cursor-pointer border",
                        currentStatus === 'Late'
                          ? "bg-amber-500 border-amber-500 text-white shadow-2xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-700"
                      )}
                    >
                      Late
                    </button>

                    <button
                      type="button"
                      onClick={() => setMarkedRecords(prev => ({ ...prev, [st._id]: 'Leave' }))}
                      className={cn(
                        "h-7 px-2.5 rounded-lg text-[10.5px] font-black transition-all cursor-pointer border",
                        currentStatus === 'Leave'
                          ? "bg-blue-600 border-blue-600 text-white shadow-2xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                      )}
                    >
                      Leave
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* 5. DRAWER FOOTER */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleAttemptClose}
            className="h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              className="h-9 px-5 bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {submitting ? (
                <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>{editSessionId ? 'Update Attendance' : 'Submit Attendance'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* UNSAVED CHANGES CONFIRMATION DIALOG */}
      <AnimatePresence>
        {showUnsavedConfirm && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 max-w-sm w-full shadow-2xl text-left space-y-4"
            >
              <div className="flex items-center gap-3 text-amber-600">
                <AlertTriangle className="h-6 w-6 shrink-0" />
                <h4 className="text-base font-black text-slate-800">Unsaved Changes</h4>
              </div>
              <p className="text-xs font-semibold text-slate-600">
                You have unsaved attendance edits for this class. If you leave now, your changes will be discarded.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUnsavedConfirm(false)}
                  className="h-8 px-3.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Continue Editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUnsavedConfirm(false)
                    onClose()
                  }}
                  className="h-8 px-3.5 rounded-lg bg-rose-600 text-white text-xs font-black hover:bg-rose-700 cursor-pointer"
                >
                  Discard Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
