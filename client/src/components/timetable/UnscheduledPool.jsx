import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, GripVertical, CheckCircle2, Cpu, Plus, Sparkles, Layers } from 'lucide-react'
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
  onDragStartSubject,
  onAutoScheduleRemaining,
  onOpenSubjectPlanner
}) {
  // Calculate scheduled vs required for each subject in current class
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

  // Generate progress bar string: e.g. 4/6 -> ████░░
  const renderProgressBar = (scheduled, required) => {
    const filled = Math.min(required, scheduled)
    const empty = Math.max(0, required - filled)
    return '█'.repeat(filled) + '░'.repeat(empty)
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4 select-none text-left flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-brand-blue-600" />
            <h3 className="text-sm font-black text-slate-800 tracking-tight">Available Class Pool</h3>
          </div>
          <p className="text-[11px] font-bold text-slate-400 mt-0.5">Drag pre-configured subjects onto the grid</p>
        </div>

        <button
          onClick={onAutoScheduleRemaining}
          disabled={totalRemaining === 0}
          className="h-8 px-3 rounded-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-[11px] font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-40"
          title="Automatically place remaining lectures into open slots"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Auto-Fill ({totalRemaining})</span>
        </button>
      </div>

      {/* Progress Cards Banner */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3.5 flex items-center justify-between text-xs font-bold text-slate-700">
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Class Progress</span>
          <span className="text-base font-black text-slate-850">{totalScheduled} / {totalRequired} <span className="text-xs font-bold text-slate-400">Scheduled</span></span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Remaining</span>
          <span className={cn("text-base font-black", totalRemaining > 0 ? "text-brand-orange-500" : "text-emerald-600")}>
            {totalRemaining} {totalRemaining === 0 ? '✓ Complete' : 'Lectures'}
          </span>
        </div>
      </div>

      {/* Draggable Subjects List */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1 flex-1">
        {classSubjects.length === 0 ? (
          <div className="py-8 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-2xl">
            No subjects configured for {currentClass}.
            <button
              onClick={onOpenSubjectPlanner}
              className="mt-2 block mx-auto text-brand-blue-600 font-black hover:underline cursor-pointer"
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
                  "p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between group relative overflow-hidden",
                  sub.isCompleted
                    ? "bg-slate-50 border-slate-200/60 opacity-60 cursor-not-allowed"
                    : "bg-white border-slate-200/80 hover:border-brand-blue-400 hover:shadow-md cursor-grab active:cursor-grabbing"
                )}
                style={{
                  backgroundColor: sub.isCompleted ? '#f8fafc' : `${subColor}0D`
                }}
              >
                {/* Accent Tag */}
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-md" style={{ backgroundColor: subColor }} />

                <div className="pl-2 flex items-center gap-3 min-w-0 flex-1">
                  <GripVertical className={cn("h-4 w-4 shrink-0 transition-colors", sub.isCompleted ? "text-slate-300" : "text-slate-400 group-hover:text-slate-600")} />
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800 truncate">{sub.name}</span>
                      {isLab && (
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-black rounded-md shrink-0">
                          {sub.consecutivePeriods || 2}P Lab
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 mt-0.5">
                      <span className="truncate">
                        {sub.assignedTeacher ? `${sub.assignedTeacher.firstName || ''} ${sub.assignedTeacher.lastName || ''}`.trim() : 'Unassigned'}
                      </span>
                      {sub.preferredRoom && (
                        <span className="shrink-0 uppercase font-black text-slate-400">• {sub.preferredRoom}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="text-right shrink-0 pl-2">
                  <div className="font-mono text-[10px] font-bold tracking-tighter text-slate-400 block">
                    {renderProgressBar(sub.scheduledCount, sub.requiredCount)}
                  </div>
                  <span className={cn("text-[10px] font-black block mt-0.5", sub.isCompleted ? "text-emerald-600" : "text-slate-700")}>
                    {sub.remainingCount} {sub.isCompleted ? '✓ Done' : 'Remaining'}
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
