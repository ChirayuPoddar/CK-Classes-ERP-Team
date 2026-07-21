import React, { useState } from 'react'
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

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const academicYears = ['2026-2027', '2027-2028']
  const sections = ['All Sections', 'Section A', 'Section B', 'Section C']
  const semesters = ['All Semesters', 'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4']
  const departments = ['All Departments', 'Science', 'Commerce', 'Arts', 'Mathematics', 'Computer Science']

  const activeCount = Object.values(filters).filter(v => v && v !== '' && !v.startsWith('All')).length

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3 transition-all select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-brand-blue-600" />
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Advanced Filters</span>
          {activeCount > 0 && (
            <span className="h-5 px-2 rounded-full bg-brand-blue-50 text-brand-blue-600 border border-brand-blue-200 text-[10px] font-black flex items-center justify-center">
              {activeCount} active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              onClick={onResetFilters}
              className="text-[11px] font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Collapse' : 'Expand Filters'}</span>
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Basic Filter Row (Always Visible) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        <select
          value={filters.class || ''}
          onChange={(e) => onFilterChange('class', e.target.value)}
          className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-brand-blue-500 focus:outline-none cursor-pointer"
        >
          <option value="">All Classes</option>
          {classes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={filters.teacher || ''}
          onChange={(e) => onFilterChange('teacher', e.target.value)}
          className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-brand-blue-500 focus:outline-none cursor-pointer"
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
          className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-brand-blue-500 focus:outline-none cursor-pointer"
        >
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>

        <select
          value={filters.day || ''}
          onChange={(e) => onFilterChange('day', e.target.value)}
          className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-brand-blue-500 focus:outline-none cursor-pointer"
        >
          <option value="">All Days</option>
          {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select
          value={filters.academicYear || '2026-2027'}
          onChange={(e) => onFilterChange('academicYear', e.target.value)}
          className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-brand-blue-500 focus:outline-none cursor-pointer"
        >
          {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <select
          value={filters.room || ''}
          onChange={(e) => onFilterChange('room', e.target.value)}
          className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-brand-blue-500 focus:outline-none cursor-pointer"
        >
          <option value="">All Rooms</option>
          {rooms.map(r => <option key={r._id || r.name} value={r.name}>{r.name}</option>)}
        </select>
      </div>

      {/* Extended Filters Row (Collapsible) */}
      {isExpanded && (
        <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 animate-fadeIn">
          <select
            value={filters.section || ''}
            onChange={(e) => onFilterChange('section', e.target.value)}
            className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-brand-blue-500 focus:outline-none cursor-pointer"
          >
            {sections.map(s => <option key={s} value={s === 'All Sections' ? '' : s}>{s}</option>)}
          </select>

          <select
            value={filters.semester || ''}
            onChange={(e) => onFilterChange('semester', e.target.value)}
            className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-brand-blue-500 focus:outline-none cursor-pointer"
          >
            {semesters.map(s => <option key={s} value={s === 'All Semesters' ? '' : s}>{s}</option>)}
          </select>

          <select
            value={filters.department || ''}
            onChange={(e) => onFilterChange('department', e.target.value)}
            className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-brand-blue-500 focus:outline-none cursor-pointer"
          >
            {departments.map(d => <option key={d} value={d === 'All Departments' ? '' : d}>{d}</option>)}
          </select>

          <input
            type="text"
            placeholder="Filter by Building..."
            value={filters.building || ''}
            onChange={(e) => onFilterChange('building', e.target.value)}
            className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-brand-blue-500 focus:outline-none placeholder-slate-400"
          />

          <input
            type="text"
            placeholder="Filter by Floor..."
            value={filters.floor || ''}
            onChange={(e) => onFilterChange('floor', e.target.value)}
            className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-brand-blue-500 focus:outline-none placeholder-slate-400"
          />
        </div>
      )}
    </div>
  )
}
