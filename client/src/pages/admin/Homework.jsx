import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  Plus, 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  Check, 
  RefreshCw, 
  BookOpen, 
  Paperclip,
  CheckSquare,
  Clock,
  X,
  Download
} from 'lucide-react'
import api from '@/services/api'
import { cn } from '@/utils/cn'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import SearchableSelect from '@/components/common/SearchableSelect'
import DashboardStatCard from '@/components/common/DashboardStatCard'
import { TableHeadSort, TableHeaderFilter, TablePagination, TableRowActions } from '@/components/common/DataTable'

const classes = [
  'Play Group', 'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11 Science', 'Class 11 Commerce',
  'Class 12 Science', 'Class 12 Commerce'
]

export default function Homework() {
  const { user } = useAuth()
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin'

  const [homeworks, setHomeworks] = useState([])
  const [classSubjects, setClassSubjects] = useState([])
  const [classSubjectsLoading, setClassSubjectsLoading] = useState(false)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Pagination & Filtering state
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [allSubjects, setAllSubjects] = useState([])
  const [activeHeaderFilterDropdown, setActiveHeaderFilterDropdown] = useState(null)

  // Sorting state
  const [sortField, setSortField] = useState('')
  const [sortOrder, setSortOrder] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (classFilter) count++
    if (statusFilter) count++
    if (subjectFilter) count++
    return count
  }, [classFilter, statusFilter, subjectFilter])

  const statuses = ['Pending', 'Completed', 'Overdue']

  // Date formatting helper: "DD/MM/YYYY"
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return 'N/A'
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  const handleSortClick = (field) => {
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
  const [currentHomework, setCurrentHomework] = useState(null) // null for create
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null)

  // Toast notification state
  const [toast, setToast] = useState(null)

  // Local Form state
  const [formFields, setFormFields] = useState({
    title: '',
    description: '',
    subject: '',
    class: '',
    dueDate: '',
    status: 'Pending',
    teacher: '',
    attachment: { fileId: '', fileName: '', url: '', thumbnailUrl: '', filePath: '', mimeType: '', fileSize: 0 }
  })
  const [validationErrors, setValidationErrors] = useState({})

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  const handleDownload = async (attachment) => {
    if (!attachment || !attachment.url) {
      showToast('error', 'Failed to download file.')
      return
    }
    try {
      const response = await fetch(`${attachment.url}?ik-attachment=true`)
      if (!response.ok) throw new Error('Download failed')
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = attachment.fileName || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
      showToast('success', 'Download started successfully.')
    } catch {
      showToast('error', 'Failed to download file.')
    }
  }

  // Fetch subjects for a selected class grade from the database
  const loadClassSubjects = async (className) => {
    if (!className) {
      setClassSubjects([])
      return
    }
    setClassSubjectsLoading(true)
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
        setClassSubjects(res.data.subjects || [])
      } else {
        setClassSubjects([])
      }
    } catch (err) {
      console.error('Failed to load class subjects:', err)
      setClassSubjects([])
    } finally {
      setClassSubjectsLoading(false)
    }
  }

  const fetchAllSubjects = useCallback(async () => {
    try {
      const res = await api.get('/subjects', {
        params: { status: 'Active', page: 1, limit: 1000 }
      })
      if (res && res.success) {
        setAllSubjects(res.data.subjects || [])
      }
    } catch (err) {
      console.error('Failed to load all subjects:', err)
    }
  }, [])

  // Fetch paginated homework logs
  const fetchHomeworks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/homework', {
        params: {
          page,
          limit,
          search,
          class: classFilter,
          status: statusFilter,
          subject: subjectFilter,
          sortBy
        }
      })

      if (res && res.success) {
        setHomeworks(res.data.homeworks || [])
        setTotal(res.data.pagination?.total || 0)
        setTotalPages(res.data.pagination?.pages || 1)
      } else {
        setError('Failed to fetch homework logs')
      }
    } catch (err) {
      console.error('Fetch homeworks error:', err)
      setError(err.message || 'Server error occurred')
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, classFilter, statusFilter, subjectFilter, sortBy])

  // Fetch dashboard aggregates
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/homework/dashboard-stats')
      if (res && res.success) {
        setStats(res.data || null)
      }
    } catch (err) {
      console.error('Fetch homework stats error:', err)
    }
  }, [])

  useEffect(() => {
    fetchHomeworks()
  }, [fetchHomeworks])

  useEffect(() => {
    fetchStats()
    fetchAllSubjects()
  }, [fetchStats, fetchAllSubjects])

  // Trigger search reactive reset
  const handleSearchChange = (val) => {
    setSearch(val)
    setPage(1)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchHomeworks()
  }



  // Class selection change handler inside modal
  const handleFormClassChange = (newClass) => {
    setFormFields(prev => ({
      ...prev,
      class: newClass,
      subject: '',
      teacher: ''
    }))
    loadClassSubjects(newClass)
  }

  // Add/Edit assignment modal builders
  const handleOpenCreate = () => {
    setCurrentHomework(null)
    const defaultClass = classes[0] || ''
    setFormFields({
      title: '',
      description: '',
      subject: '',
      class: defaultClass,
      dueDate: new Date().toISOString().split('T')[0], // Default today
      status: 'Pending',
      teacher: '',
      attachment: { filename: '', fileName: '', url: '', previewURL: '', downloadURL: '', storagePath: '', fileSize: 0 }
    })
    setSelectedFile(null)
    setValidationErrors({})
    loadClassSubjects(defaultClass)
    setIsAddEditModalOpen(true)
  }

  const handleOpenEdit = async (hw) => {
    setCurrentHomework(hw)
    if (hw.class) {
      await loadClassSubjects(hw.class)
    }
    setFormFields({
      title: hw.title || '',
      description: hw.description || '',
      subject: hw.subject?._id || hw.subject || '',
      class: hw.class || '',
      dueDate: hw.dueDate ? hw.dueDate.split('T')[0] : '',
      status: hw.status || 'Pending',
      teacher: hw.teacher?._id || hw.teacher || '',
      attachment: hw.attachment || { filename: '', fileName: '', url: '', previewURL: '', downloadURL: '', storagePath: '', fileSize: 0 }
    })
    setSelectedFile(null)
    setValidationErrors({})
    setIsAddEditModalOpen(true)
  }

  const handleOpenDelete = (hw) => {
    setCurrentHomework(hw)
    setIsDeleteConfirmOpen(true)
  }

  const handleOpenView = (hw) => {
    setCurrentHomework(hw)
    setIsViewModalOpen(true)
  }

  // Handle local file picker selections with constraints
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Allow: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, PNG, JPG, JPEG
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.png', '.jpg', '.jpeg']
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (!allowedExtensions.includes(fileExt)) {
      showToast('error', 'Unsupported file type. Allowed formats: pdf, doc, docx, ppt, pptx, xls, xlsx, txt, png, jpg, jpeg')
      return
    }

    // Limit size to 20MB
    const maxLimit = 20 * 1024 * 1024
    if (file.size > maxLimit) {
      showToast('error', 'File size exceeds the 20MB limit.')
      return
    }

    setSelectedFile(file)
    setFormFields(prev => ({
      ...prev,
      attachment: {
        fileName: file.name,
        fileSize: file.size,
        previewURL: '' // Cleared to indicate replacement
      }
    }))
  }

  const handleClearAttachment = () => {
    setSelectedFile(null)
    setFormFields(prev => ({
      ...prev,
      attachment: { filename: '', url: '', public_id: '', fileSize: 0 }
    }))
  }

  // Dynamic automatic teacher lookup resolution
  const selectedSubjectObj = classSubjects.find(s => s._id === formFields.subject)
  const resolvedTeacher = selectedSubjectObj?.assignedTeacher

  // Keep teacher property sync on form changes
  useEffect(() => {
    if (resolvedTeacher) {
      const teacherId = resolvedTeacher._id || resolvedTeacher
      if (formFields.teacher !== teacherId) {
        setFormFields(prev => ({ ...prev, teacher: teacherId }))
      }
    } else {
      if (formFields.teacher) {
        setFormFields(prev => ({ ...prev, teacher: '' }))
      }
    }
  }, [resolvedTeacher, formFields.teacher])

  const displayTeacherName = resolvedTeacher 
    ? `${resolvedTeacher.firstName} ${resolvedTeacher.lastName} (${resolvedTeacher.teacherId || 'Active'})`
    : formFields.subject
      ? 'No teacher assigned to this subject'
      : 'Please select a subject to resolve the teacher'

  // Form submission CRUD
  const handleSaveHomework = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setValidationErrors({})

    const errors = {}
    if (!formFields.title.trim()) {
      errors.title = 'Homework Title is required'
    }
    if (!formFields.description.trim()) {
      errors.description = 'Homework Description is required'
    }
    if (!formFields.class) {
      errors.class = 'Class selection is required'
    }
    if (!formFields.subject) {
      errors.subject = 'Subject selection is required'
    }
    if (!formFields.dueDate) {
      errors.dueDate = 'Due Date is required'
    } else {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const inputDate = new Date(formFields.dueDate)
      if (inputDate < today) {
        errors.dueDate = 'Due date cannot be in the past'
      }
    }

    // Verify teacher exists before submit
    if (formFields.subject && !resolvedTeacher) {
      errors.subject = 'Cannot assign homework: Subject does not have an assigned teacher'
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      setSubmitting(false)
      showToast('error', errors.subject || 'Please correct the highlighted fields.')
      return
    }

    try {
      // Assemble Multipart FormData payload
      const formData = new FormData()
      formData.append('title', formFields.title.trim())
      formData.append('description', formFields.description.trim())
      formData.append('class', formFields.class)
      formData.append('subject', formFields.subject)
      formData.append('dueDate', formFields.dueDate)
      formData.append('status', formFields.status)
      if (formFields.teacher) {
        formData.append('teacher', formFields.teacher)
      }

      if (selectedFile) {
        formData.append('attachment', selectedFile)
      } else if (formFields.attachment && formFields.attachment.fileName) {
        formData.append('attachment', JSON.stringify(formFields.attachment))
      } else {
        formData.append('attachment', '')
      }

      let res
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }

      if (currentHomework) {
        res = await api.put(`/homework/${currentHomework._id}`, formData, config)
      } else {
        res = await api.post('/homework', formData, config)
      }

      if (res && res.success) {
        showToast('success', currentHomework ? 'Homework assignment updated.' : 'Homework assigned successfully.')
        setIsAddEditModalOpen(false)
        fetchHomeworks()
        fetchStats()
      } else {
        showToast('error', res.message || 'Operation failed')
      }
    } catch (err) {
      console.error('Save homework error:', err)
      const data = err.response?.data
      if (data?.errors) {
        setValidationErrors(data.errors)
        const firstErrorVal = Object.values(data.errors)[0]
        showToast('error', firstErrorVal || 'Validation failed.')
      } else if (data?.error) {
        showToast('error', `${data.message || 'Operation failed'}: ${data.error}`)
      } else {
        const msg = data?.message || err.message || 'Server error occurred'
        showToast('error', msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Delete assignment handler
  const handleDeleteHomework = async () => {
    if (!currentHomework) return
    try {
      const res = await api.delete(`/homework/${currentHomework._id}`)
      if (res && res.success) {
        showToast('success', 'Homework assignment deleted successfully.')
        setIsDeleteConfirmOpen(false)
        fetchHomeworks()
        fetchStats()
      } else {
        showToast('error', res.message || 'Failed to delete assignment')
      }
    } catch (err) {
      showToast('error', err.message || 'Delete operation failed')
    }
  }

  const subjectOptions = classSubjects.map(s => ({
    value: s._id,
    label: `${s.name} (${s.code})`,
    searchText: `${s.name} ${s.code}`
  }))

  const todayStr = new Date().toISOString().split('T')[0]

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
            <span className="text-brand-blue-600">Homework</span>
            {activeFiltersCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-black leading-none">
                Filters ({activeFiltersCount})
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-1">
            Homework Management
          </h2>
          <p className="text-[11px] font-bold text-slate-400 mt-1.5">
            Assign homework tasks, set classes deadlines, upload reference materials, and view outstanding assignments.
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
              <span>Add Homework</span>
            </button>
          )}

          <form onSubmit={handleSearchSubmit} className="relative w-64">
            <input
              type="text"
              placeholder="Search homework, subject, class..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full h-10 pl-11 pr-5 rounded-full border border-slate-200 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white shadow-sm"
            />
            <Search className="absolute left-4 top-2.5 h-4.5 w-4.5 text-slate-400" />
          </form>

        </div>
      </div>

      {/* 2. KPI Cards Panel Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0 select-none">
        <DashboardStatCard
          title="Total Homework"
          value={stats?.totalHomework || 0}
          subtitle="Assignments logged"
          icon={BookOpen}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-500"
          className="py-3 px-5 border border-slate-100/50 hover:border-slate-200 transition-all"
        />
        <DashboardStatCard
          title="Pending"
          value={stats?.pending || 0}
          subtitle="Awaiting deadlines"
          icon={Clock}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-550"
          valueColor="text-amber-600"
          className="py-3 px-5 border border-slate-100/50 hover:border-slate-200 transition-all"
        />
        <DashboardStatCard
          title="Completed"
          value={stats?.completed || 0}
          subtitle="Finished tasks"
          icon={CheckSquare}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-500"
          valueColor="text-emerald-600"
          className="py-3 px-5 border border-slate-100/50 hover:border-slate-200 transition-all"
        />
        <DashboardStatCard
          title="Overdue"
          value={stats?.overdue || 0}
          subtitle="Passed deadlines"
          icon={AlertCircle}
          iconBgColor="bg-red-50"
          iconColor="text-red-500"
          valueColor="text-red-650"
          className="py-3 px-5 border border-slate-100/50 hover:border-slate-200 transition-all"
        />
      </div>

      {/* 4. Table Listing Panel */}
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
                    title="Title"
                    sortField="title"
                    currentSortField={sortField}
                    sortOrder={sortOrder}
                    onClick={() => handleSortClick('title')}
                  />
                </th>

                <th className="px-4 relative bg-slate-50 text-left">
                  <TableHeaderFilter
                    type="subject"
                    title={
                      <TableHeadSort
                        title="Subject"
                        sortField="subject"
                        currentSortField={sortField}
                        sortOrder={sortOrder}
                        onClick={() => handleSortClick('subject')}
                      />
                    }
                    activeFilter={subjectFilter}
                    isOpen={activeHeaderFilterDropdown === 'subject'}
                    onToggle={() => toggleFilterDropdown('subject')}
                    onClose={() => setActiveHeaderFilterDropdown(null)}
                    onSelect={(val) => { setSubjectFilter(val); setPage(1); }}
                    options={allSubjects}
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
                  <div className="inline-flex items-center gap-1.5 justify-start">
                    <TableHeadSort
                      title="Date"
                      sortField="dueDate"
                      currentSortField={sortField}
                      sortOrder={sortOrder}
                      onClick={() => handleSortClick('dueDate')}
                    />
                  </div>
                </th>

                <th className="px-4 text-left">
                  <div className="py-4">Attachment</div>
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

            <tbody className="divide-y divide-slate-100/50 text-[11px] font-bold text-slate-655 flex-grow">
              {loading && homeworks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="h-7 w-7 text-blue-500 animate-spin" />
                      <span className="text-xs font-bold text-slate-400">Loading homework records...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-red-500">
                      <AlertCircle className="h-7 w-7" />
                      <span className="text-xs font-bold">{error}</span>
                    </div>
                  </td>
                </tr>
              ) : homeworks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                      <div className="h-14 w-14 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200/50 text-slate-350">
                        <BookOpen className="h-7 w-7" />
                      </div>
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">No homework has been assigned yet.</h4>
                      <p className="text-[10px] text-slate-455 leading-normal mt-1 text-center font-bold">
                        Click 'Add Homework' to create the first assignment.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                homeworks.map((hw) => {
                  const subjectName = hw.subject?.name || 'N/A'
                  const attachmentName = hw.attachment?.fileName || ''

                  return (
                    <tr key={hw._id} className="h-[68px] hover:bg-slate-50/50 transition-colors">
                      <td className="pl-6 text-xs font-black text-slate-800">
                        {hw.title}
                      </td>

                      <td className="px-4 text-slate-550">
                        {subjectName}
                      </td>

                      <td className="px-4 text-slate-850">
                        {hw.class}
                      </td>

                      <td className="px-4 text-slate-550 font-mono">
                        {formatDate(hw.dueDate)}
                      </td>

                      <td className="px-4">
                        {attachmentName ? (
                          <div className="flex items-center gap-2 text-slate-500 font-medium truncate max-w-[160px]">
                            <Paperclip className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <a
                              href={hw.attachment?.url || ''}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline text-brand-blue-500 font-bold truncate max-w-[110px]"
                              title={attachmentName}
                            >
                              {attachmentName}
                            </a>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDownload(hw.attachment); }}
                              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer shrink-0 transition-colors"
                              title="Download attachment"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-350">—</span>
                        )}
                      </td>

                      <td className="px-4">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase inline-block border",
                          hw.status === 'Completed' && 'bg-emerald-50 text-emerald-700 border-emerald-100',
                          hw.status === 'Pending' && 'bg-amber-50 text-amber-700 border-amber-100',
                          hw.status === 'Overdue' && 'bg-red-50 text-red-700 border-red-100 animate-pulse'
                        )}>
                          {hw.status}
                        </span>
                      </td>

                      <td className="pr-6 text-right w-12">
                        <TableRowActions 
                          actions={[
                            {
                              label: 'View Details',
                              icon: Eye,
                              callback: () => handleOpenView(hw)
                            },
                            {
                              label: 'Edit',
                              icon: Edit3,
                              visible: isTeacherOrAdmin,
                              callback: () => handleOpenEdit(hw)
                            },
                            {
                              label: 'Download Attachment',
                              icon: Download,
                              visible: !!(hw.attachment && hw.attachment.fileName),
                              callback: () => handleDownload(hw.attachment)
                            },
                            {
                              label: 'Delete',
                              icon: Trash2,
                              visible: isTeacherOrAdmin,
                              danger: true,
                              callback: () => handleOpenDelete(hw)
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  )
                })
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
        title={currentHomework ? "Edit Homework Assignment" : "Assign New Homework"}
        size="md"
      >
        <form onSubmit={handleSaveHomework} className="space-y-5 text-left text-xs font-bold text-slate-700">
          <Input
            label="Homework Title *"
            type="text"
            placeholder="e.g. Solve exercises 4.1 to 4.5"
            value={formFields.title}
            onChange={(e) => setFormFields({ ...formFields, title: e.target.value })}
            error={validationErrors.title}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">
              Homework Description / Instructions *
            </label>
            <textarea
              placeholder="Provide complete instructions, questions, and page number references..."
              value={formFields.description}
              onChange={(e) => setFormFields({ ...formFields, description: e.target.value })}
              rows="4"
              className={cn(
                "w-full p-3.5 rounded-premium-md border border-[var(--border-light)] bg-white text-xs font-bold text-[var(--text-primary)] shadow-premium-1 focus:border-brand-blue-500 focus:outline-none focus:ring-4 focus:ring-brand-blue-55/40 outline-none transition-all resize-none",
                validationErrors.description && "border-[var(--danger-solid)]"
              )}
            />
            {validationErrors.description && (
              <p className="text-[11px] font-medium text-[var(--danger-text)] mt-0.5">{validationErrors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">
                Class / Grade *
              </label>
              <select
                value={formFields.class}
                onChange={(e) => handleFormClassChange(e.target.value)}
                className={cn(
                  "w-full h-10 px-3 rounded-premium-md border border-[var(--border-light)] bg-white text-sm text-[var(--text-primary)] shadow-premium-1 focus:border-brand-blue-500 focus:outline-none focus:ring-4 focus:ring-brand-blue-50/50 transition-all duration-200 cursor-pointer",
                  validationErrors.class && "border-[var(--danger-solid)]"
                )}
              >
                <option value="">Select Class</option>
                {classes.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {validationErrors.class && (
                <p className="text-[11px] font-medium text-[var(--danger-text)] mt-0.5">{validationErrors.class}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">
                Select Subject *
              </label>
              {classSubjectsLoading ? (
                <div className="h-10 px-3 border border-slate-200 bg-slate-50 flex items-center rounded-premium-md text-slate-400 font-medium">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin mr-2" />
                  <span>Loading subjects...</span>
                </div>
              ) : classSubjects.length === 0 ? (
                <select
                  disabled
                  className="w-full h-10 px-3 rounded-premium-md border border-slate-200 bg-slate-50 text-sm text-slate-400 font-semibold cursor-not-allowed"
                >
                  <option>No subjects available for this class.</option>
                </select>
              ) : (
                <SearchableSelect
                  placeholder="Select Subject..."
                  value={formFields.subject}
                  onChange={(val) => setFormFields({ ...formFields, subject: val })}
                  options={subjectOptions}
                  error={!!validationErrors.subject}
                />
              )}
              {validationErrors.subject && (
                <p className="text-[11px] font-medium text-[var(--danger-text)] mt-0.5">{validationErrors.subject}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Due Date (Today or future only) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">
                Due Date *
              </label>
              <input
                type="date"
                min={todayStr}
                value={formFields.dueDate ? formFields.dueDate.split('T')[0] : ''}
                onChange={(e) => setFormFields({ ...formFields, dueDate: e.target.value })}
                className={cn(
                  "w-full h-10 px-3 rounded-premium-md border border-[var(--border-light)] bg-white text-sm text-[var(--text-primary)] shadow-premium-1 focus:border-brand-blue-500 focus:outline-none focus:ring-4 focus:ring-brand-blue-50/50 transition-all duration-200 cursor-pointer",
                  validationErrors.dueDate && "border-[var(--danger-solid)]"
                )}
              />
              {validationErrors.dueDate && (
                <p className="text-[11px] font-medium text-[var(--danger-text)] mt-0.5">{validationErrors.dueDate}</p>
              )}
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">
                Status
              </label>
              <select
                value={formFields.status}
                onChange={(e) => setFormFields({ ...formFields, status: e.target.value })}
                className="w-full h-10 px-3 rounded-premium-md border border-[var(--border-light)] bg-white text-sm text-[var(--text-primary)] shadow-premium-1 focus:border-brand-blue-500 focus:outline-none focus:ring-4 focus:ring-brand-blue-50/50 transition-all duration-200 cursor-pointer"
              >
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Automatic Resolved Assigned Teacher Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 tracking-wide">
              Assigned Teacher
            </label>
            <input
              type="text"
              readOnly
              value={displayTeacherName}
              className="w-full h-10 px-3.5 rounded-premium-md border border-slate-200 bg-slate-50 text-slate-500 text-xs font-black tracking-wide cursor-not-allowed shadow-inner"
            />
          </div>

          {/* Attachment upload handling */}
          <div className="flex flex-col gap-2 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <label className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">
              Reference Attachment (PDF/JPG/PNG)
            </label>
            {formFields.attachment?.fileName ? (
              <div className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-xl">
                 <div className="flex items-center gap-2">
                   <Paperclip className="h-4 w-4 text-brand-blue-500" />
                   <div className="text-[11px] leading-tight">
                     <p className="font-extrabold text-slate-800">{formFields.attachment.fileName}</p>
                     <p className="text-slate-400 text-[9px] font-mono">{(formFields.attachment.fileSize / 1024).toFixed(1)} KB</p>
                   </div>
                 </div>
                 <button
                   type="button"
                   onClick={handleClearAttachment}
                   className="h-6 w-6 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 cursor-pointer"
                 >
                   <X className="h-3.5 w-3.5" />
                 </button>
               </div>
             ) : (
               <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-blue-400 cursor-pointer transition-colors">
                 <input
                   type="file"
                   accept="image/png,image/jpeg,image/jpg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                   onChange={handleFileChange}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                 />
                 <Paperclip className="h-5 w-5 text-slate-400 mx-auto mb-1" />
                 <span className="text-[10px] text-slate-455 block font-extrabold">Click to upload file (PDF, DOC/X, PPT/X, XLS/X, TXT, Images - Max 20MB)</span>
               </div>
             )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={() => setIsAddEditModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={submitting}
              disabled={submitting}
            >
              {currentHomework ? "Update" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAILS MODAL */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Homework Assignment Details"
        size="md"
      >
        {currentHomework && (
          <div className="space-y-6 text-left text-xs font-bold text-slate-700">
            
            {/* Header info card */}
            <div className="bg-slate-50 p-5 border border-slate-100 rounded-2xl space-y-4">
              <div className="flex justify-between items-start gap-4">
                <h3 className="text-sm font-black text-slate-800 tracking-tight leading-snug">
                  {currentHomework.title}
                </h3>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase inline-block border shrink-0",
                  currentHomework.status === 'Completed' && 'bg-emerald-50 text-emerald-700 border-emerald-100',
                  currentHomework.status === 'Pending' && 'bg-amber-50 text-amber-700 border-amber-100',
                  currentHomework.status === 'Overdue' && 'bg-red-50 text-red-700 border-red-100'
                )}>
                  {currentHomework.status}
                </span>
              </div>
              <hr className="border-slate-100" />
              <div className="grid grid-cols-2 gap-4 text-[10px]">
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider text-[8px] font-black">Subject</span>
                  <span className="text-slate-800 font-extrabold">{currentHomework.subject?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider text-[8px] font-black">Class Grade</span>
                  <span className="text-slate-800 font-extrabold">{currentHomework.class}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block uppercase tracking-wider text-[8px] font-black">Due Date</span>
                  <span className="text-slate-800 font-mono font-extrabold">
                    {currentHomework.dueDate ? new Date(currentHomework.dueDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                {currentHomework.teacher && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block uppercase tracking-wider text-[8px] font-black">Assigned By</span>
                    <span className="text-slate-800">
                      Teacher {currentHomework.teacher.firstName} {currentHomework.teacher.lastName}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Instruction Description body */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-brand-blue-600 uppercase tracking-widest pb-1 border-b border-slate-100">
                Instructions & Content
              </h4>
              <p className="text-[11px] leading-relaxed text-slate-650 font-semibold whitespace-pre-wrap bg-slate-50/50 p-4 rounded-xl border border-slate-150/40">
                {currentHomework.description}
              </p>
            </div>

            {/* Attachment download / preview linkages */}
            {currentHomework.attachment?.fileName && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-brand-blue-600 uppercase tracking-widest pb-1 border-b border-slate-100">
                  Reference File
                </h4>
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150/50 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <Paperclip className="h-4 w-4 text-brand-blue-500" />
                    <div className="text-[11px] leading-tight">
                      <p className="font-extrabold text-slate-800">{currentHomework.attachment.fileName}</p>
                      <p className="text-slate-400 text-[9px] font-mono mt-0.5">
                        {(currentHomework.attachment.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (currentHomework.attachment?.url) {
                          window.open(currentHomework.attachment.url, '_blank')
                        }
                      }}
                      className="text-[10px] font-black text-brand-blue-600 uppercase tracking-wider hover:underline cursor-pointer bg-transparent border-none p-0"
                    >
                      Preview
                    </button>
                    <span className="text-slate-200">|</span>
                    <button
                      type="button"
                      onClick={() => handleDownload(currentHomework.attachment)}
                      className="text-[10px] font-black text-brand-blue-600 uppercase tracking-wider hover:underline cursor-pointer bg-transparent border-none p-0"
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </Button>
            </div>

          </div>
        )}
      </Modal>

      {/* DELETE CONFIRMATION */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Delete Homework Assignment"
        size="sm"
      >
        <div className="text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto shadow-sm">
            <Trash2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-tight leading-none mb-1">
              Confirm Deletion
            </h3>
            <p className="text-xs text-slate-455 mt-1.5 font-semibold leading-relaxed">
              Are you sure you want to delete this homework assignment? This action will permanently remove the record.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleDeleteHomework}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
