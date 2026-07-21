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
  X,
  Edit3,
  Trash2,
  MapPin,
  User,
  Lock,
  Unlock,
  Download,
  CheckSquare,
  TrendingUp,
  Search,
  Settings
} from 'lucide-react'
import api from '@/services/api'
import { cn } from '@/utils/cn'
import DashboardStatCard from '@/components/common/DashboardStatCard'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const spring = { type: 'spring', stiffness: 350, damping: 28 }

const classesList = [
  'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11 Science', 'Class 11 Commerce',
  'Class 12 Science', 'Class 12 Commerce'
]

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

// Status pill formatting helper
const getStatusBadge = (status) => {
  switch (status) {
    case 'Present':
      return 'bg-emerald-55 text-emerald-700 border-emerald-100'
    case 'Absent':
      return 'bg-rose-55 text-rose-700 border-rose-100'
    case 'Late':
      return 'bg-amber-55 text-amber-700 border-amber-100'
    case 'Leave':
      return 'bg-blue-55 text-blue-700 border-blue-100'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-100'
  }
}

export default function Attendance() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [attendanceSessions, setAttendanceSessions] = useState([])
  const [dashboardStats, setDashboardStats] = useState({
    totalSessions: 0,
    attendanceSubmitted: 0,
    pendingAttendance: 0,
    overallAttendancePercentage: 0
  })
  
  const [teachers, setTeachers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filters & State
  const [classFilter, setClassFilter] = useState('')
  const [teacherFilter, setTeacherFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])

  // Modals state
  const [isLectureSelectOpen, setIsLectureSelectOpen] = useState(false)
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedSessionForView, setSelectedSessionForView] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  // Lecture Selection modal states
  const [modalClass, setModalClass] = useState('Class 1')
  const [modalDate, setModalDate] = useState(new Date().toISOString().split('T')[0])
  const [todaySlots, setTodaySlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  
  // Student Marking modal states
  const [students, setStudents] = useState([])
  const [markedRecords, setMarkedRecords] = useState({})
  const [remarks, setRemarks] = useState({})
  const [editSessionId, setEditSessionId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [modalStudentSearch, setModalStudentSearch] = useState('')

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => {
      setToast(null)
    }, 4500)
  }

  // System Settings Config
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsData, setSettingsData] = useState({
    attendanceThreshold: 75,
    lateThreshold: 15,
    attendanceLockTime: 24,
    defaultStatus: 'Present',
    weekendAttendance: false,
    autoLockAttendance: true,
    enableRemarks: true,
    enableLeave: true
  })

  const handleClearFilters = () => {
    setClassFilter('')
    setTeacherFilter('')
    setSubjectFilter('')
    setDateFilter(new Date().toISOString().split('T')[0])
    setSearchQuery('')
  }

  const fetchSettings = async () => {
    try {
      const res = await api.get('/attendance/settings')
      if (res && res.success && res.data) {
        setSettingsData(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err)
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await api.put('/attendance/settings', settingsData)
      if (res && res.success) {
        showToast('success', 'Attendance settings updated successfully!')
        setIsSettingsOpen(false)
      }
    } catch (err) {
      console.error('Failed to save settings:', err)
      showToast('error', err.response?.data?.message || 'Failed to update settings.')
    } finally {
      setSubmitting(false)
    }
  }

  // Load teachers list
  const fetchTeachers = async () => {
    try {
      const res = await api.get('/teachers', { params: { limit: 1000 } })
      if (res && res.success && res.data) {
        setTeachers(res.data.teachers || [])
      }
    } catch (err) {
      console.error('Failed to load teachers:', err)
    }
  }

  // Load subjects list
  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects', { params: { limit: 1000 } })
      if (res && res.success && res.data) {
        setSubjects(res.data.subjects || [])
      }
    } catch (err) {
      console.error('Failed to load subjects:', err)
    }
  }

  // Fetch Attendance Sessions + overall stats
  const fetchAttendanceData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/attendance', {
        params: {
          classId: classFilter || undefined,
          teacherId: teacherFilter || undefined,
          subjectId: subjectFilter || undefined,
          date: dateFilter || undefined
        }
      })
      if (res && res.success && res.data) {
        setAttendanceSessions(res.data.sessions || [])
        setDashboardStats(res.data.stats || {
          totalSessions: 0,
          attendanceSubmitted: 0,
          pendingAttendance: 0,
          overallAttendancePercentage: 0
        })
      }
    } catch (err) {
      console.error('Fetch attendance error:', err)
      setError(err.message || 'Server error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    fetchTeachers()
    fetchSubjects()
    fetchSettings()
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return
    fetchAttendanceData()
  }, [classFilter, teacherFilter, subjectFilter, dateFilter, isAuthenticated])

  // Fetch active timetable slots for selected date & class in Selection Modal
  const fetchModalSlots = async () => {
    if (!modalClass || !modalDate) return
    try {
      const res = await api.get('/attendance/timetable-status', {
        params: { date: modalDate, classId: modalClass }
      })
      if (res && res.success) {
        setTodaySlots(res.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch modal slots:', err)
    }
  }

  useEffect(() => {
    if (isLectureSelectOpen) {
      fetchModalSlots()
    }
  }, [modalClass, modalDate, isLectureSelectOpen])

  // Trigger Lecture Selection Modal
  const handleOpenLectureSelect = () => {
    setEditSessionId(null)
    setSelectedSlot(null)
    setStudents([])
    setMarkedRecords({})
    setRemarks({})
    setModalClass(classFilter || 'Class 1')
    setModalDate(dateFilter || new Date().toISOString().split('T')[0])
    setIsLectureSelectOpen(true)
  }

  const handleSelectSlotForEdit = async (slot) => {
    setIsLectureSelectOpen(false)
    await handleTriggerEdit({ _id: slot.attendanceSessionId })
  }

  // Handle clicking take attendance on a slot (Create Mode)
  const handleSelectSlot = async (slot) => {
    // Mark Mode (Create)
    setSelectedSlot(slot)
    setEditSessionId(null)
    setLoading(true)

    try {
      // Fetch active students enrolled in this class
      const res = await api.get('/students', {
        params: { page: 1, limit: 1000, class: slot.class, status: 'Active' }
      })

      if (res && res.success && res.data && res.data.students) {
        const classStudents = res.data.students
        setStudents(classStudents)

        // Default all student statuses to "Present"
        const initialMarked = {}
        const initialRemarks = {}
        classStudents.forEach(st => {
          initialMarked[st._id] = 'Present'
          initialRemarks[st._id] = ''
        })
        setMarkedRecords(initialMarked)
        setRemarks(initialRemarks)

        setIsLectureSelectOpen(false)
        setIsMarkModalOpen(true)
      } else {
        showToast('error', 'No active students found in this class.')
      }
    } catch (err) {
      console.error('Load class students error:', err)
      showToast('error', 'Failed to load students list.')
    } finally {
      setLoading(false)
    }
  }

  // Load existing session details and populate form for Edit Mode
  const handleTriggerEdit = async (sessionObj) => {
    setLoading(true)
    try {
      const res = await api.get(`/attendance/${sessionObj._id}`)
      if (res && res.success && res.data) {
        const { session, records } = res.data
        setEditSessionId(session._id)
        setSelectedSlot({
          ...(session.timetableSlotId || {}),
          class: session.classId,
          subject: session.subjectId,
          teacher: session.teacherId,
          period: session.periodId,
          day: session.day
        })
        setModalClass(session.classId)
        setModalDate(new Date(session.date).toISOString().split('T')[0])
        
        const activeStudents = records.map(r => r.studentId)
        setStudents(activeStudents)

        const initialMarked = {}
        const initialRemarks = {}
        records.forEach(r => {
          initialMarked[r.studentId._id || r.studentId] = r.status
          initialRemarks[r.studentId._id || r.studentId] = r.remarks || ''
        })
        setMarkedRecords(initialMarked)
        setRemarks(initialRemarks)
        
        setIsLectureSelectOpen(false)
        setIsMarkModalOpen(true)
      }
    } catch (err) {
      console.error('Failed to load session details for edit:', err)
      showToast('error', 'Failed to load session details.')
    } finally {
      setLoading(false)
    }
  }

  // Save or Update Attendance Submission
  const handleSaveAttendance = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    // Check if status is marked for all students (no empty values allowed)
    const unselected = students.some(st => !markedRecords[st._id])
    if (unselected) {
      showToast('error', 'Please specify attendance status for all students.')
      setSubmitting(false)
      return
    }

    try {
      const recordsPayload = students.map(st => ({
        studentId: st._id,
        status: markedRecords[st._id],
        remarks: remarks[st._id] || ''
      }))

      let res;
      if (editSessionId) {
        // Update Attendance Records
        res = await api.put(`/attendance/${editSessionId}`, { records: recordsPayload })
      } else {
        // Create Attendance Session & Records
        const payload = {
          timetableSlotId: selectedSlot._id,
          classId: modalClass,
          subjectId: selectedSlot.subject?._id || selectedSlot.subject,
          teacherId: selectedSlot.teacher?._id || selectedSlot.teacher,
          periodId: selectedSlot.period?._id || selectedSlot.period,
          day: selectedSlot.day,
          date: modalDate,
          records: recordsPayload
        }
        res = await api.post('/attendance', payload)
      }

      if (res && res.success) {
        showToast('success', editSessionId ? 'Attendance records updated successfully.' : 'Attendance recorded successfully.')
        setIsMarkModalOpen(false)
        setEditSessionId(null)
        setSelectedSlot(null)
        fetchAttendanceData()
      } else {
        showToast('error', res.message || 'Operation failed')
      }
    } catch (err) {
      console.error('Save attendance error:', err)
      showToast('error', err.response?.data?.message || err.message || 'API error')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete attendance session
  const handleDeleteSession = async (sessionObj) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this attendance session? All student records for this lecture will be removed.')
    if (!confirmDelete) return

    try {
      const res = await api.delete(`/attendance/${sessionObj._id}`)
      if (res && res.success) {
        showToast('success', 'Attendance session deleted successfully.')
        fetchAttendanceData()
      }
    } catch (err) {
      console.error('Delete attendance error:', err)
      showToast('error', err.message || 'Delete operation failed')
    }
  }

  // Toggle lock/unlock status (Admin override)
  const handleToggleLock = async (sessionObj) => {
    try {
      const res = await api.put(`/attendance/${sessionObj._id}`, { isLocked: !sessionObj.isLocked })
      if (res && res.success) {
        showToast('success', sessionObj.isLocked ? 'Attendance session unlocked successfully.' : 'Attendance session locked successfully.')
        fetchAttendanceData()
      }
    } catch (err) {
      console.error('Toggle lock error:', err)
      showToast('error', err.message || 'Lock operation failed')
    }
  }

  // Helper: Open View Details modal
  const handleOpenViewModal = async (sessionObj) => {
    try {
      const res = await api.get(`/attendance/${sessionObj._id}`)
      if (res && res.success) {
        setSelectedSessionForView(res.data)
        setIsViewModalOpen(true)
      }
    } catch (err) {
      console.error('View details error:', err)
      showToast('error', 'Failed to retrieve attendance details.')
    }
  }

  // Bulk Actions
  const handleMarkAllPresent = () => {
    const nextMarked = { ...markedRecords }
    students.forEach(st => {
      nextMarked[st._id] = 'Present'
    })
    setMarkedRecords(nextMarked)
  }

  const handleMarkAllAbsent = () => {
    const nextMarked = { ...markedRecords }
    students.forEach(st => {
      nextMarked[st._id] = 'Absent'
    })
    setMarkedRecords(nextMarked)
  }

  const handleClearAll = () => {
    const nextMarked = {}
    students.forEach(st => {
      nextMarked[st._id] = ''
    })
    setMarkedRecords(nextMarked)
  }

  const handleMarkRemainingPresent = () => {
    const nextMarked = { ...markedRecords }
    students.forEach(st => {
      if (!nextMarked[st._id]) {
        nextMarked[st._id] = 'Present'
      }
    })
    setMarkedRecords(nextMarked)
  }

  // Export reports to Excel (CSV format)
  const handleExportExcel = () => {
    if (!attendanceSessions || attendanceSessions.length === 0) {
      showToast('error', 'No attendance records to export.')
      return
    }

    const headers = ['Date', 'Class', 'Subject', 'Teacher', 'Period', 'Attendance Rate', 'Students Present', 'Students Absent', 'Status', 'Locked']
    const rows = attendanceSessions.map(session => [
      new Date(session.date).toLocaleDateString(),
      session.classId,
      session.subjectId?.name || 'N/A',
      session.teacherId ? `${session.teacherId.firstName || ''} ${session.teacherId.lastName || ''}`.trim() : 'N/A',
      session.periodId?.name || 'N/A',
      `${session.stats?.attendancePercentage || 0}%`,
      session.stats?.presentCount || 0,
      session.stats?.absentCount || 0,
      session.status,
      session.isLocked ? 'Yes' : 'No'
    ])

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Attendance_Report_${classFilter || 'All'}_${dateFilter}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredSessions = attendanceSessions.filter(session => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const classMatch = (session.classId || '').toLowerCase().includes(q)
    const subjectMatch = (session.subjectId?.name || '').toLowerCase().includes(q)
    const teacherName = session.teacherId 
      ? `${session.teacherId.firstName || ''} ${session.teacherId.lastName || ''}`.toLowerCase()
      : ''
    const teacherMatch = teacherName.includes(q)
    return classMatch || subjectMatch || teacherMatch
  })

  return (
    <div className="flex-1 w-full h-full text-slate-800 flex flex-col gap-5 select-none min-h-0 bg-transparent print:bg-white print:p-0 print:m-0">
      
      {/* Inject print-only stylesheet */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: portrait;
            margin: 1cm;
          }
          body, html, #root {
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            color: black !important;
          }
          aside, nav, header, button, .print\\:hidden {
            display: none !important;
          }
          main, .flex, .min-h-screen, div {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-main-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            padding: 8px !important;
            text-align: left !important;
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
            <span className="text-brand-blue-600">Attendance</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none mt-1">
            Attendance Management
          </h2>
          <p className="text-[11px] font-bold text-slate-400 mt-1.5">
            Mark student attendance, override submissions, lock sessions, and view reports
          </p>
        </div>
      </div>

      {/* Stats cards grid */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', 
          gap: '16px' 
        }} 
        className="shrink-0 print:hidden"
      >
        <DashboardStatCard
          title="Today's Sessions"
          value={dashboardStats.totalSessions}
          subtitle="Scheduled Lectures"
          icon={Clock}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-500"
          className="py-3 px-5"
        />
        <DashboardStatCard
          title="Attendance Submitted"
          value={dashboardStats.attendanceSubmitted}
          subtitle="Recorded Sessions"
          icon={Check}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-500"
          valueColor="text-emerald-600"
          className="py-3 px-5"
        />
        <DashboardStatCard
          title="Pending Attendance"
          value={dashboardStats.pendingAttendance}
          subtitle="Awaiting Marking"
          icon={Calendar}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-500"
          valueColor="text-amber-650"
          className="py-3 px-5"
        />
        <DashboardStatCard
          title="Overall Attendance %"
          value={`${dashboardStats.overallAttendancePercentage}%`}
          subtitle="Average Rate"
          icon={CheckSquare}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-500"
          valueColor="text-purple-650"
          className="py-3 px-5"
        />
      </div>

      {/* 2. Controls & Filters Row */}
      <div 
        style={{ borderRadius: '24px', border: '1px solid #ECECEC' }}
        className="py-5 px-6 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 print:hidden"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-52 h-10">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-full w-full pl-10 pr-4 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-xs font-semibold rounded-full focus:outline-none transition-all placeholder:text-slate-400 shadow-sm"
            />
          </div>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="h-10 w-40 px-4 bg-white border border-slate-200 rounded-full text-xs font-extrabold text-slate-550 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
          >
            <option value="">All Classes</option>
            {classesList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            className="h-10 w-44 px-4 bg-white border border-slate-200 rounded-full text-xs font-extrabold text-slate-550 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
          >
            <option value="">All Teachers</option>
            {teachers.map(t => (
              <option key={t._id} value={t._id}>
                {`${t.firstName || ''} ${t.lastName || ''}`.trim()}
              </option>
            ))}
          </select>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="h-10 w-44 px-4 bg-white border border-slate-200 rounded-full text-xs font-extrabold text-slate-550 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
          >
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-10 w-40 px-4 bg-white border border-slate-200 rounded-full text-xs font-extrabold text-slate-555 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
          />

          <button
            onClick={handleClearFilters}
            className="h-10 px-4.5 border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-500 rounded-full flex items-center justify-center cursor-pointer transition-colors active:scale-95 shadow-sm"
            title="Clear All Filters"
          >
            Clear Filters
          </button>

          <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden md:block" />

          {/* Renamed "Take Attendance" button */}
          <button
            onClick={handleOpenLectureSelect}
            className="h-10 px-5 bg-brand-blue-500 hover:bg-brand-blue-600 text-xs font-extrabold text-white rounded-full flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Take Attendance</span>
          </button>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="h-10 px-4.5 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-555 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            title="Configure Thresholds / System Parameters"
          >
            <Settings className="h-4 w-4 text-slate-500" />
            <span>Attendance Settings</span>
          </button>
          <button
            onClick={() => navigate('/admin/attendance/history')}
            className="h-10 px-4.5 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-555 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            title="View Attendance History"
          >
            <Calendar className="h-4 w-4 text-brand-blue-500" />
            <span>Attendance History</span>
          </button>
          <button
            onClick={() => navigate('/admin/attendance/analytics')}
            className="h-10 px-4.5 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-555 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            title="View Attendance Analytics"
          >
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span>Attendance Analytics</span>
          </button>
        </div>
      </div>

      {/* Print-only Header block */}
      <div className="hidden print:flex items-center justify-between border-b border-slate-200 pb-4 mb-6 select-none w-full">
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
          <h2 className="text-xs font-black text-slate-800">Student Attendance Report</h2>
          <p className="text-[10px] font-extrabold text-blue-600 uppercase">
            Filter: {classFilter || 'All Classes'} | Date: {dateFilter || 'All Dates'}
          </p>
          <p className="text-[8px] text-slate-400 font-semibold mt-0.5">Generated Date: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* 3. Main Attendance Table Card */}
      <div 
        style={{ borderRadius: '28px', border: '1px solid #ECECEC', padding: '28px' }}
        className="bg-white shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex-grow flex flex-col justify-between overflow-hidden min-h-0 print:border-none print:shadow-none print:p-0 print-main-card"
      >
        <div className="overflow-y-auto overflow-x-auto custom-scrollbar flex-grow min-h-0 pr-1 print:overflow-visible">
          <table className="w-full text-left min-w-[950px] border-collapse">
            <thead className="bg-slate-50/55 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest select-none sticky top-0 bg-white z-10">
              <tr>
                <th className="py-4 pl-7 text-left">Date</th>
                <th className="py-4 px-4">Class</th>
                <th className="py-4 px-4">Subject</th>
                <th className="py-4 px-4">Teacher</th>
                <th className="py-4 px-4">Period</th>
                <th className="py-4 px-4 text-center">Attendance %</th>
                <th className="py-4 px-4 text-center">Present</th>
                <th className="py-4 px-4 text-center">Absent</th>
                <th className="py-4 px-4 text-center">Late</th>
                <th className="py-4 px-4 text-center">Status</th>
                <th className="py-4 px-7 text-center print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-semibold text-xs text-slate-700">
              {loading ? (
                <tr className="print:hidden">
                  <td colSpan="10" className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="h-7 w-7 text-blue-500 animate-spin" />
                      <span className="text-xs font-bold text-slate-400">Loading attendance reports...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Calendar className="h-8 w-8 text-slate-350" />
                      <span className="text-xs font-black text-slate-455">No matching attendance sessions found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr 
                    key={session._id} 
                    className="hover:bg-slate-50/65 group transition-colors cursor-pointer"
                    onClick={() => handleOpenViewModal(session)}
                  >
                    <td className="py-4 pl-7 text-slate-800 font-extrabold">
                      {new Date(session.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-4 font-black text-brand-blue-700">{session.classId}</td>
                    <td className="py-4 px-4 text-slate-800 font-bold">{session.subjectId?.name || 'N/A'}</td>
                    <td className="py-4 px-4 text-slate-500">
                      {session.teacherId ? `${session.teacherId.firstName || ''} ${session.teacherId.lastName || ''}`.trim() : 'Unassigned'}
                    </td>
                    <td className="py-4 px-4 text-slate-400">
                      <span className="font-extrabold text-slate-650">{session.periodId?.name || 'N/A'}</span>
                      {session.periodId?.startTime && (
                        <span className="text-[10px] block mt-0.5 font-medium text-slate-400">({session.periodId.startTime} - {session.periodId.endTime})</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={cn(
                        "font-black text-sm",
                        (session.stats?.attendancePercentage || 0) >= 80 ? "text-emerald-600" : (session.stats?.attendancePercentage || 0) >= 50 ? "text-amber-500" : "text-rose-500"
                      )}>
                        {session.stats?.attendancePercentage || 0}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-emerald-650 font-bold">
                      {session.stats?.presentCount || 0}
                    </td>
                    <td className="py-4 px-4 text-center text-rose-550 font-bold">
                      {session.stats?.absentCount || 0}
                    </td>
                    <td className="py-4 px-4 text-center text-amber-555 font-bold">
                      {session.stats?.lateCount || 0}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex px-2.5 py-1 text-[10px] font-black rounded-full border bg-slate-50 border-slate-100 text-slate-600 uppercase tracking-wider">
                        {session.status}
                      </span>
                    </td>
                    <td className="py-4 px-7 text-center print:hidden" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        {/* Lock / Unlock Toggle button */}
                        <button
                          onClick={() => handleToggleLock(session)}
                          className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center transition-all border",
                            session.isLocked 
                              ? "bg-rose-50 hover:bg-rose-100 border-rose-100 text-rose-600" 
                              : "bg-emerald-50 hover:bg-emerald-100 border-emerald-100 text-emerald-600"
                          )}
                          title={session.isLocked ? "Unlock Attendance Session" : "Lock Attendance Session"}
                        >
                          {session.isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                        </button>
                        
                        {/* Edit Button */}
                        <button
                          onClick={() => handleTriggerEdit(session)}
                          className="h-8 w-8 rounded-full border border-slate-100 hover:bg-slate-50 text-slate-555 hover:text-blue-600 flex items-center justify-center transition-all"
                          title="Edit Session Records"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteSession(session)}
                          className="h-8 w-8 rounded-full border border-slate-100 hover:bg-red-50 text-slate-555 hover:text-red-655 flex items-center justify-center transition-all"
                          title="Delete Session"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* A. LECTURE SELECTION MODAL */}
      <AnimatePresence>
        {isLectureSelectOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={spring}
              className="bg-white w-full max-w-2xl shadow-premium-4 flex flex-col relative max-h-[85vh]"
              style={{ borderRadius: '28px', border: '1px solid #ECECEC' }}
            >
              {/* Header */}
              <div className="p-7 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="text-left">
                  <h3 className="text-base font-black text-slate-800 tracking-tight leading-none uppercase">
                    Select Lecture Slot
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">
                    Select a class and date below to see today's scheduled lectures list
                  </p>
                </div>
                <button
                  onClick={() => setIsLectureSelectOpen(false)}
                  className="h-8.5 w-8.5 rounded-full border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors shadow-sm cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Selection Content */}
              <div className="p-7 overflow-y-auto flex-grow flex flex-col min-h-0 space-y-5 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-black uppercase text-slate-405 tracking-wider">Target Class</label>
                    <select
                      value={modalClass}
                      onChange={(e) => setModalClass(e.target.value)}
                      className="h-10 w-full px-4 bg-white border border-slate-200 rounded-[14px] text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {classesList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-black uppercase text-slate-405 tracking-wider">Date</label>
                    <input
                      type="date"
                      value={modalDate}
                      onChange={(e) => setModalDate(e.target.value)}
                      className="h-10 w-full px-4 bg-white border border-slate-200 rounded-[14px] text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-3 flex-grow flex flex-col min-h-0">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Scheduled Lectures for {modalClass} ({todaySlots.length})
                  </h4>

                  <div className="overflow-y-auto flex-grow pr-1 custom-scrollbar min-h-0 space-y-2.5">
                    {todaySlots.length === 0 ? (
                      <div className="py-20 border border-dashed border-slate-200 rounded-[20px] text-center text-xs font-bold text-slate-450">
                        No scheduled lectures found on {new Date(modalDate).toLocaleDateString()}.
                      </div>
                    ) : (
                      todaySlots.map((slot) => {
                        const subColor = slot.subject?.color || getSubjectColor(slot.subject?.name)
                        return (
                          <div
                            key={slot._id}
                            className="p-4 border border-slate-200 rounded-[20px] flex items-center justify-between gap-4 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.015)] hover:border-blue-400 hover:bg-slate-50/20"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div 
                                className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 select-none"
                                style={{ backgroundColor: `${subColor}15`, color: subColor }}
                              >
                                {slot.period?.name?.replace('Period ', '') || 'P'}
                              </div>
                              <div className="text-left min-w-0 space-y-0.5">
                                <h5 className="text-[13px] font-semibold text-slate-800 leading-tight truncate">{slot.subject?.name}</h5>
                                <div className="text-[10px] font-medium text-slate-455 truncate">
                                  Class: {slot.class} | Teacher: {slot.teacher ? `${slot.teacher.firstName || ''} ${slot.teacher.lastName || ''}`.trim() : 'Unassigned'}
                                </div>
                                <div className="text-[9.5px] font-medium text-slate-400 flex items-center gap-1 mt-0.5 leading-none">
                                  <Clock className="h-3 w-3" />
                                  <span>{slot.period?.name} ({slot.period?.startTime} – {slot.period?.endTime})</span>
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {slot.attendanceStatus === 'Marked' ? (
                                <div className="flex items-center gap-2">
                                  <span className="h-8.5 px-3 rounded-full border border-emerald-250 bg-emerald-50 text-[10px] font-black uppercase text-emerald-650 flex items-center gap-1 select-none">
                                    <Check className="h-3.5 w-3.5" />
                                    <span>Submitted</span>
                                  </span>
                                  <button
                                    onClick={() => handleSelectSlotForEdit(slot)}
                                    className="h-8.5 px-3.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-[10px] font-black uppercase text-slate-700 rounded-full flex items-center justify-center cursor-pointer transition-all shadow-sm active:scale-95"
                                  >
                                    Edit
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleSelectSlot(slot)}
                                  className="h-8.5 px-4 bg-brand-blue-500 hover:bg-brand-blue-600 text-[10px] font-black uppercase text-white rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-sm active:scale-95"
                                >
                                  <span>Take Attendance</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
                <button
                  onClick={() => setIsLectureSelectOpen(false)}
                  className="h-10 px-5 border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-550 rounded-full cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* B. STUDENT ATTENDANCE MODAL (MARK/EDIT) */}
      <AnimatePresence>
        {isMarkModalOpen && selectedSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={spring}
              className="bg-white w-full max-w-4xl shadow-premium-4 flex flex-col relative max-h-[92vh]"
              style={{ borderRadius: '28px', border: '1px solid #ECECEC' }}
            >
              {/* Header */}
              <div className="p-7 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="text-left">
                  <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none">
                    {editSessionId ? 'Edit Student Attendance' : 'Record Student Attendance'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">
                    Select a status chip for each student below
                  </p>
                </div>
                <button
                  disabled={submitting}
                  onClick={() => {
                    setIsMarkModalOpen(false)
                    setEditSessionId(null)
                    setSelectedSlot(null)
                    setModalStudentSearch('')
                  }}
                  className="h-9 w-9 rounded-full border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-7 flex flex-col min-h-0 space-y-5 text-left">
                                {/* Read-Only Top Details card */}
                <div className="bg-slate-50/50 p-5 border border-slate-200/60 rounded-[20px] grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-700 select-none shrink-0">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Subject</span>
                    <span className="font-extrabold text-slate-800 text-sm mt-0.5 block">{selectedSlot.subject?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Teacher</span>
                    <span className="font-bold text-slate-705 text-xs mt-0.5 block">
                      {selectedSlot.teacher ? `${selectedSlot.teacher.firstName || ''} ${selectedSlot.teacher.lastName || ''}`.trim() : 'Unassigned'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Class / Period</span>
                    <span className="font-extrabold text-brand-blue-700 text-xs mt-0.5 block">
                      {selectedSlot.class} — {selectedSlot.period?.name || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Date / Timing</span>
                    <span className="font-bold text-slate-705 text-xs mt-0.5 block">
                      {new Date(modalDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                      {selectedSlot.period?.startTime && ` (${selectedSlot.period.startTime} - ${selectedSlot.period.endTime})`}
                    </span>
                  </div>
                </div>

                {/* Bulk Actions row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 shrink-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleMarkAllPresent}
                      className="h-8.5 px-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-150 text-[10px] font-black text-emerald-650 rounded-full cursor-pointer uppercase tracking-wider transition-all"
                    >
                      Mark All Present
                    </button>
                    <button
                      type="button"
                      onClick={handleMarkAllAbsent}
                      className="h-8.5 px-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-150 text-[10px] font-black text-rose-650 rounded-full cursor-pointer uppercase tracking-wider transition-all"
                    >
                      Mark All Absent
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="h-8.5 px-3.5 border border-slate-200 hover:bg-slate-50 text-[10px] font-black text-slate-500 rounded-full cursor-pointer uppercase tracking-wider transition-all"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={handleMarkRemainingPresent}
                      className="h-8.5 px-3.5 bg-blue-50 hover:bg-blue-100 border border-blue-150 text-[10px] font-black text-blue-650 rounded-full cursor-pointer uppercase tracking-wider transition-all"
                      title="Set all unmarked students to Present"
                    >
                      Mark Remaining Present
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative w-52 h-8.5">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search student..."
                        value={modalStudentSearch}
                        onChange={(e) => setModalStudentSearch(e.target.value)}
                        className="h-full w-full pl-8.5 pr-3 bg-slate-50 border border-slate-200 focus:border-blue-450 focus:bg-white text-[11px] font-semibold rounded-full focus:outline-none transition-all placeholder:text-slate-405"
                      />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Count: {students.length}
                    </span>
                  </div>
                </div>

                {/* Student list */}
                <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar min-h-0 space-y-2.5">
                  {(() => {
                    const filteredStudentsInModal = students.filter(st => {
                      if (!modalStudentSearch) return true;
                      const q = modalStudentSearch.toLowerCase();
                      const fullName = `${st.firstName || ''} ${st.lastName || ''}`.toLowerCase();
                      const rollNo = (st.studentId || '').toLowerCase();
                      return fullName.includes(q) || rollNo.includes(q);
                    });

                    if (filteredStudentsInModal.length === 0) {
                      return (
                        <div className="py-24 text-center text-slate-400 font-bold border border-dashed border-slate-150 rounded-2xl">
                          No matching students found.
                        </div>
                      );
                    }

                    return filteredStudentsInModal.map((st) => {
                      const initial = st.firstName?.charAt(0) || 'S'
                      const status = markedRecords[st._id]
                      
                      return (
                        <div
                          key={st._id}
                          className="p-3 border border-slate-200/80 rounded-2xl hover:bg-slate-50/15 flex flex-col md:flex-row md:items-center justify-between gap-3 text-left transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {st.photo?.secure_url ? (
                              <img
                                src={st.photo.secure_url}
                                alt={st.firstName}
                                className="h-9.5 w-9.5 rounded-full object-cover shrink-0 select-none bg-slate-100"
                              />
                            ) : (
                              <div className="h-9.5 w-9.5 rounded-full bg-brand-blue-50/80 text-brand-blue-655 flex items-center justify-center font-black text-xs shrink-0 select-none border border-brand-blue-100/50">
                                {initial}
                              </div>
                            )}

                            <div className="text-left min-w-0 space-y-0.5">
                              <h5 className="text-[13px] font-semibold text-slate-855 leading-tight truncate">
                                {`${st.firstName || ''} ${st.lastName || ''}`.trim()}
                              </h5>
                              <div className="text-[9.5px] font-bold text-slate-400 tracking-wide uppercase leading-none">
                                Roll No: {st.studentId || 'N/A'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center flex-wrap gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setMarkedRecords(prev => ({ ...prev, [st._id]: 'Present' }))}
                              className={cn(
                                "px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer",
                                status === 'Present' 
                                  ? "bg-emerald-500 border-emerald-500 text-white shadow-sm" 
                                  : "bg-white border-slate-200 text-slate-450 hover:bg-slate-50"
                              )}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => setMarkedRecords(prev => ({ ...prev, [st._id]: 'Absent' }))}
                              className={cn(
                                "px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer",
                                status === 'Absent' 
                                  ? "bg-rose-500 border-rose-500 text-white shadow-sm" 
                                  : "bg-white border-slate-200 text-slate-450 hover:bg-slate-50"
                              )}
                            >
                              Absent
                            </button>
                            <button
                              type="button"
                              onClick={() => setMarkedRecords(prev => ({ ...prev, [st._id]: 'Late' }))}
                              className={cn(
                                "px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer",
                                status === 'Late' 
                                  ? "bg-amber-500 border-amber-500 text-white shadow-sm" 
                                  : "bg-white border-slate-200 text-slate-450 hover:bg-slate-50"
                              )}
                            >
                              Late
                            </button>
                            <button
                              type="button"
                              onClick={() => setMarkedRecords(prev => ({ ...prev, [st._id]: 'Leave' }))}
                              className={cn(
                                "px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer",
                                status === 'Leave' 
                                  ? "bg-blue-500 border-blue-500 text-white shadow-sm" 
                                  : "bg-white border-slate-200 text-slate-450 hover:bg-slate-50"
                              )}
                            >
                              Leave
                            </button>

                            <div className="h-5 w-[1px] bg-slate-250 mx-1 hidden md:block" />

                            <input
                              type="text"
                              placeholder="Add notes..."
                              value={remarks[st._id] || ''}
                              onChange={(e) => setRemarks(prev => ({ ...prev, [st._id]: e.target.value }))}
                              className="h-8.5 w-36 px-3 border border-slate-200/80 rounded-xl text-[10px] font-semibold text-slate-700 bg-slate-50/50 focus:outline-none focus:bg-white focus:border-blue-400 transition-all placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-7 border-t border-slate-100 flex items-center justify-between shrink-0 select-none">
                <button
                  type="button"
                  disabled={submitting || !!editSessionId}
                  onClick={() => {
                    setIsMarkModalOpen(false)
                    setIsLectureSelectOpen(true)
                  }}
                  className="h-10 px-4 border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-550 rounded-full cursor-pointer disabled:opacity-40"
                >
                  Back to Lecture Slots
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setIsMarkModalOpen(false)
                      setEditSessionId(null)
                      setSelectedSlot(null)
                    }}
                    className="h-10 px-5 border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-555 rounded-full cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleSaveAttendance}
                    disabled={submitting || students.length === 0}
                    className="h-10 px-6 bg-brand-blue-500 hover:bg-brand-blue-600 text-xs font-extrabold text-white rounded-full cursor-pointer shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all active:scale-95"
                  >
                    {submitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                    <span>Save Attendance</span>
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* C. VIEW ATTENDANCE SESSION DETAILS MODAL */}
      <AnimatePresence>
        {isViewModalOpen && selectedSessionForView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={spring}
              className="bg-white w-full max-w-3xl shadow-premium-4 flex flex-col relative max-h-[90vh]"
              style={{ borderRadius: '28px', border: '1px solid #ECECEC' }}
            >
              {/* Modal Header */}
              <div className="p-7 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="text-left">
                  <h3 className="text-base font-black text-slate-800 tracking-tight leading-none uppercase">
                    Attendance Log Details
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">
                    Read-only record list of marked students and statistics
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false)
                    setSelectedSessionForView(null)
                  }}
                  className="h-8.5 w-8.5 rounded-full border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors shadow-sm cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-7 overflow-y-auto flex-grow space-y-6 text-left min-h-0">
                {/* Stats Summary Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-150/60 select-none">
                  <div className="text-left">
                    <span className="text-[9px] font-black text-slate-405 uppercase tracking-widest">Attendance Rate</span>
                    <h5 className="text-lg font-black text-brand-blue-700 mt-0.5">
                      {selectedSessionForView.session.stats?.attendancePercentage || 0}%
                    </h5>
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] font-black text-slate-405 uppercase tracking-widest">Present</span>
                    <h5 className="text-lg font-black text-emerald-600 mt-0.5">
                      {selectedSessionForView.session.stats?.presentCount || 0}
                    </h5>
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] font-black text-slate-405 uppercase tracking-widest">Absent</span>
                    <h5 className="text-lg font-black text-rose-600 mt-0.5">
                      {selectedSessionForView.session.stats?.absentCount || 0}
                    </h5>
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] font-black text-slate-405 uppercase tracking-widest">Late / Leave</span>
                    <h5 className="text-lg font-black text-slate-700 mt-0.5">
                      {(selectedSessionForView.session.stats?.lateCount || 0) + (selectedSessionForView.session.stats?.leaveCount || 0)}
                    </h5>
                  </div>
                </div>

                {/* Details list */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2 border-t border-slate-100 pt-5">
                  <div className="space-y-0.5">
                    <span className="text-[8.5px] font-black uppercase text-slate-405 tracking-wider block">Class & Subject</span>
                    <p className="text-xs font-black text-slate-705">
                      {selectedSessionForView.session.classId} | {selectedSessionForView.session.subjectId?.name}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8.5px] font-black uppercase text-slate-405 tracking-wider block">Instructor</span>
                    <p className="text-xs font-black text-slate-705">
                      {selectedSessionForView.session.teacherId 
                        ? `${selectedSessionForView.session.teacherId.firstName || ''} ${selectedSessionForView.session.teacherId.lastName || ''}`.trim()
                        : 'Unassigned'}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8.5px] font-black uppercase text-slate-405 tracking-wider block">Period Slot</span>
                    <p className="text-xs font-black text-slate-705">
                      {selectedSessionForView.session.periodId?.name} ({selectedSessionForView.session.periodId?.startTime} - {selectedSessionForView.session.periodId?.endTime})
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8.5px] font-black uppercase text-slate-405 tracking-wider block">Marked Date</span>
                    <p className="text-xs font-black text-slate-705">
                      {new Date(selectedSessionForView.session.date).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8.5px] font-black uppercase text-slate-405 tracking-wider block">Marked By User</span>
                    <p className="text-xs font-black text-slate-750">
                      {selectedSessionForView.session.createdBy ? `${selectedSessionForView.session.createdBy.firstName || ''} ${selectedSessionForView.session.createdBy.lastName || ''}`.trim() : 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8.5px] font-black uppercase text-slate-405 tracking-wider block">Lock Status</span>
                    <p className="text-xs font-black text-slate-705 flex items-center gap-1.5">
                      {selectedSessionForView.session.isLocked ? (
                        <span className="text-rose-600 flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> Locked</span>
                      ) : (
                        <span className="text-emerald-600 flex items-center gap-1"><Unlock className="h-3.5 w-3.5" /> Unlocked</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Records list table */}
                <div className="border-t border-slate-100 pt-5 space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Enrolled Student Attendance Records ({selectedSessionForView.records.length})
                  </h4>

                  <div className="border border-slate-150/65 rounded-[20px] overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-[9.5px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 select-none">
                        <tr>
                          <th className="py-2.5 pl-5">Student Name</th>
                          <th className="py-2.5 px-3">Roll Number</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 pr-5">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-semibold">
                        {selectedSessionForView.records.map(rec => {
                          const st = rec.studentId || {}
                          return (
                            <tr key={rec._id}>
                              <td className="py-3 pl-5 font-black text-slate-800">
                                {`${st.firstName || ''} ${st.lastName || ''}`.trim()}
                              </td>
                              <td className="py-3 px-3 text-slate-400 uppercase font-bold">{st.studentId || 'N/A'}</td>
                              <td className="py-3 px-3 text-center">
                                <span className={cn("inline-flex px-2.5 py-0.5 text-[9px] font-black rounded-full border uppercase tracking-wider", getStatusBadge(rec.status))}>
                                  {rec.status}
                                </span>
                              </td>
                              <td className="py-3 pr-5 text-slate-500 italic max-w-[200px] truncate">
                                {rec.remarks || '—'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsViewModalOpen(false)
                    setSelectedSessionForView(null)
                  }}
                  className="h-10 px-5 border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-550 rounded-full cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsViewModalOpen(false)
                    handleTriggerEdit(selectedSessionForView.session)
                  }}
                  className="h-10 px-5 bg-brand-blue-500 hover:bg-brand-blue-600 text-xs font-extrabold text-white rounded-full cursor-pointer shadow-md"
                >
                  Edit Attendance
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SYSTEM SETTINGS CONFIG MODAL */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={spring}
              className="bg-white w-full max-w-xl shadow-premium-4 flex flex-col relative"
              style={{ borderRadius: '28px', border: '1px solid #ECECEC' }}
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="text-left flex items-center gap-2">
                  <Settings className="h-5 w-5 text-slate-500 animate-spin-slow" />
                  <h3 className="text-sm font-black uppercase text-slate-800">Attendance Config Settings</h3>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="h-8 w-8 rounded-full border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-400 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="p-6 space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Alert Threshold %</label>
                    <input
                      type="number"
                      min="50"
                      max="95"
                      value={settingsData.attendanceThreshold}
                      onChange={(e) => setSettingsData(prev => ({ ...prev, attendanceThreshold: parseInt(e.target.value) }))}
                      className="h-9 w-full px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50/50 focus:outline-none focus:bg-white focus:border-blue-450"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Late Arrivals limit (min)</label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={settingsData.lateThreshold}
                      onChange={(e) => setSettingsData(prev => ({ ...prev, lateThreshold: parseInt(e.target.value) }))}
                      className="h-9 w-full px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50/50 focus:outline-none focus:bg-white focus:border-blue-450"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Auto Lock Timer (hours)</label>
                    <input
                      type="number"
                      min="1"
                      max="72"
                      value={settingsData.attendanceLockTime}
                      onChange={(e) => setSettingsData(prev => ({ ...prev, attendanceLockTime: parseInt(e.target.value) }))}
                      className="h-9 w-full px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50/50 focus:outline-none focus:bg-white focus:border-blue-450"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Default Status Option</label>
                    <select
                      value={settingsData.defaultStatus}
                      onChange={(e) => setSettingsData(prev => ({ ...prev, defaultStatus: e.target.value }))}
                      className="h-9 w-full px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-blue-450 cursor-pointer"
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-y-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-650">
                    <input
                      type="checkbox"
                      checked={settingsData.weekendAttendance}
                      onChange={(e) => setSettingsData(prev => ({ ...prev, weekendAttendance: e.target.checked }))}
                      className="rounded border-slate-350 text-brand-blue-500 focus:ring-brand-blue-500 h-4 w-4"
                    />
                    <span>Allow Weekend Attendance</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-650">
                    <input
                      type="checkbox"
                      checked={settingsData.autoLockAttendance}
                      onChange={(e) => setSettingsData(prev => ({ ...prev, autoLockAttendance: e.target.checked }))}
                      className="rounded border-slate-355 text-brand-blue-500 focus:ring-brand-blue-500 h-4 w-4"
                    />
                    <span>Auto Lock Submissions</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-650">
                    <input
                      type="checkbox"
                      checked={settingsData.enableRemarks}
                      onChange={(e) => setSettingsData(prev => ({ ...prev, enableRemarks: e.target.checked }))}
                      className="rounded border-slate-355 text-brand-blue-500 focus:ring-brand-blue-500 h-4 w-4"
                    />
                    <span>Enable Student Remarks</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-650">
                    <input
                      type="checkbox"
                      checked={settingsData.enableLeave}
                      onChange={(e) => setSettingsData(prev => ({ ...prev, enableLeave: e.target.checked }))}
                      className="rounded border-slate-355 text-brand-blue-500 focus:ring-brand-blue-500 h-4 w-4"
                    />
                    <span>Enable Leave status toggling</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="h-9.5 px-4.5 border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-550 rounded-full cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-9.5 px-5 bg-brand-blue-500 hover:bg-brand-blue-600 text-xs font-extrabold text-white rounded-full cursor-pointer shadow-md"
                  >
                    Save Config
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
