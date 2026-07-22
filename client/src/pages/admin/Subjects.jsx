import { useAuth } from '../../contexts/AuthContext';
import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Eye, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  Check, 
  RefreshCw, 
  X,
  Calendar,
  FileText,
  BookOpen,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Printer,
  SlidersHorizontal
} from 'lucide-react'
import api from '@/services/api'
import { cn } from '@/utils/cn'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import { motion, AnimatePresence } from 'framer-motion'

const spring = { type: 'spring', stiffness: 350, damping: 28 }

const classes = [
  'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11 Science', 'Class 11 Commerce',
  'Class 12 Science', 'Class 12 Commerce'
];

const colorsList = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ea580c', // Orange
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
  '#ef4444'  // Red
];

export default function Subjects() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  
  // Pagination & Filtering state
  const [page, setPage] = useState(1)
  const [limit] = useState(6)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [teacherFilter, setTeacherFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sortField, setSortField] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false)

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false)
  const [currentSubject, setCurrentSubject] = useState(null) // null for create
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // Re-use Teacher View state
  const [isTeacherViewModalOpen, setIsTeacherViewModalOpen] = useState(false)
  const [teacherToView, setTeacherToView] = useState(null)

  // Toast notification state
  const [toast, setToast] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Local Form state
  const [formFields, setFormFields] = useState({
    name: '',
    code: '',
    class: 'Class 1',
    assignedTeacher: '',
    subjectType: 'Theory',
    periodsPerWeek: '4',
    color: '#3b82f6',
    description: '',
    status: 'Active'
  })
  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    if (isAddEditModalOpen || isViewModalOpen || isDeleteConfirmOpen || isBulkDeleteConfirmOpen || isTeacherViewModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isAddEditModalOpen, isViewModalOpen, isDeleteConfirmOpen, isBulkDeleteConfirmOpen, isTeacherViewModalOpen])

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  // Load teachers for assigned dropdown selection
  const fetchTeachers = async () => {
    try {
      const res = await api.get('/teachers', {
        params: { page: 1, limit: 1000, status: 'Active' }
      })
      if (res && res.success && res.data && res.data.teachers) {
        setTeachers(res.data.teachers)
      }
    } catch (err) {
      console.error('Failed to fetch active teachers list:', err)
    }
  }

  // Fetch subjects matching page/search/filters parameters
  const fetchSubjects = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/subjects', {
        params: {
          page,
          limit,
          search,
          class: classFilter,
          assignedTeacher: teacherFilter,
          status: statusFilter,
          subjectType: typeFilter,
          sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 }
        }
      })

      if (res && res.success) {
        setSubjects(res.data.subjects || [])
        setTotal(res.data.pagination?.total || 0)
        setTotalPages(res.data.pagination?.pages || 1)
        setStats(res.data.stats || null)
      } else {
        setError('Failed to fetch subjects list')
      }
    } catch (err) {
      console.error('Fetch subjects error:', err)
      setError(err.message || 'Server error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [])

  useEffect(() => {
    fetchSubjects()
  }, [page, classFilter, teacherFilter, statusFilter, typeFilter, sortField, sortOrder, search])

  // Trigger search on submit form
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchSubjects()
  }

  // Clear all filters
  const clearFilters = () => {
    setSearch('')
    setClassFilter('')
    setTeacherFilter('')
    setStatusFilter('')
    setTypeFilter('')
    setSortField('createdAt')
    setSortOrder('desc')
    setPage(1)
  }

  const activeChips = [
    ...(search ? [{ id: 'search', label: `Search: "${search}"`, onRemove: () => { setSearch(''); setPage(1); } }] : []),
    ...(classFilter ? [{ id: 'class', label: `Class: ${classFilter}`, onRemove: () => { setClassFilter(''); setPage(1); } }] : []),
    ...(teacherFilter ? [{ id: 'teacher', label: `Teacher: ${teacherFilter === 'assigned' ? 'Assigned Only' : teacherFilter === 'unassigned' ? 'Unassigned Only' : (teachers.find(t => t._id === teacherFilter) ? `${teachers.find(t => t._id === teacherFilter).firstName} ${teachers.find(t => t._id === teacherFilter).lastName}` : 'Custom')}`, onRemove: () => { setTeacherFilter(''); setPage(1); } }] : []),
    ...(statusFilter ? [{ id: 'status', label: `Status: ${statusFilter}`, onRemove: () => { setStatusFilter(''); setPage(1); } }] : []),
    ...(typeFilter ? [{ id: 'type', label: `Type: ${typeFilter}`, onRemove: () => { setTypeFilter(''); setPage(1); } }] : []),
    ...(sortField !== 'createdAt' || sortOrder !== 'desc' ? [{ id: 'sort', label: `Sorted`, onRemove: () => { setSortField('createdAt'); setSortOrder('desc'); setPage(1); } }] : [])
  ]

  const hasActiveFilters = activeChips.length > 0
  const advancedFilterCount = [classFilter, teacherFilter, statusFilter, typeFilter].filter(Boolean).length

  // Handle individual row select
  const handleSelectSubject = (subject) => {
    if (selectedSubjects.some(s => s._id === subject._id)) {
      setSelectedSubjects(selectedSubjects.filter(s => s._id !== subject._id))
    } else {
      setSelectedSubjects([...selectedSubjects, subject])
    }
  }

  // Select all rows on current page
  const handleSelectAllPage = () => {
    const allPageSelected = subjects.length > 0 && subjects.every(s => selectedSubjects.some(sel => sel._id === s._id))
    if (allPageSelected) {
      // Deselect page subjects
      setSelectedSubjects(selectedSubjects.filter(sel => !subjects.some(s => s._id === sel._id)))
    } else {
      // Add page subjects that aren't already selected
      const toAdd = subjects.filter(s => !selectedSubjects.some(sel => sel._id === s._id))
      setSelectedSubjects([...selectedSubjects, ...toAdd])
    }
  }

  // Open Add/Edit Modal
  const handleOpenCreate = () => {
    setCurrentSubject(null)
    setFormFields({
      name: '',
      code: '',
      class: 'Class 1',
      assignedTeacher: teachers.length > 0 ? teachers[0]._id : '',
      subjectType: 'Theory',
      periodsPerWeek: '4',
      color: '#3b82f6',
      description: '',
      status: 'Active'
    })
    setValidationErrors({})
    setIsAddEditModalOpen(true)
  }

  const handleOpenEdit = (subject) => {
    setCurrentSubject(subject)
    setFormFields({
      name: subject.name || '',
      code: subject.code || '',
      class: subject.class || 'Class 1',
      assignedTeacher: subject.assignedTeacher?._id || subject.assignedTeacher || '',
      subjectType: subject.subjectType || 'Theory',
      periodsPerWeek: String(subject.periodsPerWeek || '4'),
      color: subject.color || '#3b82f6',
      description: subject.description || '',
      status: subject.status || 'Active'
    })
    setValidationErrors({})
    setIsAddEditModalOpen(true)
  }

  const handleOpenView = (subject) => {
    setCurrentSubject(subject)
    setIsViewModalOpen(true)
  }

  const handleOpenDelete = (subject) => {
    setCurrentSubject(subject)
    setIsDeleteConfirmOpen(true)
  }

  // Submit create or edit form
  const handleSaveSubject = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setValidationErrors({})

    try {
      let res;
      const payload = {
        ...formFields,
        periodsPerWeek: parseInt(formFields.periodsPerWeek, 10) || 4
      }

      if (currentSubject) {
        res = await api.put(`/subjects/${currentSubject._id}`, payload)
      } else {
        res = await api.post('/subjects', payload)
      }

      if (res && res.success) {
        showToast('success', currentSubject ? 'Subject details updated.' : 'Subject created successfully.')
        setIsAddEditModalOpen(false)
        fetchSubjects()
      } else {
        showToast('error', res.message || 'Operation failed')
      }
    } catch (err) {
      console.error('Save subject error:', err)
      if (err.errors) {
        const errMap = {}
        err.errors.forEach(e => {
          errMap[e.field] = e.message
        })
        setValidationErrors(errMap)
        showToast('error', 'Please correct the highlighted fields.')
      } else {
        showToast('error', err.message || 'Server error occurred')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Delete single subject
  const handleDeleteSubject = async () => {
    if (!currentSubject) return
    try {
      const res = await api.delete(`/subjects/${currentSubject._id}`)
      if (res && res.success) {
        showToast('success', 'Subject deleted successfully.')
        setIsDeleteConfirmOpen(false)
        setSelectedSubjects(selectedSubjects.filter(s => s._id !== currentSubject._id))
        fetchSubjects()
      } else {
        showToast('error', res.message || 'Failed to delete subject')
      }
    } catch (err) {
      showToast('error', err.message || 'Delete operation failed')
    }
  }

  // Bulk delete selected subjects
  const handleBulkDelete = async () => {
    if (selectedSubjects.length === 0) return
    setBulkDeleting(true)
    try {
      const ids = selectedSubjects.map(s => s._id)
      const res = await api.delete('/subjects/bulk', { data: { ids } })
      if (res && res.success) {
        showToast('success', `Successfully deleted ${selectedSubjects.length} subjects.`)
        setSelectedSubjects([])
        setIsBulkDeleteConfirmOpen(false)
        fetchSubjects()
      } else {
        showToast('error', res.message || 'Bulk delete failed')
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to execute bulk deletion')
    } finally {
      setBulkDeleting(false)
    }
  }

  // Derive stream helper
  const getDerivedStream = (className) => {
    if (className.includes('Science')) return 'Science'
    if (className.includes('Commerce')) return 'Commerce'
    return 'General'
  }

  // Helper for generating print A4 report for teacher (reused from Teacher.jsx)
  const handlePrintTeacherProfile = (teacher) => {
    if (!teacher) return
    try {
      const doc = new jsPDF()
      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, 210, 36, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(user?.tenantName ? user.tenantName.toUpperCase() : 'INSTITUTION', 20, 16)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('TEACHER INSTRUCTOR REPORT', 20, 24)
      doc.setFontSize(8)
      doc.text(`Report Generated: ${new Date().toLocaleString()}`, 140, 24)

      doc.setFillColor(248, 250, 252)
      doc.rect(20, 48, 170, 220, 'F')
      doc.rect(20, 48, 170, 220, 'S')

      doc.setTextColor(15, 23, 42)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(`${teacher.firstName || ''} ${teacher.lastName || ''}`.toUpperCase(), 30, 68)

      doc.setTextColor(100, 116, 139)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(`TEACHER ID: ${teacher.teacherId || 'N/A'}`, 30, 76)
      doc.text(`STATUS: ${teacher.status || 'Active'}`, 130, 76)

      let drawY = 92
      const details = [
        { label: 'Gender', val: teacher.gender },
        { label: 'Date of Birth', val: teacher.dateOfBirth ? teacher.dateOfBirth.split('T')[0] : 'N/A' },
        { label: 'Phone', val: teacher.phone },
        { label: 'Email', val: teacher.email },
        { label: 'Qualification', val: teacher.qualification },
        { label: 'Experience', val: `${teacher.experience || 0} Years` },
        { label: 'Salary Scale', val: `Rs. ${teacher.salary?.toLocaleString() || 0}` },
        { label: 'Joining Date', val: teacher.joiningDate ? teacher.joiningDate.split('T')[0] : 'N/A' },
        { label: 'Subjects', val: Array.isArray(teacher.subjects) ? teacher.subjects.join(', ') : teacher.subjects || 'N/A' },
        { label: 'Address', val: `${teacher.address || ''}, ${teacher.city || ''} - ${teacher.pincode || ''}` }
      ]

      details.forEach((item) => {
        doc.setTextColor(148, 163, 184)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.text(item.label.toUpperCase(), 30, drawY)

        doc.setTextColor(51, 65, 85)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9.5)
        doc.text(String(item.val || 'N/A'), 30, drawY + 6)
        
        doc.setDrawColor(241, 245, 249)
        doc.line(30, drawY + 10, 180, drawY + 10)
        drawY += 16
      })

      doc.save(`teacher_profile_${teacher.teacherId || 'N/A'}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
    }
  }

  // Export CSV
  const handleExportCSV = async () => {
    if (total === 0) {
      return showToast('error', 'No subjects available to export.')
    }
    try {
      const res = await api.get('/subjects', {
        params: {
          page: 1,
          limit: total,
          search,
          class: classFilter,
          assignedTeacher: teacherFilter,
          status: statusFilter,
          subjectType: typeFilter,
          sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 }
        }
      })

      if (res && res.success && res.data.subjects && res.data.subjects.length > 0) {
        const listToExport = res.data.subjects
        const headers = [
          'Subject ID', 'Subject Name', 'Subject Code', 'Class', 'Stream',
          'Assigned Teacher', 'Periods Per Week', 'Subject Type', 'Status', 'Description'
        ]

        const rows = listToExport.map(s => {
          const teacherName = s.assignedTeacher 
            ? `${s.assignedTeacher.firstName || ''} ${s.assignedTeacher.lastName || ''}`.trim()
            : 'N/A'
          const stream = getDerivedStream(s.class || '')

          return [
            s.subjectId || 'N/A',
            s.name || 'N/A',
            s.code || 'N/A',
            s.class || 'N/A',
            stream,
            teacherName,
            s.periodsPerWeek || 0,
            s.subjectType || 'Theory',
            s.status || 'Active',
            s.description || ''
          ].map(val => {
            let cleanVal = String(val).replace(/"/g, '""')
            if (cleanVal.includes(',') || cleanVal.includes('\n')) {
              cleanVal = `"${cleanVal}"`
            }
            return cleanVal
          })
        })

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
          + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `subjects_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (err) {
      showToast('error', 'Failed to export CSV')
    }
  }

  // Export Excel
  const handleExportExcel = async () => {
    if (total === 0) {
      return showToast('error', 'No subjects available to export.')
    }
    try {
      const res = await api.get('/subjects', {
        params: {
          page: 1,
          limit: total,
          search,
          class: classFilter,
          assignedTeacher: teacherFilter,
          status: statusFilter,
          subjectType: typeFilter,
          sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 }
        }
      })

      if (res && res.success && res.data.subjects && res.data.subjects.length > 0) {
        const listToExport = res.data.subjects
        const headers = [
          'Subject ID', 'Subject Name', 'Subject Code', 'Class', 'Stream',
          'Assigned Teacher', 'Periods Per Week', 'Subject Type', 'Status'
        ]

        const dataRows = listToExport.map(s => {
          const teacherName = s.assignedTeacher 
            ? `${s.assignedTeacher.firstName || ''} ${s.assignedTeacher.lastName || ''}`.trim()
            : 'N/A'
          const stream = getDerivedStream(s.class || '')
          return [
            s.subjectId || 'N/A',
            s.name || 'N/A',
            s.code || 'N/A',
            s.class || 'N/A',
            stream,
            teacherName,
            s.periodsPerWeek || 0,
            s.subjectType || 'Theory',
            s.status || 'Active'
          ]
        })

        const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Subjects')
        XLSX.writeFile(wb, `subjects_${new Date().toISOString().split('T')[0]}.xlsx`)
      }
    } catch (err) {
      showToast('error', 'Failed to export Excel')
    }
  }

  // Export PDF
  const handleExportPDF = async () => {
    if (total === 0) {
      return showToast('error', 'No subjects available to export.')
    }
    try {
      const res = await api.get('/subjects', {
        params: {
          page: 1,
          limit: total,
          search,
          class: classFilter,
          assignedTeacher: teacherFilter,
          status: statusFilter,
          subjectType: typeFilter,
          sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 }
        }
      })

      if (res && res.success && res.data.subjects && res.data.subjects.length > 0) {
        const listToExport = res.data.subjects
        const doc = new jsPDF()
        
        // Header
        doc.setFillColor(15, 23, 42)
        doc.rect(0, 0, 210, 24, 'F')
        
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text((user?.tenantName || 'Institution') + ' - Subjects Directory Report', 14, 15)
        
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 150, 15)

        // Headers grid
        const startX = 10
        let curY = 32
        const colWidths = [24, 45, 24, 30, 38, 14, 15, 10]
        const headers = ['Sub ID', 'Subject Name', 'Code', 'Class', 'Teacher', 'Periods', 'Type', 'Status']

        doc.setFillColor(245, 247, 250)
        doc.rect(startX, curY, 190, 8, 'F')
        doc.rect(startX, curY, 190, 8, 'S')
        
        doc.setTextColor(50, 50, 50)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        
        let headerX = startX
        headers.forEach((h, idx) => {
          doc.text(h, headerX + 2, curY + 5)
          headerX += colWidths[idx]
        })
        curY += 8

        // Rows
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(80, 80, 80)
        
        listToExport.forEach((s) => {
          if (curY > 275) {
            doc.addPage()
            curY = 20
            // Draw table headers again on new page
            doc.setFillColor(245, 247, 250)
            doc.rect(startX, curY, 190, 8, 'F')
            doc.rect(startX, curY, 190, 8, 'S')
            doc.setTextColor(50, 50, 50)
            doc.setFont('helvetica', 'bold')
            let pageHeaderX = startX
            headers.forEach((h, idx) => {
              doc.text(h, pageHeaderX + 2, curY + 5)
              pageHeaderX += colWidths[idx]
            })
            curY += 8
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(80, 80, 80)
          }

          const teacherName = s.assignedTeacher 
            ? `${s.assignedTeacher.firstName || ''} ${s.assignedTeacher.lastName || ''}`.trim()
            : 'N/A'

          const rowValues = [
            s.subjectId || 'N/A',
            s.name || 'N/A',
            s.code || 'N/A',
            s.class || 'N/A',
            teacherName,
            String(s.periodsPerWeek || 0),
            s.subjectType || 'Theory',
            s.status || 'Active'
          ]

          doc.rect(startX, curY, 190, 8, 'S')
          let curCellX = startX
          rowValues.forEach((val, idx) => {
            let textVal = String(val)
            if (textVal.length > 25) {
              textVal = textVal.substring(0, 22) + '...'
            }
            doc.text(textVal, curCellX + 2, curY + 5)
            curCellX += colWidths[idx]
          })
          curY += 8
        })

        doc.save(`subjects_${new Date().toISOString().split('T')[0]}.pdf`)
        showToast('success', 'PDF report downloaded successfully.')
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      showToast('error', 'Failed to generate PDF report')
    }
  }

  return (
    <div className="flex-1 w-full h-full text-slate-800 flex flex-col gap-5 select-none min-h-0 bg-transparent">
      
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

      {/* 1. Header & Breadcrumbs Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left space-y-1">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase select-none">
            <span>Admin</span>
            <span>/</span>
            <span className="text-brand-blue-600">Subjects</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
            Subject Management
          </h2>
          <p className="text-[11px] font-bold text-slate-400 mt-1">
            Manage academic subjects, codes, classes, assigned teachers, and periods
          </p>
        </div>
      </div>

      {/* Interactive Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div 
          onClick={clearFilters}
          className={cn(
            "bg-white px-5 py-3.5 rounded-2xl border flex items-center justify-between shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-blue-200 active:scale-[0.98]",
            !hasActiveFilters ? "border-blue-500 ring-2 ring-blue-500/10 bg-blue-50/10" : "border-slate-100"
          )}
        >
          <div className="text-left">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Total Subjects</span>
            <span className="text-xl font-black text-slate-800 leading-tight block mt-0.5">{stats?.total || 0}</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
            <BookOpen className="h-4.5 w-4.5" />
          </div>
        </div>

        <div 
          onClick={() => { setTypeFilter(typeFilter === 'Theory' ? '' : 'Theory'); setPage(1); }}
          className={cn(
            "bg-white px-5 py-3.5 rounded-2xl border flex items-center justify-between shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-emerald-200 active:scale-[0.98]",
            typeFilter === 'Theory' ? "border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-50/10" : "border-slate-100"
          )}
        >
          <div className="text-left">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Theory</span>
            <span className="text-xl font-black text-emerald-600 leading-tight block mt-0.5">{stats?.theory || 0}</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Check className="h-4.5 w-4.5" />
          </div>
        </div>

        <div 
          onClick={() => { setTypeFilter(typeFilter === 'Practical' ? '' : 'Practical'); setPage(1); }}
          className={cn(
            "bg-white px-5 py-3.5 rounded-2xl border flex items-center justify-between shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-indigo-200 active:scale-[0.98]",
            typeFilter === 'Practical' ? "border-indigo-500 ring-2 ring-indigo-500/10 bg-indigo-50/10" : "border-slate-100"
          )}
        >
          <div className="text-left">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Practical</span>
            <span className="text-xl font-black text-indigo-650 leading-tight block mt-0.5">{stats?.practical || 0}</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="h-4.5 w-4.5" />
          </div>
        </div>

        <div 
          onClick={() => { setTeacherFilter(teacherFilter === 'unassigned' ? '' : 'unassigned'); setPage(1); }}
          className={cn(
            "bg-white px-5 py-3.5 rounded-2xl border flex items-center justify-between shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-amber-200 active:scale-[0.98]",
            teacherFilter === 'unassigned' ? "border-amber-500 ring-2 ring-amber-500/10 bg-amber-50/10" : "border-slate-100"
          )}
        >
          <div className="text-left">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Unassigned</span>
            <span className="text-xl font-black text-amber-600 leading-tight block mt-0.5">{stats?.unassigned || 0}</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>

      {/* 2. Sleek Compact Filter Bar & Controls */}
      <div className="space-y-3 shrink-0">
        <div 
          style={{ borderRadius: '24px', border: '1px solid #ECECEC' }}
          className="p-4 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="Search by name, code, class or teacher..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-10 pl-10 pr-9 rounded-full border border-slate-200 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50/60 transition-all placeholder:text-slate-400"
            />
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>

          {/* Action & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Advanced Filters Button */}
            <button
              type="button"
              onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
              className={cn(
                "h-10 px-4 rounded-full border text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-sm transition-all active:scale-95",
                isAdvancedFiltersOpen || advancedFilterCount > 0
                  ? "bg-brand-blue-50 border-brand-blue-300 text-brand-blue-600"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
              {advancedFilterCount > 0 && (
                <span className="ml-0.5 h-4.5 w-4.5 rounded-full bg-brand-blue-500 text-white text-[10px] font-black flex items-center justify-center">
                  {advancedFilterCount}
                </span>
              )}
            </button>

            {/* Class Quick Select */}
            <select
              value={classFilter}
              onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
              className="h-10 px-4 rounded-full border border-slate-200 text-xs font-extrabold text-slate-600 bg-white cursor-pointer outline-none focus:border-blue-500 shadow-sm"
            >
              <option value="">All Classes</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Sort Dropdown */}
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [f, o] = e.target.value.split('-')
                setSortField(f)
                setSortOrder(o)
                setPage(1)
              }}
              className="h-10 px-4 rounded-full border border-slate-200 text-xs font-extrabold text-slate-600 bg-white cursor-pointer outline-none focus:border-blue-500 shadow-sm hidden sm:block"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Subject Name A-Z</option>
              <option value="periodsPerWeek-desc">Most Periods/Wk</option>
              <option value="code-asc">Subject Code A-Z</option>
            </select>

            <div className="h-5 w-px bg-slate-200 mx-0.5 hidden xl:block" />

            {/* Export buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExportCSV}
                className="h-10 px-3.5 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-600 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                title="Export CSV"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="h-10 px-3.5 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-600 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                title="Export Excel"
              >
                <FileText className="h-3.5 w-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button
                onClick={handleExportPDF}
                className="h-10 px-3.5 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-600 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                title="Export PDF Report"
              >
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            </div>

            {/* Add Subject Button */}
            <button
              onClick={handleOpenCreate}
              className="h-10 px-5 rounded-full bg-brand-blue-500 hover:bg-brand-blue-600 active:scale-95 text-xs font-extrabold text-white shadow-premium-2 cursor-pointer flex items-center justify-center gap-2 transition-all shrink-0 ml-1 font-sans"
            >
              <Plus className="h-4 w-4" />
              <span>Add Subject</span>
            </button>
          </div>
        </div>

        {/* Advanced Filter Popover */}
        <AnimatePresence>
          {isAdvancedFiltersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div 
                style={{ borderRadius: '24px', border: '1px solid #ECECEC' }}
                className="p-5 bg-slate-50/80 border border-slate-200/80 grid grid-cols-1 md:grid-cols-4 gap-4"
              >
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                    Class / Grade
                  </label>
                  <select
                    value={classFilter}
                    onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
                    className="w-full h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none focus:border-blue-500 shadow-sm"
                  >
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                    Assigned Teacher
                  </label>
                  <select
                    value={teacherFilter}
                    onChange={(e) => { setTeacherFilter(e.target.value); setPage(1); }}
                    className="w-full h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none focus:border-blue-500 shadow-sm"
                  >
                    <option value="">All Teachers</option>
                    <option value="assigned">Assigned Teachers</option>
                    <option value="unassigned">Unassigned Teachers</option>
                    <option disabled>──────────</option>
                    {teachers.map(t => (
                      <option key={t._id} value={t._id}>
                        {`${t.firstName || ''} ${t.lastName || ''}`.trim()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                    Subject Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                    className="w-full h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none focus:border-blue-500 shadow-sm"
                  >
                    <option value="">All Types</option>
                    <option value="Theory">Theory</option>
                    <option value="Practical">Practical</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="w-full h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none focus:border-blue-500 shadow-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="md:col-span-4 flex justify-end gap-2 pt-2 border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    Reset Filters
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAdvancedFiltersOpen(false)}
                    className="h-9 px-5 rounded-xl bg-slate-900 text-xs font-bold text-white hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 px-1 pt-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">Active Filters:</span>
            {activeChips.map((chip) => (
              <span
                key={chip.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-extrabold border border-blue-200 shadow-2xs"
              >
                <span>{chip.label}</span>
                <button
                  type="button"
                  onClick={chip.onRemove}
                  className="p-0.5 hover:bg-blue-200 rounded-full transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-extrabold text-slate-400 hover:text-slate-600 underline ml-2 cursor-pointer transition-colors"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* 3. Main Data Card / Listing Section */}
      <div 
        style={{ borderRadius: '28px', border: '1px solid #ECECEC' }}
        className="bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex-1 flex flex-col justify-between relative overflow-hidden min-h-0"
      >
        <AnimatePresence>
          {selectedSubjects.length > 0 && (
            <motion.div
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="absolute top-0 left-0 right-0 h-16 bg-slate-900 text-white px-8 flex items-center justify-between z-20"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-black tracking-wider uppercase text-slate-400">Selected:</span>
                <span className="text-sm font-black bg-slate-800 px-3 py-1 rounded-full">{selectedSubjects.length}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedSubjects([])}
                  className="h-9 px-4 rounded-full border border-slate-700 hover:bg-slate-800 text-xs font-extrabold text-slate-300 cursor-pointer transition-colors"
                >
                  Cancel Selection
                </button>
                <button
                  onClick={() => setIsBulkDeleteConfirmOpen(true)}
                  className="h-9 px-5 rounded-full bg-red-600 hover:bg-red-700 text-xs font-extrabold text-white cursor-pointer shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Selected</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-y-auto overflow-x-auto flex-1 min-h-0">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest select-none">
              <tr className="h-14">
                <th className="pl-6 w-[50px]">
                  <input
                    type="checkbox"
                    checked={subjects.length > 0 && subjects.every(s => selectedSubjects.some(sel => sel._id === s._id))}
                    onChange={handleSelectAllPage}
                    className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-4 w-[60px]">Color</th>
                <th className="px-4">Subject ID</th>
                <th className="px-4">Subject Name</th>
                <th className="px-4">Subject Code</th>
                <th className="px-4">Class</th>
                <th className="px-4">Stream</th>
                <th className="px-4">Assigned Teacher</th>
                <th className="px-4">Periods/Week</th>
                <th className="px-4">Type</th>
                <th className="px-4">Status</th>
                <th className="px-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100/50 text-[11px] font-bold text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan="12" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="h-7 w-7 text-blue-500 animate-spin" />
                      <span className="text-xs font-bold text-slate-400">Loading subjects data...</span>
                    </div>
                  </td>
                </tr>
              ) : subjects.length === 0 ? (
                <tr>
                  <td colSpan="12" className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                      <div className="h-14 w-14 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200/50 text-slate-300">
                        <BookOpen className="h-7 w-7" />
                      </div>
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">No Subjects Found</h4>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        We couldn't find any subjects matching your filters. Try adding a new subject or resetting search attributes.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                subjects.map((subject) => {
                  const isSelected = selectedSubjects.some(s => s._id === subject._id)
                  const teacherName = subject.assignedTeacher 
                    ? `${subject.assignedTeacher.firstName || ''} ${subject.assignedTeacher.lastName || ''}`.trim()
                    : 'Unassigned'
                  const stream = getDerivedStream(subject.class || '')

                  return (
                    <tr 
                      key={subject._id}
                      className={cn(
                        "h-[68px] hover:bg-slate-50/50 transition-colors group",
                        isSelected && "bg-blue-50/20 hover:bg-blue-50/30"
                      )}
                    >
                      <td className="pl-6">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectSubject(subject)}
                          className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      <td className="px-4">
                        <span 
                          className="h-4.5 w-4.5 rounded-full border border-slate-200 shadow-sm block" 
                          style={{ backgroundColor: subject.color || '#3b82f6' }} 
                        />
                      </td>

                      <td className="px-4 font-extrabold text-slate-800 tracking-tight">
                        {subject.subjectId}
                      </td>

                      <td className="px-4 text-xs font-black text-slate-800 truncate max-w-[180px]">
                        {subject.name}
                      </td>

                      <td className="px-4 font-mono font-extrabold text-slate-500">
                        {subject.code}
                      </td>

                      <td className="px-4 font-extrabold text-slate-800">
                        {subject.class}
                      </td>

                      <td className="px-4">
                        {stream !== 'General' ? (
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                            stream === 'Science' ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' : 'bg-purple-50 text-purple-700 border border-purple-100'
                          )}>
                            {stream}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold">-</span>
                        )}
                      </td>

                      <td className="px-4 text-xs font-black text-slate-700 truncate max-w-[150px]">
                        {teacherName}
                      </td>

                      <td className="px-4 pl-8 text-xs font-extrabold text-slate-700">
                        {subject.periodsPerWeek}
                      </td>

                      <td className="px-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                          subject.subjectType === 'Practical' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-50 text-slate-600 border border-slate-100'
                        )}>
                          {subject.subjectType || 'Theory'}
                        </span>
                      </td>

                      <td className="px-4">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase inline-block border",
                          subject.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        )}>
                          {subject.status}
                        </span>
                      </td>

                      <td className="px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenView(subject)}
                            className="h-8 w-8 rounded-full bg-white hover:bg-slate-50 border border-slate-200/50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors shadow-sm cursor-pointer"
                            title="View Subject Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(subject)}
                            className="h-8 w-8 rounded-full bg-white hover:bg-slate-50 border border-slate-200/50 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors shadow-sm cursor-pointer"
                            title="Edit Subject"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(subject)}
                            className="h-8 w-8 rounded-full bg-white hover:bg-red-50 border border-slate-200/50 flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors shadow-sm cursor-pointer"
                            title="Delete Subject"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Modern Pagination Controls */}
        {!loading && !error && subjects.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-4 select-none flex-none">
            <span className="text-[11px] text-slate-400 font-black">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                className="h-8 px-3 rounded-full border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Previous</span>
              </button>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                className="h-8 px-3 rounded-full border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 5. ADD / EDIT SUBJECT MODAL (Redesigned with sections) */}
      <AnimatePresence>
        {isAddEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
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
                    {currentSubject ? 'Edit Subject Details' : 'Add New Subject'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">
                    Please provide required subject parameters below
                  </p>
                </div>
                <button
                  disabled={submitting}
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="h-9 w-9 rounded-full border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleSaveSubject} className="flex-1 overflow-y-auto p-8 space-y-6 min-h-0 text-left">
                <fieldset disabled={submitting} className="contents">
                  
                  {/* SECTION 1: ACADEMIC DETAILS */}
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black text-brand-blue-600 tracking-widest uppercase pb-1 border-b border-slate-100">
                      ACADEMIC DETAILS
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Subject Name *</label>
                        <input
                          type="text"
                          required
                          value={formFields.name}
                          onChange={(e) => setFormFields({ ...formFields, name: e.target.value })}
                          className={cn(
                            "w-full h-11 px-4 border rounded-[16px] text-xs font-semibold text-slate-700 bg-slate-50/50 focus:outline-none focus:bg-white transition-all focus:border-blue-500",
                            validationErrors.name ? "border-red-500 focus:border-red-500" : "border-slate-200/80"
                          )}
                          placeholder="e.g. Theoretical Physics"
                        />
                        {validationErrors.name && (
                          <p className="text-[9px] font-bold text-red-500 mt-0.5">{validationErrors.name}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Subject Code *</label>
                        <input
                          type="text"
                          required
                          value={formFields.code}
                          onChange={(e) => setFormFields({ ...formFields, code: e.target.value.toUpperCase() })}
                          className={cn(
                            "w-full h-11 px-4 border rounded-[16px] text-xs font-semibold text-slate-700 bg-slate-50/50 focus:outline-none focus:bg-white transition-all focus:border-blue-500 font-mono",
                            validationErrors.code ? "border-red-500 focus:border-red-500" : "border-slate-200/80"
                          )}
                          placeholder="e.g. C10-PHY"
                        />
                        {validationErrors.code && (
                          <p className="text-[9px] font-bold text-red-500 mt-0.5">{validationErrors.code}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Class *</label>
                        <select
                          required
                          value={formFields.class}
                          onChange={(e) => setFormFields({ ...formFields, class: e.target.value })}
                          className="w-full h-11 px-4 border border-slate-200/80 rounded-[16px] text-xs font-semibold text-slate-550 bg-slate-50/50 focus:outline-none focus:bg-white focus:border-blue-500 cursor-pointer transition-all"
                        >
                          {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Assigned Teacher *</label>
                        <select
                          required
                          value={formFields.assignedTeacher}
                          onChange={(e) => setFormFields({ ...formFields, assignedTeacher: e.target.value })}
                          className="w-full h-11 px-4 border border-slate-200/80 rounded-[16px] text-xs font-semibold text-slate-550 bg-slate-50/50 focus:outline-none focus:bg-white focus:border-blue-500 cursor-pointer transition-all"
                        >
                          <option value="" disabled>Select assigned teacher</option>
                          {teachers.map(t => (
                            <option key={t._id} value={t._id}>
                              {`${t.firstName || ''} ${t.lastName || ''} (${t.teacherId})`.trim()}
                            </option>
                          ))}
                        </select>
                        {validationErrors.assignedTeacher && (
                          <p className="text-[9px] font-bold text-red-500 mt-0.5">{validationErrors.assignedTeacher}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Periods Per Week *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="24"
                          value={formFields.periodsPerWeek}
                          onChange={(e) => setFormFields({ ...formFields, periodsPerWeek: e.target.value })}
                          className="w-full h-11 px-4 border border-slate-200/80 rounded-[16px] text-xs font-semibold text-slate-700 bg-slate-50/50 focus:outline-none focus:bg-white transition-all focus:border-blue-500"
                          placeholder="e.g. 5"
                        />
                        {validationErrors.periodsPerWeek && (
                          <p className="text-[9px] font-bold text-red-500 mt-0.5">{validationErrors.periodsPerWeek}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Subject Type</label>
                        <div className="flex items-center gap-4 h-11">
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-650 cursor-pointer">
                            <input
                              type="radio"
                              name="subjectType"
                              value="Theory"
                              checked={formFields.subjectType === 'Theory'}
                              onChange={() => setFormFields({ ...formFields, subjectType: 'Theory' })}
                              className="h-4.5 w-4.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            Theory
                          </label>
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-650 cursor-pointer">
                            <input
                              type="radio"
                              name="subjectType"
                              value="Practical"
                              checked={formFields.subjectType === 'Practical'}
                              onChange={() => setFormFields({ ...formFields, subjectType: 'Practical' })}
                              className="h-4.5 w-4.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            Practical
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Subject Color Tag</label>
                      <div className="flex items-center gap-2.5 h-11">
                        {colorsList.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setFormFields({ ...formFields, color: c })}
                            className={cn(
                              "h-7 w-7 rounded-full transition-all border",
                              formFields.color === c ? "scale-110 ring-2 ring-slate-800 ring-offset-2 border-slate-800 shadow" : "border-slate-200"
                            )}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: DESCRIPTION */}
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black text-brand-blue-600 tracking-widest uppercase pb-1 border-b border-slate-100">
                      DESCRIPTION
                    </h4>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Subject Description / Syllabus</label>
                      <textarea
                        value={formFields.description}
                        onChange={(e) => setFormFields({ ...formFields, description: e.target.value })}
                        className="w-full h-20 p-4 border border-slate-200/80 rounded-[16px] text-xs font-semibold text-slate-700 bg-slate-50/50 focus:outline-none focus:bg-white transition-all focus:border-blue-500 resize-none"
                        placeholder="Add brief details about the syllabus or goals..."
                      />
                    </div>
                  </div>

                  {/* SECTION 3: STATUS */}
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black text-brand-blue-600 tracking-widest uppercase pb-1 border-b border-slate-100">
                      STATUS
                    </h4>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-4 h-11">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-650 cursor-pointer">
                          <input
                            type="radio"
                            name="status"
                            value="Active"
                            checked={formFields.status === 'Active'}
                            onChange={() => setFormFields({ ...formFields, status: 'Active' })}
                            className="h-4.5 w-4.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          Active
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-650 cursor-pointer">
                          <input
                            type="radio"
                            name="status"
                            value="Inactive"
                            checked={formFields.status === 'Inactive'}
                            onChange={() => setFormFields({ ...formFields, status: 'Inactive' })}
                            className="h-4.5 w-4.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          Inactive
                        </label>
                      </div>
                    </div>
                  </div>

                </fieldset>
              </form>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="h-11 px-5 border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-500 rounded-full cursor-pointer disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSaveSubject}
                  disabled={submitting}
                  className="h-11 px-6 bg-brand-blue-500 hover:bg-brand-blue-600 text-xs font-extrabold text-white rounded-full cursor-pointer shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all active:scale-95 animate-none"
                >
                  {submitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                  <span>{currentSubject ? 'Save Changes' : 'Create Subject'}</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. VIEW SUBJECT PROFILE DETAILS MODAL */}
      <AnimatePresence>
        {isViewModalOpen && currentSubject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={spring}
              className="bg-white w-full max-w-lg shadow-premium-4 flex flex-col relative max-h-[85vh] overflow-hidden"
              style={{ borderRadius: '28px', border: '1px solid #ECECEC' }}
            >
              {/* Profile Top Color Bar */}
              <div 
                className="h-3.5 w-full shrink-0" 
                style={{ backgroundColor: currentSubject.color || '#3b82f6' }} 
              />
              
              {/* Header Title Section */}
              <div className="px-7 pt-6 pb-5 border-b border-slate-100 flex items-center justify-between shrink-0 text-left">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-[16px] flex items-center justify-center bg-slate-50 border border-slate-200/50 text-slate-500 shadow-sm shrink-0">
                    <BookOpen className="h-6 w-6" style={{ color: currentSubject.color || '#3b82f6' }} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-slate-800 tracking-tight leading-none">
                      {currentSubject.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-mono font-extrabold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        {currentSubject.code}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border",
                        currentSubject.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      )}>
                        {currentSubject.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="h-9 w-9 rounded-full border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors shadow-sm cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Scrollable details */}
              <div className="flex-1 overflow-y-auto p-7 space-y-6 text-left min-h-0">
                
                {/* Academic Context Row */}
                <div className="grid grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-[22px] border border-slate-100">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Class Level</span>
                    <span className="text-xs font-black text-slate-800 block mt-0.5">{currentSubject.class}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Academic Stream</span>
                    <span className="text-xs font-black text-slate-800 block mt-0.5">
                      {getDerivedStream(currentSubject.class || '') !== 'General' ? (
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider inline-block",
                          getDerivedStream(currentSubject.class || '') === 'Science' ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' : 'bg-purple-50 text-purple-700 border border-purple-100'
                        )}>
                          {getDerivedStream(currentSubject.class || '')}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">N/A (General)</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Grid details */}
                <div className="grid grid-cols-2 gap-6 pl-2">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Assigned Teacher</span>
                    <span className="text-xs font-black text-slate-850 flex items-center gap-1.5 mt-0.5">
                      {currentSubject.assignedTeacher ? (
                        <>
                          <span>
                            {`${currentSubject.assignedTeacher.firstName || ''} ${currentSubject.assignedTeacher.lastName || ''}`.trim()}
                          </span>
                          <button
                            onClick={() => {
                              setTeacherToView(currentSubject.assignedTeacher)
                              setIsTeacherViewModalOpen(true)
                            }}
                            className="h-6 w-6 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-500 shadow-sm cursor-pointer transition-colors"
                            title="View Teacher Profile"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <span className="text-slate-400 font-semibold italic">Unassigned</span>
                      )}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Teacher ID</span>
                    <span className="text-xs font-mono font-extrabold text-slate-500 block mt-0.5">
                      {currentSubject.assignedTeacher?.teacherId || 'N/A'}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Periods Per Week</span>
                    <span className="text-xs font-black text-slate-850 block mt-0.5">
                      {currentSubject.periodsPerWeek} Lectures
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Subject Type</span>
                    <span className="text-xs font-black text-slate-850 block mt-0.5">
                      {currentSubject.subjectType || 'Theory'}
                    </span>
                  </div>
                </div>

                {/* Description block */}
                <div className="space-y-2.5 pl-2 border-t border-slate-100 pt-5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Description & Syllabus</span>
                  <p className="text-[11px] font-semibold text-slate-650 leading-relaxed bg-slate-50 p-4 rounded-[18px] border border-slate-100/50">
                    {currentSubject.description || 'No description or syllabus details provided for this subject yet.'}
                  </p>
                </div>

                {/* Audit stamps */}
                <div className="pt-2 pl-2 flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Subject created on {new Date(currentSubject.createdAt).toLocaleDateString()}</span>
                </div>

              </div>

              {/* Close footer */}
              <div className="p-5.5 border-t border-slate-100 flex items-center justify-end shrink-0">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-xs font-extrabold text-white rounded-full cursor-pointer shadow-sm active:scale-95 transition-all"
                >
                  Close
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REUSED TEACHER VIEW PROFILE MODAL */}
      <AnimatePresence>
        {isTeacherViewModalOpen && teacherToView && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={spring}
              style={{ borderRadius: '28px', border: '1px solid #ECECEC' }}
              className="bg-white p-7 w-full max-w-2xl shadow-premium-4 relative max-h-[90vh] overflow-y-auto text-left"
            >
              <div className="absolute right-14 top-5 flex items-center gap-2">
                <button
                  onClick={() => handlePrintTeacherProfile(teacherToView)}
                  className="h-8 px-3 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-700 cursor-pointer shadow-sm transition-colors text-xs font-bold gap-1.5"
                  title="Print Profile"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print</span>
                </button>
              </div>

              <button 
                onClick={() => setIsTeacherViewModalOpen(false)}
                className="absolute right-5 top-5 h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col sm:flex-row gap-6 items-start pb-6 border-b border-slate-100">
                {teacherToView.photo?.secure_url ? (
                  <img 
                    src={teacherToView.photo.secure_url} 
                    alt={teacherToView.firstName} 
                    className="h-24 w-24 rounded-2xl object-cover shadow-sm border border-slate-200/50 shrink-0" 
                  />
                ) : (
                  <div className="h-24 w-24 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-sm select-none shrink-0">
                    {teacherToView.firstName ? teacherToView.firstName[0].toUpperCase() : 'T'}
                  </div>
                )}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-100/50">
                    ID: {teacherToView.teacherId}
                  </span>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none mt-1">
                    {teacherToView.firstName} {teacherToView.lastName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-semibold mt-1">
                    <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {teacherToView.email}</span>
                    <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {teacherToView.phone}</span>
                  </div>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wide uppercase inline-block border mt-2",
                    teacherToView.status === 'Active'
                      ? 'bg-emerald-50/70 border-emerald-100 text-emerald-600'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  )}>
                    {teacherToView.status}
                  </span>
                </div>
              </div>

              {/* Teacher Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-slate-100">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Professional Information</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Qualification:</span><span className="font-extrabold text-slate-700">{teacherToView.qualification || 'N/A'}</span></div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Experience:</span><span className="font-extrabold text-slate-700">{teacherToView.experience || 0} Years</span></div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Salary:</span><span className="font-extrabold text-slate-700">Rs. {teacherToView.salary?.toLocaleString() || 0}</span></div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Joining Date:</span><span className="font-extrabold text-slate-700">{teacherToView.joiningDate ? teacherToView.joiningDate.split('T')[0] : 'N/A'}</span></div>
                    <div className="flex flex-col gap-1 border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400 font-semibold">Subjects Assigned:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Array.isArray(teacherToView.subjects) ? teacherToView.subjects.map(s => (
                          <span key={s} className="px-2 py-0.5 rounded-full text-[9px] bg-slate-150 text-slate-600 font-bold border border-slate-200/50">{s}</span>
                        )) : <span className="font-extrabold text-slate-700">{teacherToView.subjects || 'N/A'}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Personal Details</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Gender:</span><span className="font-extrabold text-slate-700">{teacherToView.gender || 'N/A'}</span></div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Date of Birth:</span><span className="font-extrabold text-slate-700">{teacherToView.dateOfBirth ? teacherToView.dateOfBirth.split('T')[0] : 'N/A'}</span></div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Blood Group:</span><span className="font-extrabold text-slate-700">{teacherToView.bloodGroup || 'N/A'}</span></div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Emergency Phone:</span><span className="font-extrabold text-slate-700">{teacherToView.emergencyPhone || 'N/A'}</span></div>
                  </div>
                </div>
              </div>

              {/* Address details */}
              <div className="py-6 space-y-4">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Address Info</h4>
                  <div className="text-xs text-slate-600 font-semibold flex items-start gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/50">
                    <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{teacherToView.address || 'N/A'}{teacherToView.city ? `, ${teacherToView.city}` : ''}{teacherToView.pincode ? ` - ${teacherToView.pincode}` : ''}</span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={() => setIsTeacherViewModalOpen(false)}
                  className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-xs font-extrabold text-white rounded-full cursor-pointer shadow-sm active:scale-95 transition-all"
                >
                  Close Profile
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. DELETE CONFIRMATION POPUP */}
      <AnimatePresence>
        {isDeleteConfirmOpen && currentSubject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={spring}
              style={{ borderRadius: '24px', border: '1px solid #ECECEC' }}
              className="bg-white p-6 w-full max-w-sm shadow-premium-3 relative text-center space-y-4"
            >
              <div className="h-12 w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto shadow-sm">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 tracking-tight leading-none mb-1">
                  Delete Subject
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 font-semibold">
                  Are you sure you want to delete this subject? This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="flex-1 h-10 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-500 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSubject}
                  className="flex-1 h-10 rounded-full bg-red-600 hover:bg-red-700 text-xs font-extrabold text-white cursor-pointer shadow-md transition-all active:scale-95"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* BULK DELETE CONFIRM MODAL */}
        {isBulkDeleteConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={spring}
              style={{ borderRadius: '24px', border: '1px solid #ECECEC' }}
              className="bg-white p-6 w-full max-w-sm shadow-premium-3 relative text-center space-y-4"
            >
              <div className="h-12 w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto shadow-sm">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 tracking-tight leading-none mb-1">
                  Delete {selectedSubjects.length} Subjects?
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 font-semibold">
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsBulkDeleteConfirmOpen(false)}
                  disabled={bulkDeleting}
                  className="flex-1 h-10 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-500 cursor-pointer transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="flex-1 h-10 rounded-full bg-red-600 hover:bg-red-700 text-xs font-extrabold text-white cursor-pointer shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {bulkDeleting && <RefreshCw className="h-4.5 w-4.5 animate-spin" />}
                  <span>Delete</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
