import React from 'react'
import { cn } from '@/utils/cn'
import { Calendar, User, MapPin, BookOpen, GraduationCap, Building2 } from 'lucide-react'

const VIEWS = [
  { id: 'class', label: 'Student Timetable', icon: Calendar },
  { id: 'teacher', label: 'Teacher Timetable', icon: User }
]

export default function TimetableViewTabs({ activeView = 'class', onChange }) {
  return (
    <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60 overflow-x-auto custom-scrollbar select-none">
      {VIEWS.map((v) => {
        const Icon = v.icon
        const isActive = activeView === v.id
        return (
          <button
            key={v.id}
            onClick={() => onChange(v.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap",
              isActive
                ? "bg-white text-brand-blue-600 shadow-sm border border-slate-200/50 scale-[1.02]"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", isActive ? "text-brand-blue-600" : "text-slate-400")} />
            <span>{v.label}</span>
          </button>
        )
      })}
    </div>
  )
}
