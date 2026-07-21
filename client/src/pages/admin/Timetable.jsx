import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  AlertCircle, 
  Check, 
  RefreshCw, 
  Calendar,
  FileText,
  Printer,
  Clock,
  Settings,
  X,
  Edit3,
  Trash2,
  MapPin,
  User
} from 'lucide-react'
import api from '@/services/api'
import { cn } from '@/utils/cn'
import DashboardStatCard from '@/components/common/DashboardStatCard'
import SearchableSelect from '@/components/common/SearchableSelect'
import { motion, AnimatePresence } from 'framer-motion'

const spring = { type: 'spring', stiffness: 350, damping: 28 }

const classes = [
  'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11 Science', 'Class 11 Commerce',
  'Class 12 Science', 'Class 12 Commerce'
];

// Expanded to Sunday
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Enforced Subject colors
const getSubjectColor = (subjectName) => {
  const name = (subjectName || '').toLowerCase()
  if (name.includes('physics')) return '#3b82f6' // Blue
  if (name.includes('chemistry')) return '#10b981' // Green
  if (name.includes('math') || name.includes('algebra') || name.includes('calculus') || name.includes('mathematics')) return '#8b5cf6' // Purple
  if (name.includes('english')) return '#f97316' // Orange
  if (name.includes('computer') || name.includes('programming') || name.includes('it')) return '#06b6d4' // Cyan
  if (name.includes('commerce') || name.includes('accounts') || name.includes('business')) return '#f59e0b' // Amber
  if (name.includes('biology')) return '#14b8a6' // Teal
  return '#64748b' // Slate / default
}

// Reusable cell component for scheduled cards & empty cards - redesigned with specs typography & no truncations
function TimetableCell({ slot, isFilteredOut, onClick, showTeacherView = false }) {
  if (!slot) {
    return (
      <div 
        onClick={onClick}
        className={cn(
          "h-[64px] max-h-[64px] w-full border border-dashed border-slate-300 bg-slate-50/55 hover:border-blue-500 hover:bg-blue-50/65 rounded-xl flex flex-col items-center justify-center transition-all duration-300 group select-none py-2 px-3.5 overflow-hidden",
          onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-sm" : "cursor-default",
          isFilteredOut && "opacity-25 pointer-events-none"
        )}
      >
        {onClick ? (
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

  // Teacher Timetable view shows ONLY Class and Room
  if (showTeacherView) {
    return (
      <div 
        className="group relative rounded-xl p-3 h-[64px] max-h-[64px] w-full flex flex-col justify-center text-left shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 select-none overflow-hidden"
        style={{ backgroundColor: `${subColor}15` }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-md" style={{ backgroundColor: subColor }} />
        <div className="pl-1.5 space-y-1">
          <span className="text-[11px] font-black text-slate-855 truncate leading-none block uppercase">
            {slot.class}
          </span>
          <span className="text-[8.5px] font-bold text-slate-455 truncate leading-none block">
            {slot.room || 'No Room'}
          </span>
        </div>
      </div>
    )
  }

  // Main grid cards show Subject (13px Semibold - no truncate), Teacher (11px Medium Slate-500), Room (11px Medium Slate-500)
  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative rounded-xl p-3 h-[64px] max-h-[64px] w-full flex flex-col justify-between text-left shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 select-none",
        onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-blue-400" : "cursor-default"
      )}
      style={{ backgroundColor: `${subColor}15` }} // Light background using 8-12% opacity
    >
      {/* Left colored accent tag strip */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-md" style={{ backgroundColor: subColor }} />
      
      <div className="pl-1.5 flex flex-col justify-between h-full py-0.5">
        {/* Never truncate Subject Name */}
        <span className="text-[13px] font-semibold text-slate-800 leading-none block tracking-tight whitespace-nowrap">
          {slot.subject?.name || 'Subject'}
        </span>

        {/* Never truncate Teacher Name and Room */}
        <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 leading-none mt-1 whitespace-nowrap">
          <span className="pr-2">
            {slot.teacher ? `${slot.teacher.firstName || ''} ${slot.teacher.lastName || ''}`.trim() : 'Unassigned'}
          </span>
          <span className="shrink-0 uppercase">
            {slot.room || 'No Room'}
          </span>
        </div>
      </div>

      {/* Edit hover overlay icon */}
      {onClick && (
        <div className="absolute right-2.5 bottom-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
          <Edit3 className="h-3 w-3 text-blue-500 hover:text-blue-600 shrink-0" />
        </div>
      )}
    </div>
  )
}

export default function Timetable() {
  const [timetableSlots, setTimetableSlots] = useState([])
  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])
  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filters & State
  const [classFilter, setClassFilter] = useState('Class 1')
  const [academicYearFilter, setAcademicYearFilter] = useState('2026-2027')
  const [dayFilter, setDayFilter] = useState('') // Empty means "All Days"
  const [printMode, setPrintMode] = useState('class') // 'class' or 'teacher'

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isTeacherTimetableOpen, setIsTeacherTimetableOpen] = useState(false)
  const [isAddPeriodModalOpen, setIsAddPeriodModalOpen] = useState(false)
  
  const [currentSlot, setCurrentSlot] = useState(null)
  const [selectedSlotForView, setSelectedSlotForView] = useState(null)
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  // Local Form state (removed subjectType/periodType dropdown fields)
  const [formFields, setFormFields] = useState({
    subject: '',
    teacher: '',
    room: '',
    notes: '',
    day: 'Monday',
    period: ''
  })

  // Add Period Modal state
  const [newPeriodStart, setNewPeriodStart] = useState('')
  const [newPeriodEnd, setNewPeriodEnd] = useState('')
  const [addPeriodError, setAddPeriodError] = useState('')
  
  // Real-time frontend conflict preview
  const [conflictError, setConflictError] = useState('')
  const [validationErrors, setValidationErrors] = useState({})

  // Disable body scroll when modal is open
  useEffect(() => {
    const isAnyModalOpen = isAddEditModalOpen || isViewModalOpen || isTeacherTimetableOpen || isAddPeriodModalOpen
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isAddEditModalOpen, isViewModalOpen, isTeacherTimetableOpen, isAddPeriodModalOpen])

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  // Load all active subjects
  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects', {
        params: { page: 1, limit: 1000, status: 'Active' }
      })
      if (res && res.success && res.data && res.data.subjects) {
        setSubjects(res.data.subjects)
      }
    } catch (err) {
      console.error('Failed to load active subjects list:', err)
    }
  }

  // Load all active teachers
  const fetchTeachers = async () => {
    try {
      const res = await api.get('/teachers', {
        params: { page: 1, limit: 1000, status: 'Active' }
      })
      if (res && res.success && res.data && res.data.teachers) {
        setTeachers(res.data.teachers)
      }
    } catch (err) {
      console.error('Failed to load active teachers:', err)
    }
  }

  // Load configured periods
  const fetchPeriods = async () => {
    try {
      const res = await api.get('/periods')
      if (res && res.success && res.data) {
        setPeriods(res.data || [])
      }
    } catch (err) {
      console.error('Failed to load configured periods:', err)
    }
  }

  // Load global timetable slots
  const fetchTimetable = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/timetable', {
        params: { academicYear: academicYearFilter }
      })
      if (res && res.success) {
        setTimetableSlots(res.data.slots || res.data.data?.slots || [])
      } else {
        setError('Failed to fetch timetable slots')
      }
    } catch (err) {
      console.error('Fetch timetable error:', err)
      setError(err.message || 'Server error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubjects()
    fetchTeachers()
    fetchPeriods()
  }, [])

  useEffect(() => {
    fetchTimetable()
  }, [academicYearFilter])

  // Get subject info by ID helper
  const getSubjectById = (subId) => {
    return subjects.find(s => s._id === subId)
  }

  // Auto-assign teacher when subject changes
  const handleSubjectChange = (subjectId) => {
    const selectedSub = getSubjectById(subjectId)
    if (selectedSub) {
      setFormFields(prev => ({
        ...prev,
        subject: subjectId,
        teacher: selectedSub.assignedTeacher?._id || selectedSub.assignedTeacher || ''
      }))
    } else {
      setFormFields(prev => ({
        ...prev,
        subject: subjectId,
        teacher: ''
      }))
    }
  }

  // Real-time frontend conflict checking (Teacher, Class, and Room)
  useEffect(() => {
    const { subject, teacher, room, day, period } = formFields
    if (!subject || !teacher || !room || !day || !period) {
      setConflictError('')
      return
    }

    // 1. Teacher conflict check
    const teacherConflict = timetableSlots.find(s => 
      s.day === day && 
      s.period?._id === period && 
      (s.teacher?._id || s.teacher) === teacher && 
      s._id !== currentSlot?._id
    )
    if (teacherConflict) {
      const tName = teacherConflict.teacher 
        ? `${teacherConflict.teacher.firstName || ''} ${teacherConflict.teacher.lastName || ''}`.trim()
        : 'Teacher'
      setConflictError(`Conflict: ${tName} is already teaching Class ${teacherConflict.class} at this time.`)
      return
    }

    // 2. Class conflict check
    const classConflict = timetableSlots.find(s => 
      s.day === day && 
      s.period?._id === period && 
      s.class === classFilter && 
      s._id !== currentSlot?._id
    )
    if (classConflict) {
      setConflictError(`Conflict: Class ${classFilter} already has subject "${classConflict.subject?.name || 'Unknown'}" scheduled at this time.`)
      return
    }

    // 3. Room conflict check
    const roomConflict = timetableSlots.find(s => 
      s.day === day && 
      s.period?._id === period && 
      s.room && s.room.trim().toLowerCase() === room.trim().toLowerCase() && 
      s._id !== currentSlot?._id
    )
    if (roomConflict) {
      setConflictError(`Conflict: Room "${roomConflict.room}" is already occupied by Class ${roomConflict.class} at this time.`)
      return
    }

    setConflictError('')
  }, [formFields.subject, formFields.teacher, formFields.room, formFields.day, formFields.period, classFilter, currentSlot, timetableSlots])

  // Handle cell click (Sets BOTH states to prevent any slot not found bugs)
  const handleCellClick = (day, periodObj) => {
    const existing = timetableSlots.find(s => s.class === classFilter && s.day === day && (s.period?._id || s.period) === periodObj._id)
    if (existing) {
      setSelectedSlotForView(existing)
      setCurrentSlot(existing)
      setIsViewModalOpen(true)
    } else {
      // Add slot
      setCurrentSlot(null)
      setSelectedSlotForView(null)
      const classSubjects = subjects.filter(s => s.class === classFilter)
      const defaultSub = classSubjects[0]
      const defaultTeacherId = defaultSub?.assignedTeacher?._id || defaultSub?.assignedTeacher || ''

      setFormFields({
        subject: defaultSub?._id || '',
        teacher: defaultTeacherId,
        room: '',
        notes: '',
        day: day,
        period: periodObj._id
      })
      setValidationErrors({})
      setConflictError('')
      setIsAddEditModalOpen(true)
    }
  }

  // Handle edit trigger from view detail modal
  const handleTriggerEdit = () => {
    if (!selectedSlotForView) return
    setCurrentSlot(selectedSlotForView)
    setFormFields({
      subject: selectedSlotForView.subject?._id || selectedSlotForView.subject || '',
      teacher: selectedSlotForView.teacher?._id || selectedSlotForView.teacher || '',
      room: selectedSlotForView.room || '',
      notes: selectedSlotForView.remarks || '',
      day: selectedSlotForView.day,
      period: selectedSlotForView.period?._id || selectedSlotForView.period
    })
    setValidationErrors({})
    setConflictError('')
    setIsViewModalOpen(false)
    setIsAddEditModalOpen(true)
  }

  // Handle Save (Create / Update)
  const handleSaveSlot = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setValidationErrors({})

    const errors = {}
    if (!formFields.subject) errors.subject = 'Subject selection is required'
    if (!formFields.teacher) errors.teacher = 'Teacher selection is required'
    if (!formFields.room.trim()) errors.room = 'Classroom/Room Number is required'

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      setSubmitting(false)
      return
    }

    try {
      const payload = {
        class: classFilter,
        day: formFields.day,
        period: formFields.period,
        subject: formFields.subject,
        teacher: formFields.teacher,
        room: formFields.room.trim(),
        remarks: formFields.notes.trim(),
        academicYear: academicYearFilter
      }

      let res;
      if (currentSlot && currentSlot._id) {
        res = await api.put(`/timetable/${currentSlot._id}`, payload)
      } else {
        res = await api.post('/timetable', payload)
      }

      if (res && res.success) {
        showToast('success', currentSlot ? 'Lecture slot updated successfully.' : 'Lecture scheduled successfully.')
        setIsAddEditModalOpen(false)
        setCurrentSlot(null)
        setSelectedSlotForView(null)
        fetchTimetable()
      } else {
        showToast('error', res.message || 'Overlap collision occurred.')
      }
    } catch (err) {
      console.error('Save slot error:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Operation failed'
      showToast('error', errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  // Unschedule / Delete Immediately
  const handleUnscheduleSlot = async () => {
    const targetSlot = currentSlot || selectedSlotForView
    if (!targetSlot) {
      showToast('error', 'No lecture selected to unschedule.')
      return
    }
    const slotId = targetSlot._id || targetSlot
    setSubmitting(true)
    try {
      const res = await api.delete(`/timetable/${slotId}`)
      if (res && res.success) {
        showToast('success', 'Lecture removed successfully.')
        setIsViewModalOpen(false)
        setIsAddEditModalOpen(false)
        setCurrentSlot(null)
        setSelectedSlotForView(null)
        fetchTimetable()
      } else {
        showToast('error', res.message || 'Failed to remove slot')
      }
    } catch (err) {
      console.error('Unschedule slot error:', err)
      showToast('error', err.message || 'Remove operation failed')
    } finally {
      setSubmitting(false)
    }
  }

  // Parse time helper (HH:MM AM/PM to minutes)
  const parseTimeToMinutes = (tStr) => {
    const match = (tStr || '').trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i)
    if (!match) return 0
    let hrs = parseInt(match[1], 10)
    const mins = parseInt(match[2], 10)
    const ampm = match[3].toUpperCase()
    if (ampm === 'PM' && hrs !== 12) hrs += 12
    if (ampm === 'AM' && hrs === 12) hrs = 0
    return hrs * 60 + mins
  }

  // Format minutes helper to string time
  const formatMinutesToTime = (mins) => {
    let hrs = Math.floor(mins / 60) % 24
    const m = mins % 60
    const ampm = hrs >= 12 ? 'PM' : 'AM'
    hrs = hrs % 12
    if (hrs === 0) hrs = 12
    const hrsStr = hrs < 10 ? `0${hrs}` : `${hrs}`
    const minsStr = m < 10 ? `0${m}` : `${m}`
    return `${hrsStr}:${minsStr} ${ampm}`
  }

  // Convert 24h format from HTML input to 12h AM/PM string format
  const convert24hTo12h = (time24) => {
    if (!time24) return ''
    const [hStr, mStr] = time24.split(':')
    let hrs = parseInt(hStr, 10)
    const mins = parseInt(mStr, 10)
    const ampm = hrs >= 12 ? 'PM' : 'AM'
    hrs = hrs % 12
    if (hrs === 0) hrs = 12
    const hrsPad = hrs < 10 ? `0${hrs}` : `${hrs}`
    const minsPad = mins < 10 ? `0${mins}` : `${mins}`
    return `${hrsPad}:${minsPad} ${ampm}`
  }

  // Sort and renumber period lists sequentially: Period 1, Period 2, etc.
  const sortAndRenumberPeriods = (periodList) => {
    const sorted = [...periodList].sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime))
    return sorted.map((p, idx) => ({
      ...p,
      name: `Period ${idx + 1}`,
      order: idx + 1
    }))
  }

  // Save new period from Add Period Modal dialog (runs timing validations)
  const handleSaveNewPeriod = async (e) => {
    e.preventDefault()
    setAddPeriodError('')

    if (!newPeriodStart) {
      setAddPeriodError('Start Time is required.')
      return
    }
    if (!newPeriodEnd) {
      setAddPeriodError('End Time is required.')
      return
    }

    const start12 = convert24hTo12h(newPeriodStart)
    const end12 = convert24hTo12h(newPeriodEnd)
    const sMin = parseTimeToMinutes(start12)
    const eMin = parseTimeToMinutes(end12)

    if (sMin >= eMin) {
      setAddPeriodError('End time must be later than start time.')
      return
    }

    // Check conflicts/overlaps with existing periods
    for (let i = 0; i < periods.length; i++) {
      const p = periods[i]
      const exStart = parseTimeToMinutes(p.startTime)
      const exEnd = parseTimeToMinutes(p.endTime)

      const maxStart = Math.max(sMin, exStart)
      const minEnd = Math.min(eMin, exEnd)
      if (maxStart < minEnd) {
        setAddPeriodError(`This time overlaps with ${p.name}.`)
        return
      }
    }

    // Add temp period, sort & renumber sequentially
    const newPeriod = {
      name: 'Temp Period',
      type: 'period',
      startTime: start12,
      endTime: end12
    }

    const renumberedList = sortAndRenumberPeriods([...periods, newPeriod])

    setSubmitting(true)
    try {
      const res = await api.post('/periods/bulk', { periods: renumberedList })
      if (res && res.success) {
        showToast('success', 'New period timing added successfully.')
        setIsAddPeriodModalOpen(false)
        setNewPeriodStart('')
        setNewPeriodEnd('')
        fetchPeriods()
        fetchTimetable()
      } else {
        setAddPeriodError(res.message || 'Failed to add period timing.')
      }
    } catch (err) {
      console.error('Add period timing error:', err)
      setAddPeriodError(err.response?.data?.message || err.message || 'API endpoint failure.')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Period row from main grid (warn if occupied, and renumber remaining periods automatically)
  const handleDeletePeriod = async (periodObj) => {
    const hasOccupations = timetableSlots.some(s => (s.period?._id || s.period) === periodObj._id)

    if (hasOccupations) {
      const confirmDelete = window.confirm(
        `This period contains scheduled lectures. Deleting it will remove all lectures in this period. Continue?`
      )
      if (!confirmDelete) return
    }

    // Filter out deleted row, then sort & renumber remaining rows sequentially
    const remainingFiltered = periods.filter(p => p._id !== periodObj._id)
    const renumberedList = sortAndRenumberPeriods(remainingFiltered)

    setSubmitting(true)
    try {
      const res = await api.post('/periods/bulk', { periods: renumberedList })
      if (res && res.success) {
        showToast('success', 'Period Timing deleted and timeline renumbered successfully.')
        fetchPeriods()
        fetchTimetable()
      } else {
        showToast('error', res.message || 'Delete Period failed.')
      }
    } catch (err) {
      console.error('Delete Period error:', err)
      showToast('error', 'Delete Period API failed.')
    } finally {
      setSubmitting(false)
    }
  }

  // Calculate stats reactively on frontend
  const activePeriodsList = periods.filter(p => p.type === 'period')
  const classSlots = timetableSlots.filter(s => s.class === classFilter)
  const totalLecturesCount = classSlots.length
  const maxWeeklySlotsCount = activePeriodsList.length * 7 // Monday to Sunday (7 days)
  const freeSlotsCount = Math.max(0, maxWeeklySlotsCount - totalLecturesCount)
  const occupancyPercentRate = maxWeeklySlotsCount > 0 ? Math.round((totalLecturesCount / maxWeeklySlotsCount) * 100) : 0

  // Dynamic row gap scaling only (independent of card dimensions)
  const getDynamicGap = (numPeriods) => {
    if (numPeriods <= 4) return 24
    if (numPeriods === 5) return 16
    if (numPeriods === 6) return 10
    return 4
  }
  const gapSize = getDynamicGap(activePeriodsList.length)

  // Format Minimal Options for Notion/Figma feel Dropdowns (Display ONLY name)
  const subjectOptions = subjects
    .filter(s => s.class === classFilter)
    .map(s => {
      const teacherName = s.assignedTeacher
        ? `${s.assignedTeacher.firstName || ''} ${s.assignedTeacher.lastName || ''}`.trim()
        : 'Unassigned'
      return {
        value: s._id,
        label: s.name,
        searchText: `${s.name} ${s.code} ${teacherName} ${s.class}`
      }
    })

  const teacherOptions = teachers.map(t => {
    const name = `${t.firstName || ''} ${t.lastName || ''}`.trim()
    return {
      value: t._id,
      label: name,
      searchText: `${name} ${t.teacherId || ''}`
    }
  })

  // Subject Dropdown Minimal Render Function
  const renderSubjectOption = (opt, isSelected) => {
    return (
      <div className={cn(
        "px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors",
        isSelected ? "bg-blue-50/40 text-brand-blue-700 font-bold" : "hover:bg-slate-50 text-slate-700"
      )}>
        <span className="truncate">{opt.label}</span>
      </div>
    )
  }

  // Teacher Dropdown Minimal Render Function
  const renderTeacherOption = (opt, isSelected) => {
    return (
      <div className={cn(
        "px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors",
        isSelected ? "bg-blue-50/40 text-brand-blue-700 font-bold" : "hover:bg-slate-50 text-slate-700"
      )}>
        <span className="truncate">{opt.label}</span>
      </div>
    )
  }

  const handlePrintClassTimetable = () => {
    setPrintMode('class')
    setTimeout(() => {
      window.print()
    }, 100)
  }

  const handlePrintTeacherTimetable = () => {
    setPrintMode('teacher')
    setTimeout(() => {
      window.print()
    }, 100)
  }

  // Selected teacher's read-only slots list
  const selectedTeacherSlots = timetableSlots.filter(s => 
    s.teacher && ((s.teacher._id || s.teacher) === selectedTeacherId)
  )

  const selectedTeacherObj = teachers.find(t => t._id === selectedTeacherId)
  const selectedTeacherName = selectedTeacherObj 
    ? `${selectedTeacherObj.firstName || ''} ${selectedTeacherObj.lastName || ''}`.trim()
    : 'No Teacher Selected'

  // Extract unique subjects assigned to the selected teacher
  const teacherAssignedSubjects = Array.from(
    new Set(
      subjects
        .filter(s => s.assignedTeacher && ((s.assignedTeacher._id || s.assignedTeacher) === selectedTeacherId))
        .map(s => s.name)
    )
  )

  return (
    <div className="flex-1 w-full h-full text-slate-800 flex flex-col gap-5 select-none min-h-0 bg-transparent print:bg-white print:p-0 print:m-0">
      
      {/* Inject print-only stylesheet to force Landscape formatting on a single page */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: landscape;
            margin: 0.5cm;
          }
          body, html, #root {
            width: 100% !important;
            height: 100% !important;
            overflow: visible !important;
            background: white !important;
            color: black !important;
          }
          /* Hide all non-printable wrappers */
          aside, nav, header, button, .print\\:hidden {
            display: none !important;
          }
          /* Remove layout main container margins/paddings */
          main, .flex, .min-h-screen, .h-screen, div {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            min-height: 0 !important;
            background: transparent !important;
            transform: none !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .print-main-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          /* Flex table layouts under print override */
          table {
            display: flex !important;
            flex-direction: column !important;
            height: 100% !important;
            width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
          }
          thead {
            display: block !important;
            flex-shrink: 0 !important;
          }
          tbody {
            display: flex !important;
            flex-direction: column !important;
            flex: 1 !important;
            min-height: 0 !important;
            gap: 12px !important;
          }
          tr {
            display: flex !important;
            flex: 1 !important;
            min-height: 0 !important;
            width: 100% !important;
          }
          th, td {
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            border: 1px solid #E2E8F0 !important;
            padding: 6px !important;
          }
          /* Width columns equal distribution: 130px for hours, ~230px for 7 days */
          th:first-child, td:first-child {
            width: 130px !important;
          }
          th:not(:first-child):not(:last-child), td:not(:first-child):not(:last-child) {
            width: 230px !important;
          }
          /* Hide last Action column on print */
          th:last-child, td:last-child {
            display: none !important;
          }
        }
      `}} />

      {/* Custom Scrollbar and layout transitions stylesheet */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1; /* slate-300 */
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8; /* slate-400 */
        }
      `}} />

      {/* Dynamic Print Container Switch based on printMode state */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .print-class-view {
            display: ${printMode === 'class' ? 'block' : 'none'} !important;
          }
          .print-teacher-view {
            display: ${printMode === 'teacher' ? 'block' : 'none'} !important;
          }
        }
      `}} />

      {/* Toast notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "fixed top-6 right-6 z-[100] px-5 py-3.5 rounded-[20px] shadow-premium-3 flex items-center gap-3 border text-xs font-black tracking-wide bg-white max-w-sm select-none print:hidden",
              toast.type === 'success' ? "border-emerald-200 text-slate-850" : "border-red-200 text-slate-850"
            )}
          >
            <div className={cn(
              "h-6.5 w-6.5 rounded-full flex items-center justify-center shrink-0",
              toast.type === 'success' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            )}>
              {toast.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            </div>
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header & Breadcrumbs Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 print:hidden">
        <div className="text-left space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase select-none">
            <span>Admin</span>
            <span>/</span>
            <span className="text-brand-blue-600">Timetable</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none mt-1">
            Timetable Management
          </h2>
          <p className="text-[11px] font-bold text-slate-400 mt-1.5">
            Manage weekly schedules, period rows, classrooms, and printable timetables
          </p>
        </div>
      </div>

      {/* Stats CSS grid layout */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', 
          gap: '16px' 
        }} 
        className="shrink-0 print:hidden"
      >
        <DashboardStatCard
          title="Total Lectures"
          value={totalLecturesCount}
          subtitle="Scheduled Slots"
          icon={Clock}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-500"
          className="py-3 px-5"
        />
        <DashboardStatCard
          title="Free Slots"
          value={freeSlotsCount}
          subtitle="Available Cells"
          icon={Calendar}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-500"
          valueColor="text-purple-650"
          className="py-3 px-5"
        />
        <DashboardStatCard
          title="Occupancy"
          value={`${occupancyPercentRate}%`}
          subtitle={`${totalLecturesCount} / ${maxWeeklySlotsCount} Slots`}
          icon={Check}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-500"
          valueColor="text-emerald-600"
          className="py-3 px-5"
        />
      </div>

      {/* 2. Controls & Filters Row */}
      <div 
        style={{ borderRadius: '24px', border: '1px solid #ECECEC' }}
        className="py-5 px-6 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 print:hidden"
      >
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="h-10 w-44 px-4 bg-white border border-slate-200 rounded-full text-xs font-extrabold text-slate-550 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
          >
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={academicYearFilter}
            onChange={(e) => setAcademicYearFilter(e.target.value)}
            className="h-10 w-44 px-4 bg-white border border-slate-200 rounded-full text-xs font-extrabold text-slate-550 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
          >
            <option value="2026-2027">2026-2027</option>
            <option value="2027-2028">2027-2028</option>
          </select>

          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            className="h-10 w-44 px-4 bg-white border border-slate-200 rounded-full text-xs font-extrabold text-slate-555 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
          >
            <option value="">All Days</option>
            {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden md:block" />

          {/* Trigger Add Period Modal dialog */}
          <button
            onClick={() => {
              setNewPeriodStart('')
              setNewPeriodEnd('')
              setAddPeriodError('')
              setIsAddPeriodModalOpen(true)
            }}
            disabled={submitting}
            className="h-10 px-4.5 bg-blue-50/50 hover:bg-blue-50 border border-dashed border-blue-200 rounded-full text-xs font-extrabold text-blue-600 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Period</span>
          </button>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Replaced Period Settings with Teacher Timetable */}
          <button
            onClick={() => {
              setSelectedTeacherId(teachers[0]?._id || '')
              setIsTeacherTimetableOpen(true)
            }}
            className="h-10 px-4.5 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-550 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            title="Open Teacher Timetable"
          >
            <User className="h-4 w-4 text-blue-500" />
            <span>Teacher Timetable</span>
          </button>
          
          <div className="h-6 w-[1px] bg-slate-200 mx-1" />

          <button
            onClick={handlePrintClassTimetable}
            className="h-10 px-4.5 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-500 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            title="Print Timetable"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </button>
          <button
            onClick={handlePrintClassTimetable}
            className="h-10 px-4.5 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-555 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            title="Export Timetable as PDF Grid"
          >
            <FileText className="h-4 w-4 text-red-500" />
            <span>PDF Export</span>
          </button>
        </div>
      </div>

      {/* 1. Print/PDF Header FOR CLASS TIMETABLE (Visible during printing only) */}
      <div className="hidden print:print-class-view flex items-center justify-between border-b border-slate-200 pb-4 mb-6 select-none w-full">
        <div className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-black">
              CK
            </div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">C.K. Classes</h1>
          </div>
          <p className="text-[9px] font-bold text-slate-400">Advanced ERP Coaching Portal</p>
        </div>
        <div className="text-right space-y-0.5">
          <h2 className="text-xs font-black text-slate-800">Weekly Class Timetable</h2>
          <p className="text-[10px] font-extrabold text-blue-600 uppercase">Class: {classFilter} | Year: {academicYearFilter}</p>
          <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Generated Date: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* 2. Print/PDF Header FOR TEACHER TIMETABLE (Visible during printing only) */}
      <div className="hidden print:print-teacher-view flex items-center justify-between border-b border-slate-200 pb-4 mb-6 select-none w-full">
        <div className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-black">
              CK
            </div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">C.K. Classes</h1>
          </div>
          <p className="text-[9px] font-bold text-slate-400">Advanced ERP Coaching Portal</p>
        </div>
        <div className="text-right space-y-0.5">
          <h2 className="text-xs font-black text-slate-800">Weekly Teacher Timetable</h2>
          <p className="text-[10px] font-extrabold text-blue-600 uppercase">Teacher: {selectedTeacherName} | Year: {academicYearFilter}</p>
          <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Generated Date: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* 3. Main Weekly Grid Section (Horizontal Scroll, fixed card height) */}
      <div 
        style={{ borderRadius: '28px', border: '1px solid #ECECEC', padding: '28px' }}
        className="bg-white shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex-grow flex flex-col justify-between overflow-hidden min-h-0 print:border-none print:shadow-none print:p-0 print-main-card print:print-class-view"
      >
        {/* Horizontally scrollable wrapper */}
        <div className="overflow-y-auto overflow-x-auto custom-scrollbar flex-grow min-h-0 pr-1 print:overflow-visible h-full flex flex-col">
          <table className="w-full text-left min-w-[1810px] border-collapse flex flex-col h-full">
            <thead className="bg-slate-50/55 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest select-none block shrink-0">
              <tr className="flex w-full items-center h-14">
                {/* Sticky Hours header */}
                <th className="pl-7 text-left flex items-center shrink-0 border-r border-slate-100 h-full sticky left-0 z-30 bg-slate-50" style={{ width: '130px' }}>Time / Period</th>
                
                {daysOfWeek.map(day => {
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
                <th className="text-center flex items-center justify-center shrink-0 print:hidden h-full" style={{ width: '70px' }}>Action</th>
              </tr>
            </thead>

            {/* Distributed height rows with centered 64px cards */}
            <tbody className="divide-y-0 flex flex-col flex-1 min-h-0">
              {loading ? (
                <tr className="print:hidden h-full flex items-center justify-center">
                  <td className="text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="h-7 w-7 text-blue-500 animate-spin" />
                      <span className="text-xs font-bold text-slate-400">Loading coaching slots...</span>
                    </div>
                  </td>
                </tr>
              ) : activePeriodsList.length === 0 ? (
                <tr className="h-full flex items-center justify-center">
                  <td className="text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Calendar className="h-8 w-8 text-slate-350" />
                      <span className="text-xs font-black text-slate-455">No coaching periods available.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                activePeriodsList.map((periodObj) => (
                  <tr 
                    key={periodObj._id} 
                    className="flex w-full items-stretch flex-1 min-h-[72px] transition-all duration-300 group hover:bg-slate-50/10"
                  >
                    {/* Sticky Period Column */}
                    <td className="pl-7 font-extrabold text-slate-800 bg-white group-hover:bg-slate-50 border-r border-slate-200/80 text-left select-none pr-4 shrink-0 flex flex-col justify-center overflow-hidden h-full sticky left-0 z-10 transition-colors duration-200" style={{ width: '130px' }}>
                      <div className="text-[13px] font-semibold tracking-tight text-brand-blue-700 leading-none">{periodObj.name}</div>
                      <div className="text-[11px] font-medium text-slate-500 mt-2.5 flex items-center gap-1.5 leading-none">
                        <span className="text-[11px] font-medium text-slate-400">🕓</span>
                        <span className="whitespace-nowrap">{periodObj.startTime} – {periodObj.endTime}</span>
                      </div>
                    </td>

                    {/* Weekly Columns */}
                    {daysOfWeek.map((day) => {
                      const isFilteredOut = dayFilter && dayFilter !== day
                      const slot = timetableSlots.find(s => s.class === classFilter && s.day === day && (s.period?._id || s.period) === periodObj._id)

                      return (
                        <td 
                          key={day}
                          className={cn(
                            "flex-1 min-w-[230px] px-2 border-r border-slate-100 text-center relative transition-all overflow-hidden flex flex-col justify-center h-full",
                            isFilteredOut ? "opacity-20 cursor-not-allowed pointer-events-none" : "hover:bg-slate-50/50"
                          )}
                        >
                          <TimetableCell
                            slot={slot}
                            isFilteredOut={isFilteredOut}
                            onClick={() => !isFilteredOut && handleCellClick(day, periodObj)}
                          />
                        </td>
                      )
                    })}

                    {/* Row Delete Column */}
                    <td className="w-[70px] shrink-0 text-center flex items-center justify-center overflow-hidden print:hidden h-full" style={{ width: '70px' }}>
                      <button
                        onClick={() => handleDeletePeriod(periodObj)}
                        className="h-8 w-8 rounded-full hover:bg-red-50 text-red-500 hover:text-red-750 flex items-center justify-center transition-all border border-transparent hover:border-red-100 cursor-pointer mx-auto"
                        title={`Delete ${periodObj.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Teacher Printable Grid view (Visible during printing only, when printMode === 'teacher') */}
      <div className="hidden print:print-teacher-view w-full">
        <table className="w-full text-left min-w-[900px] border-collapse flex flex-col h-full">
          <thead className="bg-slate-50/55 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest select-none block shrink-0">
            <tr className="flex w-full items-center h-14">
              <th className="pl-7 border-r border-slate-100 text-left align-middle shrink-0 flex items-center h-full sticky left-0 z-30 bg-slate-50" style={{ width: '130px' }}>Time / Period</th>
              {daysOfWeek.map(day => (
                <th key={day} className="flex-1 min-w-[230px] flex items-center justify-center border-r border-slate-100 last:border-r-0 tracking-widest font-black h-full">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y-0 flex flex-col flex-1 min-h-0">
            {activePeriodsList.map((periodObj) => (
              <tr key={periodObj._id} className="flex w-full items-stretch flex-1 min-h-[72px] transition-all duration-300 group hover:bg-slate-50/10">
                <td className="pl-7 font-extrabold text-slate-800 bg-white group-hover:bg-slate-50 border-r border-slate-200/80 text-left select-none pr-4 shrink-0 flex flex-col justify-center overflow-hidden h-full sticky left-0 z-10 transition-colors duration-200" style={{ width: '130px' }}>
                  <div className="text-[13px] font-semibold tracking-tight text-brand-blue-700 leading-none">{periodObj.name}</div>
                  <div className="text-[11px] font-medium text-slate-500 mt-2.5 flex items-center gap-1.5 leading-none">
                    <span>🕓</span>
                    <span>{periodObj.startTime} – {periodObj.endTime}</span>
                  </div>
                </td>
                {daysOfWeek.map((day) => {
                  const tSlot = selectedTeacherSlots.find(s => s.day === day && (s.period?._id || s.period) === periodObj._id)
                  return (
                    <td key={day} className="flex-1 min-w-[230px] px-2 border-r border-slate-100 last:border-r-0 text-center overflow-hidden flex flex-col justify-center h-full">
                      <TimetableCell slot={tSlot} showTeacherView={true} />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Print/PDF Footer (Visible during printing only) */}
      <div className="hidden print:flex items-center justify-between border-t border-slate-200 pt-3 mt-5 select-none w-full">
        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
          Generated by CK Classes ERP
        </span>
        <span className="text-[8px] text-slate-400 font-semibold">
          Page 1 of 1
        </span>
      </div>

      {/* 4. ADD / EDIT LECTURE MODAL (Notion/Figma feel Dropdowns) */}
      <AnimatePresence>
        {isAddEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={spring}
              className="bg-white w-full max-w-xl shadow-premium-4 flex flex-col relative max-h-[90vh]"
              style={{ borderRadius: '28px', border: '1px solid #ECECEC' }}
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="text-left">
                  <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none">
                    {currentSlot ? 'Edit Scheduled Lecture' : 'Schedule Timetable Slot'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">
                    Please provide the scheduling details below
                  </p>
                </div>
                <button
                  disabled={submitting}
                  onClick={() => {
                    setIsAddEditModalOpen(false)
                    setCurrentSlot(null)
                    setSelectedSlotForView(null)
                  }}
                  className="h-9 w-9 rounded-full border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleSaveSlot} className="flex-1 overflow-y-auto p-8 space-y-6 min-h-0 text-left">
                <fieldset disabled={submitting} className="space-y-6">
                  
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black text-brand-blue-600 tracking-widest uppercase pb-1 border-b border-slate-100">
                      ACADEMIC DETAILS
                    </h4>
                    
                    {/* Class metadata banner */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-650">
                      <span>Target Class: <strong className="text-slate-850 font-black">{classFilter}</strong></span>
                      <span>Day & Period: <strong className="text-slate-850 font-black">{formFields.day}, {periods.find(p => p._id === formFields.period)?.name}</strong></span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-405 tracking-wider">Select Subject *</label>
                        <SearchableSelect
                          placeholder="Search class subject..."
                          value={formFields.subject}
                          onChange={handleSubjectChange}
                          options={subjectOptions}
                          renderOption={renderSubjectOption}
                          error={!!validationErrors.subject}
                        />
                        {validationErrors.subject && (
                          <p className="text-[9px] font-bold text-red-500 mt-0.5">{validationErrors.subject}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-405 tracking-wider">Assigned Teacher *</label>
                        <SearchableSelect
                          placeholder="Search instructor..."
                          value={formFields.teacher}
                          onChange={(val) => setFormFields(prev => ({ ...prev, teacher: val }))}
                          options={teacherOptions}
                          renderOption={renderTeacherOption}
                          error={!!validationErrors.teacher}
                        />
                        {validationErrors.teacher && (
                          <p className="text-[9px] font-bold text-red-500 mt-0.5">{validationErrors.teacher}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-405 tracking-wider">Classroom / Room No *</label>
                        <input
                          type="text"
                          required
                          value={formFields.room}
                          onChange={(e) => setFormFields(prev => ({ ...prev, room: e.target.value }))}
                          className={cn(
                            "w-full h-11 px-4 border rounded-[16px] text-xs font-semibold text-slate-700 bg-slate-50/50 focus:outline-none focus:bg-white transition-all focus:border-blue-500",
                            validationErrors.room ? "border-red-500 focus:border-red-500" : "border-slate-200/80"
                          )}
                          placeholder="e.g. Room 102"
                        />
                        {validationErrors.room && (
                          <p className="text-[9px] font-bold text-red-500 mt-0.5">{validationErrors.room}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black text-brand-blue-600 tracking-widest uppercase pb-1 border-b border-slate-100">
                      ADDITIONAL NOTES
                    </h4>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-405 tracking-wider">Remarks / Notes (Optional)</label>
                      <textarea
                        value={formFields.notes}
                        onChange={(e) => setFormFields(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full h-20 p-3.5 border border-slate-200/80 rounded-[16px] text-xs font-semibold text-slate-700 bg-slate-50/50 focus:outline-none focus:bg-white transition-all focus:border-blue-500 resize-none"
                        placeholder="Topics to cover or preparation guidelines..."
                      />
                    </div>
                  </div>

                  {/* Real-time Conflict Warning box */}
                  {conflictError && (
                    <div className="p-4 rounded-[18px] bg-red-50/40 border border-red-200 flex items-start gap-3 text-red-700 text-xs font-semibold">
                      <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                      <span>{conflictError}</span>
                    </div>
                  )}

                </fieldset>
              </form>

              {/* Modal Footer */}
              <div className="p-8 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setIsAddEditModalOpen(false)
                    setCurrentSlot(null)
                    setSelectedSlotForView(null)
                  }}
                  className="h-10 px-5 border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-555 rounded-full cursor-pointer disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSaveSlot}
                  disabled={submitting || !!conflictError}
                  className="h-10 px-6 bg-brand-blue-500 hover:bg-brand-blue-600 text-xs font-extrabold text-white rounded-full cursor-pointer shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all active:scale-95"
                >
                  {submitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Slot</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. DETAILS VIEW MODAL */}
      <AnimatePresence>
        {isViewModalOpen && selectedSlotForView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={spring}
              className="bg-white w-full max-w-md shadow-premium-4 flex flex-col relative overflow-hidden"
              style={{ borderRadius: '24px', border: '1px solid #ECECEC' }}
            >
              {/* Top accent color bar */}
              <div 
                className="h-4 w-full shrink-0" 
                style={{ backgroundColor: selectedSlotForView.subject?.color || getSubjectColor(selectedSlotForView.subject?.name) }}
              />

              <div className="p-7 text-left space-y-5 flex-grow overflow-y-auto">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-855 tracking-tight leading-tight">
                      {selectedSlotForView.subject?.name || 'Subject Details'}
                    </h3>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none pt-0.5">
                      Code: {selectedSlotForView.subject?.code || 'N/A'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false)
                      setCurrentSlot(null)
                      setSelectedSlotForView(null)
                    }}
                    className="h-8 w-8 rounded-full border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors shadow-sm cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-2 border-t border-slate-100 pt-5 text-left">
                  <div className="space-y-1">
                    <span className="text-[8.5px] font-black uppercase text-slate-405 tracking-wider flex items-center gap-1">
                      <User className="h-3 w-3 text-slate-350" />
                      <span>Teacher</span>
                    </span>
                    <p className="text-xs font-black text-slate-705">
                      {selectedSlotForView.teacher 
                        ? `${selectedSlotForView.teacher.firstName || ''} ${selectedSlotForView.teacher.lastName || ''}`.trim()
                        : 'Unassigned'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8.5px] font-black uppercase text-slate-405 tracking-wider flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-350" />
                      <span>Classroom</span>
                    </span>
                    <p className="text-xs font-black text-slate-705">
                      {selectedSlotForView.room || 'N/A'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8.5px] font-black uppercase text-slate-405 tracking-wider flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-350" />
                      <span>Period & Day</span>
                    </span>
                    <p className="text-xs font-black text-slate-705">
                      {selectedSlotForView.period?.name || 'Class Period'} ({selectedSlotForView.day})
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8.5px] font-black uppercase text-slate-405 tracking-wider flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-350" />
                      <span>Class</span>
                    </span>
                    <p className="text-xs font-black text-slate-705">
                      {selectedSlotForView.class || classFilter}
                    </p>
                  </div>
                </div>

                {selectedSlotForView.remarks && (
                  <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 space-y-1 mt-4">
                    <span className="text-[8.5px] font-black uppercase text-slate-405 tracking-wider block">Remarks / Notes</span>
                    <p className="text-xs font-semibold text-slate-650 leading-relaxed">{selectedSlotForView.remarks}</p>
                  </div>
                )}

                <div className="text-[8px] font-semibold text-slate-355 pt-2 flex flex-col gap-0.5 border-t border-slate-100">
                  <span>Created: {new Date(selectedSlotForView.createdAt).toLocaleString()}</span>
                  <span>Updated: {new Date(selectedSlotForView.updatedAt).toLocaleString()}</span>
                </div>
              </div>

              {/* View Footer actions */}
              <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleUnscheduleSlot}
                  className="h-10 px-4 bg-red-50 hover:bg-red-100 text-xs font-extrabold text-red-655 rounded-full cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Unschedule</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewModalOpen(false)
                      setCurrentSlot(null)
                      setSelectedSlotForView(null)
                    }}
                    className="h-10 px-4 border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-550 rounded-full cursor-pointer transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerEdit}
                    className="h-10 px-5 bg-brand-blue-500 hover:bg-brand-blue-600 text-xs font-extrabold text-white rounded-full cursor-pointer shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit Slot</span>
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. ADD PERIOD MODAL DIALOG */}
      <AnimatePresence>
        {isAddPeriodModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={spring}
              className="bg-white w-full max-w-md shadow-premium-4 flex flex-col relative"
              style={{ borderRadius: '24px', border: '1px solid #ECECEC' }}
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="text-left">
                  <h3 className="text-base font-black text-slate-800 tracking-tight leading-none">
                    Add New Period
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">
                    Select start and end timings below
                  </p>
                </div>
                <button
                  disabled={submitting}
                  onClick={() => setIsAddPeriodModalOpen(false)}
                  className="h-8.5 w-8.5 rounded-full border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveNewPeriod} className="p-6 space-y-4 text-left">
                {addPeriodError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-705 text-xs font-semibold flex items-center gap-2 border border-red-100">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{addPeriodError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-black uppercase text-slate-405 tracking-wider">Start Time</label>
                    <div className="relative">
                      <input
                        type="time"
                        required
                        value={newPeriodStart}
                        onChange={(e) => setNewPeriodStart(e.target.value)}
                        className="w-full h-10 px-3 border border-slate-200 rounded-[14px] text-xs font-semibold text-slate-700 bg-slate-50/50 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-black uppercase text-slate-405 tracking-wider">End Time</label>
                    <div className="relative">
                      <input
                        type="time"
                        required
                        value={newPeriodEnd}
                        onChange={(e) => setNewPeriodEnd(e.target.value)}
                        className="w-full h-10 px-3 border border-slate-200 rounded-[14px] text-xs font-semibold text-slate-700 bg-slate-50/50 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setIsAddPeriodModalOpen(false)}
                    className="h-9.5 px-4 border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-550 rounded-full cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-9.5 px-5 bg-brand-blue-500 hover:bg-brand-blue-600 text-xs font-extrabold text-white rounded-full cursor-pointer shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {submitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                    <span>Add Period</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. TEACHER TIMETABLE PREVIEW MODAL */}
      <AnimatePresence>
        {isTeacherTimetableOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={spring}
              className="bg-white w-full max-w-5xl shadow-premium-4 flex flex-col relative max-h-[92vh] overflow-hidden"
              style={{ borderRadius: '28px', border: '1px solid #ECECEC' }}
            >
              {/* Modal Header */}
              <div className="p-7 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="text-left space-y-1">
                  <h3 className="text-base font-black text-slate-800 tracking-tight leading-none uppercase">
                    Teacher Timetable View
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400">
                    Search and preview read-only schedules of individual coaching teachers
                  </p>
                </div>
                <button
                  onClick={() => setIsTeacherTimetableOpen(false)}
                  className="h-8.5 w-8.5 rounded-full border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors shadow-sm cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Selection Bar inside Modal */}
              <div className="px-7 py-4.5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between gap-5 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-455 uppercase tracking-widest">Select Instructor:</span>
                  <SearchableSelect
                    placeholder="Search teacher..."
                    value={selectedTeacherId}
                    onChange={(val) => setSelectedTeacherId(val)}
                    options={teacherOptions}
                    renderOption={renderTeacherOption}
                    className="w-64"
                  />
                </div>

                <button
                  onClick={handlePrintTeacherTimetable}
                  disabled={!selectedTeacherId}
                  className="h-9.5 px-4 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-550 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-40"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Timetable</span>
                </button>
              </div>

              {/* Scrollable teacher layout */}
              <div className="flex-1 overflow-y-auto overflow-x-auto p-7 min-h-0 flex flex-col">
                {!selectedTeacherId ? (
                  <div className="py-24 text-center flex flex-col items-center justify-center gap-2 flex-grow">
                    <User className="h-8 w-8 text-slate-350" />
                    <span className="text-xs font-bold text-slate-400">Please select an instructor above to view details.</span>
                  </div>
                ) : (
                  <>
                    {/* Summary Header - Fixed overlap bug, proper responsive LEFT, CENTER, RIGHT flex layout */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-5 flex flex-col md:flex-row justify-between gap-6 text-left items-start">
                      {/* Left: Selected Instructor */}
                      <div className="md:w-1/3 min-w-0 space-y-1">
                        <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none block">Selected Instructor</span>
                        <h4 className="text-base font-black text-slate-800 leading-tight mt-1">{selectedTeacherName}</h4>
                      </div>

                      {/* Center: Subjects List */}
                      <div className="md:w-1/3 min-w-0 space-y-1">
                        <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest leading-none block">Subjects</span>
                        <ul className="text-xs font-extrabold text-slate-650 space-y-1 mt-2 list-none pl-0">
                          {teacherAssignedSubjects.length > 0 ? (
                            teacherAssignedSubjects.map(subName => (
                              <li key={subName} className="flex items-center gap-1.5 leading-tight">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                                <span className="truncate">{subName}</span>
                              </li>
                            ))
                          ) : (
                            <span className="text-slate-400 italic">No assigned subjects</span>
                          )}
                        </ul>
                      </div>

                      {/* Right: Weekly Lectures */}
                      <div className="md:w-1/3 shrink-0 flex flex-col md:items-end justify-center">
                        <div className="text-left md:text-right">
                          <span className="text-3xl font-black text-blue-600 leading-none block">{selectedTeacherSlots.length}</span>
                          <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest mt-1 block">Weekly Lectures</span>
                        </div>
                      </div>
                    </div>

                    {/* Teacher Read Only Grid Table */}
                    {activePeriodsList.length === 0 ? (
                      <div className="py-24 text-center flex-grow">No periods configured.</div>
                    ) : (
                      <table className="w-full text-left min-w-[850px] border-collapse flex flex-col h-full flex-grow">
                        <thead className="bg-slate-50/55 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest select-none block shrink-0">
                          <tr className="flex w-full items-center h-14">
                            <th className="pl-6 border-r border-slate-100 shrink-0 flex items-center h-full sticky left-0 z-30 bg-slate-50" style={{ width: '130px' }}>Time / Period</th>
                            {daysOfWeek.map(day => (
                              <th key={day} className="flex-1 min-w-[230px] flex items-center justify-center border-r border-slate-100 last:border-r-0 tracking-widest font-black h-full">
                                {day}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y-0 flex flex-col flex-1 min-h-0">
                          {activePeriodsList.map((periodObj) => (
                            <tr key={periodObj._id} className="flex w-full items-stretch flex-1 min-h-[72px] transition-all duration-300 group hover:bg-slate-50/10">
                              {/* Hours label */}
                              <td className="pl-6 font-extrabold text-slate-800 bg-white group-hover:bg-slate-50 border-r border-slate-200/80 text-left select-none pr-4 shrink-0 flex flex-col justify-center overflow-hidden h-full sticky left-0 z-10 transition-colors duration-200" style={{ width: '130px' }}>
                                <div className="text-[13px] font-semibold tracking-tight text-brand-blue-700 leading-none">{periodObj.name}</div>
                                <div className="text-[11px] font-medium text-slate-500 mt-2.5 flex items-center gap-1 leading-none">
                                  <span>🕓</span>
                                  <span className="whitespace-nowrap">{periodObj.startTime} – {periodObj.endTime}</span>
                                </div>
                              </td>
                              {/* Read-only cells */}
                              {daysOfWeek.map((day) => {
                                const tSlot = selectedTeacherSlots.find(s => s.day === day && (s.period?._id || s.period) === periodObj._id)
                                return (
                                  <td key={day} className="flex-1 min-w-[230px] px-2 border-r border-slate-100 last:border-r-0 text-center overflow-hidden flex flex-col justify-center h-full">
                                    <TimetableCell slot={tSlot} showTeacherView={true} />
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </>
                )}
              </div>

              {/* Close footer action */}
              <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-center shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTeacherTimetableOpen(false)}
                  className="h-10 px-5 border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-550 rounded-full cursor-pointer"
                >
                  Close
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
