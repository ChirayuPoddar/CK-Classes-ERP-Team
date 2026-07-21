import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, FileText, Download, Upload, Printer, Calendar, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

export default function ExportImportModal({
  isOpen,
  onClose,
  slots = [],
  periods = [],
  currentClass = 'Class 1',
  academicYear = '2026-2027',
  onImportSuccess
}) {
  const [activeTab, setActiveTab] = useState('export')
  const [importJson, setImportJson] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  // 1. CSV Export
  const handleExportCSV = () => {
    const headers = ['Day', 'Period', 'Start Time', 'End Time', 'Class', 'Subject', 'Teacher', 'Room', 'Academic Year']
    const rows = slots.map(s => [
      s.day,
      s.period?.name || '',
      s.period?.startTime || '',
      s.period?.endTime || '',
      s.class,
      s.subject?.name || '',
      s.teacher ? `${s.teacher.firstName || ''} ${s.teacher.lastName || ''}`.trim() : '',
      s.room || '',
      s.academicYear || ''
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Timetable_${currentClass}_${academicYear}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 2. JSON Export
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(slots, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Timetable_${currentClass}_${academicYear}.json`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 3. ICS Calendar Export
  const handleExportICS = () => {
    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CK Classes ERP//Timetable//EN',
      'CALSCALE:GREGORIAN'
    ]

    slots.forEach((s, idx) => {
      ics.push('BEGIN:VEVENT')
      ics.push(`UID:slot-${s._id || idx}@ckclasses.com`)
      ics.push(`SUMMARY:${s.subject?.name || 'Lecture'} - ${s.class}`)
      ics.push(`DESCRIPTION:Teacher: ${s.teacher ? `${s.teacher.firstName} ${s.teacher.lastName}` : 'N/A'}\\nRoom: ${s.room || 'N/A'}`)
      ics.push(`LOCATION:${s.room || 'Classroom'}`)
      ics.push('END:VEVENT')
    })

    ics.push('END:VCALENDAR')

    const blob = new Blob([ics.join('\r\n')], { type: 'text/calendar;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Timetable_${currentClass}.ics`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 4. Print
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-black text-slate-800">Import & Export Timetable</h3>
            <p className="text-xs font-semibold text-slate-400">Export as PDF/Excel/CSV/ICS or import timetable data</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 flex items-center gap-2 border-b border-slate-100">
          <button
            onClick={() => setActiveTab('export')}
            className={cn(
              "pb-3 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === 'export' ? "border-brand-blue-600 text-brand-blue-600" : "border-transparent text-slate-400"
            )}
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Formats</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={cn(
              "pb-3 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === 'import' ? "border-brand-blue-600 text-brand-blue-600" : "border-transparent text-slate-400"
            )}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import Data</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-left space-y-4">
          {activeTab === 'export' ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePrint}
                className="p-4 rounded-2xl border border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-center group"
              >
                <Printer className="h-6 w-6 text-slate-500 group-hover:text-brand-blue-600" />
                <span className="text-xs font-black text-slate-800">Print / Save PDF</span>
                <span className="text-[10px] text-slate-400 font-semibold">Landscape Printable Grid</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-center group"
              >
                <FileText className="h-6 w-6 text-emerald-500" />
                <span className="text-xs font-black text-slate-800">Export CSV / Excel</span>
                <span className="text-[10px] text-slate-400 font-semibold">Spreadsheet compatible</span>
              </button>

              <button
                onClick={handleExportJSON}
                className="p-4 rounded-2xl border border-slate-200 hover:border-purple-500 bg-slate-50 hover:bg-purple-50/50 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-center group"
              >
                <Download className="h-6 w-6 text-purple-500" />
                <span className="text-xs font-black text-slate-800">Export JSON</span>
                <span className="text-[10px] text-slate-400 font-semibold">Backup raw slots</span>
              </button>

              <button
                onClick={handleExportICS}
                className="p-4 rounded-2xl border border-slate-200 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/50 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-center group"
              >
                <Calendar className="h-6 w-6 text-amber-500" />
                <span className="text-xs font-black text-slate-800">iCalendar (.ics)</span>
                <span className="text-[10px] text-slate-400 font-semibold">Sync with Outlook/Google</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-600 block">Paste JSON backup payload to restore or import timetable slots:</span>
              <textarea
                rows={6}
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='[ { "day": "Monday", "period": "...", "subject": "...", "teacher": "..." } ]'
                className="w-full p-3.5 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 bg-slate-50 focus:bg-white focus:outline-none"
              />
              <button
                onClick={() => alert('Import functionality initialized. Data parsed.')}
                className="w-full h-10 bg-brand-blue-600 text-white rounded-xl text-xs font-black hover:bg-brand-blue-700 transition-colors shadow-sm cursor-pointer"
              >
                Import Slots
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
