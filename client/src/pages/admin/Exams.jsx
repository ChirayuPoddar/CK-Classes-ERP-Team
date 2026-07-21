import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  Check, 
  RefreshCw, 
  Calendar,
  CheckSquare,
  Award,
  Info,
  Briefcase,
  GraduationCap
} from 'lucide-react'
import api from '@/services/api'
import { cn } from '@/utils/cn'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import DashboardStatCard from '@/components/common/DashboardStatCard'
import { TableHeadSort, TableHeaderFilter, TablePagination, TableRowActions } from '@/components/common/DataTable'

const classes = [
  'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11 Science', 'Class 11 Commerce',
  'Class 12 Science', 'Class 12 Commerce'
]

const statuses = ['Scheduled', 'Active', 'Completed', 'Published']

// Date formatting helper: "17 Jul 2026"
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'N/A'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

// Time range formatting helper: "10:00 AM - 01:00 PM"
const formatTimeRange = (startTimeStr, endTimeStr) => {
  if (!startTimeStr || !endTimeStr) return 'N/A'
  const formatTime = (tStr) => {
    const parts = tStr.split(':')
    let h = parseInt(parts[0], 10) || 0
    const m = String(parts[1] || '00').padStart(2, '0')
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12
    if (h === 0) h = 12
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`
  }
  return `${formatTime(startTimeStr)} - ${formatTime(endTimeStr)}`
}

// Status Badges Color mapping helper
const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Scheduled':
      return 'bg-blue-50 text-blue-700 border-blue-100'
    case 'Active':
      return 'bg-orange-50 text-orange-700 border-orange-100'
    case 'Completed':
      return 'bg-green-50 text-green-700 border-green-100'
    case 'Published':
      return 'bg-purple-50 text-purple-700 border-purple-100'
    default:
      return 'bg-slate-50 text-slate-550 border-slate-200'
  }
}

// Strip leading zeros while editing integers
const normalizeIntegerString = (val) => {
  if (val === '') return ''
  const digits = val.replace(/\D/g, '')
  if (digits === '') return ''
  const stripped = digits.replace(/^0+/, '')
  return stripped === '' ? '0' : stripped
}

export default function Exams() {
  const { user } = useAuth()
  const isStudentOrParent = user?.role === 'student' || user?.role === 'parent'
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin'
  const isAdmin = user?.role === 'admin'

  const [exams, setExams] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isFetchingBackground, setIsFetchingBackground] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const hasExamsRef = useRef(false)

  // Pagination & Filtering state
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)

  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [academicYearFilter, setAcademicYearFilter] = useState('')
  const [sortBy, setSortBy] = useState('Newest Exam')

  // KPI card selection filter state
  const [kpiFilter, setKpiFilter] = useState('all')

  const [examDateFilter, setExamDateFilter] = useState('')
  const [sortField, setSortField] = useState('')
  const [sortOrder, setSortOrder] = useState('reset')
  const [activeHeaderFilterDropdown, setActiveHeaderFilterDropdown] = useState(null)

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (classFilter) count++
    if (statusFilter) count++
    if (subjectFilter) count++
    if (academicYearFilter) count++
    if (examDateFilter) count++
    return count
  }, [classFilter, statusFilter, subjectFilter, academicYearFilter, examDateFilter])

  const handleSortClick = (field) => {
    setPage(1)
    if (sortField !== field) {
      setSortField(field)
      setSortOrder('asc')
      setSortBy(field)
    } else {
      if (sortOrder === 'asc') {
        setSortOrder('desc')
        setSortBy(`-${field}`)
      } else if (sortOrder === 'desc') {
        setSortOrder('reset')
        setSortField('')
        setSortBy('createdAt')
      } else {
        setSortOrder('asc')
        setSortBy(field)
      }
    }
  }

  const toggleFilterDropdown = (type) => {
    setActiveHeaderFilterDropdown(prev => prev === type ? null : type)
  }





  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false)
  const [currentExam, setCurrentExam] = useState(null) // null for create
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  // Subject states
  const [subjectsByClass, setSubjectsByClass] = useState([])
  const [allSubjects, setAllSubjects] = useState([])
  const [subjectsLoading, setSubjectsLoading] = useState(false)

  // Marks Entry Modal States
  const [isMarksModalOpen, setIsMarksModalOpen] = useState(false)
  const [selectedExamForMarks, setSelectedExamForMarks] = useState(null)
  const [marksStudents, setMarksStudents] = useState([])
  const [marksStudentsLoading, setMarksStudentsLoading] = useState(false)
  const [savingMarks, setSavingMarks] = useState(false)
  const [hasUnsavedMarks, setHasUnsavedMarks] = useState(false)

  // Results Roster Modal States
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false)
  const [selectedExamForResults, setSelectedExamForResults] = useState(null)
  const [resultsSearch, setResultsSearch] = useState('')
  const [resultsSortBy, setResultsSortBy] = useState('Alphabetical')
  const [studentSearchResults, setStudentSearchResults] = useState([])
  const [resultsLoading, setResultsLoading] = useState(false)

  // Detailed Report Card Modal States
  const [selectedStudentResult, setSelectedStudentResult] = useState(null)
  const [resultDetailOpen, setResultDetailOpen] = useState(false)

  // Toast notification state
  const [toast, setToast] = useState(null)

  // Local Form state
  const [formFields, setFormFields] = useState({
    examName: '',
    academicYear: new Date().getFullYear().toString(),
    class: '',
    subjectId: '',
    examDate: '',
    startTime: '',
    endTime: '',
    maxMarks: '100',
    passingMarks: '40',
    instructions: '',
    status: 'Scheduled'
  })
  const [validationErrors, setValidationErrors] = useState({})

  const showToast = useCallback((type, message) => {
    setToast({ type, message })
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }, [])

  // Load all subjects for filtering
  const loadAllSubjects = useCallback(async () => {
    try {
      const res = await api.get('/subjects', { params: { limit: 1000, status: 'Active' } })
      if (res && res.success) {
        setAllSubjects(res.data.subjects || [])
      }
    } catch {
      // silent catch
    }
  }, [])

  useEffect(() => {
    loadAllSubjects()
  }, [loadAllSubjects])

  // Unsaved changes unload warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedMarks) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedMarks])

  // Fetch subjects for a selected class grade
  const loadClassSubjects = async (className) => {
    if (!className) {
      setSubjectsByClass([])
      return
    }
    setSubjectsLoading(true)
    try {
      const res = await api.get('/subjects', {
        params: {
          class: className,
          status: 'Active',
          page: 1,
          limit: 1000
        }
      })
      if (res && res.success) {
        setSubjectsByClass(res.data.subjects || [])
      } else {
        setSubjectsByClass([])
      }
    } catch {
      setSubjectsByClass([])
    } finally {
      setSubjectsLoading(false)
    }
  }

  // Fetch paginated exams
  const fetchExams = useCallback(async () => {
    if (hasExamsRef.current) {
      setIsFetchingBackground(true)
    } else {
      setLoading(true)
    }
    setError(null)
    try {
      const params = {
        page,
        limit,
        search,
        class: classFilter,
        status: statusFilter,
        academicYear: academicYearFilter,
        subjectId: subjectFilter,
        examDate: examDateFilter,
        sortBy
      }
      if (isStudentOrParent && user?.class) {
        params.class = user.class
      }

      const res = await api.get('/exams', { params })

      if (res && res.success) {
        const examList = res.data.exams || []
        setExams(examList)
        hasExamsRef.current = examList.length > 0
        setTotal(res.data.pagination?.total || 0)
      } else {
        setError('Failed to fetch exams logs')
      }
    } catch (err) {
      setError(err.message || 'Server error occurred')
    } finally {
      setLoading(false)
      setIsFetchingBackground(false)
    }
  }, [page, limit, search, classFilter, statusFilter, academicYearFilter, subjectFilter, examDateFilter, sortBy, isStudentOrParent, user])

  // Fetch dashboard aggregates
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/exams/dashboard-stats')
      if (res && res.success) {
        setStats(res.data || null)
      }
    } catch {
      // Silent catch
    }
  }, [])

  useEffect(() => {
    fetchExams()
  }, [fetchExams])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Fetch results roster for selected exam
  const fetchResultsRoster = useCallback(async () => {
    if (!selectedExamForResults) return
    setResultsLoading(true)
    try {
      const params = {
        examId: selectedExamForResults._id,
        search: resultsSearch,
        sortBy: resultsSortBy,
        limit: 1000
      }
      const res = await api.get('/exams/results', { params })
      if (res && res.success) {
        setStudentSearchResults(res.data.results || [])
      }
    } catch {
      showToast('error', 'Failed to fetch student results')
    } finally {
      setResultsLoading(false)
    }
  }, [selectedExamForResults, resultsSearch, resultsSortBy, showToast])

  useEffect(() => {
    fetchResultsRoster()
  }, [fetchResultsRoster])


  const handleSearchChange = (val) => {
    setSearch(val)
    setPage(1)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchExams()
  }



  const handleFormClassChange = (newClass) => {
    setFormFields(prev => ({
      ...prev,
      class: newClass,
      subjectId: ''
    }))
    loadClassSubjects(newClass)
  }

  const handleOpenCreate = () => {
    setCurrentExam(null)
    const defaultClass = classes[0] || ''
    setFormFields({
      examName: '',
      academicYear: new Date().getFullYear().toString(),
      class: defaultClass,
      subjectId: '',
      examDate: new Date().toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '13:00',
      maxMarks: '100',
      passingMarks: '40',
      instructions: '',
      status: 'Scheduled'
    })
    setValidationErrors({})
    loadClassSubjects(defaultClass)
    setIsAddEditModalOpen(true)
  }

  const handleOpenEdit = async (exam) => {
    setCurrentExam(exam)
    if (exam.class) {
      await loadClassSubjects(exam.class)
    }
    setFormFields({
      examName: exam.examName || '',
      academicYear: exam.academicYear || '',
      class: exam.class || '',
      subjectId: exam.subjectId?._id || exam.subjectId || '',
      examDate: exam.examDate ? exam.examDate.split('T')[0] : '',
      startTime: exam.startTime || '',
      endTime: exam.endTime || '',
      maxMarks: String(exam.maxMarks || '100'),
      passingMarks: String(exam.passingMarks || '40'),
      instructions: exam.instructions || '',
      status: exam.status || 'Scheduled'
    })
    setValidationErrors({})
    setIsAddEditModalOpen(true)
  }

  const handleOpenDelete = (exam) => {
    setCurrentExam(exam)
    setIsDeleteConfirmOpen(true)
  }

  const handleOpenView = (exam) => {
    setCurrentExam(exam)
    setIsViewModalOpen(true)
  }

  const handleIntInput = (field, val) => {
    const normalized = normalizeIntegerString(val)
    setFormFields(prev => ({
      ...prev,
      [field]: normalized
    }))
  }

  const handleSaveExam = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setValidationErrors({})

    const errors = {}
    if (!formFields.examName.trim()) {
      errors.examName = 'Exam name is required'
    }
    if (!formFields.academicYear.trim()) {
      errors.academicYear = 'Academic Year is required'
    }
    if (!formFields.class) {
      errors.class = 'Class grade is required'
    }
    if (!formFields.subjectId) {
      errors.subjectId = 'Subject selection is required'
    }
    if (!formFields.examDate) {
      errors.examDate = 'Exam date is required'
    }
    if (!formFields.startTime) {
      errors.startTime = 'Start time is required'
    }
    if (!formFields.endTime) {
      errors.endTime = 'End time is required'
    }

    const max = parseInt(formFields.maxMarks, 10)
    const pass = parseInt(formFields.passingMarks, 10)

    if (isNaN(max) || max <= 0) {
      errors.maxMarks = 'Max marks must be a positive integer greater than 0'
    }
    if (isNaN(pass) || pass < 0) {
      errors.passingMarks = 'Passing marks cannot be negative'
    } else if (pass > max) {
      errors.passingMarks = 'Passing marks cannot exceed maximum marks'
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      setSubmitting(false)
      showToast('error', 'Please resolve highlighted validation errors.')
      return
    }

    // Cast string variables to numbers for saving
    const payload = {
      ...formFields,
      maxMarks: max,
      passingMarks: pass
    }

    try {
      let res
      if (currentExam) {
        res = await api.put(`/exams/${currentExam._id}`, payload)
      } else {
        res = await api.post('/exams', payload)
      }

      if (res && res.success) {
        showToast('success', currentExam ? 'Exam configuration updated.' : 'Exam scheduled successfully.')
        setIsAddEditModalOpen(false)
        fetchExams()
        fetchStats()
      } else {
        showToast('error', res.message || 'Operation failed')
      }
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) {
        setValidationErrors(data.errors)
        showToast('error', Object.values(data.errors)[0] || 'Validation failed.')
      } else {
        showToast('error', data?.message || err.message || 'Server error occurred')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteExam = async () => {
    if (!currentExam) return
    try {
      const res = await api.delete(`/exams/${currentExam._id}`)
      if (res && res.success) {
        showToast('success', 'Exam configuration deleted.')
        setIsDeleteConfirmOpen(false)
        fetchExams()
        fetchStats()
      } else {
        showToast('error', res.message || 'Failed to delete exam')
      }
    } catch (err) {
      showToast('error', err.message || 'Delete operation failed')
    }
  }

  const handlePublishResults = async () => {
    if (!selectedExamForResults) return
    const confirmPublish = window.confirm('Are you sure you want to publish the results for this exam? This will release report cards to students and parents.')
    if (!confirmPublish) return
    
    try {
      const res = await api.put(`/exams/${selectedExamForResults._id}`, { status: 'Published' })
      if (res && res.success) {
        showToast('success', 'Exam results published successfully.')
        setIsResultsModalOpen(false)
        fetchExams()
        fetchStats()
      } else {
        showToast('error', res.message || 'Failed to publish results')
      }
    } catch (err) {
      showToast('error', err.message || 'Operation failed')
    }
  }

  // Marks Entry Handlers
  const handleOpenMarksEntry = (exam) => {
    if (exam.status === 'Scheduled' || exam.status === 'Active') {
      showToast('error', 'Marks can only be entered after the exam has been completed.')
      return
    }
    setSelectedExamForMarks(exam)
    setMarksStudents([])
    setHasUnsavedMarks(false)
    setMarksStudentsLoading(true)
    setIsMarksModalOpen(true)
    
    // Direct endpoint fetch
    api.get(`/exams/${exam._id}/students`)
      .then(res => {
        if (res && res.success) {
          const mapped = (res.data || []).map(row => ({
            ...row,
            pristineMarks: row.marksObtained,
            pristineRemarks: row.remarks || '',
            isChanged: false,
            inputError: null
          }))
          setMarksStudents(mapped)
        }
      })
      .catch(() => {
        showToast('error', 'Failed to fetch marks roster')
      })
      .finally(() => {
        setMarksStudentsLoading(false)
      })
  }

  const handleCloseMarksEntry = () => {
    if (hasUnsavedMarks) {
      const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to discard them?')
      if (!confirmLeave) return
    }
    setHasUnsavedMarks(false)
    setIsMarksModalOpen(false)
    setSelectedExamForMarks(null)
  }

  const handleMarksObtainedChange = (index, value) => {
    const updated = [...marksStudents]
    const cleanedValue = value.replace(/^0+/, '')
    updated[index].marksObtained = cleanedValue
    
    const max = updated[index].maxMarks
    const pass = updated[index].passingMarks
    const marksVal = parseFloat(cleanedValue)

    if (cleanedValue.trim() === '') {
      updated[index].inputError = 'Marks obtained is required'
    } else if (isNaN(marksVal) || marksVal < 0 || marksVal > max) {
      updated[index].inputError = `Marks must be between 0 and ${max}`
    } else {
      updated[index].inputError = null
    }

    if (!isNaN(marksVal) && marksVal >= 0 && marksVal <= max) {
      const pct = parseFloat(((marksVal / max) * 100).toFixed(2))
      updated[index].percentage = pct
      updated[index].grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 65 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'D' : 'F'
      updated[index].result = marksVal >= pass ? 'PASS' : 'FAIL'
    } else {
      updated[index].percentage = null
      updated[index].grade = ''
      updated[index].result = ''
    }

    updated[index].isChanged = 
      String(updated[index].marksObtained) !== String(updated[index].pristineMarks) ||
      String(updated[index].remarks || '') !== String(updated[index].pristineRemarks)

    setMarksStudents(updated)
    setHasUnsavedMarks(updated.some(r => r.isChanged))
  }

  const handleRemarksChange = (index, value) => {
    const updated = [...marksStudents]
    updated[index].remarks = value

    updated[index].isChanged = 
      String(updated[index].marksObtained) !== String(updated[index].pristineMarks) ||
      String(updated[index].remarks || '') !== String(updated[index].pristineRemarks)

    setMarksStudents(updated)
    setHasUnsavedMarks(updated.some(r => r.isChanged))
  }

  const handleSaveMarks = async () => {
    let valid = true
    const listToSave = []
    
    marksStudents.forEach((row, index) => {
      const valStr = String(row.marksObtained).trim()
      if (valStr === '') {
        row.inputError = 'Marks obtained cannot be empty'
        showToast('error', `Row ${index + 1}: Marks obtained cannot be empty.`)
        valid = false
        return
      }
      
      const val = parseFloat(row.marksObtained)
      if (isNaN(val) || val < 0 || val > row.maxMarks) {
        row.inputError = `Marks must be between 0 and ${row.maxMarks}`
        showToast('error', `Row ${index + 1}: Marks must be a positive integer between 0 and ${row.maxMarks}.`)
        valid = false
        return
      }

      listToSave.push({
        studentId: row.student._id,
        marksObtained: val,
        remarks: row.remarks || ''
      })
    })

    if (!valid) {
      setMarksStudents([...marksStudents])
      return
    }

    setSavingMarks(true)
    try {
      await api.post(`/exams/${selectedExamForMarks._id}/marks`, { marks: listToSave })
      showToast('success', 'Student marks submitted successfully.')
      setHasUnsavedMarks(false)
      setIsMarksModalOpen(false) // Automatically close modal
      fetchExams()
      fetchStats()
    } catch (err) {
      showToast('error', err.message || 'Failed to submit marks.')
    } finally {
      setSavingMarks(false)
    }
  }

  // Results View Handlers
  const handleOpenResults = (exam) => {
    setSelectedExamForResults(exam)
    setResultsSearch('')
    setStudentSearchResults([])
    setIsResultsModalOpen(true)
  }

  const handleOpenStudentResultCard = (studentId) => {
    setResultsLoading(true)
    api.get(`/exams/results/student/${studentId}`)
      .then(res => {
        if (res && res.success) {
          const matchResult = res.data.results.find(r => r.exam._id === selectedExamForResults?._id)
          if (matchResult) {
            setSelectedStudentResult({
              student: res.data.student,
              results: [matchResult]
            })
            setResultDetailOpen(true)
          } else {
            showToast('error', 'No marks data found for this exam.')
          }
        }
      })
      .catch(() => {
        showToast('error', 'Failed to fetch student result card details.')
      })
      .finally(() => {
        setResultsLoading(false)
      })
  }

  // Frontend local filtering via selected KPI Card
  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      if (kpiFilter === 'upcoming') {
        return exam.status === 'Scheduled'
      }
      if (kpiFilter === 'completed') {
        return exam.status === 'Completed' || exam.status === 'Published'
      }
      if (kpiFilter === 'published') {
        return exam.status === 'Published'
      }
      return true
    })
  }, [exams, kpiFilter])

  const totalPages = Math.ceil(total / limit) || 1

  return (
    <div className="flex-grow w-full h-full text-slate-800 flex flex-col gap-6 select-none min-h-0 bg-transparent overflow-y-auto pr-1 custom-scrollbar">
      
      {/* Toast notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "fixed top-6 right-6 z-[100] px-5 py-3.5 rounded-[20px] shadow-premium-3 flex items-center gap-3 border text-xs font-black tracking-wide bg-white max-w-sm select-none",
              toast.type === 'success' ? "border-emerald-200 text-slate-800" : "border-red-200 text-slate-800"
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

      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="text-left space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase select-none">
            <span>ERP</span>
            <span>/</span>
            <span className="text-brand-blue-600">Exams</span>
            {activeFiltersCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-black leading-none">
                Filters ({activeFiltersCount})
              </span>
            )}
            {isFetchingBackground && (
              <span className="ml-2 text-[9px] text-brand-blue-500 font-extrabold animate-pulse">Syncing...</span>
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none mt-1">
            Exams Management
          </h2>
          <p className="text-[11px] font-bold text-slate-400 mt-1.5">
            Configure exam timetables, record marks sheet, and review academic report card results.
          </p>
        </div>

        {/* Top-Right Header controls */}
        <div className="flex items-center gap-3">
          {isTeacherOrAdmin && (
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenCreate(); }}
              className="h-10 px-5 rounded-full bg-brand-blue-500 hover:bg-brand-blue-600 active:scale-95 text-xs font-extrabold text-white shadow-premium-2 cursor-pointer flex items-center justify-center gap-2 transition-all shrink-0 font-sans"
            >
              <Plus className="h-4 w-4" />
              <span>Add Exam</span>
            </button>
          )}

          <form onSubmit={handleSearchSubmit} className="relative w-64">
            <input
              type="text"
              placeholder="Search exam, class, subject..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full h-10 pl-11 pr-5 rounded-full border border-slate-200 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white shadow-sm"
            />
            <Search className="absolute left-4 top-2.5 h-4.5 w-4.5 text-slate-400" />
          </form>

        </div>
      </div>

      {/* 2. KPI Cards Panel Grid with active filter highlight */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0 select-none">
        <div 
          onClick={() => setKpiFilter('all')}
          className="cursor-pointer rounded-[24px]"
        >
          <DashboardStatCard
            title="Total Exams"
            value={stats?.totalExams || 0}
            subtitle="Registered exams"
            icon={Calendar}
            iconBgColor="bg-blue-50"
            iconColor="text-blue-500"
            className="py-3 px-5 border border-slate-100/50 hover:border-slate-200 transition-all"
          />
        </div>
        <div 
          onClick={() => setKpiFilter(kpiFilter === 'upcoming' ? 'all' : 'upcoming')}
          className={cn(
            "cursor-pointer rounded-[24px] border border-transparent transition-all",
            kpiFilter === 'upcoming' && "ring-2 ring-brand-blue-500/20 border-brand-blue-500"
          )}
        >
          <DashboardStatCard
            title="Upcoming"
            value={stats?.upcomingExams || 0}
            subtitle="Awaiting schedule"
            icon={Calendar}
            iconBgColor="bg-amber-50"
            iconColor="text-amber-555"
            valueColor="text-amber-600"
            className="py-3 px-5 border border-slate-100/50 hover:border-slate-200"
          />
        </div>
        <div 
          onClick={() => setKpiFilter(kpiFilter === 'completed' ? 'all' : 'completed')}
          className={cn(
            "cursor-pointer rounded-[24px] border border-transparent transition-all",
            kpiFilter === 'completed' && "ring-2 ring-brand-blue-500/20 border-brand-blue-500"
          )}
        >
          <DashboardStatCard
            title="Completed"
            value={stats?.completedExams || 0}
            subtitle="Finished exams"
            icon={CheckSquare}
            iconBgColor="bg-emerald-50"
            iconColor="text-emerald-500"
            valueColor="text-emerald-600"
            className="py-3 px-5 border border-slate-100/50 hover:border-slate-200"
          />
        </div>
        <div 
          onClick={() => setKpiFilter(kpiFilter === 'published' ? 'all' : 'published')}
          className={cn(
            "cursor-pointer rounded-[24px] border border-transparent transition-all",
            kpiFilter === 'published' && "ring-2 ring-brand-blue-500/20 border-brand-blue-500"
          )}
        >
          <DashboardStatCard
            title="Results Published"
            value={stats?.resultsPublished || 0}
            subtitle="Released reports"
            icon={Award}
            iconBgColor="bg-red-50"
            iconColor="text-red-500"
            valueColor="text-red-655"
            className="py-3 px-5 border border-slate-100/50 hover:border-slate-200"
          />
        </div>
      </div>

      {/* 4. Table Listing Panel with fixed heights and sticky headers (blinking fix integrated) */}
      <div 
        style={{ borderRadius: '28px', border: '1px solid #ECECEC' }}
        className="bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex-grow flex flex-col justify-between relative overflow-hidden min-h-[480px] text-left"
      >
        <div className="overflow-y-auto overflow-x-auto flex-grow min-h-0 flex flex-col">
          <table className="w-full text-left min-w-[900px] border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest select-none">
              <tr className="h-14 bg-slate-50 sticky top-0 z-10">
                <th className="pl-6 text-left">
                  <TableHeadSort
                    title="Exam"
                    sortField="examName"
                    currentSortField={sortField}
                    sortOrder={sortOrder}
                    onClick={() => handleSortClick('examName')}
                  />
                </th>

                <th className="px-4 relative bg-slate-50 text-left">
                  <TableHeaderFilter
                    type="academicYear"
                    title={
                      <TableHeadSort
                        title="Year"
                        sortField="academicYear"
                        currentSortField={sortField}
                        sortOrder={sortOrder}
                        onClick={() => handleSortClick('academicYear')}
                      />
                    }
                    activeFilter={academicYearFilter}
                    isOpen={activeHeaderFilterDropdown === 'academicYear'}
                    onToggle={() => toggleFilterDropdown('academicYear')}
                    onClose={() => setActiveHeaderFilterDropdown(null)}
                    onSelect={(val) => { setAcademicYearFilter(val); setPage(1); }}
                    options={['2025', '2026', '2027']}
                  />
                </th>

                <th className="px-4 relative bg-slate-50 text-left">
                  <TableHeaderFilter
                    type="class"
                    title={
                      <TableHeadSort
                        title="Class"
                        sortField="class"
                        currentSortField={sortField}
                        sortOrder={sortOrder}
                        onClick={() => handleSortClick('class')}
                      />
                    }
                    activeFilter={classFilter}
                    isOpen={activeHeaderFilterDropdown === 'class'}
                    onToggle={() => toggleFilterDropdown('class')}
                    onClose={() => setActiveHeaderFilterDropdown(null)}
                    onSelect={(val) => { setClassFilter(val); setPage(1); }}
                    options={classes}
                  />
                </th>

                <th className="px-4 relative bg-slate-50 text-left">
                  <TableHeaderFilter
                    type="subject"
                    title={
                      <TableHeadSort
                        title="Subject"
                        sortField="subjectId"
                        currentSortField={sortField}
                        sortOrder={sortOrder}
                        onClick={() => handleSortClick('subjectId')}
                      />
                    }
                    activeFilter={subjectFilter}
                    isOpen={activeHeaderFilterDropdown === 'subjectId'}
                    onToggle={() => toggleFilterDropdown('subjectId')}
                    onClose={() => setActiveHeaderFilterDropdown(null)}
                    onSelect={(val) => { setSubjectFilter(val); setPage(1); }}
                    options={allSubjects}
                  />
                </th>

                <th className="px-4 relative bg-slate-50 text-left">
                  <TableHeaderFilter
                    type="examDate"
                    title={
                      <TableHeadSort
                        title="Date"
                        sortField="examDate"
                        currentSortField={sortField}
                        sortOrder={sortOrder}
                        onClick={() => handleSortClick('examDate')}
                      />
                    }
                    activeFilter={examDateFilter}
                    isOpen={activeHeaderFilterDropdown === 'examDate'}
                    onToggle={() => toggleFilterDropdown('examDate')}
                    onClose={() => setActiveHeaderFilterDropdown(null)}
                    onSelect={(val) => { setExamDateFilter(val); setPage(1); }}
                    options={[]} // handled inside the template filter dropdown date-picker if any
                  />
                </th>

                <th className="px-4 text-left">
                  <div className="py-4">Time</div>
                </th>

                <th className="px-4 relative bg-slate-50 text-left">
                  <TableHeaderFilter
                    type="status"
                    title={
                      <TableHeadSort
                        title="Status"
                        sortField="status"
                        currentSortField={sortField}
                        sortOrder={sortOrder}
                        onClick={() => handleSortClick('status')}
                      />
                    }
                    activeFilter={statusFilter}
                    isOpen={activeHeaderFilterDropdown === 'status'}
                    onToggle={() => toggleFilterDropdown('status')}
                    onClose={() => setActiveHeaderFilterDropdown(null)}
                    onSelect={(val) => { setStatusFilter(val); setPage(1); }}
                    options={statuses}
                  />
                </th>

                <th className="pr-6 w-12 text-right"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100/50 text-[11px] font-bold text-slate-655">
              {loading && filteredExams.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="h-7 w-7 text-blue-500 animate-spin" />
                      <span className="text-xs font-bold text-slate-400">Loading examinations...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="8" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-red-500">
                      <AlertCircle className="h-7 w-7" />
                      <span className="text-xs font-bold">{error}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredExams.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                      <div className="h-14 w-14 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200/50 text-slate-350">
                        <Calendar className="h-7 w-7" />
                      </div>
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">No examinations have been created yet.</h4>
                      {isTeacherOrAdmin && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenCreate(); }}
                          className="mt-2 h-9 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all border border-slate-200 cursor-pointer"
                        >
                          Create First Exam
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam) => (
                  <tr 
                    key={exam._id} 
                    onClick={() => handleOpenView(exam)} 
                    className="h-[68px] hover:bg-slate-50/50 transition-all cursor-pointer"
                  >
                    <td className="pl-6 text-xs font-black text-slate-808">
                      {exam.examName}
                    </td>

                    <td className="px-4 text-slate-550 font-mono">
                      {exam.academicYear}
                    </td>

                    <td className="px-4 text-slate-850">
                      {exam.class}
                    </td>

                    <td className="px-4 text-slate-805">
                      {exam.subjectId?.name || 'Deleted Subject'}
                    </td>

                    <td className="px-4 text-slate-555 font-mono">
                      {formatDate(exam.examDate)}
                    </td>

                    <td className="px-4 text-slate-555 font-mono">
                      {formatTimeRange(exam.startTime, exam.endTime)}
                    </td>

                    <td className="px-4">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase inline-block border",
                        getStatusBadgeClass(exam.status)
                      )}>
                        {exam.status}
                      </span>
                    </td>

                    <td className="pr-6 text-right w-12">
                      <TableRowActions 
                        actions={[
                          {
                            label: 'View Details',
                            icon: Info,
                            callback: () => handleOpenView(exam)
                          },
                          {
                            label: 'Marks Entry',
                            icon: CheckSquare,
                            visible: isTeacherOrAdmin,
                            callback: () => handleOpenMarksEntry(exam)
                          },
                          {
                            label: 'View Results',
                            icon: Award,
                            visible: isTeacherOrAdmin,
                            callback: () => handleOpenResults(exam)
                          },
                          {
                            label: 'View My Report Card',
                            icon: Award,
                            visible: isStudentOrParent && exam.status === 'Published',
                            callback: () => handleOpenStudentResultCard(user._id)
                          },
                          {
                            label: 'Edit',
                            icon: Edit3,
                            visible: isAdmin,
                            callback: () => handleOpenEdit(exam)
                          },
                          {
                            label: 'Delete',
                            icon: Trash2,
                            visible: isAdmin,
                            danger: true,
                            callback: () => handleOpenDelete(exam)
                          }
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPrev={() => setPage(prev => Math.max(prev - 1, 1))}
          onNext={() => setPage(prev => Math.min(prev + 1, totalPages))}
        />
      </div>

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={currentExam ? "Edit Exam Configuration" : "Schedule New Exam"}
        size="lg"
      >
        <form onSubmit={handleSaveExam} className="space-y-5 text-left text-xs font-bold text-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Exam Name *"
              type="text"
              placeholder="e.g. Weekly Physics Quiz"
              value={formFields.examName}
              onChange={(e) => setFormFields({ ...formFields, examName: e.target.value })}
              error={validationErrors.examName}
            />
            <Input
              label="Academic Session *"
              type="text"
              placeholder="e.g. 2026"
              value={formFields.academicYear}
              onChange={(e) => setFormFields({ ...formFields, academicYear: e.target.value })}
              error={validationErrors.academicYear}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">
                Class *
              </label>
              <select
                value={formFields.class}
                onChange={(e) => handleFormClassChange(e.target.value)}
                className={cn(
                  "w-full h-10 px-3.5 rounded-premium-md border border-[var(--border-light)] bg-white text-xs font-bold text-[var(--text-primary)] focus:border-brand-blue-500 focus:outline-none focus:ring-4 focus:ring-brand-blue-50/50 transition-all outline-none",
                  validationErrors.class && "border-red-500 focus:border-red-500"
                )}
              >
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {validationErrors.class && <p className="text-[10px] text-red-500 font-bold mt-1">{validationErrors.class}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">
                Subject *
              </label>
              <select
                value={formFields.subjectId}
                onChange={(e) => setFormFields({ ...formFields, subjectId: e.target.value })}
                className={cn(
                  "w-full h-10 px-3.5 rounded-premium-md border border-[var(--border-light)] bg-white text-xs font-bold text-[var(--text-primary)] focus:border-brand-blue-500 focus:outline-none transition-all outline-none",
                  validationErrors.subjectId && "border-red-500"
                )}
              >
                <option value="">Choose Subject...</option>
                {subjectsLoading ? (
                  <option disabled>Loading subjects...</option>
                ) : (
                  subjectsByClass.map(sub => (
                    <option key={sub._id} value={sub._id}>{sub.name} ({sub.code})</option>
                  ))
                )}
              </select>
              {validationErrors.subjectId && <p className="text-[10px] text-red-500 font-bold mt-1">{validationErrors.subjectId}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Exam Date *"
              type="date"
              value={formFields.examDate}
              onChange={(e) => setFormFields({ ...formFields, examDate: e.target.value })}
              error={validationErrors.examDate}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">
                Start Time *
              </label>
              <input
                type="time"
                value={formFields.startTime}
                onChange={(e) => setFormFields({ ...formFields, startTime: e.target.value })}
                className={cn(
                  "w-full h-10 px-3.5 rounded-premium-md border border-[var(--border-light)] bg-white text-xs font-bold text-[var(--text-primary)] focus:border-brand-blue-500 focus:outline-none transition-all outline-none",
                  validationErrors.startTime && "border-red-500"
                )}
              />
              {validationErrors.startTime && <p className="text-[10px] text-red-500 font-bold mt-1">{validationErrors.startTime}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">
                End Time *
              </label>
              <input
                type="time"
                value={formFields.endTime}
                onChange={(e) => setFormFields({ ...formFields, endTime: e.target.value })}
                className={cn(
                  "w-full h-10 px-3.5 rounded-premium-md border border-[var(--border-light)] bg-white text-xs font-bold text-[var(--text-primary)] focus:border-brand-blue-500 focus:outline-none transition-all outline-none",
                  validationErrors.endTime && "border-red-500"
                )}
              />
              {validationErrors.endTime && <p className="text-[10px] text-red-500 font-bold mt-1">{validationErrors.endTime}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Maximum Marks *"
              type="text"
              value={formFields.maxMarks}
              onChange={(e) => handleIntInput('maxMarks', e.target.value)}
              error={validationErrors.maxMarks}
            />
            <Input
              label="Passing Marks *"
              type="text"
              value={formFields.passingMarks}
              onChange={(e) => handleIntInput('passingMarks', e.target.value)}
              error={validationErrors.passingMarks}
            />
          </div>

          <Input
            label="Instructions"
            type="text"
            placeholder="Exam guidelines..."
            value={formFields.instructions}
            onChange={(e) => setFormFields({ ...formFields, instructions: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsAddEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Save Exam
            </Button>
          </div>
        </form>
      </Modal>

      {/* VIEW MODAL (Strictly single date/time coaching details) */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Exam Details"
        size="md"
      >
        <div className="space-y-4 text-xs font-bold text-slate-700 text-left">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Exam</p>
              <p className="text-slate-808 mt-1 font-extrabold text-[13px]">{currentExam?.examName}</p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Subject</p>
              <p className="text-slate-800 mt-1">{currentExam?.subjectId?.name || 'Deleted Subject'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Class</p>
              <p className="text-slate-805 mt-1">{currentExam?.class}</p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Current Status</p>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase inline-block border mt-1",
                getStatusBadgeClass(currentExam?.status)
              )}>
                {currentExam?.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Date</p>
              <p className="text-slate-800 mt-1">{formatDate(currentExam?.examDate)}</p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Time</p>
              <p className="text-slate-850 mt-1">{formatTimeRange(currentExam?.startTime, currentExam?.endTime)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Maximum Marks</p>
              <p className="text-slate-800 mt-1 font-extrabold text-brand-blue-600">{currentExam?.maxMarks}</p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Passing Marks</p>
              <p className="text-slate-800 mt-1 font-extrabold text-red-505">{currentExam?.passingMarks}</p>
            </div>
          </div>

          {currentExam?.instructions && (
            <div>
              <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Instructions</p>
              <p className="text-slate-600 mt-1 font-semibold">{currentExam.instructions}</p>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Delete Exam Configuration"
        size="sm"
      >
        <div className="space-y-4 text-left text-xs font-bold text-slate-700">
          <p className="leading-relaxed">
            Are you sure you want to delete <span className="text-slate-805 font-black">"{currentExam?.examName}"</span>? 
            This action cannot be undone. All marks registered for this exam will remain in archive.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={submitting} onClick={handleDeleteExam}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* MARKS ENTRY MODAL */}
      <Modal
        isOpen={isMarksModalOpen}
        onClose={handleCloseMarksEntry}
        title={`Marks Entry — ${selectedExamForMarks?.examName} (${selectedExamForMarks?.class})`}
        size="xl"
      >
        <div className="space-y-4 text-left">
          
          {selectedExamForMarks && (
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-2xl select-none">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-brand-blue-500" />
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider leading-none">Subject</p>
                  <p className="text-xs font-black text-slate-705 mt-1 leading-none">
                    {selectedExamForMarks.subjectId?.name || 'Loading Subject...'}
                  </p>
                </div>
              </div>
              <div className="text-right text-[10px] font-extrabold text-slate-550 leading-none">
                Max: {selectedExamForMarks.maxMarks} | Pass: {selectedExamForMarks.passingMarks}
              </div>
            </div>
          )}

          <div className="overflow-auto border border-slate-150 rounded-2xl max-h-[50vh] min-h-[250px]">
            {marksStudentsLoading ? (
              <div className="h-full flex items-center justify-center text-xs font-extrabold text-slate-400 min-h-[250px]">
                Loading student marks sheet...
              </div>
            ) : marksStudents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 p-10 text-center min-h-[250px]">
                <GraduationCap className="h-10 w-10 text-slate-300" />
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mt-1">No Enrolled Students</h3>
                <p className="text-xs text-slate-450 font-bold mt-1">No active student profiles are enrolled in {selectedExamForMarks?.class}.</p>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-155 sticky top-0 z-10 text-[9px] font-black tracking-wider text-slate-455 uppercase text-left select-none">
                    <th className="py-2.5 px-4">Photo</th>
                    <th className="py-2.5 px-4">Roll No</th>
                    <th className="py-2.5 px-4">Student Name</th>
                    <th className="py-2.5 px-4">Student ID</th>
                    <th className="py-2.5 px-4 w-36">Marks Obtained</th>
                    <th className="py-2.5 px-4">Percentage</th>
                    <th className="py-2.5 px-4">Grade</th>
                    <th className="py-2.5 px-4">Result</th>
                    <th className="py-2.5 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                  {marksStudents.map((row, idx) => (
                    <tr key={row.student._id} className={cn("hover:bg-slate-50/40", row.isChanged && "bg-blue-50/25")}>
                      <td className="py-1.5 px-4">
                        {row.student.photo?.secure_url ? (
                          <img
                            src={row.student.photo.secure_url}
                            alt={row.student.firstName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-extrabold text-slate-550 uppercase select-none">
                            {row.student.firstName[0]}{row.student.lastName[0]}
                          </div>
                        )}
                      </td>
                      <td className="py-1.5 px-4 text-slate-500 font-mono">{row.student.rollNumber || '-'}</td>
                      <td className="py-1.5 px-4 font-extrabold text-slate-805">{row.student.firstName} {row.student.lastName}</td>
                      <td className="py-1.5 px-4 text-slate-500 font-mono">{row.student.studentId}</td>
                      <td className="py-1.5 px-4">
                        <input
                          type="number"
                          min="0"
                          max={row.maxMarks}
                          value={row.marksObtained}
                          onChange={(e) => handleMarksObtainedChange(idx, e.target.value)}
                          placeholder={`Max: ${row.maxMarks}`}
                          className={cn(
                            "w-full max-w-[100px] px-3 py-1 border rounded-xl text-xs font-extrabold focus:outline-none focus:border-brand-blue-500",
                            row.inputError ? "border-red-500 focus:ring-red-50" : "border-slate-200 focus:ring-brand-blue-50"
                          )}
                        />
                        {row.inputError && (
                          <p className="text-[9px] font-black text-red-500 uppercase mt-0.5 leading-none">{row.inputError}</p>
                        )}
                      </td>
                      <td className="py-1.5 px-4 text-slate-500 font-mono">{row.percentage !== null && row.percentage !== undefined ? `${row.percentage}%` : '-'}</td>
                      <td className="py-1.5 px-4">
                        {row.grade ? (
                          <span className={cn(
                            "px-2 py-0.5 rounded font-black text-[9px]",
                            row.grade === 'F' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                          )}>
                            {row.grade}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-1.5 px-4">
                        {row.result ? (
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-black border",
                            row.result === 'PASS' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                          )}>
                            {row.result}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-1.5 px-4">
                        <input
                          type="text"
                          value={row.remarks || ''}
                          onChange={(e) => handleRemarksChange(idx, e.target.value)}
                          placeholder="Remarks"
                          className="w-full max-w-[150px] px-2.5 py-1 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={handleCloseMarksEntry}>
              Cancel
            </Button>
            {marksStudents.length > 0 && (
              <Button
                disabled={savingMarks}
                onClick={handleSaveMarks}
              >
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* RESULTS ROSTER MODAL (Allows publishing results from footer) */}
      <Modal
        isOpen={isResultsModalOpen}
        onClose={() => setIsResultsModalOpen(false)}
        title={`Results Summary — ${selectedExamForResults?.examName} (${selectedExamForResults?.class})`}
        size="xl"
      >
        <div className="space-y-4 text-left">
          
          <div className="flex flex-wrap items-center gap-3.5 p-3.5 bg-slate-50 border border-slate-150 rounded-2xl shrink-0">
            <div className="relative w-48">
              <input
                type="text"
                placeholder="Search student..."
                value={resultsSearch}
                onChange={(e) => setResultsSearch(e.target.value)}
                className="w-full h-9 pl-10 pr-4 rounded-full border border-slate-200 text-xs font-semibold focus:outline-none bg-white"
              />
              <Search className="absolute left-3.5 top-2 h-4 w-4 text-slate-400" />
            </div>

            <select
              value={resultsSortBy}
              onChange={(e) => setResultsSortBy(e.target.value)}
              className="h-9 px-3.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-655 focus:outline-none ml-auto"
            >
              <option value="Alphabetical">Alphabetical</option>
              <option value="Percentage">Percentage</option>
            </select>
          </div>

          <div className="overflow-auto border border-slate-150 rounded-2xl max-h-[50vh] min-h-[250px]">
            {resultsLoading ? (
              <div className="h-full flex items-center justify-center text-xs font-extrabold text-slate-400 min-h-[250px]">
                Loading results records...
              </div>
            ) : studentSearchResults.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 p-10 text-center min-h-[250px]">
                <Award className="h-10 w-10 text-slate-300" />
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mt-1">No Results Recorded</h3>
                <p className="text-xs text-slate-455 font-bold mt-1">No published results are recorded for this exam filter.</p>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 sticky top-0 z-10 text-[9px] font-black tracking-wider text-slate-455 uppercase text-left select-none">
                    <th className="py-2.5 px-4">Student</th>
                    <th className="py-2.5 px-4 text-center">Score</th>
                    <th className="py-2.5 px-4 text-center">Percentage</th>
                    <th className="py-2.5 px-4 text-center">Grade</th>
                    <th className="py-2.5 px-4 text-center">Result</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                  {studentSearchResults.map((card, cIdx) => (
                    <tr key={cIdx} className="hover:bg-slate-50/40">
                      <td className="py-2 px-4 font-extrabold text-slate-800 flex items-center gap-2">
                        {card.student.photo?.secure_url ? (
                          <img
                            src={card.student.photo.secure_url}
                            alt={card.student.firstName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] font-extrabold text-slate-550 uppercase select-none">
                            {card.student.firstName[0]}{card.student.lastName[0]}
                          </div>
                        )}
                        <span>{card.student.firstName} {card.student.lastName}</span>
                      </td>
                      <td className="py-2 px-4 text-center font-mono text-slate-808">{card.totalObtained} / {card.totalMax}</td>
                      <td className="py-2 px-4 text-center font-mono text-slate-500">{card.percentage}%</td>
                      <td className="py-2 px-4 text-center">
                        <span className="px-2 py-0.5 rounded font-black text-[9px] bg-blue-50 text-blue-700">
                          {card.grade}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-center">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase inline-block border",
                          card.overallResult === 'PASS' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                        )}>
                          {card.overallResult}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-right">
                        <button
                          onClick={() => handleOpenStudentResultCard(card.student._id)}
                          className="px-3.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-655 rounded-xl text-[9px] font-black uppercase transition-colors border-none bg-transparent cursor-pointer"
                        >
                          View Card
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsResultsModalOpen(false)}>
              Close
            </Button>
            {selectedExamForResults?.status !== 'Published' && (
              <Button
                variant="primary"
                onClick={handlePublishResults}
              >
                Publish Results
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* DETAILED STUDENT RESULT REPORT CARD */}
      <Modal 
        isOpen={resultDetailOpen} 
        onClose={() => setResultDetailOpen(false)} 
        title={`Academic Result Card - ${selectedStudentResult?.student.firstName} ${selectedStudentResult?.student.lastName}`}
        size="lg"
      >
        <div className="space-y-6 text-left">
          
          {selectedStudentResult?.student && (
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-150 rounded-3xl p-4 shrink-0">
              {selectedStudentResult.student.photo?.secure_url ? (
                <img
                  src={selectedStudentResult.student.photo.secure_url}
                  alt={selectedStudentResult.student.firstName}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-extrabold text-slate-555 uppercase select-none">
                  {selectedStudentResult.student.firstName[0]}{selectedStudentResult.student.lastName[0]}
                </div>
              )}
              <div>
                <p className="text-[10px] font-black uppercase text-slate-455 tracking-wider">Student Profile</p>
                <p className="text-sm font-black text-slate-805 mt-0.5 leading-none">
                  {selectedStudentResult.student.firstName} {selectedStudentResult.student.lastName}
                </p>
                <p className="text-[10px] text-slate-455 font-bold mt-1.5">
                  ID: {selectedStudentResult.student.studentId} | Class: {selectedStudentResult.student.class} | Roll: {selectedStudentResult.student.rollNumber || '-'}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-5 overflow-y-auto max-h-[50vh]">
            {selectedStudentResult?.results?.map((examRes, idx) => (
              <div key={idx} className="p-4.5 border border-slate-155 rounded-[24px] space-y-4">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-xs font-black text-slate-808 uppercase tracking-wider">{examRes.exam.examName}</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">
                      Academic Session: {examRes.exam.academicYear} | Date: {formatDate(examRes.exam.examDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 select-none">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase inline-block border",
                      examRes.overallResult === 'PASS' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                    )}>
                      {examRes.overallResult === 'PASS' ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-150/40 rounded-2xl">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150/40 text-[9px] font-black tracking-wider text-slate-400 uppercase text-left select-none">
                        <th className="py-2.5 px-4">Subject</th>
                        <th className="py-2.5 px-4 text-center">Obtained</th>
                        <th className="py-2.5 px-4 text-center">Max Marks</th>
                        <th className="py-2.5 px-4 text-center">Percentage</th>
                        <th className="py-2.5 px-4 text-center">Grade</th>
                        <th className="py-2.5 px-4 text-center">Status</th>
                        <th className="py-2.5 px-4">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px] font-bold text-slate-700">
                      {examRes.subjects?.map((sub, sIdx) => (
                        <tr key={sIdx} className="border-b border-slate-105 hover:bg-slate-50/30">
                          <td className="py-2 px-4 uppercase">{sub.subjectName}</td>
                          <td className="py-2 px-4 text-center text-slate-800 font-extrabold">{sub.marksObtained}</td>
                          <td className="py-2 px-4 text-center text-slate-555 font-mono">{sub.maxMarks}</td>
                          <td className="py-2 px-4 text-center text-slate-555 font-mono">{sub.percentage}%</td>
                          <td className="py-2 px-4 text-center">
                            <span className={cn(
                              "px-2 py-0.5 rounded font-black text-[9px]",
                              sub.grade === 'F' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                            )}>
                              {sub.grade}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-center">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-black border",
                              sub.result === 'PASS' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                            )}>
                              {sub.result}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-slate-550 italic max-w-[150px] truncate" title={sub.remarks}>
                            {sub.remarks || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-2xl text-[11px] font-extrabold text-slate-655 select-none">
                  <div>
                    Percentage: <span className="text-slate-800 font-black">{examRes.percentage}%</span>
                  </div>
                  <div>
                    Grade: <span className="text-slate-800 font-black">{examRes.grade}</span>
                  </div>
                  <div>
                    Score: <span className="text-slate-800 font-black">{examRes.totalObtained} / {examRes.totalMax}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setResultDetailOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
