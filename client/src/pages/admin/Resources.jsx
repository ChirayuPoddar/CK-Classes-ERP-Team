import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  Check, 
  RefreshCw, 
  BookOpen,
  Info,
  FileText,
  Download,
  Copy,
  Paperclip,
  Video as VideoIcon,
  Link as LinkIcon,
  FileSpreadsheet,
  FileImage,
  Database,
  Layers,
  Sparkles,
  Archive
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
import AIQuizGeneratorModal from '@/components/common/AIQuizGeneratorModal'

const classes = [
  'Play Group', 'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11 Science', 'Class 11 Commerce',
  'Class 12 Science', 'Class 12 Commerce'
]

const categories = [
  'Notes', 'Assignments', 'Question Papers', 'Sample Papers', 'Books',
  'Reference Books', 'Practice Sheets', 'Worksheets', 'Lab Manuals',
  'Presentations', 'Videos', 'Recorded Lectures', 'Important Documents',
  'Circulars', 'Others'
]

const visibilities = [
  'Entire Institute', 'Specific Class', 'Specific Subject', 'Teachers Only'
]

const statuses = ['Scheduled', 'Published']

export default function Resources() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const queryId = searchParams.get('id')

  const isAdmin = user?.role === 'admin'
  const isTeacher = user?.role === 'teacher'
  const isTeacherOrAdmin = isAdmin || isTeacher

  // Resources list states
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Dashboard Stats
  const [stats, setStats] = useState(null)

  // Dynamic Subject Lists for filters & forms
  const [classSubjects, setClassSubjects] = useState([])
  const [classSubjectsLoading, setClassSubjectsLoading] = useState(false)
  
  // Search & Filtering states
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const [sortField, setSortField] = useState('')
  const [sortOrder, setSortOrder] = useState('')

  // Pagination states
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Header Dropdowns
  const [activeHeaderFilterDropdown, setActiveHeaderFilterDropdown] = useState(null)

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false)
  const [currentResource, setCurrentResource] = useState(null) // null for create
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  // Upload & File removal state
  const [selectedFile, setSelectedFile] = useState(null)
  const [removeFile, setRemoveFile] = useState(false)
  
  // Form values
  const [formFields, setFormFields] = useState({
    title: '',
    description: '',
    category: 'Notes',
    visibility: 'Entire Institute',
    class: '',
    subject: '',
    externalUrl: '',
    publishMode: 'instant',
    publishAt: '',
    tags: ''
  })
  const [validationErrors, setValidationErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  // Extract YouTube ID helper (supports Shorts, Watch, Embed, and short links)
  const extractYoutubeId = (url) => {
    if (!url) return null
    const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[1].length === 11) ? match[1] : null
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

  // Fetch Resources listing
  const fetchResources = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        visibility: visibilityFilter || undefined,
        class: classFilter || undefined,
        subject: subjectFilter || undefined,
        category: categoryFilter || undefined,
        sortField: sortField || undefined,
        sortOrder: sortOrder || undefined
      }
      const res = await api.get('/resources', { params })
      if (res && res.success && res.data) {
        setResources(res.data.resources || [])
        setTotalPages(res.data.totalPages || 1)
        setTotal(res.data.total || 0)
      }
    } catch {
      setError('Failed to load resources.')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, visibilityFilter, classFilter, subjectFilter, categoryFilter, sortField, sortOrder])

  // Fetch KPI Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/resources/dashboard-stats')
      if (res && res.success && res.data) {
        setStats(res.data)
      }
    } catch {
      // Catch silently
    }
  }, [])

  useEffect(() => {
    fetchResources()
  }, [fetchResources])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Share link auto-opening when query parameter `id` is present
  useEffect(() => {
    if (queryId) {
      const fetchQueryResource = async () => {
        try {
          const res = await api.get(`/resources/${queryId}`)
          if (res && res.success && res.data) {
            handleOpenView(res.data)
          }
        } catch {
          // Catch silently
        }
      }
      fetchQueryResource()
    }
  }, [queryId])

  // Filter dropdown state toggler
  const toggleFilterDropdown = (type) => {
    setActiveHeaderFilterDropdown(prev => prev === type ? null : type)
  }

  // Active filters count calculation
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (statusFilter) count++
    if (visibilityFilter) count++
    if (classFilter) count++
    if (subjectFilter) count++
    if (categoryFilter) count++
    return count
  }, [statusFilter, visibilityFilter, classFilter, subjectFilter, categoryFilter])

  // Column header sorting
  const handleSortClick = (field) => {
    if (sortField !== field) {
      setSortField(field)
      setSortOrder('asc')
    } else {
      if (sortOrder === 'asc') {
        setSortOrder('desc')
      } else if (sortOrder === 'desc') {
        setSortOrder('')
        setSortField('')
      } else {
        setSortOrder('asc')
      }
    }
  }

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

  const handleOpenCreate = () => {
    setCurrentResource(null)
    setFormFields({
      title: '',
      description: '',
      category: 'Notes',
      visibility: 'Entire Institute',
      class: '',
      subject: '',
      externalUrl: '',
      publishMode: 'instant',
      publishAt: getLocalISOString(),
      tags: ''
    })
    setSelectedFile(null)
    setRemoveFile(false)
    setClassSubjects([])
    setValidationErrors({})
    setSubmitting(false)
    setIsAddEditModalOpen(true)
  }

  const handleOpenEdit = async (res) => {
    setCurrentResource(res)
    if (res.class) {
      await loadClassSubjects(res.class)
    } else {
      setClassSubjects([])
    }
    setFormFields({
      title: res.title || '',
      description: res.description || '',
      category: res.category || 'Notes',
      visibility: res.visibility || 'Entire Institute',
      class: res.class || '',
      subject: res.subject?._id || res.subject || '',
      externalUrl: res.youtubeId ? `https://www.youtube.com/watch?v=${res.youtubeId}` : (res.externalUrl || ''),
      publishMode: res.status === 'Published' ? 'instant' : 'scheduled',
      publishAt: convertToLocalInputVal(res.publishAt),
      tags: res.tags ? res.tags.join(', ') : ''
    })
    setSelectedFile(null)
    setRemoveFile(false)
    setValidationErrors({})
    setSubmitting(false)
    setIsAddEditModalOpen(true)
  }

  const handleOpenDuplicate = async (res) => {
    try {
      showToast('info', 'Copying resource...')
      const response = await api.post(`/resources/${res._id}/duplicate`)
      if (response && response.success) {
        showToast('success', 'Resource duplicated.')
        fetchResources()
        fetchStats()
      }
    } catch {
      showToast('error', 'Failed to duplicate resource.')
    }
  }

  const handleCopyLink = (res) => {
    const shareLink = `${window.location.origin}${window.location.pathname}?id=${res._id}`
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareLink)
        .then(() => {
          showToast('success', 'Resource link copied to clipboard.')
        })
        .catch(() => {
          fallbackCopyTextToClipboard(shareLink)
        })
    } else {
      fallbackCopyTextToClipboard(shareLink)
    }
  }

  const fallbackCopyTextToClipboard = (text) => {
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.top = '0'
      textArea.style.left = '0'
      textArea.style.width = '2em'
      textArea.style.height = '2em'
      textArea.style.padding = '0'
      textArea.style.border = 'none'
      textArea.style.outline = 'none'
      textArea.style.boxShadow = 'none'
      textArea.style.background = 'transparent'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      if (successful) {
        showToast('success', 'Resource link copied to clipboard.')
      } else {
        showToast('error', 'Failed to copy resource link.')
      }
    } catch {
      showToast('error', 'Failed to copy resource link.')
    }
  }

  const handleOpenView = async (res) => {
    setCurrentResource(res)
    setIsViewModalOpen(true)
    try {
      await api.post(`/resources/${res._id}/view`)
      setResources(prev => prev.map(r => r._id === res._id ? { ...r, viewCount: (r.viewCount || 0) + 1 } : r))
    } catch {
      // Ignore exception
    }
  }

  const handleDownload = async (res) => {
    if (!res || !res.resourceUrl) {
      showToast('error', 'Download link is invalid.')
      return
    }
    
    // Large file warning check (100MB)
    if (res.fileSize > 100 * 1024 * 1024) {
      const confirmVal = window.confirm(`This file is large (${formatFileSize(res.fileSize)}). Continue downloading?`)
      if (!confirmVal) return
    }

    try {
      // Track Download count in backend
      await api.post(`/resources/${res._id}/download`)
      setResources(prev => prev.map(r => r._id === res._id ? { ...r, downloadCount: (r.downloadCount || 0) + 1 } : r))
      fetchStats()

      // Trigger download
      const response = await fetch(`${res.resourceUrl}?ik-attachment=true`)
      if (!response.ok) throw new Error('Download failed')
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = res.fileName || res.title || 'resource'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
      showToast('success', 'Download initiated.')
    } catch {
      // Fallback redirection link
      window.open(res.resourceUrl, '_blank')
    }
  }

  const handleOpenDelete = (res) => {
    setCurrentResource(res)
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!currentResource) return
    try {
      await api.delete(`/resources/${currentResource._id}`)
      showToast('success', 'Resource deleted successfully.')
      setIsDeleteConfirmOpen(false)
      fetchResources()
      fetchStats()
    } catch {
      showToast('error', 'Failed to delete resource.')
    }
  }

  const handleSaveResource = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setValidationErrors({})

    const errors = {}
    if (!formFields.title.trim()) errors.title = 'Title is required'
    if (!formFields.category) errors.category = 'Category is required'
    if (!formFields.visibility) errors.visibility = 'Visibility is required'

    if ((formFields.visibility === 'Specific Class' || formFields.visibility === 'Specific Subject') && !formFields.class) {
      errors.class = 'Target class is required'
    }
    if (formFields.visibility === 'Specific Subject' && !formFields.subject) {
      errors.subject = 'Target subject is required'
    }

    // Validation for content source availability
    const hasExistingFile = currentResource?.cloudPublicId || (currentResource?.resourceUrl && !currentResource?.externalUrl && !currentResource?.youtubeId)
    const hasExistingUrl = currentResource?.externalUrl || currentResource?.youtubeId
    const willHaveFile = selectedFile || (hasExistingFile && !removeFile)
    const willHaveUrl = formFields.externalUrl.trim() || (hasExistingUrl && !removeFile)

    if (!willHaveFile && !willHaveUrl) {
      errors.file = 'Either a file upload or an external URL is required'
    }

    if (formFields.publishMode === 'scheduled') {
      if (!formFields.publishAt) {
        errors.publishAt = 'Publish date is required'
      } else {
        const isPublishedStatus = currentResource && currentResource.status === 'Published'
        if (!isPublishedStatus && new Date(formFields.publishAt) < new Date(Date.now() - 60000)) {
          errors.publishAt = 'Publish date cannot be in the past'
        }
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
      formData.append('description', formFields.description.trim())
      formData.append('category', formFields.category)
      formData.append('visibility', formFields.visibility)
      formData.append('class', formFields.class || '')
      formData.append('subject', formFields.subject || '')
      formData.append('externalUrl', formFields.externalUrl.trim())
      formData.append('publishMode', formFields.publishMode)
      formData.append('removeFile', removeFile ? 'true' : 'false')
      
      if (formFields.publishMode === 'scheduled' && formFields.publishAt) {
        formData.append('publishAt', new Date(formFields.publishAt).toISOString())
      }

      // Format tags array
      const tagsArray = formFields.tags.split(',').map(t => t.trim()).filter(Boolean)
      formData.append('tags', JSON.stringify(tagsArray))

      if (selectedFile) {
        if (selectedFile.size > 4 * 1024 * 1024) {
          showToast('error', 'File size exceeds maximum supported upload limit of 4MB. Please compress the file or provide an external link.')
          setSubmitting(false)
          return
        }
        formData.append('file', selectedFile)
      }

      let res
      if (currentResource) {
        res = await api.put(`/resources/${currentResource._id}`, formData)
      } else {
        res = await api.post('/resources', formData)
      }

      if (res && res.success) {
        showToast('success', currentResource ? 'Resource updated successfully.' : 'Resource uploaded successfully.')
        setIsAddEditModalOpen(false)
        fetchResources()
        fetchStats()
      } else {
        showToast('error', res.message || 'Operation failed.')
      }
    } catch (err) {
      const data = err.response?.data
      if (data?.code === 'FILE_TOO_LARGE') {
        showToast('error', 'File exceeds maximum supported upload limit of 4MB.')
      } else if (data?.errors) {
        setValidationErrors(data.errors)
        const firstErr = Object.values(data.errors)[0]
        showToast('error', firstErr || 'Validation checks failed.')
      } else {
        showToast('error', err.response?.data?.message || err.message || 'Resource upload failed.')
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

  // Humanize File Sizes
  const formatFileSize = (bytes) => {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    const mb = kb / 1024
    if (mb < 1024) return `${mb.toFixed(1)} MB`
    const gb = mb / 1024
    return `${gb.toFixed(1)} GB`
  }

  // Storage Used Display Formatter
  const formatStorageDisplay = (bytes) => {
    if (!bytes) return '0.0 GB / 10 GB'
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(2)} GB / 10 GB`
  }

  // Analytics Class Helper
  const getMostActiveClass = (analyticsMap) => {
    if (!analyticsMap || typeof analyticsMap !== 'object' || Object.keys(analyticsMap).length === 0) return 'None'
    let bestClass = 'None'
    let maxViews = 0
    Object.entries(analyticsMap).forEach(([className, count]) => {
      if (count > maxViews) {
        maxViews = count
        bestClass = className
      }
    })
    return maxViews > 0 ? `${bestClass} (${maxViews} views)` : 'None'
  }

  // Render colored file icons
  const renderResourceTypeIcon = (type) => {
    switch (type) {
      case 'PDF':
        return (
          <div className="h-7 w-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center border border-red-100 shrink-0">
            <FileText className="h-4 w-4" />
          </div>
        )
      case 'Document':
        return (
          <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shrink-0">
            <FileText className="h-4 w-4" />
          </div>
        )
      case 'Presentation':
        return (
          <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100 shrink-0">
            <Layers className="h-4 w-4" />
          </div>
        )
      case 'Spreadsheet':
        return (
          <div className="h-7 w-7 rounded-lg bg-cyan-50 text-cyan-500 flex items-center justify-center border border-cyan-100 shrink-0">
            <FileSpreadsheet className="h-4 w-4" />
          </div>
        )
      case 'Image':
        return (
          <div className="h-7 w-7 rounded-lg bg-pink-50 text-pink-500 flex items-center justify-center border border-pink-100 shrink-0">
            <FileImage className="h-4 w-4" />
          </div>
        )
      case 'Video':
      case 'Cloud Video':
        return (
          <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 shrink-0">
            <VideoIcon className="h-4 w-4" />
          </div>
        )
      case 'ZIP':
        return (
          <div className="h-7 w-7 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center border border-purple-100 shrink-0">
            <Archive className="h-4 w-4" />
          </div>
        )
      case 'YouTube Video':
        return (
          <div className="h-7 w-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-200 shrink-0">
            <VideoIcon className="h-4 w-4" />
          </div>
        )
      case 'External Link':
      default:
        return (
          <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center border border-indigo-100 shrink-0">
            <LinkIcon className="h-4 w-4" />
          </div>
        )
    }
  }

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'PDF':
        return 'bg-red-50 border-red-200 text-red-600'
      case 'Document':
        return 'bg-blue-50 border-blue-200 text-blue-600'
      case 'Presentation':
        return 'bg-amber-50 border-amber-200 text-amber-600'
      case 'Spreadsheet':
        return 'bg-cyan-50 border-cyan-200 text-cyan-600'
      case 'Image':
        return 'bg-pink-50 border-pink-200 text-pink-600'
      case 'Video':
      case 'Cloud Video':
        return 'bg-emerald-50 border-emerald-200 text-emerald-600'
      case 'ZIP':
        return 'bg-purple-50 border-purple-200 text-purple-600'
      case 'YouTube Video':
      case 'External Link':
      default:
        return 'bg-indigo-50 border-indigo-200 text-indigo-600'
    }
  }

  // Office Web Viewer check
  const isOfficePreviewable = (res) => {
    if (!res || !res.resourceUrl) return false
    const ext = res.fileName?.split('.').pop()?.toLowerCase() || ''
    return ['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls'].includes(ext)
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
            <span className="text-brand-blue-600">Resources</span>
            {activeFiltersCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-black leading-none font-sans">
                Filters ({activeFiltersCount})
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none mt-1">
            Books & Resources
          </h2>
          <p className="text-[11px] font-bold text-slate-400 mt-1.5">
            Share handouts, worksheets, reference booklets, syllabus files, and lecture videos with students and parents.
          </p>
        </div>

        {/* Top-Right Header controls */}
        <div className="flex items-center gap-3 select-none">
          <button
            onClick={() => { setCurrentResource(null); setIsQuizModalOpen(true); }}
            className="h-10 px-5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95 text-xs font-extrabold text-white shadow-premium-2 cursor-pointer flex items-center justify-center gap-2 transition-all shrink-0 font-sans"
          >
            <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
            <span>AI Quiz Generator</span>
          </button>

          {isTeacherOrAdmin && (
            <button
              onClick={handleOpenCreate}
              className="h-10 px-5 rounded-full bg-brand-blue-500 hover:bg-brand-blue-600 active:scale-95 text-xs font-extrabold text-white shadow-premium-2 cursor-pointer flex items-center justify-center gap-2 transition-all shrink-0 font-sans"
            >
              <Plus className="h-4 w-4" />
              <span>Add Resource</span>
            </button>
          )}

          <form onSubmit={(e) => { e.preventDefault(); setPage(1); }} className="relative w-64">
            <input
              type="text"
              placeholder="Search title, tags, description..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-10 pl-11 pr-5 rounded-full border border-slate-200 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white shadow-sm"
            />
            <Search className="absolute left-4 top-2.5 h-4.5 w-4.5 text-slate-400" />
          </form>
        </div>
      </div>

      {/* 2. Rebalanced KPI Cards Panel Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0 select-none">
        <DashboardStatCard
          title="Total Resources"
          value={stats?.total || 0}
          subtitle="Materials uploaded"
          icon={BookOpen}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-500"
          className="py-3 px-5 border border-slate-100/50 hover:border-slate-200 transition-all"
        />
        <DashboardStatCard
          title="PDFs & Documents"
          value={stats?.pdfs || 0}
          subtitle="Text notes & guides"
          icon={FileText}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-500"
          valueColor="text-amber-600"
          className="py-3 px-5 border border-slate-100/50 hover:border-slate-200 transition-all"
        />
        <DashboardStatCard
          title="Videos & Media"
          value={stats?.videos || 0}
          subtitle="Lectures & recordings"
          icon={VideoIcon}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-500"
          valueColor="text-emerald-600"
          className="py-3 px-5 border border-slate-100/50 hover:border-slate-200 transition-all"
        />
        <DashboardStatCard
          title="Storage Used"
          value={formatStorageDisplay(stats?.storageBytes)}
          subtitle="Automatic storage monitor"
          icon={Database}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-500"
          valueColor="text-purple-600"
          className="py-3 px-5 border border-slate-100/50 hover:border-slate-200 transition-all"
        />
      </div>

      {/* 3. Main Resources Table Panel */}
      <div 
        style={{ borderRadius: '28px', border: '1px solid #ECECEC' }}
        className="bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex-grow flex flex-col justify-between relative overflow-hidden min-h-[480px] text-left"
      >
        <div className="overflow-y-auto overflow-x-auto flex-grow min-h-0 flex flex-col">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest select-none">
              <tr className="h-14 bg-slate-50 sticky top-0 z-10">
                <th className="pl-6 text-left w-[34%]">
                  <TableHeadSort
                    title="Title"
                    sortField="title"
                    currentSortField={sortField}
                    sortOrder={sortOrder}
                    onClick={() => handleSortClick('title')}
                  />
                </th>

                <th className="px-4 relative bg-slate-50 text-left w-[16%]">
                  <TableHeaderFilter
                    type="category"
                    title={
                      <TableHeadSort
                        title="Category"
                        sortField="category"
                        currentSortField={sortField}
                        sortOrder={sortOrder}
                        onClick={() => handleSortClick('category')}
                      />
                    }
                    activeFilter={categoryFilter}
                    isOpen={activeHeaderFilterDropdown === 'category'}
                    onToggle={() => toggleFilterDropdown('category')}
                    onClose={() => setActiveHeaderFilterDropdown(null)}
                    onSelect={(val) => { setCategoryFilter(val); setPage(1); }}
                    options={categories}
                  />
                </th>

                <th className="px-4 relative bg-slate-50 text-left w-[12%]">
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

                <th className="px-4 relative bg-slate-50 text-left w-[18%]">
                  <TableHeaderFilter
                    type="subject"
                    title="Subject"
                    activeFilter={subjectFilter}
                    isOpen={activeHeaderFilterDropdown === 'subject'}
                    onToggle={() => toggleFilterDropdown('subject')}
                    onClose={() => setActiveHeaderFilterDropdown(null)}
                    onSelect={(val) => { setSubjectFilter(val); setPage(1); }}
                    options={classSubjects.map(s => ({ _id: s._id, name: s.name }))}
                  />
                </th>

                <th className="px-4 relative bg-slate-50 text-left w-[12%]">
                  <TableHeaderFilter
                    type="status"
                    title={
                      <TableHeadSort
                        title="Published"
                        sortField="publishAt"
                        currentSortField={sortField}
                        sortOrder={sortOrder}
                        onClick={() => handleSortClick('publishAt')}
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

                <th className="px-4 relative bg-slate-50 text-left w-[10%]">
                  <TableHeaderFilter
                    type="visibility"
                    title="Visibility"
                    activeFilter={visibilityFilter}
                    isOpen={activeHeaderFilterDropdown === 'visibility'}
                    onToggle={() => toggleFilterDropdown('visibility')}
                    onClose={() => setActiveHeaderFilterDropdown(null)}
                    onSelect={(val) => { setVisibilityFilter(val); setPage(1); }}
                    options={visibilities}
                  />
                </th>

                <th className="pr-6 w-12 text-right"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100/50 text-[11px] font-bold text-slate-655">
              {loading && resources.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="h-7 w-7 text-blue-500 animate-spin" />
                      <span className="text-xs font-bold text-slate-400">Loading resources catalog...</span>
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
              ) : resources.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-400 bg-transparent">
                      <Sparkles className="h-10 w-10 text-slate-300" />
                      <div className="space-y-0.5">
                        <span className="text-xs font-black text-slate-655 block">No resources found</span>
                        <span className="text-[10px] text-slate-400 font-semibold block">Upload notes, worksheets, manuals, and videos to share.</span>
                      </div>
                      {isTeacherOrAdmin && (
                        <button
                          onClick={handleOpenCreate}
                          className="h-9 px-5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 font-extrabold cursor-pointer hover:bg-blue-100 transition-colors mt-2"
                        >
                          Upload Resource
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                resources.map((res) => (
                  <tr 
                    key={res._id}
                    onClick={() => handleOpenView(res)}
                    className="h-[64px] hover:bg-slate-50/50 transition-colors duration-150 border-b border-slate-100/50 last:border-b-0 cursor-pointer"
                  >
                    <td className="pl-6 font-extrabold text-slate-800">
                      <div className="flex items-center gap-3">
                        {renderResourceTypeIcon(res.resourceType)}
                        
                        <div className="truncate flex flex-col justify-center min-w-0 pr-2">
                          <span className="truncate text-xs font-extrabold text-slate-800">{res.title}</span>
                          {res.fileName && (
                            <span className="text-[9.5px] text-slate-400 font-medium block truncate mt-0.5 font-sans">
                              {res.fileName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 text-slate-600 font-semibold">
                      {res.category}
                    </td>

                    <td className="px-4 text-slate-500 font-semibold">
                      {res.class || '—'}
                    </td>

                    <td className="px-4 text-slate-600 font-semibold">
                      {res.subject?.name ? `${res.subject.name}${res.subject.code ? ` (${res.subject.code})` : ''}` : '—'}
                    </td>

                    <td className="px-4 text-slate-500 font-semibold">
                      {formatDateDisplay(res.publishAt)}
                    </td>

                    <td className="px-4 text-slate-500">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-650 text-[9.5px] font-extrabold leading-none inline-block">
                        {res.visibility}
                      </span>
                    </td>

                    <td className="pr-6 text-right w-12" onClick={(e) => e.stopPropagation()}>
                      <TableRowActions 
                        actions={[
                          {
                            label: 'View',
                            icon: Info,
                            callback: () => handleOpenView(res)
                          },
                          {
                            label: 'Download',
                            icon: Download,
                            visible: res.resourceType !== 'YouTube Video' && res.resourceType !== 'External Link',
                            callback: () => handleDownload(res)
                          },
                          {
                            label: 'Copy Resource Link',
                            icon: LinkIcon,
                            callback: () => handleCopyLink(res)
                          },
                          {
                            label: 'Duplicate',
                            icon: Copy,
                            visible: isTeacherOrAdmin,
                            callback: () => handleOpenDuplicate(res)
                          },
                          {
                            label: 'Edit',
                            icon: Edit3,
                            visible: isTeacherOrAdmin,
                            callback: () => handleOpenEdit(res)
                          },
                          {
                            label: 'Delete',
                            icon: Trash2,
                            visible: isTeacherOrAdmin,
                            danger: true,
                            callback: () => handleOpenDelete(res)
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

      {/* CREATE / EDIT DIALOG MODAL */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={currentResource ? "Edit Resource" : "Upload New Resource"}
        size="lg"
      >
        <form onSubmit={handleSaveResource} className="space-y-5 text-left text-xs font-bold text-slate-700 select-none">
          <Input
            label="Resource Title *"
            type="text"
            placeholder="E.g., Class 10 Trigonometry Formula Book"
            value={formFields.title}
            onChange={(e) => setFormFields(prev => ({ ...prev, title: e.target.value }))}
            error={validationErrors.title}
            className="text-xs font-semibold"
          />

          <Input
            label="Short Description"
            type="text"
            placeholder="Provide a brief summary sentence..."
            value={formFields.description}
            onChange={(e) => setFormFields(prev => ({ ...prev, description: e.target.value }))}
            error={validationErrors.description}
            className="text-xs font-semibold"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Category *</label>
              <select
                value={formFields.category}
                onChange={(e) => setFormFields(prev => ({ ...prev, category: e.target.value }))}
                className="h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold outline-none bg-white focus:border-blue-500 transition-colors w-full"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {validationErrors.category && (
                <p className="text-[10px] text-red-500 mt-1 font-bold">{validationErrors.category}</p>
              )}
            </div>

            {/* Visibility Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Visibility Target *</label>
              <select
                value={formFields.visibility}
                onChange={(e) => {
                  const val = e.target.value
                  setFormFields(prev => ({ 
                    ...prev, 
                    visibility: val,
                    class: (val === 'Entire Institute' || val === 'Teachers Only') ? '' : prev.class,
                    subject: (val === 'Entire Institute' || val === 'Teachers Only' || val === 'Specific Class') ? '' : prev.subject
                  }))
                }}
                className="h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold outline-none bg-white focus:border-blue-500 transition-colors w-full"
              >
                {visibilities.map(vis => (
                  <option key={vis} value={vis}>{vis}</option>
                ))}
              </select>
              {validationErrors.visibility && (
                <p className="text-[10px] text-red-500 mt-1 font-bold">{validationErrors.visibility}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Class Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Target Class</label>
              <select
                disabled={formFields.visibility !== 'Specific Class' && formFields.visibility !== 'Specific Subject'}
                value={formFields.class}
                onChange={(e) => {
                  const val = e.target.value
                  setFormFields(prev => ({ ...prev, class: val, subject: '' }))
                  loadClassSubjects(val)
                }}
                className={cn(
                  "h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold outline-none bg-white focus:border-blue-500 transition-colors w-full",
                  (formFields.visibility !== 'Specific Class' && formFields.visibility !== 'Specific Subject') && "opacity-40 cursor-not-allowed bg-slate-50"
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

            {/* Target Subject Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Target Subject</label>
              <select
                disabled={formFields.visibility !== 'Specific Subject'}
                value={formFields.subject}
                onChange={(e) => setFormFields(prev => ({ ...prev, subject: e.target.value }))}
                className={cn(
                  "h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold outline-none bg-white focus:border-blue-500 transition-colors w-full",
                  formFields.visibility !== 'Specific Subject' && "opacity-40 cursor-not-allowed bg-slate-50"
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

          {/* Resource attachments file selector */}
          <div className="flex flex-col gap-4 border border-slate-100 p-4.5 rounded-2xl bg-slate-50/50">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Resource File or External Link</span>
            
            {/* Existing File Badge with Remove File Option in Edit Mode */}
            {currentResource && (currentResource.cloudPublicId || (currentResource.resourceUrl && !currentResource.externalUrl && !currentResource.youtubeId)) && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Currently Attached File</span>
                {!removeFile ? (
                  <div className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <Paperclip className="h-4 w-4 text-blue-500 shrink-0" />
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-800 block truncate">{currentResource.fileName || 'Attached File'}</span>
                        <span className="text-[10px] text-slate-400 font-semibold block">{formatFileSize(currentResource.fileSize)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRemoveFile(true)}
                      className="h-7 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-colors border border-red-100 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove File</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-red-50 border border-red-200 p-3 rounded-xl text-red-700">
                    <span className="text-xs font-bold">File will be removed when resource is saved</span>
                    <button
                      type="button"
                      onClick={() => setRemoveFile(false)}
                      className="h-7 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-extrabold cursor-pointer border border-slate-200"
                    >
                      Undo Removal
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* File Attachment Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  Upload File (Max 50MB, Videos 500MB)
                </label>
                <div className="flex items-center gap-3 h-10">
                  <label className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold text-slate-600 transition-colors bg-white select-none shadow-sm shrink-0">
                    <Paperclip className="h-4 w-4 text-blue-500" />
                    <span>Choose File</span>
                    <input 
                      type="file" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0])
                          setRemoveFile(false)
                          setFormFields(prev => ({ ...prev, externalUrl: '' }))
                        }
                      }} 
                      className="hidden" 
                    />
                  </label>
                  <span className="text-[10px] text-slate-500 font-extrabold max-w-[150px] truncate">
                    {selectedFile ? selectedFile.name : (removeFile ? 'File removed' : (currentResource?.cloudPublicId ? 'Using attached file' : 'No file selected'))}
                  </span>
                </div>
              </div>

              {/* External Video / Drive Link Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  OR External URL (Drive, YouTube, Shorts, MP4)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formFields.externalUrl}
                  onChange={(e) => {
                    setFormFields(prev => ({ ...prev, externalUrl: e.target.value }))
                    if (e.target.value.trim()) {
                      setSelectedFile(null)
                    }
                  }}
                  className="h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold outline-none bg-white focus:border-blue-500 transition-colors w-full"
                />
              </div>
            </div>
            {validationErrors.file && (
              <p className="text-[10px] text-red-500 font-bold">{validationErrors.file}</p>
            )}
          </div>

          {/* Tags list */}
          <Input
            label="Tags (Comma separated)"
            type="text"
            placeholder="trigonometry, formulas, cheat sheet"
            value={formFields.tags}
            onChange={(e) => setFormFields(prev => ({ ...prev, tags: e.target.value }))}
            className="text-xs font-semibold"
          />

          {/* Publishing workflow radios */}
          <div className="flex flex-col gap-2 border border-slate-100 p-4 rounded-2xl bg-slate-50/50">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Publishing</span>
            
            {currentResource && currentResource.status === 'Published' ? (
              <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 py-1">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Published Immediately ({formatDateDisplay(currentResource.publishAt)})</span>
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

          {formFields.publishMode === 'scheduled' && !(currentResource && currentResource.status === 'Published') && (
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
                <span>Save Resource</span>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAILS MODAL */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="View Resource"
        size="lg"
      >
        {currentResource && (
          <div className="space-y-5 text-left text-xs font-semibold text-slate-655">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-1 select-none">
                <span>Category:</span>
                <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[8px] font-black">
                  {currentResource.category}
                </span>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full border text-[8px] font-black tracking-widest",
                  getTypeBadgeClass(currentResource.resourceType)
                )}>
                  {currentResource.resourceType}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight mt-1.5 leading-snug">
                {currentResource.title}
              </h3>
              {currentResource.description && (
                <p className="text-[11px] font-bold text-slate-400 mt-2">
                  {currentResource.description}
                </p>
              )}
            </div>

            {/* Embedded preview player logic */}
            <div className="w-full">
              {(currentResource.resourceType === 'YouTube Video' || currentResource.youtubeId) ? (
                <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${currentResource.youtubeId || extractYoutubeId(currentResource.externalUrl || currentResource.resourceUrl)}`}
                    title={currentResource.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : (currentResource.resourceType === 'Video' || currentResource.resourceType === 'Cloud Video' || (currentResource.resourceType === 'External Link' && currentResource.resourceUrl?.match(/\.(mp4|webm|mov|ogg)$/i))) ? (
                <video
                  controls
                  autoPlay
                  src={currentResource.resourceUrl}
                  className="w-full aspect-video rounded-2xl border border-slate-100 bg-black shadow-sm"
                />
              ) : currentResource.resourceType === 'PDF' ? (
                <iframe
                  src={currentResource.resourceUrl}
                  title={currentResource.title}
                  className="w-full h-[450px] rounded-2xl border border-slate-100 shadow-sm"
                />
              ) : currentResource.resourceType === 'Image' ? (
                <div className="flex justify-center bg-slate-50 border border-slate-100 p-4 rounded-2xl max-h-[400px] overflow-hidden">
                  <img 
                    src={currentResource.resourceUrl} 
                    alt={currentResource.title} 
                    className="max-w-full max-h-[350px] object-contain rounded-xl shadow-sm" 
                  />
                </div>
              ) : isOfficePreviewable(currentResource) ? (
                <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(currentResource.resourceUrl)}`}
                  title={currentResource.title}
                  className="w-full h-[450px] rounded-2xl border border-slate-100 shadow-sm"
                />
              ) : (
                <div className="bg-slate-50 border border-slate-100 p-8 rounded-2xl flex flex-col items-center justify-center gap-3">
                  <FileText className="h-12 w-12 text-slate-350" />
                  <div className="text-center space-y-1">
                    <span className="text-xs font-bold text-slate-700 block">No inline preview available</span>
                    <span className="text-[10px] text-slate-400 font-medium block">You can view or download this resource using the action below.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Metadata information block */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 pt-4.5 text-[11px] select-none">
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Target Class</span>
                <span className="text-slate-700 block mt-1 font-bold">
                  {currentResource.class || 'Entire Institute'}
                </span>
              </div>

              {currentResource.subject && (
                <div>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Subject</span>
                  <span className="text-slate-700 block mt-1 font-bold">
                    {currentResource.subject.name || currentResource.subject}
                  </span>
                </div>
              )}

              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Uploaded By</span>
                <span className="text-slate-700 block mt-1 font-bold">
                  {currentResource.uploadedBy?.name || 'Academic Admin'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Publish Date</span>
                <span className="text-slate-700 block mt-1 font-bold">
                  {formatDateDisplay(currentResource.publishAt)}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Downloads</span>
                <span className="text-slate-700 block mt-1 font-bold">
                  {currentResource.downloadCount || 0} times
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Views Count</span>
                <span className="text-slate-700 block mt-1 font-bold">
                  {currentResource.viewCount || 0} views
                </span>
              </div>

              {currentResource.fileSize > 0 && (
                <div>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">File Size</span>
                  <span className="text-slate-700 block mt-1 font-bold">
                    {formatFileSize(currentResource.fileSize)}
                  </span>
                </div>
              )}

              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Visibility</span>
                <span className="text-slate-700 block mt-1 font-bold">
                  {currentResource.visibility}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Last Updated</span>
                <span className="text-slate-700 block mt-1 font-bold">
                  {formatDateDisplay(currentResource.updatedAt)}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Last Viewed</span>
                <span className="text-slate-700 block mt-1 font-bold">
                  {formatDateDisplay(currentResource.lastViewedAt)}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Most Active Class</span>
                <span className="text-slate-700 block mt-1 font-bold">
                  {getMostActiveClass(currentResource.classAnalytics)}
                </span>
              </div>
            </div>

            {/* Render tags */}
            {currentResource.tags && currentResource.tags.length > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Tags</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {currentResource.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-slate-500 text-[9px] font-bold">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 select-none">
              <span className="text-[10px] text-slate-400 font-bold">Uploaded on {formatDateDisplay(currentResource.createdAt)}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsViewModalOpen(false)}
                  className="h-10 px-5 rounded-full text-xs font-extrabold text-slate-500"
                >
                  Close
                </Button>
                {currentResource.resourceType !== 'YouTube Video' && currentResource.resourceType !== 'External Link' && currentResource.resourceUrl && (
                  <Button
                    onClick={() => handleDownload(currentResource)}
                    className="h-10 px-6 rounded-full text-xs font-extrabold bg-brand-blue-500 hover:bg-brand-blue-600 text-white flex items-center justify-center gap-1.5"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download File</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Delete Resource"
        size="sm"
      >
        <div className="space-y-5 text-left text-xs font-bold text-slate-700">
          <div className="flex items-start gap-3 bg-red-50 p-4.5 rounded-2xl border border-red-100 text-red-700">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-red-800">Confirm Deletion</h4>
              <p className="text-[11px] font-semibold text-red-600 leading-relaxed">
                Are you sure you want to delete this resource? Students and parents will lose access immediately.
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
              className="h-10 px-6 rounded-full text-xs font-extrabold bg-red-600 hover:bg-red-700 text-white shadow-sm"
            >
              Delete Resource
            </Button>
          </div>
        </div>
      </Modal>

      {/* AI Quiz & Test Generator Modal */}
      <AIQuizGeneratorModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        initialResource={currentResource}
      />

    </div>
  )
}
