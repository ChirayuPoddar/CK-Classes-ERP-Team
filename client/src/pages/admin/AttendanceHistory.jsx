import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft,
  Search,
  Calendar,
  Clock,
  User,
  Check,
  X,
  Edit3,
  Trash2,
  Lock,
  Unlock,
  Eye,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileSpreadsheet,
  History,
  CheckSquare,
  Settings,
  Download
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import { cn } from '@/utils/cn'
import { motion, AnimatePresence } from 'framer-motion'
import * as XLSX from 'xlsx'

const spring = { type: 'spring', stiffness: 350, damping: 28 }

const classesList = [
  'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11 Science', 'Class 11 Commerce',
  'Class 12 Science', 'Class 12 Commerce'
]

// Status pills formatting
const getStatusBadge = (status) => {
  switch (status) {
    case 'Present':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    case 'Absent':
      return 'bg-rose-50 text-rose-700 border-rose-100'
    case 'Late':
      return 'bg-amber-50 text-amber-700 border-amber-100'
    case 'Leave':
      return 'bg-blue-50 text-blue-700 border-blue-100'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-100'
  }
}

// Session statuses formatting
const getSessionStatusBadge = (status) => {
  switch (status) {
    case 'Completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    case 'Locked':
      return 'bg-rose-50 text-rose-700 border-rose-150'
    case 'Overridden':
      return 'bg-amber-50 text-amber-700 border-amber-150'
    case 'Pending':
      return 'border-dashed border-slate-200 bg-slate-50/50 text-slate-500'
    default:
      return 'bg-slate-50 text-slate-600 border-slate-100'
  }
}

export default function AttendanceHistoryPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  
  // Lists
  const [sessions, setSessions] = useState([])
  const [teachers, setTeachers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  // Filters State
  const [classFilter, setClassFilter] = useState('')
  const [teacherFilter, setTeacherFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchVal, setSearchVal] = useState('')
  
  const getPastDateString = (daysAgo) => {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    return d.toISOString().split('T')[0]
  }
  const [startDate, setStartDate] = useState(getPastDateString(15))
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  // Pagination State
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [limit, setLimit] = useState(10)

  // Modals state
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedSessionForView, setSelectedSessionForView] = useState(null)
  const [viewTab, setViewTab] = useState('roster')
  const [overrideLogs, setOverrideLogs] = useState([])

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedSlotForEdit, setSelectedSlotForEdit] = useState(null)
  const [editSessionId, setEditSessionId] = useState(null)
  const [students, setStudents] = useState([])
  const [markedRecords, setMarkedRecords] = useState({})
  const [initialMarkedRecords, setInitialMarkedRecords] = useState({})
  const [remarks, setRemarks] = useState({})
  
  // Override confirmation modal state
  const [isOverrideReasonOpen, setIsOverrideReasonOpen] = useState(false)
  const [overrideReasonText, setOverrideReasonText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Custom Delete Confirm Modal State
  const [deleteConfirmSession, setDeleteConfirmSession] = useState(null)

  // Checkbox multi-selections states
  const [selectedSessionIds, setSelectedSessionIds] = useState([])

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const handleClearFilters = () => {
    setClassFilter('')
    setTeacherFilter('')
    setSubjectFilter('')
    setStatusFilter('')
    setSearchVal('')
    setStartDate(getPastDateString(15))
    setEndDate(new Date().toISOString().split('T')[0])
    setPage(1)
  }

  // Fetch initial teachers & subjects
  const loadFiltersData = async () => {
    try {
      const [tRes, sRes] = await Promise.all([
        api.get('/teachers', { params: { limit: 1000 } }),
        api.get('/subjects', { params: { limit: 1000 } })
      ])
      if (tRes?.success && tRes?.data) setTeachers(tRes.data.teachers || [])
      if (sRes?.success && sRes?.data) setSubjects(sRes.data.subjects || [])
    } catch (err) {
      console.error('Failed to load filter options:', err)
    }
  }

  // Fetch paginated attendance sessions
  const fetchSessions = async () => {
    setLoading(true)
    try {
      const res = await api.get('/attendance', {
        params: {
          classId: classFilter || undefined,
          teacherId: teacherFilter || undefined,
          subjectId: subjectFilter || undefined,
          status: statusFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          search: searchVal || undefined,
          page,
          limit
        }
      })
      if (res?.success && res?.data) {
        setSessions(res.data.sessions || [])
        setSelectedSessionIds([]) // clear selection on query reload
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1)
          setTotalCount(res.data.pagination.totalCount || 0)
        }
      }
    } catch (err) {
      console.error('Failed to query sessions list:', err)
      showToast('error', 'Failed to retrieve attendance logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    loadFiltersData()
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return
    setPage(1)
  }, [classFilter, teacherFilter, subjectFilter, statusFilter, startDate, endDate, searchVal, limit, isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return
    fetchSessions()
  }, [classFilter, teacherFilter, subjectFilter, statusFilter, startDate, endDate, searchVal, page, limit, isAuthenticated])

  // Delete Action
  const handleDeleteTrigger = (session) => {
    setDeleteConfirmSession(session)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmSession) return
    try {
      const res = await api.delete(`/attendance/${deleteConfirmSession._id}`)
      if (res?.success) {
        showToast('success', 'Attendance session and logs deleted successfully.')
        setDeleteConfirmSession(null)
        fetchSessions()
      }
    } catch (err) {
      console.error('Delete attendance error:', err)
      showToast('error', err.message || 'Delete operation failed')
    }
  }

  // Lock / Unlock Toggle
  const handleToggleLock = async (session) => {
    try {
      const res = await api.put(`/attendance/${session._id}`, { isLocked: !session.isLocked })
      if (res?.success) {
        showToast('success', session.isLocked ? 'Attendance session unlocked.' : 'Attendance session locked.')
        fetchSessions()
      }
    } catch (err) {
      console.error('Toggle lock error:', err)
      showToast('error', err.message || 'Lock operation failed')
    }
  }

  // Bulk Actions
  const handleBulkAction = async (action) => {
    if (selectedSessionIds.length === 0) return
    
    if (action === 'Delete') {
      const confirmVal = window.confirm(`Are you sure you want to bulk delete the selected ${selectedSessionIds.length} sessions?`)
      if (!confirmVal) return
    }

    try {
      const res = await api.post('/attendance/bulk', {
        ids: selectedSessionIds,
        action
      })
      if (res?.success) {
        showToast('success', `Bulk ${action.toLowerCase()} completed successfully.`)
        setSelectedSessionIds([])
        fetchSessions()
      }
    } catch (err) {
      console.error('Bulk update error:', err)
      showToast('error', 'Bulk action operation failed.')
    }
  }

  // Bulk Excel Export
  const handleBulkExportExcel = () => {
    const selected = sessions.filter(s => selectedSessionIds.includes(s._id))
    if (selected.length === 0) return

    const dataToExport = selected.map(s => ({
      'Date': new Date(s.date).toLocaleDateString(),
      'Class': s.classId,
      'Subject': s.subjectId?.name || 'N/A',
      'Teacher': s.teacherId ? `${s.teacherId.firstName || ''} ${s.teacherId.lastName || ''}`.trim() : 'N/A',
      'Period': s.periodId?.name || 'N/A',
      'Attendance Rate': `${s.stats?.attendancePercentage || 0}%`,
      'Present': s.stats?.presentCount || 0,
      'Absent': s.stats?.absentCount || 0,
      'Late': s.stats?.lateCount || 0,
      'Leave': s.stats?.leaveCount || 0,
      'Status': s.status
    }))

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Bulk Attendance Summary")
    XLSX.writeFile(wb, `Bulk_Attendance_Report.xlsx`)
    showToast('success', 'Selected sessions list exported to Excel.')
  }

  // View Details Drawer / Modal
  const handleOpenViewDrawer = async (sessionObj) => {
    if (sessionObj.status === 'Pending') {
      showToast('error', 'Attendance has not been marked for this lecture slot.')
      return
    }
    setLoading(true)
    try {
      const res = await api.get(`/attendance/${sessionObj._id}`)
      if (res?.success && res?.data) {
        setSelectedSessionForView(res.data)
        setViewTab('roster')
        setIsViewOpen(true)
        
        // Fetch override logs
        const logsRes = await api.get(`/attendance/${sessionObj._id}/override-history`)
        if (logsRes?.success && logsRes?.data) {
          setOverrideLogs(logsRes.data)
        } else {
          setOverrideLogs([])
        }
      }
    } catch (err) {
      console.error('Failed to load session details:', err)
      showToast('error', 'Failed to retrieve attendance logs.')
    } finally {
      setLoading(false)
    }
  }

  // Edit Mode initialization
  const handleOpenEditModal = async (sessionObj) => {
    if (sessionObj.isPendingSlot) {
      const slot = sessionObj.timetableSlotId
      setSelectedSlotForEdit(slot)
      setEditSessionId(null)
      setLoading(true)
      try {
        const res = await api.get('/students', {
          params: { page: 1, limit: 1000, class: sessionObj.classId, status: 'Active' }
        })
        if (res?.success && res?.data?.students) {
          const activeStudents = res.data.students
          setStudents(activeStudents)
          const initialMarked = {}
          const initialRemarks = {}
          activeStudents.forEach(st => {
            initialMarked[st._id] = 'Present'
            initialRemarks[st._id] = ''
          })
          setMarkedRecords(initialMarked)
          setInitialMarkedRecords(initialMarked)
          setRemarks(initialRemarks)
          setIsEditOpen(true)
        }
      } catch (err) {
        console.error('Load students error:', err)
        showToast('error', 'Failed to fetch student roster.')
      } finally {
        setLoading(false)
      }
      return
    }

    // Existing session edit
    setLoading(true)
    try {
      const res = await api.get(`/attendance/${sessionObj._id}`)
      if (res?.success && res?.data) {
        const { session, records } = res.data
        setEditSessionId(session._id)
        setSelectedSlotForEdit(session.timetableSlotId)
        
        const activeStudents = records.map(r => r.studentId)
        setStudents(activeStudents)

        const initialMarked = {}
        const initialRemarks = {}
        records.forEach(r => {
          const id = r.studentId._id || r.studentId
          initialMarked[id] = r.status
          initialRemarks[id] = r.remarks || ''
        })
        setMarkedRecords(initialMarked)
        setInitialMarkedRecords(initialMarked)
        setRemarks(initialRemarks)
        setIsEditOpen(true)
      }
    } catch (err) {
      console.error('Failed to load session details for edit:', err)
      showToast('error', 'Failed to retrieve attendance logs.')
    } finally {
      setLoading(false)
    }
  }

  const modalClass = selectedSlotForEdit?.class || ''
  const modalDate = selectedSlotForEdit?.date || startDate

  const handleMarkAllPresent = () => {
    const updated = {}
    students.forEach(st => {
      updated[st._id] = 'Present'
    })
    setMarkedRecords(updated)
  }

  const handleMarkAllAbsent = () => {
    const updated = {}
    students.forEach(st => {
      updated[st._id] = 'Absent'
    })
    setMarkedRecords(updated)
  }

  const handleClearAll = () => {
    setMarkedRecords({})
  }

  const handleMarkRemainingPresent = () => {
    const updated = { ...markedRecords }
    students.forEach(st => {
      if (!updated[st._id]) {
        updated[st._id] = 'Present'
      }
    })
    setMarkedRecords(updated)
  }

  // Pre-Save verify: check status changes to prompt override reason
  const handleSaveTrigger = (e) => {
    e.preventDefault()

    const unselected = students.some(st => !markedRecords[st._id])
    if (unselected) {
      showToast('error', 'Please specify attendance status for all students.')
      return
    }

    let hasChanges = false
    if (editSessionId) {
      students.forEach(st => {
        if (initialMarkedRecords[st._id] !== markedRecords[st._id]) {
          hasChanges = true
        }
      })
    }

    if (hasChanges) {
      setOverrideReasonText('')
      setIsOverrideReasonOpen(true)
    } else {
      executeSaveAttendance('')
    }
  }

  const executeSaveAttendance = async (reason) => {
    setSubmitting(true)
    try {
      const recordsPayload = students.map(st => ({
        studentId: st._id,
        status: markedRecords[st._id],
        remarks: remarks[st._id] || ''
      }))

      let res;
      if (editSessionId) {
        res = await api.put(`/attendance/${editSessionId}`, {
          records: recordsPayload,
          overrideReason: reason || undefined
        })
      } else {
        res = await api.post('/attendance', {
          timetableSlotId: selectedSlotForEdit._id,
          classId: selectedSlotForEdit.class,
          subjectId: selectedSlotForEdit.subject?._id || selectedSlotForEdit.subject,
          teacherId: selectedSlotForEdit.teacher?._id || selectedSlotForEdit.teacher,
          periodId: selectedSlotForEdit.period?._id || selectedSlotForEdit.period,
          day: selectedSlotForEdit.day,
          date: startDate,
          records: recordsPayload
        })
      }

      if (res?.success) {
        showToast('success', editSessionId ? 'Attendance logs updated successfully.' : 'Attendance recorded successfully.')
        setIsEditOpen(false)
        setIsOverrideReasonOpen(false)
        setEditSessionId(null)
        setSelectedSlotForEdit(null)
        fetchSessions()
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

  // Row selection handler
  const handleRowSelectToggle = (id) => {
    if (selectedSessionIds.includes(id)) {
      setSelectedSessionIds(prev => prev.filter(x => x !== id))
    } else {
      setSelectedSessionIds(prev => [...prev, id])
    }
  }

  return (
    <div className="flex-1 w-full h-full text-slate-800 flex flex-col gap-5 select-none min-h-0 bg-transparent">
      
      {/* Toast popup */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "fixed top-6 right-6 z-[100] px-5 py-3.5 rounded-[20px] shadow-premium-3 flex items-center gap-3 border text-xs font-black tracking-wide bg-white max-w-sm select-none",
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

      {/* Header and Breadcrumbs */}
      <div className="flex items-center gap-4 shrink-0 justify-between">
        <div className="text-left space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
            <span>Admin</span>
            <span>/</span>
            <span className="text-brand-blue-650 cursor-pointer" onClick={() => navigate('/admin/attendance')}>Attendance</span>
            <span>/</span>
            <span className="text-slate-500">History</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={() => navigate('/admin/attendance')}
              className="h-8.5 w-8.5 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
              Attendance History
            </h2>
          </div>
        </div>
      </div>

      {/* Advanced Filters Block */}
      <div 
        style={{ borderRadius: '24px', border: '1px solid #ECECEC' }}
        className="py-5 px-6 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.01)] shrink-0 flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search bar */}
            <div className="relative w-64 h-10">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Subject, Class, Teacher..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="h-full w-full pl-10 pr-4 bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-xs font-semibold rounded-full focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="h-10 w-36 px-4 bg-white border border-slate-200 rounded-full text-xs font-extrabold text-slate-550 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Classes</option>
              {classesList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="h-10 w-44 px-4 bg-white border border-slate-200 rounded-full text-xs font-extrabold text-slate-550 focus:outline-none focus:border-blue-500 cursor-pointer"
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
              className="h-10 w-40 px-4 bg-white border border-slate-200 rounded-full text-xs font-extrabold text-slate-550 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-40 px-4 bg-white border border-slate-200 rounded-full text-xs font-extrabold text-slate-550 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Locked">Locked</option>
              <option value="Overridden">Overridden</option>
            </select>

            <div className="flex items-center gap-1.5 h-10 px-3 bg-slate-50 border border-slate-200 rounded-full">
              <span className="text-[9px] font-black text-slate-400 uppercase pr-1.5 border-r border-slate-200">Range</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-[11px] font-bold text-slate-600 focus:outline-none cursor-pointer"
              />
              <span className="text-[10px] text-slate-350 font-black">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-[11px] font-bold text-slate-600 focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleClearFilters}
              className="h-10 px-4.5 border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-550 rounded-full flex items-center justify-center cursor-pointer transition-colors active:scale-95 shadow-sm"
              title="Clear All Filters"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Bulk Action Controls Sub-row (visible only if rows are selected) */}
        <AnimatePresence>
          {selectedSessionIds.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center justify-between border-t border-slate-100 pt-3 select-none"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide mr-2">
                  Selected {selectedSessionIds.length} items:
                </span>
                <button
                  onClick={() => handleBulkAction('Lock')}
                  className="h-8 px-3.5 bg-rose-50 border border-rose-100 hover:bg-rose-100/50 text-[10px] font-black uppercase text-rose-600 rounded-full flex items-center gap-1 transition-all"
                >
                  <Lock className="h-3 w-3" />
                  <span>Bulk Lock</span>
                </button>
                <button
                  onClick={() => handleBulkAction('Unlock')}
                  className="h-8 px-3.5 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100/50 text-[10px] font-black uppercase text-emerald-600 rounded-full flex items-center gap-1 transition-all"
                >
                  <Unlock className="h-3 w-3" />
                  <span>Bulk Unlock</span>
                </button>
                <button
                  onClick={() => handleBulkAction('Delete')}
                  className="h-8 px-3.5 border border-slate-200 hover:bg-slate-50 text-[10px] font-black uppercase text-slate-600 rounded-full flex items-center gap-1 transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Bulk Delete</span>
                </button>
                <button
                  onClick={handleBulkExportExcel}
                  className="h-8 px-3.5 bg-blue-50 border border-blue-100 hover:bg-blue-100/50 text-[10px] font-black uppercase text-blue-600 rounded-full flex items-center gap-1 transition-all"
                >
                  <Download className="h-3 w-3" />
                  <span>Bulk Export</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main History Grid Table Card */}
      <div 
        style={{ borderRadius: '28px', border: '1px solid #ECECEC', padding: '28px' }}
        className="bg-white shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex-grow flex flex-col justify-between overflow-hidden min-h-0"
      >
        <div className="overflow-y-auto overflow-x-auto custom-scrollbar flex-grow min-h-0 pr-1">
          <table className="w-full text-left min-w-[1150px] border-collapse">
            <thead className="bg-slate-50/55 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest select-none sticky top-0 bg-white z-10">
              <tr>
                <th className="py-4 pl-5 text-center w-12">
                  <input
                    type="checkbox"
                    checked={sessions.length > 0 && sessions.filter(s => s.status !== 'Pending').every(s => selectedSessionIds.includes(s._id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSessionIds(sessions.filter(s => s.status !== 'Pending').map(s => s._id))
                      } else {
                        setSelectedSessionIds([])
                      }
                    }}
                    className="rounded border-slate-300 text-brand-blue-500 focus:ring-brand-blue-500"
                  />
                </th>
                <th className="py-4 px-4 text-left">Date</th>
                <th className="py-4 px-4">Class</th>
                <th className="py-4 px-4">Subject</th>
                <th className="py-4 px-4">Teacher</th>
                <th className="py-4 px-4">Period</th>
                <th className="py-4 px-3 text-center">Rate %</th>
                <th className="py-4 px-3 text-center">Present</th>
                <th className="py-4 px-3 text-center">Absent</th>
                <th className="py-4 px-3 text-center">Late</th>
                <th className="py-4 px-3 text-center">Leave</th>
                <th className="py-4 px-4 text-center">Status</th>
                <th className="py-4 px-7 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-semibold text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="13" className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="h-7 w-7 text-blue-500 animate-spin" />
                      <span className="text-xs font-bold text-slate-400">Loading history logs...</span>
                    </div>
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan="13" className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Calendar className="h-8 w-8 text-slate-350" />
                      <span className="text-xs font-black text-slate-455">No logs found matching your filters.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr 
                    key={session._id} 
                    className="hover:bg-slate-50/65 group transition-colors cursor-pointer"
                    onClick={() => handleOpenViewDrawer(session)}
                  >
                    <td className="py-4 pl-5 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedSessionIds.includes(session._id)}
                        disabled={session.status === 'Pending'}
                        onChange={() => handleRowSelectToggle(session._id)}
                        className="rounded border-slate-300 text-brand-blue-500 focus:ring-brand-blue-500 disabled:opacity-40"
                      />
                    </td>
                    <td className="py-4 px-4 text-slate-800 font-extrabold">
                      {new Date(session.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-4 font-black text-brand-blue-700">{session.classId}</td>
                    <td className="py-4 px-4 text-slate-800 font-bold">
                      {session.subjectId?.name || (session.timetableSlotId?.subject?.name || 'N/A')}
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      {session.teacherId 
                        ? `${session.teacherId.firstName || ''} ${session.teacherId.lastName || ''}`.trim()
                        : (session.timetableSlotId?.teacher 
                            ? `${session.timetableSlotId.teacher.firstName || ''} ${session.timetableSlotId.teacher.lastName || ''}`.trim()
                            : 'Unassigned')}
                    </td>
                    <td className="py-4 px-4 text-slate-400">
                      <span className="font-extrabold text-slate-650">
                        {session.periodId?.name || (session.timetableSlotId?.period?.name || 'N/A')}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-center">
                      <span className={cn(
                        "font-black text-sm",
                        (session.stats?.attendancePercentage || 0) >= 80 ? "text-emerald-600" : (session.stats?.attendancePercentage || 0) >= 75 ? "text-amber-500" : "text-rose-500"
                      )}>
                        {session.stats?.attendancePercentage || 0}%
                      </span>
                    </td>
                    <td className="py-4 px-3 text-center text-emerald-650 font-bold">
                      {session.stats?.presentCount || 0}
                    </td>
                    <td className="py-4 px-3 text-center text-rose-550 font-bold">
                      {session.stats?.absentCount || 0}
                    </td>
                    <td className="py-4 px-3 text-center text-amber-550 font-bold">
                      {session.stats?.lateCount || 0}
                    </td>
                    <td className="py-4 px-3 text-center text-blue-550 font-bold">
                      {session.stats?.leaveCount || 0}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={cn(
                        "inline-flex px-2.5 py-1 text-[10px] font-black rounded-full border uppercase tracking-wider",
                        getSessionStatusBadge(session.status)
                      )}>
                        {session.status}
                      </span>
                    </td>
                    <td className="py-4 px-7 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Button */}
                        <button
                          onClick={() => handleOpenViewDrawer(session)}
                          className="h-8 w-8 rounded-full border border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        
                        {/* Lock / Unlock Toggle */}
                        {session.status !== 'Pending' && (
                          <button
                            onClick={() => handleToggleLock(session)}
                            className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center transition-all border",
                              session.isLocked 
                                ? "bg-rose-50 hover:bg-rose-100 border-rose-100 text-rose-600" 
                                : "bg-emerald-50 hover:bg-emerald-100 border-emerald-100 text-emerald-600"
                            )}
                            title={session.isLocked ? "Unlock Session" : "Lock Session"}
                          >
                            {session.isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                          </button>
                        )}
                        
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditModal(session)}
                          className="h-8 w-8 rounded-full border border-slate-100 hover:bg-slate-50 text-slate-555 hover:text-blue-600 flex items-center justify-center transition-all"
                          title="Edit / Override Session Records"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete Button */}
                        {session.status !== 'Pending' && (
                          <button
                            onClick={() => handleDeleteTrigger(session)}
                            className="h-8 w-8 rounded-full border border-slate-100 hover:bg-red-50 text-slate-555 hover:text-red-655 flex items-center justify-center transition-all"
                            title="Delete Session"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Server-side Pagination controls */}
        {!loading && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-5 mt-4 select-none shrink-0 text-left">
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-bold text-slate-400">
                Showing <span className="font-extrabold text-slate-650">{(page - 1) * limit + 1}</span>–
                <span className="font-extrabold text-slate-650">{Math.min(page * limit, totalCount)}</span> of{' '}
                <span className="font-extrabold text-slate-650">{totalCount}</span> records
              </span>
              
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Page size:</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="h-8.5 px-3 bg-white border border-slate-200 rounded-full text-[11px] font-extrabold text-slate-600 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  className="h-8.5 px-3 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-black text-slate-550 cursor-pointer disabled:opacity-40 select-none transition-colors"
                >
                  ← Previous
                </button>
                
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pNum = i + 1
                  return (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      className={cn(
                        "h-8.5 w-8.5 rounded-full text-xs font-black cursor-pointer transition-all border",
                        page === pNum 
                          ? "bg-brand-blue-500 border-brand-blue-500 text-white shadow-sm" 
                          : "border-slate-200 hover:bg-slate-50 text-slate-550"
                      )}
                    >
                      {pNum}
                    </button>
                  )
                })}

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  className="h-8.5 px-3 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-black text-slate-550 cursor-pointer disabled:opacity-40 select-none transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 1. VIEW ATTENDANCE DRAWER / LARGE MODAL */}
      <AnimatePresence>
        {isViewOpen && selectedSessionForView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
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
                  <h3 className="text-base font-black text-slate-800 tracking-tight uppercase leading-none">
                    View Attendance Record
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">
                    Details, student roster list, and admin override history logs
                  </p>
                </div>
                <button
                  onClick={() => setIsViewOpen(false)}
                  className="h-8.5 w-8.5 rounded-full border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-850 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="px-7 border-b border-slate-100 flex items-center gap-6 shrink-0 select-none">
                <button
                  onClick={() => setViewTab('roster')}
                  className={cn(
                    "py-3 text-xs font-black uppercase tracking-wider relative cursor-pointer",
                    viewTab === 'roster' ? "text-brand-blue-600" : "text-slate-400 hover:text-slate-650"
                  )}
                >
                  Student Roster
                  {viewTab === 'roster' && (
                    <motion.div layoutId="viewTabLine" className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-blue-500 rounded-full" />
                  )}
                </button>

                <button
                  onClick={() => setViewTab('override')}
                  className={cn(
                    "py-3 text-xs font-black uppercase tracking-wider relative flex items-center gap-1.5 cursor-pointer",
                    viewTab === 'override' ? "text-brand-blue-600" : "text-slate-400 hover:text-slate-655"
                  )}
                >
                  <History className="h-3.5 w-3.5" />
                  <span>Override History</span>
                  {overrideLogs.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[9px] font-bold text-slate-500">{overrideLogs.length}</span>
                  )}
                  {viewTab === 'override' && (
                    <motion.div layoutId="viewTabLine" className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-blue-500 rounded-full" />
                  )}
                </button>
              </div>

              {/* Content body */}
              <div className="p-7 overflow-y-auto flex-grow flex flex-col min-h-0 space-y-6 text-left">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex flex-wrap items-center justify-between gap-4 select-none shrink-0">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-brand-blue-650 uppercase tracking-widest">Attendance Session info</span>
                    <h4 className="text-sm font-black text-slate-855 tracking-tight leading-tight mt-1">
                      {selectedSessionForView.session.subjectId?.name} ({selectedSessionForView.session.classId})
                    </h4>
                    <div className="text-[10px] font-bold text-slate-500 mt-1 flex items-center gap-2">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> Teacher: {selectedSessionForView.session.teacherId ? `${selectedSessionForView.session.teacherId.firstName || ''} ${selectedSessionForView.session.teacherId.lastName || ''}`.trim() : 'N/A'}</span>
                      <span className="h-1 w-1 bg-slate-350 rounded-full" />
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {selectedSessionForView.session.periodId?.name} ({selectedSessionForView.session.periodId?.startTime} - {selectedSessionForView.session.periodId?.endTime})</span>
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Attendance Date</span>
                    <span className="text-xs font-black text-slate-800 tracking-tight block mt-1.5">
                      {new Date(selectedSessionForView.session.date).toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {viewTab === 'roster' ? (
                  <div className="space-y-4 flex-grow flex flex-col min-h-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 border border-slate-200/60 rounded-2xl select-none shrink-0">
                      <div>
                        <span className="text-[8.5px] font-black text-slate-405 uppercase tracking-widest">Attendance Rate</span>
                        <h5 className="text-base font-black text-brand-blue-700 mt-0.5">{selectedSessionForView.session.stats?.attendancePercentage || 0}%</h5>
                      </div>
                      <div>
                        <span className="text-[8.5px] font-black text-slate-405 uppercase tracking-widest">Present</span>
                        <h5 className="text-base font-black text-emerald-600 mt-0.5">{selectedSessionForView.session.stats?.presentCount || 0}</h5>
                      </div>
                      <div>
                        <span className="text-[8.5px] font-black text-slate-405 uppercase tracking-widest">Absent</span>
                        <h5 className="text-base font-black text-rose-600 mt-0.5">{selectedSessionForView.session.stats?.absentCount || 0}</h5>
                      </div>
                      <div>
                        <span className="text-[8.5px] font-black text-slate-405 uppercase tracking-widest">Late / Leave</span>
                        <h5 className="text-base font-black text-slate-650 mt-0.5">
                          {(selectedSessionForView.session.stats?.lateCount || 0) + (selectedSessionForView.session.stats?.leaveCount || 0)}
                        </h5>
                      </div>
                    </div>

                    <div className="border border-slate-200/80 rounded-[20px] overflow-hidden flex-grow overflow-y-auto custom-scrollbar min-h-0">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 text-[9.5px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 sticky top-0 bg-white z-10">
                          <tr>
                            <th className="py-3 pl-5">Student Name</th>
                            <th className="py-3 px-3">Roll Number</th>
                            <th className="py-3 px-3 text-center">Status</th>
                            <th className="py-3 pr-5">Remarks</th>
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
                ) : (
                  <div className="flex-grow flex flex-col min-h-0 space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider select-none shrink-0">
                      Audit Override Logs ({overrideLogs.length})
                    </h4>

                    <div className="border border-slate-200/80 rounded-[20px] overflow-hidden flex-grow overflow-y-auto custom-scrollbar min-h-0">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 text-[9.5px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 sticky top-0 bg-white z-10 select-none">
                          <tr>
                            <th className="py-3 pl-5">Date</th>
                            <th className="py-3 px-3">Modified By</th>
                            <th className="py-3 px-3">Student</th>
                            <th className="py-3 px-3 text-center">Old Status</th>
                            <th className="py-3 px-3 text-center">New Status</th>
                            <th className="py-3 pr-5">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-semibold">
                          {overrideLogs.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="py-20 text-center text-xs font-bold text-slate-400">
                                No modifications recorded.
                              </td>
                            </tr>
                          ) : (
                            overrideLogs.map(log => {
                              const adminName = log.modifiedBy ? `${log.modifiedBy.firstName || ''} ${log.modifiedBy.lastName || ''}`.trim() : 'Admin'
                              const stName = log.studentId ? `${log.studentId.firstName || ''} ${log.studentId.lastName || ''}`.trim() : 'Student'
                              return (
                                <tr key={log._id}>
                                  <td className="py-3 pl-5 text-slate-500 text-[10.5px]">
                                    {new Date(log.createdAt).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                  <td className="py-3 px-3 font-extrabold text-slate-700">{adminName}</td>
                                  <td className="py-3 px-3 text-slate-650 font-bold">{stName}</td>
                                  <td className="py-3 px-3 text-center">
                                    <span className={cn("inline-flex px-2 py-0.5 text-[8.5px] font-black rounded-full border uppercase", getStatusBadge(log.oldStatus))}>
                                      {log.oldStatus}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <span className={cn("inline-flex px-2 py-0.5 text-[8.5px] font-black rounded-full border uppercase", getStatusBadge(log.newStatus))}>
                                      {log.newStatus}
                                    </span>
                                  </td>
                                  <td className="py-3 pr-5 font-bold text-slate-800 italic max-w-[200px] truncate" title={log.reason}>
                                    {log.reason}
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsViewOpen(false)}
                  className="h-10 px-5 border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-550 rounded-full cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsViewOpen(false)
                    handleOpenEditModal(selectedSessionForView.session)
                  }}
                  className="h-10 px-5 bg-brand-blue-500 hover:bg-brand-blue-600 text-xs font-extrabold text-white rounded-full cursor-pointer shadow-md"
                >
                  Edit / Override
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. EDIT / RECORD ATTENDANCE MODAL */}
      <AnimatePresence>
        {isEditOpen && selectedSlotForEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
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
                    {editSessionId ? 'Edit / Override Attendance' : 'Record Student Attendance'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">
                    Update student attendance records. If changes are detected, you will be prompted for an override reason.
                  </p>
                </div>
                <button
                  disabled={submitting}
                  onClick={() => {
                    setIsEditOpen(false)
                    setEditSessionId(null)
                    setSelectedSlotForEdit(null)
                  }}
                  className="h-9 w-9 rounded-full border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-7 flex flex-col min-h-0 space-y-5 text-left">
                <div className="bg-slate-50/50 p-4 border border-slate-200/60 rounded-[20px] flex flex-wrap items-center justify-between gap-4 select-none shrink-0">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[9px] font-black text-brand-blue-655 uppercase tracking-widest leading-none block">Attendance details</span>
                    <h4 className="text-sm font-black text-slate-850 tracking-tight leading-tight mt-1">
                      {selectedSlotForEdit.subject?.name || 'Subject'} ({modalClass})
                    </h4>
                    <div className="text-[10px] font-bold text-slate-500 mt-1 flex items-center gap-2">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> Teacher: {selectedSlotForEdit.teacher ? `${selectedSlotForEdit.teacher.firstName || ''} ${selectedSlotForEdit.teacher.lastName || ''}`.trim() : 'N/A'}</span>
                      <span className="h-1 w-1 bg-slate-350 rounded-full" />
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {selectedSlotForEdit.period?.name} ({selectedSlotForEdit.period?.startTime} - {selectedSlotForEdit.period?.endTime})</span>
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Attendance Date</span>
                    <span className="text-xs font-black text-slate-800 tracking-tight block mt-1.5">
                      {new Date(modalDate).toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>

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
                      className="h-8.5 px-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-150 text-[10px] font-black text-rose-655 rounded-full cursor-pointer uppercase tracking-wider transition-all"
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

                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Total Students Enrolled: {students.length}
                  </span>
                </div>

                {/* Student list */}
                <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar min-h-0 space-y-2.5">
                  {students.map((st) => {
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
                            <div className="h-9.5 w-9.5 rounded-full bg-brand-blue-5/80 text-brand-blue-655 flex items-center justify-center font-black text-xs shrink-0 select-none border border-brand-blue-100/50">
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
                                : "bg-white border-slate-200 text-slate-455 hover:bg-slate-50"
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
                                : "bg-white border-slate-200 text-slate-455 hover:bg-slate-50"
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
                                : "bg-white border-slate-200 text-slate-455 hover:bg-slate-50"
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
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-7 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setIsEditOpen(false)
                    setEditSessionId(null)
                    setSelectedSlotForEdit(null)
                  }}
                  className="h-10 px-5 border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-555 rounded-full cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSaveSaveTrigger}
                  disabled={submitting || students.length === 0}
                  className="h-10 px-6 bg-brand-blue-500 hover:bg-brand-blue-600 text-xs font-extrabold text-white rounded-full cursor-pointer shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all active:scale-95"
                >
                  {submitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Attendance</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2.1 ADMIN OVERRIDE REASON MODAL DIALOG */}
      <AnimatePresence>
        {isOverrideReasonOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={spring}
              className="bg-white w-full max-w-md shadow-premium-4 p-7 flex flex-col relative"
              style={{ borderRadius: '24px', border: '1px solid #ECECEC' }}
            >
              <div className="text-left space-y-3">
                <div className="h-10 w-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-805">Override Reason Required</h4>
                  <p className="text-[11px] font-bold text-slate-455">
                    Modifying attendance logs will override previous submissions. Please provide a brief mandatory reason for the audit history logs.
                  </p>
                </div>

                <textarea
                  required
                  placeholder="E.g. Corrected student sign-in errors, student marked absent by mistake"
                  value={overrideReasonText}
                  onChange={(e) => setOverrideReasonText(e.target.value)}
                  className="h-24 w-full p-3.5 border border-slate-200 rounded-[14px] text-xs font-semibold text-slate-700 bg-slate-50/50 focus:outline-none focus:bg-white focus:border-blue-400 placeholder:text-slate-400 resize-none transition-all mt-2"
                />

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsOverrideReasonOpen(false)}
                    className="h-9.5 px-4 border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-550 rounded-full cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!overrideReasonText.trim() || submitting}
                    onClick={() => executeSaveAttendance(overrideReasonText)}
                    className="h-9.5 px-5 bg-brand-blue-500 hover:bg-brand-blue-600 disabled:opacity-45 text-xs font-extrabold text-white rounded-full cursor-pointer shadow-md transition-colors"
                  >
                    Confirm Override
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* 3. PREMIUM CONFIRM DELETE MODAL */}
      <AnimatePresence>
        {deleteConfirmSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={spring}
              className="bg-white w-full max-w-sm shadow-premium-4 p-7 flex flex-col relative"
              style={{ borderRadius: '24px', border: '1px solid #ECECEC' }}
            >
              <div className="text-left space-y-3">
                <div className="h-10 w-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-805">Delete Attendance Session?</h4>
                  <p className="text-[11px] font-bold text-slate-455">
                    This action will permanently delete the attendance session, student logs, and override history for this lecture slot. This operation cannot be undone.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmSession(null)}
                    className="h-9.5 px-4 border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-550 rounded-full cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="h-9.5 px-5 bg-red-500 hover:bg-red-600 text-xs font-extrabold text-white rounded-full cursor-pointer shadow-md transition-colors"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )

  function handleSaveSaveTrigger(e) {
    handleSaveTrigger(e)
  }
}
