import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  Check, 
  RefreshCw, 
  Bell,
  Info,
  Clock,
  Pin,
  Send,
  FileText,
  Download,
  Copy,
  Paperclip,
  X
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

const getLocalISOString = () => {
  const now = new Date()
  const tzOffset = now.getTimezoneOffset() * 60000
  return (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 16)
}

const convertToLocalInputVal = (utcDateStr) => {
  if (!utcDateStr) return ''
  const d = new Date(utcDateStr)
  if (isNaN(d.getTime())) return ''
  const tzOffset = d.getTimezoneOffset() * 60000
  return (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16)
}

const classes = [
  'Play Group', 'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11 Science', 'Class 11 Commerce',
  'Class 12 Science', 'Class 12 Commerce'
]

const audiences = [
  'Entire Institute', 
  'Specific Class', 
  'Specific Subject', 
  'Teachers Only', 
  'Students Only', 
  'Parents Only', 
  'Admin Only'
]

const statuses = ['Scheduled', 'Published']

export default function Announcements() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isTeacher = user?.role === 'teacher'
  const isTeacherOrAdmin = isAdmin || isTeacher

  // List states
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Stats
  const [stats, setStats] = useState(null)

  // Class subjects list for form
  const [classSubjects, setClassSubjects] = useState([])
  const [classSubjectsLoading, setClassSubjectsLoading] = useState(false)
  
  // Search & Filtering
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [audienceFilter, setAudienceFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [pinnedFilter, setPinnedFilter] = useState('')
  const [sortField, setSortField] = useState('')
  const [sortOrder, setSortOrder] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Dropdown states
  const [activeHeaderFilterDropdown, setActiveHeaderFilterDropdown] = useState(null)

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false)
  const [currentAnnouncement, setCurrentAnnouncement] = useState(null) 
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  // Upload state
  const [selectedFiles, setSelectedFiles] = useState([])

  // Form states
  const [formFields, setFormFields] = useState({
    title: '',
    shortDescription: '',
    audience: ['Entire Institute'],
    class: '',
    subject: '',
    message: '',
    publishMode: 'instant',
    publishAt: '',
    isPinned: false,
    attachments: []
  })
  const [validationErrors, setValidationErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  // Load Class Specific Subjects
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
    } catch {
      setClassSubjects([])
    } finally {
      setClassSubjectsLoading(false)
    }
  }

  // Fetch Announcements listing
  const fetchAnnouncements = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        audience: audienceFilter || undefined,
        class: classFilter || undefined,
        isPinned: pinnedFilter || undefined,
        sortBy: sortBy || undefined
      }
      const res = await api.get('/announcements', { params })
      if (res && res.success && res.data) {
        setAnnouncements(res.data.announcements || [])
        setTotalPages(res.data.totalPages || 1)
        setTotal(res.data.total || 0)
      }
    } catch {
      setError('Failed to load announcements.')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, audienceFilter, classFilter, pinnedFilter, sortBy])

  // Fetch KPI Stats
  const fetchStats = async () => {
    try {
      const res = await api.get('/announcements/dashboard-stats')
      if (res && res.success && res.data) {
        setStats(res.data)
      }
    } catch {
      // Catch silently
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  useEffect(() => {
    fetchStats()
  }, [])

  // Header Filters active counts
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (statusFilter) count++
    if (audienceFilter) count++
    if (classFilter) count++
    if (pinnedFilter) count++
    return count
  }, [statusFilter, audienceFilter, classFilter, pinnedFilter])

  // Search input callbacks
  const handleSearchChange = (val) => {
    setSearch(val)
    setPage(1)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchAnnouncements()
  }

  // Column header sort click cycles
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

  // Header filter dropdowns
  const toggleFilterDropdown = (type) => {
    setActiveHeaderFilterDropdown(prev => prev === type ? null : type)
  }

  // Attachments download helper
  const handleDownload = async (attachment) => {
    if (!attachment || !attachment.url) {
      showToast('error', 'Attachment link is invalid.')
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
      showToast('success', 'File download started.')
    } catch {
      showToast('error', 'Download trigger failed.')
    }
  }

  // Modals interactions
  const handleOpenCreate = () => {
    setCurrentAnnouncement(null)
    setFormFields({
      title: '',
      shortDescription: '',
      audience: ['Entire Institute'],
      class: '',
      subject: '',
      message: '',
      publishMode: 'instant',
      publishAt: getLocalISOString(),
      isPinned: false,
      attachments: []
    })
    setSelectedFiles([])
    setClassSubjects([])
    setValidationErrors({})
    setSubmitting(false)
    setIsAddEditModalOpen(true)
  }

  const handleOpenEdit = async (ann) => {
    setCurrentAnnouncement(ann)
    if (ann.class) {
      await loadClassSubjects(ann.class)
    } else {
      setClassSubjects([])
    }
    setFormFields({
      title: ann.title || '',
      shortDescription: ann.shortDescription || '',
      audience: ann.audience || ['Entire Institute'],
      class: ann.class || '',
      subject: ann.subject?._id || ann.subject || '',
      message: ann.message || '',
      publishMode: ann.status === 'Published' ? 'instant' : 'scheduled',
      publishAt: convertToLocalInputVal(ann.publishAt),
      isPinned: ann.isPinned || false,
      attachments: ann.attachments || []
    })
    setSelectedFiles([])
    setValidationErrors({})
    setSubmitting(false)
    setIsAddEditModalOpen(true)
  }

  const handleOpenDuplicate = async (ann) => {
    setCurrentAnnouncement(null)
    if (ann.class) {
      await loadClassSubjects(ann.class)
    } else {
      setClassSubjects([])
    }
    setFormFields({
      title: `${ann.title || ''} (Copy)`,
      shortDescription: ann.shortDescription || '',
      audience: ann.audience || ['Entire Institute'],
      class: ann.class || '',
      subject: ann.subject?._id || ann.subject || '',
      message: ann.message || '',
      publishMode: 'instant',
      publishAt: getLocalISOString(),
      isPinned: ann.isPinned || false,
      attachments: ann.attachments || [] 
    })
    setSelectedFiles([])
    setValidationErrors({})
    setSubmitting(false)
    setIsAddEditModalOpen(true)
  }

  const handleOpenView = async (ann) => {
    setCurrentAnnouncement(ann)
    setIsViewModalOpen(true)
    try {
      await api.post(`/announcements/${ann._id}/view`)
      setAnnouncements(prev => prev.map(a => a._id === ann._id ? { ...a, viewsCount: a.viewsCount + 1 } : a))
    } catch {
      // Catch silently
    }
  }

  const handleOpenDelete = (ann) => {
    setCurrentAnnouncement(ann)
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!currentAnnouncement) return
    try {
      await api.delete(`/announcements/${currentAnnouncement._id}`)
      showToast('success', 'Announcement deleted successfully.')
      setIsDeleteConfirmOpen(false)
      fetchAnnouncements()
      fetchStats()
    } catch {
      showToast('error', 'Failed to delete announcement.')
    }
  }

  const handleTogglePin = async (ann) => {
    if (!isTeacherOrAdmin) return

    // Optimistically update list state
    setAnnouncements(prev => prev.map(a => a._id === ann._id ? { ...a, isPinned: !a.isPinned } : a))
    
    // Optimistically update count stats
    setStats(prev => {
      if (!prev) return prev
      const countChange = ann.isPinned ? -1 : 1
      return {
        ...prev,
        pinned: Math.max((prev.pinned || 0) + countChange, 0)
      }
    })

    try {
      const res = await api.patch(`/announcements/${ann._id}/pin`)
      if (res && res.success) {
        showToast('success', res.message || 'Pinned status updated successfully.')
        fetchAnnouncements()
        fetchStats()
      } else {
        throw new Error('Toggle pin request failed')
      }
    } catch {
      showToast('error', 'Pin status toggle failed.')
      // Revert optimistic updates
      setAnnouncements(prev => prev.map(a => a._id === ann._id ? { ...a, isPinned: ann.isPinned } : a))
      fetchAnnouncements()
      fetchStats()
    }
  }

  // Handle Form Class Change linking
  const handleFormClassChange = (newClass) => {
    setFormFields(prev => ({
      ...prev,
      class: newClass,
      subject: '' 
    }))
    loadClassSubjects(newClass)
  }

  // Handle forms save operations
  const handleSaveAnnouncement = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setValidationErrors({})

    const errors = {}
    if (!formFields.title.trim()) errors.title = 'Title is required'
    if (!formFields.message.trim()) errors.message = 'Announcement message content is required'
    if (!formFields.audience || formFields.audience.length === 0) errors.audience = 'Audience target selection is required'
    if (formFields.publishMode === 'scheduled') {
      if (!formFields.publishAt) {
        errors.publishAt = 'Publish date is required'
      } else {
        const isPublishedStatus = currentAnnouncement && currentAnnouncement.status === 'Published'
        if (!isPublishedStatus && new Date(formFields.publishAt) < new Date(Date.now() - 60000)) {
          errors.publishAt = 'Publish date cannot be in the past'
        }
      }
    }

    if (formFields.audience.includes('Specific Class') && !formFields.class) {
      errors.class = 'Class selection is required when targeting class'
    }

    if (formFields.audience.includes('Specific Subject')) {
      if (!formFields.class) {
        errors.class = 'Class selection is required when targeting subject'
      }
      if (!formFields.subject) {
        errors.subject = 'Subject selection is required when targeting subject'
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      setSubmitting(false)
      showToast('error', 'Please correct the highlighted fields.')
      return
    }

    try {
      const formData = new FormData()
      formData.append('title', formFields.title.trim())
      formData.append('message', formFields.message.trim())
      formData.append('shortDescription', formFields.shortDescription.trim())
      formData.append('audience', JSON.stringify(formFields.audience))
      formData.append('class', formFields.class || '')
      formData.append('subject', formFields.subject || '')
      formData.append('publishMode', formFields.publishMode)
      if (formFields.publishMode === 'scheduled' && formFields.publishAt) {
        formData.append('publishAt', new Date(formFields.publishAt).toISOString())
      }
      formData.append('isPinned', String(formFields.isPinned))
      
      formData.append('attachments', JSON.stringify(formFields.attachments || []))

      if (selectedFiles && selectedFiles.length > 0) {
        selectedFiles.forEach(file => {
          formData.append('attachments', file)
        })
      }

      const config = { headers: { 'Content-Type': 'multipart/form-data' } }

      let res
      if (currentAnnouncement) {
        res = await api.put(`/announcements/${currentAnnouncement._id}`, formData, config)
      } else {
        res = await api.post('/announcements', formData, config)
      }

      if (res && res.success) {
        showToast('success', currentAnnouncement ? 'Announcement updated successfully.' : 'Announcement created successfully.')
        setIsAddEditModalOpen(false)
        fetchAnnouncements()
        fetchStats()
      } else {
        showToast('error', res.message || 'Operation failed.')
      }
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) {
        setValidationErrors(data.errors)
        const firstErr = Object.values(data.errors)[0]
        showToast('error', firstErr || 'Validation checks failed.')
      } else {
        showToast('error', 'Communication error on backend.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Format Dates to DD/MM/YYYY
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Multi-select audience click list helper
  const handleAudienceCheckboxChange = (option) => {
    setFormFields(prev => {
      let current = [...prev.audience]
      if (option === 'Entire Institute') {
        current = ['Entire Institute']
      } else {
        current = current.filter(item => item !== 'Entire Institute')
        if (current.includes(option)) {
          current = current.filter(item => item !== option)
          if (current.length === 0) {
            current = ['Entire Institute']
          }
        } else {
          current.push(option)
        }
      }
      return { ...prev, audience: current }
    })
  }

  // Format status tag backgrounds
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Published':
        return 'bg-emerald-50 border-emerald-200 text-emerald-600'
      case 'Scheduled':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-600'
    }
  }

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
            <span className="text-brand-blue-600">Announcements</span>
            {activeFiltersCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-black leading-none">
                Filters ({activeFiltersCount})
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none mt-1">
            Announcements Board
          </h2>
          <p className="text-[11px] font-bold text-slate-400 mt-1.5">
            Broadcast notifications, alerts, schedule changes, and updates to classes, teachers, parents, or parents.
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
              <span>Add Announcement</span>
            </button>
          )}

          <form onSubmit={handleSearchSubmit} className="relative w-64">
            <input
              type="text"
              placeholder="Search announcements, subjects..."
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
          title="Total Announcements"
          value={stats?.total || 0}
          subtitle="Alerts logged"
          icon={Bell}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-500"
          className="py-3 px-5 border border-slate-100/50 hover:border-slate-200 transition-all"
        />
        <DashboardStatCard
          title="Published"
          value={stats?.published || 0}
          subtitle="Active notifications"
          icon={Send}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-500"
          valueColor="text-emerald-600"
          className="py-3 px-5 border border-slate-100/50 hover:border-slate-200 transition-all"
        />
        <DashboardStatCard
          title="Scheduled"
          value={stats?.scheduled || 0}
          subtitle="Awaiting publishAt times"
          icon={Clock}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-500"
          valueColor="text-amber-600"
          className="py-3 px-5 border border-slate-100/50 hover:border-slate-200 transition-all"
        />
        <DashboardStatCard
          title="Pinned"
          value={stats?.pinned || 0}
          subtitle="Board header posts"
          icon={Pin}
          iconBgColor="bg-red-50"
          iconColor="text-red-500"
          valueColor="text-red-650"
          className="py-3 px-5 border border-slate-100/50 hover:border-slate-200 transition-all"
        />
      </div>

      {/* 3. Table Panel Wrapper */}
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
                    type="audience"
                    title="Audience"
                    activeFilter={audienceFilter}
                    isOpen={activeHeaderFilterDropdown === 'audience'}
                    onToggle={() => toggleFilterDropdown('audience')}
                    onClose={() => setActiveHeaderFilterDropdown(null)}
                    onSelect={(val) => { setAudienceFilter(val); setPage(1); }}
                    options={audiences}
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
                  <TableHeadSort
                    title="Publish Date"
                    sortField="publishAt"
                    currentSortField={sortField}
                    sortOrder={sortOrder}
                    onClick={() => handleSortClick('publishAt')}
                  />
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

                <th className="px-4 text-center">
                  <TableHeaderFilter
                    type="pinned"
                    title="Pinned"
                    activeFilter={pinnedFilter}
                    isOpen={activeHeaderFilterDropdown === 'pinned'}
                    onToggle={() => toggleFilterDropdown('pinned')}
                    onClose={() => setActiveHeaderFilterDropdown(null)}
                    onSelect={(val) => { setPinnedFilter(val); setPage(1); }}
                    options={[{ _id: 'true', name: 'Pinned Only' }, { _id: 'false', name: 'Unpinned Only' }]}
                  />
                </th>

                <th className="pr-6 w-12 text-right"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100/50 text-[11px] font-bold text-slate-655">
              {loading && announcements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="h-7 w-7 text-blue-500 animate-spin" />
                      <span className="text-xs font-bold text-slate-400">Loading announcements board...</span>
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
              ) : announcements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-2.5 text-slate-400">
                      <Bell className="h-8 w-8 text-slate-300" />
                      <span className="text-xs font-bold">No announcements found on the board.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                announcements.map((ann) => (
                  <tr 
                    key={ann._id}
                    onClick={() => handleOpenView(ann)}
                    className="h-[68px] hover:bg-slate-50/50 transition-colors duration-150 border-b border-slate-100/50 last:border-b-0 cursor-pointer"
                  >
                    <td className="pl-6 font-extrabold text-slate-800 max-w-[200px] truncate">
                      {ann.title}
                    </td>

                    <td className="px-4 text-slate-500 text-left">
                      <div className="flex flex-wrap gap-1">
                        {ann.audience?.map(aud => (
                          <span key={aud} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-black leading-none">
                            {aud}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 text-slate-500 text-left">
                      {ann.class || '—'}
                    </td>

                    <td className="px-4 text-slate-500 text-left">
                      {formatDateDisplay(ann.publishAt)}
                    </td>

                    <td className="px-4 text-left">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase inline-block border",
                        getStatusBadgeClass(ann.status)
                      )}>
                        {ann.status}
                      </span>
                    </td>

                    <td className="px-4 text-center">
                      <div className="flex justify-center" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleTogglePin(ann)}
                          disabled={!isTeacherOrAdmin}
                          className={cn(
                            "p-1.5 rounded-full cursor-pointer transition-all active:scale-90",
                            ann.isPinned ? "text-brand-blue-600 bg-blue-50 hover:bg-blue-100" : "text-slate-350 hover:bg-slate-100"
                          )}
                          title={ann.isPinned ? "Unpin announcement" : "Pin announcement"}
                        >
                          <Pin className={cn("h-3.5 w-3.5", ann.isPinned && "fill-brand-blue-600")} />
                        </button>
                      </div>
                    </td>

                    <td className="pr-6 text-right w-12">
                      <TableRowActions 
                        actions={[
                          {
                            label: 'View Details',
                            icon: Info,
                            callback: () => handleOpenView(ann)
                          },
                          {
                            label: 'Duplicate',
                            icon: Copy,
                            visible: isTeacherOrAdmin,
                            callback: () => handleOpenDuplicate(ann)
                          },
                          {
                            label: 'Edit',
                            icon: Edit3,
                            visible: isTeacherOrAdmin,
                            callback: () => handleOpenEdit(ann)
                          },
                          {
                            label: 'Delete',
                            icon: Trash2,
                            visible: isTeacherOrAdmin,
                            danger: true,
                            callback: () => handleOpenDelete(ann)
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
        title={currentAnnouncement ? "Edit Announcement" : "Create New Announcement"}
        size="lg"
      >
        <form onSubmit={handleSaveAnnouncement} className="space-y-5 text-left text-xs font-bold text-slate-700">
          <Input
            label="Announcement Title *"
            type="text"
            placeholder="E.g., Mid Term Exam Schedule Postponed"
            value={formFields.title}
            onChange={(e) => setFormFields(prev => ({ ...prev, title: e.target.value }))}
            error={validationErrors.title}
            className="text-xs font-semibold"
          />

          <Input
            label="Short Description"
            type="text"
            placeholder="Brief summary sentence (max 250 characters)"
            value={formFields.shortDescription}
            onChange={(e) => setFormFields(prev => ({ ...prev, shortDescription: e.target.value }))}
            error={validationErrors.shortDescription}
            className="text-xs font-semibold"
          />

          {/* Audience Multi-Select Targets Checklist */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Target Audience *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/50 border border-slate-100 p-4 rounded-2xl">
              {audiences.map(option => {
                const isChecked = formFields.audience.includes(option)
                return (
                  <label key={option} className="flex items-center gap-2 text-xs font-semibold text-slate-600 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleAudienceCheckboxChange(option)}
                      className="rounded border-slate-300 text-brand-blue-500 focus:ring-brand-blue-500 cursor-pointer h-3.5 w-3.5"
                    />
                    <span>{option}</span>
                  </label>
                )
              })}
            </div>
            {validationErrors.audience && (
              <p className="text-[10px] text-red-500 mt-1 font-bold">{validationErrors.audience}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Class Grade Select - Enabled conditionally */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Target Class Grade</label>
              <select
                disabled={!formFields.audience.includes('Specific Class') && !formFields.audience.includes('Specific Subject')}
                value={formFields.class}
                onChange={(e) => handleFormClassChange(e.target.value)}
                className={cn(
                  "h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold outline-none bg-white focus:border-blue-500 transition-colors w-full",
                  (!formFields.audience.includes('Specific Class') && !formFields.audience.includes('Specific Subject')) && "opacity-40 cursor-not-allowed bg-slate-50"
                )}
              >
                <option value="">Select Target Class...</option>
                {classes.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {validationErrors.class && (
                <p className="text-[10px] text-red-500 mt-1 font-bold">{validationErrors.class}</p>
              )}
            </div>

            {/* Subject Select - Enabled conditionally */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Target Subject</label>
              <select
                disabled={!formFields.audience.includes('Specific Subject')}
                value={formFields.subject}
                onChange={(e) => setFormFields(prev => ({ ...prev, subject: e.target.value }))}
                className={cn(
                  "h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold outline-none bg-white focus:border-blue-500 transition-colors w-full",
                  !formFields.audience.includes('Specific Subject') && "opacity-40 cursor-not-allowed bg-slate-50"
                )}
              >
                <option value="">Select Target Subject...</option>
                {classSubjectsLoading ? (
                  <option disabled>Loading subjects...</option>
                ) : classSubjects.length === 0 ? (
                  <option disabled>No subjects available for this class</option>
                ) : (
                  classSubjects.map(sub => (
                    <option key={sub._id} value={sub._id}>{sub.name} ({sub.code})</option>
                  ))
                )}
              </select>
              {validationErrors.subject && (
                <p className="text-[10px] text-red-500 mt-1 font-bold">{validationErrors.subject}</p>
              )}
            </div>
          </div>

          {/* Multiline Plain Textarea Editor */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Announcement Message *</label>
            <textarea
              placeholder="Provide announcement message content..."
              value={formFields.message}
              onChange={(e) => setFormFields(prev => ({ ...prev, message: e.target.value }))}
              rows="6"
              className={cn(
                "w-full p-3.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none shadow-sm",
                validationErrors.message && "border-red-500 focus:border-red-500"
              )}
            />
            {validationErrors.message && (
              <p className="text-[10px] text-red-500 mt-1 font-bold">{validationErrors.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2 border border-slate-100 p-4 rounded-2xl bg-slate-50/50">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Publishing</span>
            
            {currentAnnouncement && currentAnnouncement.status === 'Published' ? (
              <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 py-1">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Published Immediately ({formatDateDisplay(currentAnnouncement.publishAt)})</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 mt-1 select-none">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="publishMode"
                    value="instant"
                    checked={formFields.publishMode === 'instant'}
                    onChange={() => setFormFields(prev => ({ ...prev, publishMode: 'instant' }))}
                    className="text-brand-blue-500 focus:ring-brand-blue-500 cursor-pointer h-4 w-4"
                  />
                  <span>Publish Instantly</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="publishMode"
                    value="scheduled"
                    checked={formFields.publishMode === 'scheduled'}
                    onChange={() => setFormFields(prev => ({ ...prev, publishMode: 'scheduled' }))}
                    className="text-brand-blue-500 focus:ring-brand-blue-500 cursor-pointer h-4 w-4"
                  />
                  <span>Schedule for Later</span>
                </label>
              </div>
            )}
          </div>

          {formFields.publishMode === 'scheduled' && !(currentAnnouncement && currentAnnouncement.status === 'Published') && (
            <div>
              <Input
                label="Publish At *"
                type="datetime-local"
                value={formFields.publishAt}
                onChange={(e) => setFormFields(prev => ({ ...prev, publishAt: e.target.value }))}
                error={validationErrors.publishAt}
                className="text-xs font-semibold"
                min={getLocalISOString()}
              />
            </div>
          )}

          {/* Multiple File Attachments Selectors */}
          <div className="flex flex-col gap-2 border border-slate-100 p-4.5 rounded-2xl bg-slate-50/50">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Attachments (PDF, Doc, Image, Excel, ZIP - max 20MB)</span>
            
            <div className="flex items-center gap-3">
              <label className="h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold text-slate-600 transition-colors bg-white select-none shadow-sm">
                <Paperclip className="h-4 w-4" />
                <span>Choose Files</span>
                <input 
                  type="file" 
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      const filesArray = Array.from(e.target.files)
                      const sizeLimit = 20 * 1024 * 1024 // 20 MB
                      const oversized = filesArray.some(file => file.size > sizeLimit)
                      if (oversized) {
                        showToast('error', 'Each attached file must be smaller than 20 MB.')
                        return
                      }
                      setSelectedFiles(prev => [...prev, ...filesArray])
                    }
                  }} 
                  className="hidden" 
                />
              </label>
              <span className="text-[10px] text-slate-400 font-extrabold">{selectedFiles.length + (formFields.attachments?.length || 0)} files selected</span>
            </div>

            {/* Render files upload list preview */}
            <div className="space-y-1.5 mt-2">
              {/* Existing saved attachments */}
              {formFields.attachments?.map((file, idx) => (
                <div key={file.fileId || idx} className="flex items-center justify-between bg-white border border-slate-200/60 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="h-4 w-4 text-brand-blue-500 shrink-0" />
                    <span className="truncate">{file.fileName}</span>
                    <span className="text-[9px] text-slate-400 shrink-0">({(file.fileSize / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setFormFields(prev => ({
                        ...prev,
                        attachments: prev.attachments.filter((_, i) => i !== idx)
                      }))
                    }}
                    className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {/* Newly selected files */}
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between bg-blue-50/30 border border-blue-100 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="truncate">{file.name}</span>
                    <span className="text-[9px] text-slate-400 shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                    <span className="text-[9px] text-blue-500 font-extrabold shrink-0 bg-blue-50 px-1 rounded">New</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setSelectedFiles(prev => prev.filter((_, i) => i !== idx))
                    }}
                    className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 border-t border-slate-100 pt-4 mt-2">
            <label className="flex items-center gap-2 select-none cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={formFields.isPinned}
                onChange={(e) => setFormFields(prev => ({ ...prev, isPinned: e.target.checked }))}
                className="rounded border-slate-300 text-brand-blue-500 focus:ring-brand-blue-500 cursor-pointer h-4 w-4"
              />
              <span>Pin to Board Header</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-4 select-none">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddEditModalOpen(false)}
              className="h-10 px-5 rounded-full text-xs font-extrabold text-slate-500"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="h-10 px-6 rounded-full text-xs font-extrabold bg-brand-blue-500 hover:bg-brand-blue-600 text-white flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Announcement</span>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAILS MODAL */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Announcement Details"
        size="md"
      >
        {currentAnnouncement && (
          <div className="space-y-5 text-left text-xs font-semibold text-slate-600">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-1">
                <span>Status:</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full border text-[8px] font-black tracking-widest",
                  getStatusBadgeClass(currentAnnouncement.status)
                )}>
                  {currentAnnouncement.status}
                </span>
                {currentAnnouncement.isPinned && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[8px] font-black tracking-widest inline-flex items-center gap-0.5">
                    <Pin className="h-2 w-2 fill-blue-600" />
                    <span>PINNED</span>
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight mt-1.5 leading-snug">
                {currentAnnouncement.title}
              </h3>
              {currentAnnouncement.shortDescription && (
                <p className="text-[11px] font-bold text-slate-400 mt-2">
                  {currentAnnouncement.shortDescription}
                </p>
              )}
            </div>

            {/* Plain text message container preserving line breaks */}
            <div className="bg-slate-50/50 border border-slate-100/80 p-4.5 rounded-2xl max-h-[300px] overflow-y-auto custom-scrollbar">
              <div 
                className="whitespace-pre-line text-xs text-slate-700 leading-relaxed font-bold font-sans"
              >
                {currentAnnouncement.message}
              </div>
            </div>

            {/* Metadata information block */}
            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4.5 text-[11px]">
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Audience</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentAnnouncement.audience?.map(aud => (
                    <span key={aud} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-black leading-none">
                      {aud}
                    </span>
                  ))}
                </div>
              </div>

              {(currentAnnouncement.class || currentAnnouncement.subject) && (
                <div>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Target Specifics</span>
                  <span className="text-slate-700 block mt-1 font-bold">
                    {currentAnnouncement.class ? `Class: ${currentAnnouncement.class}` : ''}
                    {currentAnnouncement.class && currentAnnouncement.subject ? ' | ' : ''}
                    {currentAnnouncement.subject ? `Subject: ${currentAnnouncement.subject.name || currentAnnouncement.subject}` : ''}
                  </span>
                </div>
              )}

              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Created By</span>
                <span className="text-slate-700 block mt-1 font-bold">
                  {currentAnnouncement.createdBy?.name || 'Academic Admin'} ({currentAnnouncement.createdBy?.role || 'Staff'})
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Publish Date</span>
                <span className="text-slate-700 block mt-1 font-bold">
                  {formatDateDisplay(currentAnnouncement.publishAt)}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Engagement stats</span>
                <span className="text-slate-500 block mt-1 font-bold">
                  <span className="text-slate-700 font-black">{currentAnnouncement.viewsCount || 0}</span> views | <span className="text-slate-700 font-black">{currentAnnouncement.acknowledgedCount || 0}</span> checks
                </span>
              </div>
            </div>

            {/* Attachments Section */}
            {currentAnnouncement.attachments && currentAnnouncement.attachments.length > 0 && (
              <div className="border-t border-slate-100 pt-4.5 space-y-2">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Attachments</span>
                <div className="space-y-1.5">
                  {currentAnnouncement.attachments.map((file, idx) => (
                    <div 
                      key={file.fileId || idx}
                      className="flex items-center justify-between bg-white border border-slate-200/60 rounded-xl px-3.5 py-2 hover:border-slate-300 transition-colors select-none"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="h-4 w-4 text-brand-blue-500 shrink-0" />
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="truncate hover:text-brand-blue-600 hover:underline text-xs font-bold text-slate-600 cursor-pointer"
                        >
                          {file.fileName}
                        </a>
                        <span className="text-[9px] text-slate-400 shrink-0">({(file.fileSize / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button 
                        onClick={() => handleDownload(file)}
                        className="h-7 w-7 rounded-full bg-slate-55 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center cursor-pointer border border-slate-200/40"
                        title="Download file"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100 select-none">
              <Button
                variant="outline"
                onClick={() => setIsViewModalOpen(false)}
                className="h-10 px-5 rounded-full text-xs font-extrabold text-slate-500"
              >
                Close details
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Delete Announcement"
        size="sm"
      >
        <div className="space-y-5 text-left text-xs font-bold text-slate-700">
          <div className="flex items-start gap-3 bg-red-50 p-4.5 rounded-2xl border border-red-100 text-red-700">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-red-800">Confirm Deletion</h4>
              <p className="text-[11px] font-semibold text-red-600 leading-relaxed">
                Are you sure you want to permanently delete this announcement? This action is irreversible and all students, teachers, and parents will lose access immediately.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 select-none">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="h-10 px-5 rounded-full text-xs font-extrabold text-slate-500"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="h-10 px-6 rounded-full text-xs font-extrabold bg-red-655 hover:bg-red-700 text-white"
            >
              Delete Announcement
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
