import React from 'react'
import { cn } from '@/utils/cn'
import { Edit3, Trash2 } from 'lucide-react'

// Subject color palette fallback
const getSubjectColor = (subjectName) => {
  const name = (subjectName || '').toLowerCase()
  if (name.includes('physics')) return '#3b82f6' // Blue
  if (name.includes('chemistry')) return '#10b981' // Green
  if (name.includes('math') || name.includes('algebra') || name.includes('calculus') || name.includes('mathematics')) return '#8b5cf6' // Purple
  if (name.includes('english')) return '#f97316' // Orange
  if (name.includes('computer') || name.includes('programming') || name.includes('it')) return '#06b6d4' // Cyan
  if (name.includes('commerce') || name.includes('accounts') || name.includes('business')) return '#f59e0b' // Amber
  if (name.includes('biology')) return '#14b8a6' // Teal
  return '#64748b' // Slate
}

export function TimetableCell({
  slot,
  isFilteredOut,
  onClick,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isSelected,
  hoverState = null,
  showTeacherView = false,
  showRoomView = false,
  showSubjectView = false
}) {
  const isHovered = hoverState?.isHovered
  const isValid = hoverState?.isValid
  const reason = hoverState?.reason

  if (!slot) {
    return (
      <div
        onClick={onClick}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "h-[64px] max-h-[64px] w-full border border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-200 group select-none py-2 px-3.5 overflow-hidden relative",
          onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-sm" : "cursor-default",
          isFilteredOut && "opacity-25 pointer-events-none",
          isSelected && "border-blue-600 bg-blue-50/90 ring-2 ring-blue-400",
          !isHovered && "border-slate-300 bg-slate-50/55 hover:border-blue-500 hover:bg-blue-50/65",
          isHovered && isValid && "border-2 border-emerald-500 bg-emerald-50/90 shadow-md ring-2 ring-emerald-300",
          isHovered && !isValid && "border-2 border-rose-500 bg-rose-50/90 ring-2 ring-rose-300"
        )}
      >
        {isHovered ? (
          <div className="flex flex-col items-center justify-center p-1 text-center">
            {isValid ? (
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                ✓ Valid Slot
              </span>
            ) : (
              <span className="text-[9px] font-black text-rose-700 leading-tight block truncate max-w-[200px]" title={reason}>
                🚫 {reason || 'Invalid'}
              </span>
            )}
          </div>
        ) : onClick ? (
          <>
            <span className="text-[12px] font-medium text-slate-400 group-hover:text-blue-550 leading-none transition-colors mb-0.5">+</span>
            <span className="text-[11px] font-medium tracking-[0.08em] text-slate-400 uppercase group-hover:text-blue-600 transition-colors">Schedule</span>
          </>
        ) : (
          <span className="text-[9px] font-bold text-slate-350">—</span>
        )}
      </div>
    )
  }

  const subColor = slot.subject?.color || getSubjectColor(slot.subject?.name)

  // Specialized view mode cards
  if (showTeacherView || showRoomView || showSubjectView) {
    return (
      <div
        draggable={true}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "group relative rounded-xl p-3 h-[64px] max-h-[64px] w-full flex flex-col justify-center text-left shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-200 select-none overflow-hidden cursor-grab active:cursor-grabbing hover:shadow-md hover:scale-[1.01]",
          isSelected && "ring-2 ring-blue-500",
          isHovered && isValid && "ring-4 ring-indigo-400 bg-indigo-50/90",
          isHovered && !isValid && "ring-4 ring-rose-400 bg-rose-50/90"
        )}
        style={{ backgroundColor: isHovered ? undefined : `${subColor}15` }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-md" style={{ backgroundColor: subColor }} />
        <div className="pl-1.5 space-y-1">
          <span className="text-[11px] font-black text-slate-800 truncate leading-none block uppercase">
            {showTeacherView ? slot.class : showRoomView ? slot.class : `${slot.class} • ${slot.teacher ? `${slot.teacher.firstName || ''}` : 'Unassigned'}`}
          </span>
          <span className="text-[8.5px] font-bold text-slate-500 truncate leading-none block">
            {showTeacherView ? (slot.room || 'No Room') : showRoomView ? (slot.subject?.name || 'Subject') : (slot.room || 'No Room')}
          </span>
        </div>
      </div>
    )
  }

  // Standard Class view cell
  return (
    <div
      draggable={true}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      className={cn(
        "group relative rounded-xl p-3 h-[64px] max-h-[64px] w-full flex flex-col justify-between text-left shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-200 select-none cursor-grab active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-md hover:border-blue-400",
        isSelected && "ring-2 ring-blue-500 bg-blue-100/50",
        isHovered && isValid && "border-2 border-indigo-500 bg-indigo-50/95 ring-2 ring-indigo-300 shadow-md",
        isHovered && !isValid && "border-2 border-rose-500 bg-rose-50/95 ring-2 ring-rose-300 shadow-md"
      )}
      style={{ backgroundColor: isHovered ? undefined : `${subColor}15` }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-md" style={{ backgroundColor: subColor }} />

      {isHovered ? (
        <div className="pl-1.5 flex flex-col justify-center h-full">
          {isValid ? (
            <span className="text-[11px] font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1">
              🔄 Swap / Overwrite
            </span>
          ) : (
            <span className="text-[9px] font-black text-rose-700 leading-tight block truncate" title={reason}>
              🚫 {reason || 'Invalid'}
            </span>
          )}
        </div>
      ) : (
        <div className="pl-1.5 flex flex-col justify-between h-full py-0.5">
          <span className="text-[13px] font-semibold text-slate-800 leading-none block tracking-tight whitespace-nowrap">
            {slot.subject?.name || 'Subject'}
          </span>

          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 leading-none mt-1 whitespace-nowrap">
            <span className="pr-2">
              {slot.teacher ? `${slot.teacher.firstName || ''} ${slot.teacher.lastName || ''}`.trim() : 'Unassigned'}
            </span>
            <span className="shrink-0 uppercase font-bold text-slate-600">
              {slot.room || 'No Room'}
            </span>
          </div>
        </div>
      )}

      {onClick && !isHovered && (
        <div className="absolute right-2.5 bottom-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
          <Edit3 className="h-3 w-3 text-blue-500 hover:text-blue-600 shrink-0" />
        </div>
      )}
    </div>
  )
}

const getId = (val) => {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (val._id) return String(val._id)
  return String(val)
}

export default function TimetableGrid({
  periods = [],
  days = [],
  slots = [],
  dayFilter = '',
  loading = false,
  onCellClick,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  selectedSlotIds = [],
  viewMode = 'class',
  hoverCell = null,
  onDeletePeriod
}) {
  const safePeriods = (periods || []).filter(p => p && (p.type === 'period' || p.type === 'break' || p.type === 'lunch' || p.type === 'short_break'))
  const safeDays = days || []
  const safeSlots = slots || []
  const safeSelectedIds = selectedSlotIds || []

  return (
    <div className="overflow-y-auto overflow-x-auto custom-scrollbar flex-grow min-h-0 pr-1 h-full flex flex-col">
      <table className="w-full text-left min-w-[1810px] border-collapse flex flex-col h-full">
        <thead className="bg-slate-50/55 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest select-none block shrink-0">
          <tr className="flex w-full items-center h-14">
            <th className="pl-7 text-left flex items-center shrink-0 border-r border-slate-100 h-full sticky left-0 z-30 bg-slate-50" style={{ width: '130px' }}>
              Time / Period
            </th>
            {safeDays.map(day => {
              const isFilteredOut = dayFilter && dayFilter !== day
              return (
                <th
                  key={day}
                  className={cn(
                    "text-center flex-1 min-w-[230px] flex items-center justify-center border-r border-slate-100 tracking-widest font-black h-full",
                    isFilteredOut && "opacity-30"
                  )}
                >
                  {day}
                </th>
              )
            })}
            <th className="text-center flex items-center justify-center shrink-0 print:hidden h-full" style={{ width: '70px' }}>
              Action
            </th>
          </tr>
        </thead>

        <tbody className="divide-y-0 flex flex-col flex-1 min-h-0">
          {loading ? (
            <tr className="h-full flex items-center justify-center">
              <td className="text-center text-xs font-bold text-slate-400">Loading grid...</td>
            </tr>
          ) : safePeriods.length === 0 ? (
            <tr className="h-full flex items-center justify-center">
              <td className="text-center text-xs font-black text-slate-400">No periods available.</td>
            </tr>
          ) : (
            safePeriods.map((periodObj) => {
              const isBreak = periodObj.type === 'lunch' || periodObj.type === 'short_break' || periodObj.type === 'break'

              return (
                <tr
                  key={periodObj._id}
                  className={cn(
                    "flex w-full items-stretch flex-1 min-h-[72px] transition-all duration-300 group",
                    isBreak ? "bg-amber-50/30" : "hover:bg-slate-50/10"
                  )}
                >
                  {/* Period Sticky Label */}
                  <td className="pl-7 font-extrabold text-slate-800 bg-white group-hover:bg-slate-50 border-r border-slate-200/80 text-left select-none pr-4 shrink-0 flex flex-col justify-center overflow-hidden h-full sticky left-0 z-10 transition-colors duration-200" style={{ width: '130px' }}>
                    <div className="text-[13px] font-semibold tracking-tight text-brand-blue-700 leading-none flex items-center gap-1.5">
                      <span>{periodObj.name}</span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 mt-2.5 flex items-center gap-1.5 leading-none">
                      <span className="text-[11px] font-medium text-slate-400">🕓</span>
                      <span className="whitespace-nowrap">{periodObj.startTime} – {periodObj.endTime}</span>
                    </div>
                  </td>

                  {/* Day Cells */}
                  {safeDays.map((day) => {
                    const isFilteredOut = dayFilter && dayFilter !== day
                    const targetPeriodId = getId(periodObj)
                    const slot = safeSlots.find(s => s && s.day === day && getId(s.period) === targetPeriodId)
                    const isSelected = slot && safeSelectedIds.some(id => getId(id) === getId(slot))

                    const cellHover = hoverCell?.day === day && getId(hoverCell?.periodId) === targetPeriodId
                      ? { isHovered: true, isValid: hoverCell.isValid, reason: hoverCell.reason, isOccupied: hoverCell.isOccupied }
                      : null

                    return (
                      <td
                        key={day}
                        onDragOver={(e) => {
                          console.log("GRID dragOver")
                          if (!isFilteredOut && onDragOver) onDragOver(e, day, periodObj, slot)
                        }}
                        onDragLeave={(e) => {
                          if (!isFilteredOut && onDragLeave) onDragLeave(e)
                        }}
                        onDrop={(e) => {
                          console.log("GRID drop")
                          if (!isFilteredOut && onDrop) onDrop(e, day, periodObj, slot)
                        }}
                        className={cn(
                          "flex-1 min-w-[230px] px-2 border-r border-slate-100 text-center relative transition-all overflow-hidden flex flex-col justify-center h-full",
                          isFilteredOut ? "opacity-20 cursor-not-allowed pointer-events-none" : "hover:bg-slate-50/50"
                        )}
                      >
                        <TimetableCell
                          slot={slot}
                          isFilteredOut={isFilteredOut}
                          isSelected={isSelected}
                          hoverState={cellHover}
                          onClick={() => !isFilteredOut && onCellClick && onCellClick(day, periodObj, slot)}
                          onDragStart={(e) => {
                            console.log("GRID dragStart")
                            if (slot && onDragStart) onDragStart(e, slot)
                          }}
                          onDragOver={(e) => {
                            console.log("GRID dragOver (cell)")
                            if (!isFilteredOut && onDragOver) onDragOver(e, day, periodObj, slot)
                          }}
                          onDragLeave={(e) => {
                            if (!isFilteredOut && onDragLeave) onDragLeave(e)
                          }}
                          onDrop={(e) => {
                            console.log("GRID drop (cell)")
                            if (!isFilteredOut && onDrop) onDrop(e, day, periodObj, slot)
                          }}
                          showTeacherView={viewMode === 'teacher'}
                          showRoomView={viewMode === 'room'}
                          showSubjectView={viewMode === 'subject'}
                        />
                      </td>
                    )
                  })}

                  {/* Delete Period Action */}
                  <td className="w-[70px] shrink-0 text-center flex items-center justify-center overflow-hidden print:hidden h-full">
                    {onDeletePeriod && (
                      <button
                        onClick={() => onDeletePeriod(periodObj)}
                        className="h-8 w-8 rounded-full hover:bg-red-50 text-red-500 flex items-center justify-center transition-all cursor-pointer mx-auto"
                        title={`Delete ${periodObj.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
