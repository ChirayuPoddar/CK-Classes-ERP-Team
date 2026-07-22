import React from 'react'
import { LayoutList, LayoutGrid, Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

export default function AttendanceViewSwitcher({ activeView, onChange }) {
  const views = [
    { id: 'table', label: 'Table', icon: LayoutList },
    { id: 'cards', label: 'Cards', icon: LayoutGrid },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon }
  ]

  return (
    <div className="bg-slate-100/90 p-0.5 rounded-full border border-slate-200/80 flex items-center shrink-0 select-none">
      {views.map((v) => {
        const Icon = v.icon
        const isActive = activeView === v.id
        return (
          <button
            key={v.id}
            onClick={() => onChange(v.id)}
            className={cn(
              "h-7 px-3 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer",
              isActive
                ? "bg-white text-slate-850 shadow-xs border border-slate-200/60"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
            )}
            title={`${v.label} View`}
          >
            <Icon className={cn("h-3.5 w-3.5", isActive ? "text-brand-blue-600" : "text-slate-400")} />
            <span className="hidden sm:inline">{v.label}</span>
          </button>
        )
      })}
    </div>
  )
}
