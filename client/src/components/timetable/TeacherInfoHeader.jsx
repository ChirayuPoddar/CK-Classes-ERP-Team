import React from 'react'
import { User, BookOpen, Clock, Calendar, CheckCircle2, AlertTriangle, Layers, X, ShieldAlert } from 'lucide-react'
import SearchableSelect from '@/components/common/SearchableSelect'
import { cn } from '@/utils/cn'

const getId = (val) => {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (val._id) return String(val._id)
  return String(val)
}

export default function TeacherInfoHeader({
  teachers = [],
  subjects = [],
  timetableSlots = [],
  periods = [],
  selectedTeacherIds = [],
  activeTeacherId = '',
  onSelectTeacher,
  onRemoveTeacher,
  onSetActiveTeacher
}) {
  // Build searchable options for all teachers
  const teacherOptions = teachers.map(t => {
    const fullName = `${t.firstName || ''} ${t.lastName || ''}`.trim()
    const tId = t.teacherId || t._id
    const dept = t.department || 'General'
    
    // Find assigned subjects for this teacher
    const assignedSubs = subjects.filter(s => getId(s.assignedTeacher) === getId(t)).map(s => s.name).join(', ')

    return {
      value: t._id,
      label: `${fullName} (${tId})`,
      searchText: `${fullName} ${tId} ${dept} ${assignedSubs} ${t.email || ''}`
    }
  })

  // Current active teacher object
  const activeTeacher = teachers.find(t => getId(t) === getId(activeTeacherId)) || teachers[0]
  const currentTId = getId(activeTeacher)

  // Calculations for active teacher
  const teacherSlots = timetableSlots.filter(s => s.teacher && getId(s.teacher) === currentTId)
  const teacherAssignedSubjects = subjects.filter(s => getId(s.assignedTeacher) === currentTId)
  
  // Weekly load
  const weeklyLoad = teacherSlots.length
  const maxWeeklyTarget = 24

  // Today's classes (Monday default or current day)
  const todayDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()] || 'Monday'
  const todayClasses = teacherSlots.filter(s => s.day === todayDay).length

  // Free periods count
  const activePeriodsCount = periods.filter(p => p.type === 'period').length
  const todayFreePeriods = Math.max(0, activePeriodsCount - todayClasses)

  // Conflicts check for this teacher across slots
  const conflicts = teacherSlots.filter((slot, idx) => {
    return teacherSlots.some((other, oIdx) => 
      idx !== oIdx && slot.day === other.day && getId(slot.period) === getId(other.period)
    )
  })

  const renderTeacherOption = (opt, isSelected) => (
    <div className={cn(
      "px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors",
      isSelected ? "bg-blue-50 text-brand-blue-700 font-bold" : "hover:bg-slate-50 text-slate-700"
    )}>
      <div className="flex items-center gap-2">
        <User className="h-3.5 w-3.5 text-blue-500" />
        <span>{opt.label}</span>
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3 select-none text-left print:hidden">
      {/* 1. Top Bar: Search & Selected Teacher Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-brand-blue-600" />
            <span>Select Teacher:</span>
          </span>

          <SearchableSelect
            placeholder="Search teacher by name, ID, subject..."
            value=""
            onChange={(val) => {
              if (val) onSelectTeacher(val)
            }}
            options={teacherOptions}
            renderOption={renderTeacherOption}
            className="w-72"
          />

          {/* Selected Teacher Tabs / Chips for Multi-Teacher Compare */}
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {selectedTeacherIds.map(tId => {
              const tObj = teachers.find(t => getId(t) === getId(tId))
              if (!tObj) return null
              const name = `${tObj.firstName || ''} ${tObj.lastName || ''}`.trim()
              const isActive = getId(tId) === currentTId

              return (
                <div
                  key={tId}
                  onClick={() => onSetActiveTeacher(tId)}
                  className={cn(
                    "h-8 px-3 rounded-full text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all border",
                    isActive
                      ? "bg-brand-blue-600 border-brand-blue-600 text-white shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                  )}
                >
                  <span className="truncate max-w-[130px]">{name}</span>
                  {selectedTeacherIds.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveTeacher(tId)
                      }}
                      className={cn("hover:opacity-80 rounded-full p-0.5", isActive ? "text-white/80 hover:text-white" : "text-slate-400 hover:text-slate-700")}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* View Mode Tag */}
        {selectedTeacherIds.length > 1 && (
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            Compare Mode ({selectedTeacherIds.length} Selected)
          </span>
        )}
      </div>

      {/* 2. Teacher Information Banner */}
      {activeTeacher && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50/70 border border-slate-200/60 rounded-xl p-3.5">
          {/* Info Column 1: Teacher Profile */}
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Instructor Profile</span>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-slate-800 leading-tight">
                {`${activeTeacher.firstName || ''} ${activeTeacher.lastName || ''}`.trim()}
              </h4>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">
                {activeTeacher.teacherId || 'T001'}
              </span>
            </div>
            <span className="text-[10.5px] font-extrabold text-slate-500 block truncate">
              Dept: {activeTeacher.department || 'General Faculty'}
            </span>
          </div>

          {/* Info Column 2: Subjects Taught */}
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Subjects Taught</span>
            <div className="flex flex-wrap gap-1">
              {teacherAssignedSubjects.length > 0 ? (
                teacherAssignedSubjects.map(sub => (
                  <span key={sub._id} className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                    {sub.name}
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-slate-400 italic">No assigned subjects</span>
              )}
            </div>
          </div>

          {/* Info Column 3: Workload Stats */}
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Teaching Load</span>
            <div className="flex items-center gap-3">
              <div>
                <span className="text-base font-black text-brand-blue-700 leading-none">{weeklyLoad} / {maxWeeklyTarget}</span>
                <span className="text-[9px] font-extrabold text-slate-400 block mt-0.5 uppercase">Weekly Hours</span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-base font-black text-slate-800 leading-none">{todayClasses}</span>
                <span className="text-[9px] font-extrabold text-slate-400 block mt-0.5 uppercase">Today's Lectures</span>
              </div>
            </div>
          </div>

          {/* Info Column 4: Free Periods & Conflicts */}
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Status & Availability</span>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>{todayFreePeriods} Free Periods</span>
              </span>

              {conflicts.length > 0 ? (
                <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" />
                  <span>{conflicts.length} Conflict</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black">
                  ✓ Clear Schedule
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
