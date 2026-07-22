import React from 'react'
import { Layers, Sparkles, GripVertical } from 'lucide-react'
import { cn } from '@/utils/cn'

const getId = (val) => {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (val._id) return String(val._id)
  return String(val)
}

export default function UnscheduledPool({
  subjects = [],
  timetableSlots = [],
  currentClass = 'Class 1',
  onClassChange,
  classes = [],
  onDragStartSubject,
  onAutoScheduleRemaining,
  onOpenSubjectPlanner
}) {
  // Filter subjects for current class
  const classSubjects = subjects.filter(s => s.class === currentClass)

  const subjectStats = classSubjects.map(sub => {
    const scheduledCount = timetableSlots.filter(
      s => s.class === currentClass && getId(s.subject) === getId(sub)
    ).length
    const requiredCount = sub.periodsPerWeek || 4
    const remainingCount = Math.max(0, requiredCount - scheduledCount)
    const isCompleted = remainingCount === 0

    return {
      ...sub,
      scheduledCount,
      requiredCount,
      remainingCount,
      isCompleted
    }
  })

  const totalRequired = subjectStats.reduce((acc, s) => acc + s.requiredCount, 0)
  const totalScheduled = subjectStats.reduce((acc, s) => acc + s.scheduledCount, 0)
  const totalRemaining = Math.max(0, totalRequired - totalScheduled)

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm select-none text-left flex flex-col gap-2.5 w-full print:hidden">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-brand-blue-600 shrink-0" />
            <h3 className="text-xs font-black text-slate-800 tracking-tight">Available Class Pool</h3>
          </div>

          {/* Class Selector Dropdown */}
          <select
            value={currentClass}
            onChange={(e) => onClassChange && onClassChange(e.target.value)}
            className="h-8 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-brand-blue-500 focus:outline-none cursor-pointer transition-colors"
          >
            {classes.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Scheduled Progress Badge */}
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            <span>{totalScheduled}/{totalRequired} Scheduled</span>
            {totalRemaining > 0 ? (
              <span className="text-amber-600 font-extrabold">({totalRemaining} left)</span>
            ) : (
              <span className="text-emerald-600 font-extrabold">✓ Done</span>
            )}
          </span>
        </div>

        {/* Auto-Fill Action Button */}
        <button
          onClick={onAutoScheduleRemaining}
          disabled={totalRemaining === 0}
          className="h-7.5 px-3 rounded-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-[11px] font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-40"
          title="Automatically place remaining lectures into open slots"
        >
          <Sparkles className="h-3 w-3" />
          <span>Auto Fill ({totalRemaining})</span>
        </button>
      </div>

      {/* Horizontal Draggable Subjects Row */}
      <div className="flex flex-row items-center gap-2.5 overflow-x-auto custom-scrollbar pb-1.5 w-full">
        {classSubjects.length === 0 ? (
          <div className="py-2 px-4 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-xl w-full flex items-center justify-center gap-2">
            <span>No subjects configured for {currentClass}.</span>
            <button
              onClick={onOpenSubjectPlanner}
              className="text-brand-blue-600 font-black hover:underline cursor-pointer"
            >
              + Configure Class Subjects
            </button>
          </div>
        ) : (
          subjectStats.map(sub => {
            const subColor = sub.color || '#3b82f6'
            const isLab = sub.lectureType === 'Lab' || sub.consecutivePeriods > 1

            return (
              <div
                key={sub._id}
                draggable={!sub.isCompleted}
                onDragStart={(e) => onDragStartSubject(e, sub)}
                className={cn(
                  "min-w-[180px] max-w-[220px] shrink-0 p-2 rounded-xl border transition-all duration-200 flex items-center justify-between group relative overflow-hidden select-none",
                  sub.isCompleted
                    ? "bg-slate-50 border-slate-200/60 opacity-50 cursor-not-allowed"
                    : "bg-white border-slate-200/80 hover:border-brand-blue-400 hover:shadow-md cursor-grab active:cursor-grabbing"
                )}
                style={{
                  backgroundColor: sub.isCompleted ? '#f8fafc' : `${subColor}0D`
                }}
              >
                {/* Left Color Indicator Bar */}
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-md" style={{ backgroundColor: subColor }} />

                <div className="pl-1.5 flex items-center gap-1.5 min-w-0 flex-1">
                  <GripVertical className={cn("h-3.5 w-3.5 shrink-0 transition-colors", sub.isCompleted ? "text-slate-300" : "text-slate-400 group-hover:text-slate-600")} />
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-black text-slate-800 truncate leading-tight">{sub.name}</span>
                      {isLab && (
                        <span className="px-1 py-0.2 bg-purple-100 text-purple-700 text-[8px] font-black rounded shrink-0">
                          Lab
                        </span>
                      )}
                    </div>

                    <div className="text-[9px] font-bold text-slate-500 truncate leading-tight mt-0.5">
                      {sub.assignedTeacher ? `${sub.assignedTeacher.firstName || ''} ${sub.assignedTeacher.lastName || ''}`.trim() : 'Unassigned'}
                    </div>
                  </div>
                </div>

                {/* Remaining Counter */}
                <div className="text-right shrink-0 pl-1.5">
                  <span className={cn(
                    "text-[10px] font-black px-1.5 py-0.5 rounded-md",
                    sub.isCompleted ? "bg-slate-200/60 text-slate-400" : "bg-white border border-slate-200 text-brand-blue-700 shadow-2xs"
                  )}>
                    {sub.scheduledCount}/{sub.requiredCount}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
