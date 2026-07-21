import React, { useState, useRef, useEffect } from 'react'
import { Filter, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/utils/cn'

export default function TimetableFilters({
  filters,
  onFilterChange,
  onResetFilters,
  classes = [],
  teachers = [],
  subjects = [],
  rooms = []
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [contentHeight, setContentHeight] = useState(0)
  const contentRef = useRef(null)

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const academicYears = ['2026-2027', '2027-2028']
  const sections = ['All Sections', 'Section A', 'Section B', 'Section C']
  const semesters = ['All Semesters', 'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4']
  const departments = ['All Departments', 'Science', 'Commerce', 'Arts', 'Mathematics', 'Computer Science']

  const activeCount = Object.values(filters).filter(v => v && v !== '' && !v.startsWith('All')).length

  // Measure content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [isExpanded, filters])

  const selectClass = "h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:bg-white focus:border-brand-blue-500 focus:outline-none cursor-pointer transition-colors"

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm transition-all select-none overflow-hidden">
      {/* Collapsed Header Bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-brand-blue-600" />
          <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Filters</span>
          {activeCount > 0 && (
            <span className="h-4.5 px-1.5 rounded-full bg-brand-blue-50 text-brand-blue-600 border border-brand-blue-200 text-[9px] font-black flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span
              onClick={(e) => { e.stopPropagation(); onResetFilters(); }}
              className="text-[10px] font-bold text-slate-400 hover:text-red-500 flex items-center gap-0.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-2.5 w-2.5" />
              <span>Reset</span>
            </span>
          )}
          <ChevronDown className={cn(
            "h-3.5 w-3.5 text-slate-400 transition-transform duration-300",
            isExpanded && "rotate-180"
          )} />
        </div>
      </button>

      {/* Animated Expandable Content */}
      <div
        className="transition-all duration-300 ease-in-out overflow-hidden"
        style={{ maxHeight: isExpanded ? `${contentHeight + 20}px` : '0px', opacity: isExpanded ? 1 : 0 }}
      >
        <div ref={contentRef} className="px-4 pb-3 space-y-2.5">
          {/* Primary Filter Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            <select
              value={filters.class || ''}
              onChange={(e) => onFilterChange('class', e.target.value)}
              className={selectClass}
            >
              <option value="">All Classes</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={filters.teacher || ''}
              onChange={(e) => onFilterChange('teacher', e.target.value)}
              className={selectClass}
            >
              <option value="">All Teachers</option>
              {teachers.map(t => (
                <option key={t._id} value={t._id}>
                  {`${t.firstName || ''} ${t.lastName || ''}`.trim()}
                </option>
              ))}
            </select>

            <select
              value={filters.subject || ''}
              onChange={(e) => onFilterChange('subject', e.target.value)}
              className={selectClass}
            >
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>

            <select
              value={filters.day || ''}
              onChange={(e) => onFilterChange('day', e.target.value)}
              className={selectClass}
            >
              <option value="">All Days</option>
              {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <select
              value={filters.academicYear || '2026-2027'}
              onChange={(e) => onFilterChange('academicYear', e.target.value)}
              className={selectClass}
            >
              {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <select
              value={filters.room || ''}
              onChange={(e) => onFilterChange('room', e.target.value)}
              className={selectClass}
            >
              <option value="">All Rooms</option>
              {rooms.map(r => <option key={r._id || r.name} value={r.name}>{r.name}</option>)}
            </select>
          </div>

          {/* Extended Filters Row */}
          <div className="pt-1.5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            <select
              value={filters.section || ''}
              onChange={(e) => onFilterChange('section', e.target.value)}
              className={selectClass}
            >
              {sections.map(s => <option key={s} value={s === 'All Sections' ? '' : s}>{s}</option>)}
            </select>

            <select
              value={filters.semester || ''}
              onChange={(e) => onFilterChange('semester', e.target.value)}
              className={selectClass}
            >
              {semesters.map(s => <option key={s} value={s === 'All Semesters' ? '' : s}>{s}</option>)}
            </select>

            <select
              value={filters.department || ''}
              onChange={(e) => onFilterChange('department', e.target.value)}
              className={selectClass}
            >
              {departments.map(d => <option key={d} value={d === 'All Departments' ? '' : d}>{d}</option>)}
            </select>

            <input
              type="text"
              placeholder="Building..."
              value={filters.building || ''}
              onChange={(e) => onFilterChange('building', e.target.value)}
              className="h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:bg-white focus:border-brand-blue-500 focus:outline-none placeholder-slate-400"
            />

            <input
              type="text"
              placeholder="Floor..."
              value={filters.floor || ''}
              onChange={(e) => onFilterChange('floor', e.target.value)}
              className="h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:bg-white focus:border-brand-blue-500 focus:outline-none placeholder-slate-400"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
