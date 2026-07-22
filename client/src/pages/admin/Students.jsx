import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  GraduationCap, 
  Search, 
  Plus, 
  Download, 
  Eye, 
  Edit3,
  Camera, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Calendar, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  AlertCircle, 
  Check, 
  RefreshCw,
  Trash2,
  BookOpen,
  Info,
  Layers,
  Briefcase,
  Upload,
  Printer,
  KeyRound,
  MoreVertical,
  MoreHorizontal,
  SlidersHorizontal
} from 'lucide-react'
import api from '@/services/api'
import { cn } from '@/utils/cn'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import * as XLSX from 'xlsx'
import { TableHeadSort, TableHeaderFilter } from '@/components/common/DataTable'

export const CLASS_ORDER = {
  "Play Group": 1,
  "Nursery": 2,
  "LKG": 3,
  "UKG": 4,
  "Class 1": 5,
  "Class 2": 6,
  "Class 3": 7,
  "Class 4": 8,
  "Class 5": 9,
  "Class 6": 10,
  "Class 7": 11,
  "Class 8": 12,
  "Class 9": 13,
  "Class 10": 14,
  "Class 11 Science": 15,
  "Class 11 Commerce": 16,
  "Class 12 Science": 17,
  "Class 12 Commerce": 18
}

export const sortClassesByHierarchy = (classList) => {
  return [...classList].sort((a, b) => {
    const rankA = CLASS_ORDER[a] || 999
    const rankB = CLASS_ORDER[b] || 999
    return rankA - rankB
  })
}

const rawClasses = [
  'Play Group', 'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11 Science', 'Class 11 Commerce',
  'Class 12 Science', 'Class 12 Commerce'
]

const classes = sortClassesByHierarchy(rawClasses)

// Spring physics configurations
const spring = { type: 'spring', stiffness: 350, damping: 28 }

export default function Students() {
  // State variables
  const [students, setStudents] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [activeHeaderFilterDropdown, setActiveHeaderFilterDropdown] = useState(null)
  const [openDropdownDirection, setOpenDropdownDirection] = useState('down')
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)

  // Filters & Search
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false)
  const [sortField, setSortField] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false)
  const [currentStudent, setCurrentStudent] = useState(null) // null for create
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  
  // Student Promotion States
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState([])
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [selectedStream, setSelectedStream] = useState('Class 11 Science')
  const [promoting, setPromoting] = useState(false)

  // Activation Info Modal State
  const [isActivationInfoOpen, setIsActivationInfoOpen] = useState(false)
  const [activationData, setActivationData] = useState(null)
  const [loadingActivation, setLoadingActivation] = useState(false)

  const handleOpenActivationInfo = async (student) => {
    setCurrentStudent(student)
    setIsActivationInfoOpen(true)
    setLoadingActivation(true)
    setActivationData(null)
    try {
      const res = await api.get(`/activation/status/${student._id}`)
      if (res && res.data) {
        setActivationData(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch activation status:', err)
    } finally {
      setLoadingActivation(false)
    }
  }

  // Toast notifications state
  const [toast, setToast] = useState(null)
  const [isSecondaryMenuOpen, setIsSecondaryMenuOpen] = useState(false)
  const [isFiltersPopoverOpen, setIsFiltersPopoverOpen] = useState(false)
  const [openRowMenuId, setOpenRowMenuId] = useState(null)
  const [activeProfileTab, setActiveProfileTab] = useState('info')
  const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false)
  const [bulkTargetStatus, setBulkTargetStatus] = useState('Active')
  const [bulkStatusUpdating, setBulkStatusUpdating] = useState(false)

  useEffect(() => {
    if (isAddEditModalOpen || isViewModalOpen || isDeleteConfirmOpen || isBulkDeleteConfirmOpen || isPromoteModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isAddEditModalOpen, isViewModalOpen, isDeleteConfirmOpen, isBulkDeleteConfirmOpen, isPromoteModalOpen])

  // Local state for files inside Add Student modal
  const [formPhotoFile, setFormPhotoFile] = useState(null)
  const [formPhotoPreview, setFormPhotoPreview] = useState(null)

  // Form fields state
  const [formFields, setFormFields] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    gender: 'Male',
    dateOfBirth: '',
    email: '',
    phone: '',
    parentPhone: '',
    additionalParentPhones: [],
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    bloodGroup: '',
    category: 'General',
    religion: '',
    admissionDate: '',
    class: '',
    status: 'Active',
    parent: '',
    fatherName: '',
    motherName: '',
    occupation: '',
    emergencyContact: {
      name: '',
      phone: '',
      relation: ''
    }
  })
  const [formError, setFormError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgressMsg, setUploadProgressMsg] = useState('')

  // Show floating toast
  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  // Fetch students function
  const fetchStudents = async () => {
    setLoading(true)
    setError(null)
    try {
      const sortQuery = {}
      sortQuery[sortField] = sortOrder === 'desc' ? -1 : 1

      const response = await api.get('/students', {
        params: {
          page,
          limit,
          search,
          class: classFilter,
          status: statusFilter,
          gender: genderFilter,
          category: categoryFilter,
          sort: sortQuery
        }
      })

      if (response && response.success) {
        setStudents(response.data.students || [])
        setTotal(response.data.total || 0)
        setPages(response.data.pages || 1)
        setStats(response.data.stats || null)
      } else {
        setError('Failed to fetch students data')
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching students')
    } finally {
      setLoading(false)
    }
  }

  // Refetch when filters, search, or sorting change
  useEffect(() => {
    fetchStudents()
  }, [page, classFilter, statusFilter, genderFilter, categoryFilter, sortField, sortOrder, search])

  // Trigger search on form submit
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchStudents()
  }

  const handleSort = (field) => {
    if (sortField !== field) {
      setSortField(field)
      setSortOrder('asc')
    } else {
      if (sortOrder === 'asc') {
        setSortOrder('desc')
      } else if (sortOrder === 'desc') {
        setSortField('createdAt')
        setSortOrder('desc')
      } else {
        setSortField(field)
        setSortOrder('asc')
      }
    }
    setPage(1)
  }

  const toggleFilterDropdown = (type) => {
    setActiveHeaderFilterDropdown(prev => prev === type ? null : type)
  }

  const handleDropdownClick = (e, studentId) => {
    e.stopPropagation()
    if (openRowMenuId === studentId) {
      setOpenRowMenuId(null)
    } else {
      const rect = e.currentTarget.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      if (spaceBelow < 240) {
        setOpenDropdownDirection('up')
      } else {
        setOpenDropdownDirection('down')
      }
      setOpenRowMenuId(studentId)
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setSearch('')
    setClassFilter('')
    setStatusFilter('')
    setGenderFilter('')
    setCategoryFilter('')
    setSortField('createdAt')
    setSortOrder('desc')
    setPage(1)
  }

  const advancedFilterCount = (genderFilter ? 1 : 0) + (categoryFilter ? 1 : 0) + (sortField !== 'createdAt' || sortOrder !== 'desc' ? 1 : 0)
  const hasActiveFilters = Boolean(search || classFilter || statusFilter || genderFilter || categoryFilter || (sortField !== 'createdAt' || sortOrder !== 'desc'))

  const activeChips = [
    ...(search ? [{ id: 'search', label: `Search: "${search}"`, onRemove: () => setSearch('') }] : []),
    ...(classFilter ? [{ id: 'class', label: `Class: ${classFilter}`, onRemove: () => setClassFilter('') }] : []),
    ...(statusFilter ? [{ id: 'status', label: `Status: ${statusFilter}`, onRemove: () => setStatusFilter('') }] : []),
    ...(genderFilter ? [{ id: 'gender', label: `Gender: ${genderFilter}`, onRemove: () => setGenderFilter('') }] : []),
    ...(categoryFilter ? [{ id: 'category', label: `Category: ${categoryFilter}`, onRemove: () => setCategoryFilter('') }] : []),
    ...((sortField !== 'createdAt' || sortOrder !== 'desc') ? [{
      id: 'sort',
      label: `Sort: ${sortField === 'firstName' ? 'Name (A-Z)' : sortField === 'studentId' ? 'ID' : 'Oldest First'}`,
      onRemove: () => { setSortField('createdAt'); setSortOrder('desc'); }
    }] : [])
  ]

  const formatDateToDDMMYYYY = (dateVal) => {
    if (!dateVal) return ''
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return ''
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Open Create Modal
  const handleOpenCreate = () => {
    setCurrentStudent(null)
    setFormFields({
      firstName: '',
      middleName: '',
      lastName: '',
      gender: 'Male',
      dateOfBirth: '',
      email: '',
      phone: '',
      parentPhone: '',
      additionalParentPhones: [],
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      bloodGroup: '',
      category: 'General',
      religion: '',
      admissionDate: formatDateToDDMMYYYY(new Date()),
      class: '',
      status: 'Active',
      parent: '',
      fatherName: '',
      motherName: '',
      occupation: '',
      emergencyContact: {
        name: '',
        phone: '',
        relation: ''
      }
    })
    setFormPhotoFile(null)
    setFormPhotoPreview(null)
    setFormError(null)
    setValidationErrors({})
    setIsAddEditModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (student) => {
    setCurrentStudent(student)
    setFormFields({
      firstName: student.firstName || '',
      middleName: student.middleName || '',
      lastName: student.lastName || '',
      gender: student.gender || 'Male',
      dateOfBirth: formatDateToDDMMYYYY(student.dateOfBirth),
      email: student.email || '',
      phone: student.phone || '',
      parentPhone: student.parentPhone || '',
      additionalParentPhones: student.additionalParentPhones || [],
      address: student.address || '',
      city: student.city || '',
      state: student.state || '',
      country: student.country || 'India',
      pincode: student.pincode || '',
      bloodGroup: student.bloodGroup || '',
      category: student.category || 'General',
      religion: student.religion || '',
      admissionDate: formatDateToDDMMYYYY(student.admissionDate),
      class: student.class || '',
      status: student.status || 'Active',
      parent: student.parent || '',
      fatherName: student.fatherName || '',
      motherName: student.motherName || '',
      occupation: student.occupation || '',
      emergencyContact: {
        name: student.emergencyContact?.name || '',
        phone: student.emergencyContact?.phone || '',
        relation: student.emergencyContact?.relation || ''
      }
    })
    setFormPhotoFile(null)
    setFormPhotoPreview(student.photo?.secure_url || null)
    setFormError(null)
    setValidationErrors({})
    setIsAddEditModalOpen(true)
  }

  // Handle drag and drop image select
  const handlePhotoDrop = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        return showToast('error', 'Only JPG, PNG, and WEBP formats are allowed')
      }
      if (file.size > 5 * 1024 * 1024) {
        return showToast('error', 'Maximum profile photo size is 5MB')
      }
      setFormPhotoFile(file)
      setFormPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleDeletePhoto = async () => {
    if (!currentStudent || !currentStudent._id) return
    try {
      setSubmitting(true)
      const res = await api.delete(`/students/${currentStudent._id}/photo`)
      if (res && res.success) {
        showToast('success', 'Profile photo deleted successfully.')
        setFormPhotoPreview(null)
        setFormPhotoFile(null)
        setCurrentStudent(prev => ({
          ...prev,
          photo: { public_id: '', secure_url: '' }
        }))
        fetchStudents()
      } else {
        showToast('error', res.message || 'Failed to delete photo')
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to delete photo')
    } finally {
      setSubmitting(false)
    }
  }

  // Submit Form: Create / Edit Student with integrated uploads
  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    setValidationErrors({})
    setUploadProgressMsg('')

    // Client-side validations
    if (!formFields.firstName.trim()) {
      setSubmitting(false)
      return showToast('error', 'First Name is required')
    }
    if (!formFields.lastName.trim()) {
      setSubmitting(false)
      return showToast('error', 'Last Name is required')
    }
    if (!formFields.email.trim()) {
      setSubmitting(false)
      return showToast('error', 'Email is required')
    }
    if (!formFields.phone.trim() || !/^[0-9]{10}$/.test(formFields.phone)) {
      setSubmitting(false)
      return showToast('error', 'Phone number must be exactly 10 digits')
    }
    if (formFields.pincode && !/^[0-9]{6}$/.test(formFields.pincode)) {
      setSubmitting(false)
      return showToast('error', 'Pincode must be exactly 6 digits')
    }
    if (formFields.parentPhone && !/^[0-9]{10}$/.test(formFields.parentPhone)) {
      setSubmitting(false)
      return showToast('error', 'Parent Phone number must be exactly 10 digits')
    }
    if (formFields.additionalParentPhones && formFields.additionalParentPhones.length > 0) {
      for (let i = 0; i < formFields.additionalParentPhones.length; i++) {
        if (!/^[0-9]{10}$/.test(formFields.additionalParentPhones[i])) {
          setSubmitting(false)
          return showToast('error', `Additional Parent Phone ${i + 2} must be exactly 10 digits`)
        }
      }
    }
    if (formFields.emergencyContact?.phone && !/^[0-9]{10}$/.test(formFields.emergencyContact.phone)) {
      setSubmitting(false)
      return showToast('error', 'Emergency Phone number must be exactly 10 digits')
    }
    if (!formFields.class.trim()) {
      setSubmitting(false)
      return showToast('error', 'Class is required')
    }
    if (!formFields.dateOfBirth) {
      setSubmitting(false)
      return showToast('error', 'Date of Birth is required')
    } else {
      const dobMatch = formFields.dateOfBirth.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
      if (!dobMatch) {
        setSubmitting(false)
        return showToast('error', 'Date of birth must be in DD/MM/YYYY format')
      }
      const day = parseInt(dobMatch[1], 10)
      const month = parseInt(dobMatch[2], 10)
      const year = parseInt(dobMatch[3], 10)
      const d = new Date(year, month - 1, day)
      if (isNaN(d.getTime()) || d.getDate() !== day || d.getMonth() !== month - 1 || d.getFullYear() !== year) {
        setSubmitting(false)
        return showToast('error', 'Date of birth is not a valid calendar date')
      }
    }
    if (formFields.admissionDate) {
      const admMatch = formFields.admissionDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
      if (!admMatch) {
        setSubmitting(false)
        return showToast('error', 'Admission date must be in DD/MM/YYYY format')
      }
      const day = parseInt(admMatch[1], 10)
      const month = parseInt(admMatch[2], 10)
      const year = parseInt(admMatch[3], 10)
      const d = new Date(year, month - 1, day)
      if (isNaN(d.getTime()) || d.getDate() !== day || d.getMonth() !== month - 1 || d.getFullYear() !== year) {
        setSubmitting(false)
        return showToast('error', 'Admission date is not a valid calendar date')
      }
    }
    if (formFields.bloodGroup) {
      const bg = formFields.bloodGroup.toUpperCase().trim()
      if (!['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(bg)) {
        setSubmitting(false)
        return showToast('error', 'Blood Group must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-')
      }
    }

    try {
      let res
      if (currentStudent) {
        res = await api.put(`/students/${currentStudent._id}`, formFields)
      } else {
        res = await api.post('/students', formFields)
      }

      if (res && res.success) {
        const studentId = res.data._id || res.data.id

        // Process profile photo upload
        if (formPhotoFile && studentId) {
          setUploadProgressMsg('Uploading profile image...')
          const photoData = new FormData()
          photoData.append('photo', formPhotoFile)
          await api.post(`/students/${studentId}/photo`, photoData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        }

        showToast('success', currentStudent ? 'Student details updated successfully' : 'Student registered successfully')
        setIsAddEditModalOpen(false)
        fetchStudents()
      } else {
        setFormError(res.message || 'Operation failed')
        showToast('error', res.message || 'Operation failed')
      }
    } catch (err) {
      const msg = err.message || 'An error occurred during save'
      setFormError(msg)
      showToast('error', msg)

      if (err.errors && Array.isArray(err.errors)) {
        const fieldErrors = {}
        err.errors.forEach(e => {
          fieldErrors[e.field] = e.message
        })
        setValidationErrors(fieldErrors)
      }
    } finally {
      setSubmitting(false)
      setUploadProgressMsg('')
    }
  }

  // Hard delete Student action
  const handleDeleteStudent = async () => {
    if (!currentStudent) return
    try {
      const res = await api.delete(`/students/${currentStudent._id}`)
      if (res && res.success) {
        showToast('success', 'Student deleted successfully.')
        setIsDeleteConfirmOpen(false)
        fetchStudents()
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to delete student')
    }
  }

  const handleBulkDelete = async () => {
    try {
      setBulkDeleting(true)
      const ids = selectedStudents.map(s => s._id)
      const res = await api.delete('/students/bulk', { data: { ids } })
      if (res && res.success) {
        showToast('success', res.message || 'Successfully deleted selected students.')
        setSelectedStudents([])
        setIsBulkDeleteConfirmOpen(false)
        fetchStudents()
      } else {
        showToast('error', res.message || 'Failed to delete selected students')
      }
    } catch (e) {
      console.error('Bulk delete error:', e)
      showToast('error', e.message || 'Failed to delete selected students')
    } finally {
      setBulkDeleting(false)
    }
  }

  const handleBulkStatusChangeSubmit = async () => {
    setBulkStatusUpdating(true)
    try {
      const ids = selectedStudents.map(s => s._id)
      const res = await api.put('/students/bulk/status', {
        studentIds: ids,
        status: bulkTargetStatus
      })
      if (res && res.success) {
        showToast('success', res.message || `Status updated for ${ids.length} students.`)
        setSelectedStudents([])
        setIsBulkStatusModalOpen(false)
        fetchStudents()
      }
    } catch (err) {
      showToast('error', err.message || 'Bulk status update failed')
    } finally {
      setBulkStatusUpdating(false)
    }
  }

  // Export to CSV helper
  const handleExportCSV = async () => {
    if (total === 0) {
      return showToast('error', 'No students available to export.')
    }

    try {
      // Fetch all filtered students matching the current filters (without pagination limit)
      const res = await api.get('/students', {
        params: {
          page: 1,
          limit: total,
          search,
          class: classFilter,
          status: statusFilter,
          sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 }
        }
      })

      if (res && res.success && res.data.students && res.data.students.length > 0) {
        const listToExport = res.data.students
        
        const headers = [
          'Student ID',
          'Full Name',
          'Grade',
          'Gender',
          'Date of Birth',
          'Father Name',
          'Mother Name',
          'Parent Phone',
          'Student Phone',
          'Email',
          'Address',
          'City',
          'Pincode',
          'Status',
          'Admission Date'
        ]

        const rows = listToExport.map(s => {
          const fullName = `${s.firstName || ''} ${s.middleName ? s.middleName + ' ' : ''}${s.lastName || ''}`.trim()
          const dob = s.dateOfBirth ? s.dateOfBirth.split('T')[0] : 'N/A'
          const admissionDate = s.admissionDate ? s.admissionDate.split('T')[0] : 'N/A'
          
          return [
            s.studentId || 'N/A',
            fullName,
            s.class || 'N/A',
            s.gender || 'N/A',
            dob,
            s.fatherName || 'N/A',
            s.motherName || 'N/A',
            s.parentPhone || 'N/A',
            s.phone || 'N/A',
            s.email || 'N/A',
            s.address || 'N/A',
            s.city || 'N/A',
            s.pincode || 'N/A',
            s.status || 'Active',
            admissionDate
          ].map(val => {
            // Escape double quotes and wrap in quotes if contains commas or newlines
            let cleanVal = String(val).replace(/"/g, '""')
            if (cleanVal.includes(',') || cleanVal.includes('\n')) {
              cleanVal = `"${cleanVal}"`
            }
            return cleanVal
          })
        })

        // Construct CSV
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
          + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        
        // File name format: students_YYYY-MM-DD.csv
        const formattedDate = new Date().toISOString().split('T')[0]
        link.setAttribute("download", `students_${formattedDate}.csv`)
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        showToast('error', 'No students available to export.')
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to export students')
    }
  }

  // Download Student ID Card PDF helper
  const handleDownloadIDCard = async (student) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [54, 86]
      })

      // 1. Draw Background and Borders
      doc.setFillColor(255, 255, 255)
      doc.rect(0, 0, 54, 86, 'F')

      // Draw primary brand header banner (Hex: #2563EB - modern blue)
      doc.setFillColor(37, 99, 235)
      doc.rect(0, 0, 54, 14, 'F')

      // Draw red accent stripe below header (Hex: #EF4444 - modern red)
      doc.setFillColor(239, 68, 68)
      doc.rect(0, 14, 54, 1, 'F')

      // Draw brand logo badge
      doc.setFillColor(255, 255, 255)
      doc.circle(9, 7, 3, 'F')

      // Draw diamond cap inside badge
      doc.setDrawColor(37, 99, 235) // primary blue
      doc.setLineWidth(0.3)
      doc.line(7.5, 7, 9, 5.5)
      doc.line(9, 5.5, 10.5, 7)
      doc.line(10.5, 7, 9, 8.5)
      doc.line(9, 8.5, 7.5, 7)
      
      // Draw tassel line
      doc.line(10.5, 7, 11, 9)

      // Header Text: Brand name
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.text('C.K. CLASSES', 15, 6.5)

      // Subheader Text: Student ID Card label
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(4.5)
      doc.text('STUDENT ID CARD', 15, 10.5)

      // 2. Profile Photo
      // Draw outer photo frame border
      doc.setDrawColor(226, 232, 240) // Slate-200 border
      doc.setLineWidth(0.3)
      doc.rect(16.5, 18.5, 21, 21)

      const drawDefaultAvatar = () => {
        doc.setFillColor(241, 245, 249)
        doc.rect(17, 19, 20, 20, 'F')
        
        doc.setFillColor(148, 163, 184)
        doc.circle(27, 26, 3, 'F')

        doc.setFillColor(148, 163, 184)
        doc.ellipse(27, 33.5, 6, 3.5, 'F')
      }

      if (student.photo?.secure_url) {
        try {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = student.photo.secure_url + '?cb=' + Date.now()
          })

          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth || img.width
          canvas.height = img.naturalHeight || img.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          const dataUrl = canvas.toDataURL('image/jpeg')

          doc.addImage(dataUrl, 'JPEG', 17, 19, 20, 20)
        } catch (e) {
          console.warn('Failed to load profile image for ID card generation. Using placeholder avatar.', e)
          drawDefaultAvatar()
        }
      } else {
        drawDefaultAvatar()
      }

      // 3. Student Name & ID Card label text
      const fullName = `${student.firstName || ''} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName || ''}`.trim()
      doc.setTextColor(30, 41, 59) // Slate-800
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.text(fullName.toUpperCase(), 27, 43, { align: 'center' })

      // Highlighted Student ID text block
      doc.setFillColor(239, 246, 255) // Blue-50 background
      doc.rect(14, 45.5, 26, 3.5, 'F')
      doc.setDrawColor(191, 219, 254) // Blue-200 border
      doc.rect(14, 45.5, 26, 3.5)
      
      doc.setTextColor(29, 78, 216) // Blue-700
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(5.5)
      doc.text(`ID: ${student.studentId || 'N/A'}`, 27, 48.2, { align: 'center' })

      // 4. Student Information Grid
      doc.setTextColor(71, 85, 105) // Slate-600
      doc.setFontSize(5.2)

      const startY = 52
      const stepY = 3.5

      const printRow = (label, value, y) => {
        doc.setFont('helvetica', 'bold')
        doc.text(label, 4, y)
        doc.setFont('helvetica', 'normal')
        const cleanVal = String(value || 'N/A')
        doc.text(cleanVal, 18, y)
      }

      const formattedDOB = student.dateOfBirth ? student.dateOfBirth.split('T')[0] : 'N/A'
      const formattedAdm = student.admissionDate ? student.admissionDate.split('T')[0] : 'N/A'

      printRow('GRADE:', student.class, startY)
      printRow('D.O.B:', formattedDOB, startY + stepY)
      printRow('BLOOD GRP:', student.bloodGroup || 'N/A', startY + stepY * 2)
      printRow('STUDENT:', student.phone, startY + stepY * 3)
      printRow('PARENT:', student.parentPhone, startY + stepY * 4)

      // Bottom left secondary grid
      printRow('ADMISSION:', formattedAdm, 72)
      
      if (student.emergencyContact && student.emergencyContact.phone) {
        const contactName = student.emergencyContact.name || 'Emergency'
        printRow('EMERGENCY:', student.emergencyContact.phone, 76)
        printRow('CONTACT:', contactName, 80)
      } else {
        printRow('EMERGENCY:', 'N/A', 76)
        printRow('CONTACT:', 'N/A', 80)
      }

      // 5. Generate QR Code
      const qrText = `Student ID: ${student.studentId || 'N/A'}\nName: ${fullName}\nGrade: ${student.class || 'N/A'}\nStudent Phone: ${student.phone || 'N/A'}\nParent Phone: ${student.parentPhone || 'N/A'}`
      const qrDataUrl = await QRCode.toDataURL(qrText, {
        margin: 0,
        width: 150
      })

      // Add QR Code outline box and image at bottom right
      doc.setDrawColor(241, 245, 249)
      doc.rect(36.5, 68.5, 14, 14)
      doc.addImage(qrDataUrl, 'PNG', 37, 69, 13, 13)

      // Draw subtle boundary cut border around card
      doc.setDrawColor(203, 213, 225)
      doc.setLineWidth(0.2)
      doc.rect(0, 0, 54, 86)

      // Save/download
      doc.save(`StudentID_${student.studentId || 'Profile'}.pdf`)
      showToast('success', 'ID card generated successfully.')
    } catch (error) {
      console.error('Error generating PDF ID card:', error)
      showToast('error', error.message || 'Failed to generate ID Card')
    }
  }

  const calculateCompleteness = (student) => {
    if (!student) return 0
    let score = 0
    if (student.firstName) score += 15
    if (student.lastName) score += 15
    if (student.email) score += 15
    if (student.phone) score += 15
    if (student.class) score += 10
    if (student.dateOfBirth) score += 10
    if (student.parentPhone) score += 10
    if (student.address) score += 5
    if (student.gender) score += 5
    return score
  }

  const handleViewProfile = async (student) => {
    try {
      const res = await api.get(`/students/${student._id}`)
      if (res && res.success) {
        setCurrentStudent(res.data)
        setActiveProfileTab('info')
        setIsViewModalOpen(true)
      } else {
        showToast('error', 'Failed to retrieve profile details')
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to retrieve profile details')
    }
  }

  // Document upload state
  const [docName, setDocName] = useState('')
  const [docType, setDocType] = useState('Identity Document')
  const [docFile, setDocFile] = useState(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)

  // Internal Notes state
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  // Leaving Info state
  const [leavingDate, setLeavingDate] = useState('')
  const [leavingReason, setLeavingReason] = useState('')
  const [leavingNotes, setLeavingNotes] = useState('')
  const [recordingLeaving, setRecordingLeaving] = useState(false)

  // Toggle student portal access helper
  const handleTogglePortalAccess = async () => {
    if (!currentStudent || !currentStudent.portalAccount) return
    const isActive = currentStudent.portalAccount.isActive
    const actionText = isActive ? 'disable' : 'enable'
    
    if (!window.confirm(`Are you sure you want to ${actionText} portal access for this student?`)) {
      return
    }

    try {
      const res = await api.put(`/students/${currentStudent._id}/portal-access`, { active: !isActive })
      if (res && res.success) {
        showToast('success', `Portal access ${isActive ? 'disabled' : 'enabled'} successfully`)
        const fresh = await api.get(`/students/${currentStudent._id}`)
        if (fresh && fresh.success) {
          setCurrentStudent(fresh.data)
        }
      }
    } catch (err) {
      showToast('error', err.message || 'Operation failed')
    }
  }

  // Document management helpers
  const handleDocumentSubmit = async (e) => {
    e.preventDefault()
    if (!docFile || !currentStudent) return
    setUploadingDoc(true)
    try {
      const formData = new FormData()
      formData.append('document', docFile)
      formData.append('name', docName || docFile.name)
      formData.append('type', docType)

      const res = await api.post(`/students/${currentStudent._id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (res && res.success) {
        showToast('success', 'Document uploaded successfully')
        setDocName('')
        setDocFile(null)
        const fresh = await api.get(`/students/${currentStudent._id}`)
        if (fresh && fresh.success) {
          setCurrentStudent(fresh.data)
        }
      }
    } catch (err) {
      showToast('error', err.message || 'Upload failed')
    } finally {
      setUploadingDoc(false)
    }
  }

  const handleDeleteDocument = async (docId) => {
    if (!currentStudent || !window.confirm('Are you sure you want to delete this document?')) return
    try {
      const res = await api.delete(`/students/${currentStudent._id}/documents/${docId}`)
      if (res && res.success) {
        showToast('success', 'Document deleted successfully')
        const fresh = await api.get(`/students/${currentStudent._id}`)
        if (fresh && fresh.success) {
          setCurrentStudent(fresh.data)
        }
      }
    } catch (err) {
      showToast('error', err.message || 'Delete failed')
    }
  }

  // Internal Notes helpers
  const handleNoteSubmit = async (e) => {
    e.preventDefault()
    if (!noteText.trim() || !currentStudent) return
    setAddingNote(true)
    try {
      const res = await api.post(`/students/${currentStudent._id}/notes`, { text: noteText })
      if (res && res.success) {
        showToast('success', 'Note added successfully')
        setNoteText('')
        const fresh = await api.get(`/students/${currentStudent._id}`)
        if (fresh && fresh.success) {
          setCurrentStudent(fresh.data)
        }
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to add note')
    } finally {
      setAddingNote(false)
    }
  }

  const handleDeleteInternalNote = async (noteId) => {
    if (!currentStudent || !window.confirm('Are you sure you want to delete this note?')) return
    try {
      const res = await api.delete(`/students/${currentStudent._id}/notes/${noteId}`)
      if (res && res.success) {
        showToast('success', 'Note deleted successfully')
        const fresh = await api.get(`/students/${currentStudent._id}`)
        if (fresh && fresh.success) {
          setCurrentStudent(fresh.data)
        }
      }
    } catch (err) {
      showToast('error', err.message || 'Delete failed')
    }
  }

  // Record Leaving / Transfer helper
  const handleLeavingSubmit = async (e) => {
    e.preventDefault()
    if (!leavingDate || !currentStudent) return
    setRecordingLeaving(true)
    try {
      const match = leavingDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
      if (!match) {
        showToast('error', 'Leaving date must be in DD/MM/YYYY format')
        setRecordingLeaving(false)
        return
      }
      const day = parseInt(match[1], 10)
      const month = parseInt(match[2], 10)
      const year = parseInt(match[3], 10)
      const d = new Date(year, month - 1, day)
      if (isNaN(d.getTime())) {
        showToast('error', 'Invalid leaving date')
        setRecordingLeaving(false)
        return
      }

      const res = await api.put(`/students/${currentStudent._id}`, {
        status: 'Inactive',
        leavingInfo: {
          date: d.toISOString(),
          reason: leavingReason,
          notes: leavingNotes
        }
      })
      if (res && res.success) {
        showToast('success', 'Student leaving/transfer details saved.')
        setLeavingDate('')
        setLeavingReason('')
        setLeavingNotes('')
        const fresh = await api.get(`/students/${currentStudent._id}`)
        if (fresh && fresh.success) {
          setCurrentStudent(fresh.data)
        }
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to save leaving details')
    } finally {
      setRecordingLeaving(false)
    }
  }

  const handlePrintProfile = async (student) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Draw brand header banner (Hex: #1E293B - Slate-800)
      doc.setFillColor(30, 41, 59)
      doc.rect(0, 0, 210, 36, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      doc.text('C.K. CLASSES', 15, 16)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text('COACHING CLASS ERP SYSTEM - STUDENT PROFILE REPORT', 15, 22)
      doc.setFontSize(7.5)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 29)

      // Draw brand logo badge decoration on top right
      doc.setFillColor(255, 255, 255)
      doc.circle(185, 18, 7, 'F')
      doc.setDrawColor(37, 99, 235)
      doc.setLineWidth(0.4)
      doc.line(181.5, 18, 185, 14.5)
      doc.line(185, 14.5, 188.5, 18)
      doc.line(188.5, 18, 185, 21.5)
      doc.line(185, 21.5, 181.5, 18)

      // Draw profile photo frame on right side of report
      let hasPhoto = false
      const photoX = 150
      const photoY = 46
      const photoW = 40
      const photoH = 40

      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.4)
      doc.rect(photoX, photoY, photoW, photoH)

      if (student.photo?.secure_url) {
        try {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = student.photo.secure_url + '?cb=' + Date.now()
          })
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth || img.width
          canvas.height = img.naturalHeight || img.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          const dataUrl = canvas.toDataURL('image/jpeg')
          doc.addImage(dataUrl, 'JPEG', photoX + 0.8, photoY + 0.8, photoW - 1.6, photoH - 1.6)
          hasPhoto = true
        } catch (e) {
          console.warn('Could not render photo for student A4 report, using placeholder', e)
        }
      }

      if (!hasPhoto) {
        doc.setFillColor(241, 245, 249)
        doc.rect(photoX + 0.8, photoY + 0.8, photoW - 1.6, photoH - 1.6, 'F')
        doc.setTextColor(148, 163, 184)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.text('NO PHOTO', photoX + 20, photoY + 22, { align: 'center' })
      }

      // Profile details layout
      doc.setTextColor(30, 41, 59)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(15)
      const fullName = `${student.firstName || ''} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName || ''}`.trim()
      doc.text(fullName.toUpperCase(), 15, 54)

      doc.setFontSize(10)
      doc.setTextColor(29, 78, 216)
      doc.text(`Student ID: ${student.studentId || 'N/A'}`, 15, 60)

      let currentY = 92

      const drawSectionHeader = (title) => {
        doc.setFillColor(248, 250, 252)
        doc.rect(15, currentY, 180, 7, 'F')
        doc.setDrawColor(241, 245, 249)
        doc.line(15, currentY, 195, currentY)
        doc.line(15, currentY + 7, 195, currentY + 7)
        doc.setTextColor(15, 23, 42)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8.5)
        doc.text(title.toUpperCase(), 18, currentY + 4.8)
        currentY += 11
      }

      const drawFieldsGrid = (fields) => {
        doc.setFontSize(8.5)
        fields.forEach(row => {
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(100, 116, 139)
          doc.text(row[0], 18, currentY)
          
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(15, 23, 42)
          doc.text(String(row[1] || 'N/A'), 65, currentY)

          if (row[2]) {
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(100, 116, 139)
            doc.text(row[2], 110, currentY)

            doc.setFont('helvetica', 'normal')
            doc.setTextColor(15, 23, 42)
            doc.text(String(row[3] || 'N/A'), 150, currentY)
          }

          currentY += 6.5
        })
        currentY += 4.5
      }

      // Academic Details Section
      drawSectionHeader('Academic details')
      drawFieldsGrid([
        ['Class / Grade:', student.class, 'Admission Date:', student.admissionDate ? student.admissionDate.split('T')[0] : 'N/A'],
        ['Status:', student.status || 'Active']
      ])

      // Personal Details Section
      drawSectionHeader('Personal Details')
      drawFieldsGrid([
        ['Gender:', student.gender, 'Date of Birth:', student.dateOfBirth ? student.dateOfBirth.split('T')[0] : 'N/A'],
        ['Blood Group:', student.bloodGroup || 'N/A', 'Category:', student.category || 'N/A'],
        ['Religion:', student.religion || 'N/A']
      ])

      // Contact Details Section
      drawSectionHeader('Contact Details')
      drawFieldsGrid([
        ['Student Phone:', student.phone, 'Parent Phone:', student.parentPhone],
        ['Email Address:', student.email]
      ])

      // Emergency Contact Section
      drawSectionHeader('Emergency Contact')
      const emergencyName = student.emergencyContact?.name || 'N/A'
      const emergencyPhone = student.emergencyContact?.phone || 'N/A'
      const emergencyRelation = student.emergencyContact?.relation || 'N/A'
      drawFieldsGrid([
        ['Contact Person:', emergencyName, 'Phone Number:', emergencyPhone],
        ['Relation:', emergencyRelation]
      ])

      // Address Section
      drawSectionHeader('Address details')
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(8.5)
      const fullAddressStr = `${student.address || ''}, ${student.city || ''}, ${student.state || 'Gujarat'}, ${student.country || 'India'} - ${student.pincode || ''}`
      
      // Wrap text if address is too long
      const splitAddress = doc.splitTextToSize(fullAddressStr, 170)
      doc.text(splitAddress, 18, currentY)

      doc.save(`StudentProfile_${student.studentId || 'Profile'}.pdf`)
      showToast('success', 'Profile PDF report downloaded.')
    } catch (e) {
      console.error('Error generating printable student profile:', e)
      showToast('error', 'Failed to generate printable student profile')
    }
  }

  // Download Excel Import Template helper
  const handleDownloadTemplate = () => {
    const headers = [
      'First Name',
      'Middle Name',
      'Last Name',
      'Gender',
      'Date of Birth',
      'Blood Group',
      'Category',
      'Religion',
      'Admission Date',
      'Class',
      'Status',
      'Student Phone',
      'Parent Phone 1',
      'Parent Phone 2',
      'Parent Phone 3',
      'Email',
      'Address',
      'City',
      'Pincode',
      'Father Name',
      'Mother Name',
      'Occupation',
      'Emergency Contact Name',
      'Emergency Contact Relationship',
      'Emergency Contact Phone'
    ]

    const data = [
      headers
    ]

    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Students Template')
    XLSX.writeFile(wb, 'student_import_template.xlsx')
    showToast('success', 'Excel template downloaded.')
  }

  // Download error report CSV helper
  const downloadErrorReport = (failedRows) => {
    const headers = [
      'Row Number',
      'Reason for Failure',
      'First Name',
      'Middle Name',
      'Last Name',
      'Gender',
      'Date of Birth',
      'Blood Group',
      'Category',
      'Religion',
      'Admission Date',
      'Class',
      'Status',
      'Student Phone',
      'Parent Phone 1',
      'Parent Phone 2',
      'Parent Phone 3',
      'Email',
      'Address',
      'City',
      'Pincode',
      'Father Name',
      'Mother Name',
      'Occupation',
      'Emergency Contact Name',
      'Emergency Contact Relationship',
      'Emergency Contact Phone'
    ]

    const csvRows = failedRows.map(f => {
      const rowData = [
        f.firstName, f.middleName, f.lastName, f.gender, f.dob, f.bloodGroup,
        f.category, f.religion, f.admissionDate, f.grade, f.status,
        f.studentPhone, f.parentPhone1, f.parentPhone2, f.parentPhone3, f.email,
        f.address, f.city, f.pincode, f.fatherName, f.motherName, f.occupation,
        f.emergencyName, f.emergencyRelation, f.emergencyPhone
      ]

      return [
        f.rowNumber,
        f.reason,
        ...rowData
      ].map(val => {
        let cleanVal = String(val === undefined || val === null ? '' : val).replace(/"/g, '""')
        if (cleanVal.includes(',') || cleanVal.includes('\n')) {
          cleanVal = `"${cleanVal}"`
        }
        return cleanVal
      })
    })

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n')
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `import_errors_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Read and import students from Excel file helper
  const handleImportExcel = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    e.target.value = ''

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })
        
        if (rows.length < 2) {
          return showToast('error', 'Excel sheet is empty or contains no students data.')
        }

        const requiredHeaders = [
          'First Name',
          'Middle Name',
          'Last Name',
          'Gender',
          'Date of Birth',
          'Blood Group',
          'Category',
          'Religion',
          'Admission Date',
          'Class',
          'Status',
          'Student Phone',
          'Parent Phone 1',
          'Parent Phone 2',
          'Parent Phone 3',
          'Email',
          'Address',
          'City',
          'Pincode',
          'Father Name',
          'Mother Name',
          'Occupation',
          'Emergency Contact Name',
          'Emergency Contact Relationship',
          'Emergency Contact Phone'
        ]

        const fileHeaders = rows[0].map(h => String(h || '').trim())
        const headersMatch = requiredHeaders.every((h, idx) => fileHeaders[idx] === h)
        
        if (!headersMatch) {
          return showToast('error', 'Invalid columns template. Please use the downloaded Excel template.')
        }

        let successCount = 0
        let failedCount = 0
        const failedRows = []

        const parseExcelDate = (d) => {
          if (d === undefined || d === null || String(d).trim() === '') return ''
          if (typeof d === 'number') {
            const date = new Date(Math.round((d - 25569) * 86400 * 1000))
            return date.toISOString().split('T')[0]
          }
          const dateObj = new Date(d)
          if (!isNaN(dateObj.getTime())) {
            return dateObj.toISOString().split('T')[0]
          }
          return ''
        }

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i]
          
          if (!row || row.length === 0 || row.every(val => val === undefined || val === null || String(val).trim() === '')) {
            continue
          }

          const [
            firstName,
            middleName,
            lastName,
            gender,
            dobRaw,
            bloodGroup,
            category,
            religion,
            admissionDateRaw,
            grade, // this is "Class"
            status,
            studentPhone,
            parentPhone1,
            parentPhone2,
            parentPhone3,
            email,
            address,
            city,
            pincode,
            fatherName,
            motherName,
            occupation,
            emergencyName,
            emergencyRelation,
            emergencyPhone
          ] = row

          const errors = []

          if (!firstName || String(firstName).trim() === '') errors.push('First Name is required')
          if (!lastName || String(lastName).trim() === '') errors.push('Last Name is required')
          if (!gender || String(gender).trim() === '') errors.push('Gender is required')
          if (!dobRaw) errors.push('Date of Birth is required')
          if (!grade || String(grade).trim() === '') errors.push('Class is required')
          if (!studentPhone) errors.push('Student Phone is required')
          if (!parentPhone1) errors.push('Parent Phone 1 is required')
          if (!email || String(email).trim() === '') errors.push('Email is required')

          const validClasses = [
            'Nursery', 'LKG', 'UKG',
            'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
            'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
            'Class 11 Science', 'Class 11 Commerce',
            'Class 12 Science', 'Class 12 Commerce'
          ]
          const cleanGrade = String(grade || '').trim()
          if (cleanGrade && !validClasses.includes(cleanGrade)) {
            errors.push(`Invalid Class: "${cleanGrade}"`)
          }

          const formattedDOB = parseExcelDate(dobRaw)
          if (dobRaw && !formattedDOB) errors.push('Invalid Date of Birth format')

          const formattedAdmission = parseExcelDate(admissionDateRaw)
          if (admissionDateRaw && !formattedAdmission) errors.push('Invalid Admission Date format')

          if (errors.length > 0) {
            failedCount++
            failedRows.push({
              rowNumber: i + 1,
              reason: errors.join('; '),
              firstName, middleName, lastName, gender, dob: dobRaw, bloodGroup,
              category, religion, admissionDate: admissionDateRaw, grade, status,
              studentPhone, parentPhone1, parentPhone2, parentPhone3, email,
              address, city, pincode, fatherName, motherName, occupation,
              emergencyName, emergencyRelation, emergencyPhone
            })
            continue
          }

          try {
            const payload = {
              firstName: String(firstName).trim(),
              middleName: middleName ? String(middleName).trim() : '',
              lastName: String(lastName).trim(),
              gender: String(gender).trim(),
              dateOfBirth: formattedDOB,
              class: cleanGrade,
              fatherName: fatherName ? String(fatherName).trim() : '',
              motherName: motherName ? String(motherName).trim() : '',
              phone: String(studentPhone).trim(),
              parentPhone: String(parentPhone1).trim(),
              additionalParentPhones: [parentPhone2, parentPhone3].map(p => String(p || '').trim()).filter(Boolean),
              email: String(email).trim(),
              address: address ? String(address).trim() : '',
              city: city ? String(city).trim() : '',
              pincode: pincode ? String(pincode).trim() : '',
              bloodGroup: bloodGroup ? String(bloodGroup).trim() : '',
              religion: religion ? String(religion).trim() : '',
              category: category ? String(category).trim() : '',
              admissionDate: formattedAdmission,
              status: status ? String(status).trim() : 'Active',
              occupation: occupation ? String(occupation).trim() : '',
              emergencyContact: {
                name: emergencyName ? String(emergencyName).trim() : '',
                relation: emergencyRelation ? String(emergencyRelation).trim() : '',
                phone: emergencyPhone ? String(emergencyPhone).trim() : ''
              }
            }

            const res = await api.post('/students', payload)
            if (res && res.success) {
              successCount++
            } else {
              failedCount++
              failedRows.push({
                rowNumber: i + 1,
                reason: res.message || 'API save rejected profile',
                firstName, middleName, lastName, gender, dob: dobRaw, bloodGroup,
                category, religion, admissionDate: admissionDateRaw, grade, status,
                studentPhone, parentPhone1, parentPhone2, parentPhone3, email,
                address, city, pincode, fatherName, motherName, occupation,
                emergencyName, emergencyRelation, emergencyPhone
              })
            }
          } catch (err) {
            failedCount++
            failedRows.push({
              rowNumber: i + 1,
              reason: err.message || 'Save execution failed',
              firstName, middleName, lastName, gender, dob: dobRaw, bloodGroup,
              category, religion, admissionDate: admissionDateRaw, grade, status,
              studentPhone, parentPhone1, parentPhone2, parentPhone3, email,
              address, city, pincode, fatherName, motherName, occupation,
              emergencyName, emergencyRelation, emergencyPhone
            })
          }
        }

        showToast('success', `Imported Successfully: ${successCount}\nFailed: ${failedCount}`)

        if (failedCount > 0) {
          downloadErrorReport(failedRows)
        }

        fetchStudents()

      } catch (err) {
        console.error('Import processing failed:', err)
        showToast('error', err.message || 'Failed to read Excel workbook')
      }
    }
    reader.readAsBinaryString(file)
  }

  // Clear selection on page/filter/search changes
  useEffect(() => {
    setSelectedStudents([])
  }, [page, classFilter, statusFilter, search])

  const handleSelectStudent = (student) => {
    setSelectedStudents(prev => {
      const exists = prev.some(s => s._id === student._id)
      if (exists) {
        return prev.filter(s => s._id !== student._id)
      } else {
        return [...prev, student]
      }
    })
  }

  const handleSelectAllPage = () => {
    const allPageSelected = students.length > 0 && students.every(s => selectedStudents.some(sel => sel._id === s._id))
    if (allPageSelected) {
      setSelectedStudents(prev => prev.filter(sel => !students.some(s => s._id === sel._id)))
    } else {
      setSelectedStudents(prev => {
        const newSelection = [...prev]
        students.forEach(s => {
          if (!newSelection.some(sel => sel._id === s._id)) {
            newSelection.push(s)
          }
        })
        return newSelection
      })
    }
  }

  const handleSelectAllMatching = async () => {
    try {
      const sortQuery = {}
      sortQuery[sortField] = sortOrder === 'desc' ? -1 : 1
      const response = await api.get('/students', {
        params: {
          page: 1,
          limit: total || 9999,
          search,
          class: classFilter,
          status: statusFilter,
          sort: sortQuery
        }
      })
      if (response && response.success) {
        setSelectedStudents(response.data.students || [])
      }
    } catch (err) {
      console.error('Failed to select all students:', err)
      showToast('error', 'Failed to select all matching students.')
    }
  }

  // Execute student grade promotion
  const handlePromoteStudents = async () => {
    if (selectedStudents.length === 0) {
      return showToast('error', 'No students selected for promotion.')
    }
    
    const hasClass12 = selectedStudents.some(s => s.class === 'Class 12 Science' || s.class === 'Class 12 Commerce')
    if (hasClass12) {
      return showToast('error', 'These students have already completed the highest class and cannot be promoted.')
    }

    const hasClass10 = selectedStudents.some(s => s.class === 'Class 10')

    setPromoting(true)
    try {
      const res = await api.post('/students/promote', {
        studentIds: selectedStudents.map(s => s._id),
        stream: hasClass10 ? selectedStream : undefined
      })
      if (res && res.success) {
        showToast('success', res.message || `${selectedStudents.length} students promoted successfully.`)
        setIsPromoteModalOpen(false)
        setSelectedStudents([])
        fetchStudents()
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to promote students')
    } finally {
      setPromoting(false)
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
            <span className="text-brand-blue-600">Students</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
            Student Management
          </h2>
          <p className="text-[11px] font-bold text-slate-400 mt-1">
            Create, view, edit, and organize coaching class student enrollments
          </p>
        </div>

        {/* RIGHT SIDE ACTIONS */}
        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto w-full md:w-auto">
          <button
            onClick={handleOpenCreate}
            id="add-student-btn"
            className="h-10 px-5 rounded-full bg-brand-blue-500 hover:bg-brand-blue-600 active:scale-95 text-xs font-extrabold text-white shadow-premium-2 cursor-pointer flex items-center justify-center gap-2 transition-all shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add Student</span>
          </button>

          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-64 md:flex-none">
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-10 pl-11 pr-5 rounded-full border border-slate-200 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50/50"
            />
            <Search className="absolute left-4 top-2.5 h-4.5 w-4.5 text-slate-400" />
          </form>

          {/* Three-Dot Dropdown Menu for Secondary Actions */}
          <div className="relative">
            <button
              onClick={() => setIsSecondaryMenuOpen(!isSecondaryMenuOpen)}
              className="h-10 w-10 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 cursor-pointer shadow-sm transition-all"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>

            {isSecondaryMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsSecondaryMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-20 text-left">
                  <button
                    onClick={() => {
                      setIsSecondaryMenuOpen(false);
                      handleDownloadTemplate();
                    }}
                    className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="h-4 w-4 text-blue-500" />
                    <span>Download Template</span>
                  </button>
                  <div className="relative w-full">
                    <input
                      type="file"
                      accept=".xlsx"
                      onChange={(e) => {
                        setIsSecondaryMenuOpen(false);
                        handleImportExcel(e);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
                      <Upload className="h-4 w-4 text-emerald-500" />
                      <span>Import Students</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsSecondaryMenuOpen(false);
                      handleExportCSV();
                    }}
                    className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="h-4 w-4 text-slate-500" />
                    <span>Export Students</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div 
          onClick={clearFilters}
          className={cn(
            "bg-white px-5 py-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md hover:border-blue-200 group active:scale-[0.98]",
            !statusFilter && !classFilter && !genderFilter && !categoryFilter && !search ? "border-blue-500 ring-1 ring-blue-500/20 bg-blue-50/10" : "border-slate-100"
          )}
        >
          <div className="text-left">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block group-hover:text-blue-600 transition-colors">Total Students</span>
            <span className="text-xl font-black text-slate-800 leading-tight block mt-0.5">{stats?.total || 0}</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <GraduationCap className="h-4.5 w-4.5" />
          </div>
        </div>

        <div 
          onClick={() => { setStatusFilter(statusFilter === 'Active' ? '' : 'Active'); setPage(1); }}
          className={cn(
            "bg-white px-5 py-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md hover:border-emerald-200 group active:scale-[0.98]",
            statusFilter === 'Active' ? "border-emerald-500 ring-1 ring-emerald-500/20 bg-emerald-50/10" : "border-slate-100"
          )}
        >
          <div className="text-left">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block group-hover:text-emerald-600 transition-colors">Active Students</span>
            <span className="text-xl font-black text-emerald-600 leading-tight block mt-0.5">{stats?.active || 0}</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Check className="h-4.5 w-4.5" />
          </div>
        </div>

        <div 
          onClick={() => { setStatusFilter(statusFilter === 'Inactive' ? '' : 'Inactive'); setPage(1); }}
          className={cn(
            "bg-white px-5 py-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md hover:border-rose-200 group active:scale-[0.98]",
            statusFilter === 'Inactive' ? "border-rose-500 ring-1 ring-rose-500/20 bg-rose-50/10" : "border-slate-100"
          )}
        >
          <div className="text-left">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block group-hover:text-rose-600 transition-colors">Inactive Students</span>
            <span className="text-xl font-black text-slate-500 leading-tight block mt-0.5">{stats?.inactive || 0}</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <X className="h-4.5 w-4.5" />
          </div>
        </div>

        <div 
          onClick={() => {
            setSortField('createdAt')
            setSortOrder('desc')
            setPage(1)
          }}
          className="bg-white px-5 py-3.5 rounded-2xl border border-slate-100 transition-all cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md hover:border-indigo-200 group active:scale-[0.98]"
        >
          <div className="text-left">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block group-hover:text-indigo-600 transition-colors">Today's Admissions</span>
            <span className="text-xl font-black text-indigo-600 leading-tight block mt-0.5">{stats?.todayAdmissions || 0}</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Calendar className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>

      {/* Modern Compact Filter Bar & Advanced Filter Panel */}
      <div className="shrink-0 select-none space-y-2">
        <div 
          style={{ borderRadius: '18px', border: '1px solid #ECECEC' }}
          className="py-2.5 px-4 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-wrap items-center justify-between gap-3"
        >
          {/* Primary Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5 min-w-0">
            {/* Class Dropdown */}
            <select
              value={classFilter}
              onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
              className="h-9 px-3.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs transition-colors hover:bg-slate-100/70"
            >
              <option value="">All Classes ({classes.length})</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-9 px-3.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs transition-colors hover:bg-slate-100/70"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            {/* Advanced Filters Button */}
            <div className="relative">
              <button
                onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
                className={cn(
                  "h-9 px-4 rounded-full border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-95",
                  isAdvancedFiltersOpen || advancedFilterCount > 0
                    ? "bg-blue-50 border-blue-300 text-blue-700 font-extrabold"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
                <span>Filters</span>
                {advancedFilterCount > 0 && (
                  <span className="h-4.5 px-1.5 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center ml-0.5 shadow-2xs">
                    {advancedFilterCount}
                  </span>
                )}
              </button>

              {/* Advanced Filter Slide-Down Dropdown Panel */}
              <AnimatePresence>
                {isAdvancedFiltersOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsAdvancedFiltersOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-11 z-50 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 select-none text-left space-y-3.5"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          Advanced Filters
                        </span>
                        <button
                          onClick={() => setIsAdvancedFiltersOpen(false)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Gender Filter */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase block">Gender</label>
                        <select
                          value={genderFilter}
                          onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
                          className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="">All Genders</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Category Filter */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase block">Category / Quota</label>
                        <select
                          value={categoryFilter}
                          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                          className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="">All Categories</option>
                          <option value="General">General</option>
                          <option value="OBC">OBC</option>
                          <option value="SC/ST">SC/ST</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Sort Order */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase block">Sort By</label>
                        <select
                          value={`${sortField}_${sortOrder}`}
                          onChange={(e) => {
                            const [f, o] = e.target.value.split('_')
                            setSortField(f)
                            setSortOrder(o)
                            setPage(1)
                          }}
                          className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="createdAt_desc">Newest First</option>
                          <option value="createdAt_asc">Oldest First</option>
                          <option value="firstName_asc">Name (A to Z)</option>
                          <option value="firstName_desc">Name (Z to A)</option>
                          <option value="studentId_asc">Student ID (Ascending)</option>
                        </select>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Smart Clear All Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="h-8 px-3.5 text-xs font-extrabold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-full border border-rose-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-95 shadow-2xs"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>

        {/* Active Filter Chips Bar */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-1 pt-0.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Active Filters:</span>
            {activeChips.map(chip => (
              <span
                key={chip.id}
                className="h-7 px-3 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 shadow-2xs transition-colors hover:bg-slate-200/80"
              >
                <span>{chip.label}</span>
                <button
                  onClick={chip.onRemove}
                  className="h-4 w-4 rounded-full hover:bg-slate-300/80 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3. Main Data Card / Listing Section */}
      <div 
        style={{ borderRadius: '28px', border: '1px solid #ECECEC' }}
        className="bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex-1 flex flex-col justify-between relative overflow-hidden min-h-0"
      >
        <div className="overflow-y-auto overflow-x-auto flex-1 min-h-0 custom-scrollbar">
          <table className="w-full text-left min-w-[900px]">
            <thead className="sticky top-0 bg-slate-50 z-30 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest select-none shadow-sm">
              {selectedStudents.length > 0 ? (
                <tr className="h-14 bg-slate-900 text-white">
                  <th colSpan="9" className="p-0 bg-slate-900 text-white normal-case font-semibold">
                    <div className="h-14 px-8 flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black tracking-wider uppercase text-slate-400">Selected:</span>
                        <span className="text-sm font-black bg-slate-800 px-3 py-1 rounded-full text-white">{selectedStudents.length}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedStudents([])}
                          className="h-9 px-4 rounded-full border border-slate-700 hover:bg-slate-850 text-xs font-extrabold text-slate-300 cursor-pointer transition-colors"
                        >
                          Cancel Selection
                        </button>
                        {selectedStudents.length === total ? (
                          <button
                            disabled
                            className="h-9 px-4 rounded-full border border-slate-700 bg-slate-800 text-xs font-extrabold text-slate-400 cursor-not-allowed flex items-center justify-center gap-1.5"
                          >
                            All Students Selected
                          </button>
                        ) : (
                          <button
                            onClick={handleSelectAllMatching}
                            className="h-9 px-4 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-extrabold text-white border border-slate-700 cursor-pointer shadow-md transition-all flex items-center justify-center"
                          >
                            Select All Students
                          </button>
                        )}
                        <button
                          onClick={() => setIsPromoteModalOpen(true)}
                          className="h-9 px-4 rounded-full bg-indigo-650 hover:bg-indigo-700 active:scale-95 text-xs font-extrabold text-white shadow-premium-2 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Layers className="h-4 w-4 text-white" />
                          <span>Promote ({selectedStudents.length})</span>
                        </button>
                        <button
                          onClick={() => setIsBulkStatusModalOpen(true)}
                          className="h-9 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-xs font-extrabold text-white cursor-pointer shadow-md transition-colors flex items-center gap-1.5"
                        >
                          <span>Change Status</span>
                        </button>
                        <button
                          onClick={() => setIsBulkDeleteConfirmOpen(true)}
                          className="h-9 px-5 rounded-full bg-red-600 hover:bg-red-700 text-xs font-extrabold text-white cursor-pointer shadow-md transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Selected</span>
                        </button>
                      </div>
                    </div>
                  </th>
                </tr>
              ) : (
                <tr className="h-14">
                <th className="pl-6 w-[50px] bg-slate-50">
                  <input
                    type="checkbox"
                    checked={students.length > 0 && students.every(s => selectedStudents.some(sel => sel._id === s._id))}
                    onChange={handleSelectAllPage}
                    className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-4 w-[80px] hidden sm:table-cell bg-slate-50">Photo</th>
                <th className="px-4 w-[130px] bg-slate-50 text-left">
                  <TableHeadSort
                    title="Student ID"
                    sortField="studentId"
                    currentSortField={sortField}
                    sortOrder={sortOrder}
                    onClick={() => handleSort('studentId')}
                  />
                </th>
                <th className="px-4 w-[240px] bg-slate-50 text-left">
                  <TableHeadSort
                    title="Full Name"
                    sortField="firstName"
                    currentSortField={sortField}
                    sortOrder={sortOrder}
                    onClick={() => handleSort('firstName')}
                  />
                </th>
                <th className="px-4 w-[140px] relative bg-slate-50 text-left">
                  <TableHeaderFilter
                    type="class"
                    title={
                      <TableHeadSort
                        title="Class"
                        sortField="class"
                        currentSortField={sortField}
                        sortOrder={sortOrder}
                        onClick={() => handleSort('class')}
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
                <th className="px-4 w-[130px] bg-slate-50 text-left hidden lg:table-cell">
                  <TableHeadSort
                    title="Phone"
                    sortField="phone"
                    currentSortField={sortField}
                    sortOrder={sortOrder}
                    onClick={() => handleSort('phone')}
                  />
                </th>
                <th className="px-4 w-[160px] bg-slate-50 text-left hidden xl:table-cell">
                  <TableHeadSort
                    title="Admission Date"
                    sortField="admissionDate"
                    currentSortField={sortField}
                    sortOrder={sortOrder}
                    onClick={() => handleSort('admissionDate')}
                  />
                </th>
                <th className="px-4 w-[120px] relative bg-slate-50 text-left">
                  <TableHeaderFilter
                    type="status"
                    title={
                      <TableHeadSort
                        title="Status"
                        sortField="status"
                        currentSortField={sortField}
                        sortOrder={sortOrder}
                        onClick={() => handleSort('status')}
                      />
                    }
                    activeFilter={statusFilter}
                    isOpen={activeHeaderFilterDropdown === 'status'}
                    onToggle={() => toggleFilterDropdown('status')}
                    onClose={() => setActiveHeaderFilterDropdown(null)}
                    onSelect={(val) => { setStatusFilter(val); setPage(1); }}
                    options={['Active', 'Inactive', 'Graduated']}
                  />
                </th>
                <th className="pr-6 text-right w-[80px] bg-slate-50">Actions</th>
              </tr>
            )}
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700 bg-white">
              {loading ? (
                // Skeletons State
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="h-[78px] animate-pulse">
                    <td className="pl-6 py-4.5">
                      <div className="h-4 w-4 bg-slate-100 rounded" />
                    </td>
                    <td className="px-4 py-4.5 hidden sm:table-cell">
                      <div className="h-12 w-12 rounded-full bg-slate-100" />
                    </td>
                    <td className="px-4 py-4.5"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-4.5"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-4.5"><div className="h-3 w-16 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-4.5 hidden lg:table-cell"><div className="h-3 w-20 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-4.5 hidden xl:table-cell"><div className="h-3 w-16 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-4.5"><div className="h-5 w-14 bg-slate-100 rounded-full" /></td>
                    <td className="pr-6 py-4.5 text-right w-[80px]"><div className="h-8 w-8 bg-slate-100 rounded-full ml-auto" /></td>
                  </tr>
                ))
              ) : error ? (
                // Error State
                <tr>
                  <td colSpan="9" className="text-center py-20 text-red-500 font-bold">
                    <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-2" />
                    <span>{error}</span>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan="9" className="text-center py-24 text-slate-400 font-bold">
                    <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <span className="text-[14px] text-slate-500 font-extrabold block">No students found</span>
                    <span className="text-xs text-slate-400 block mt-1 font-semibold">Try modifying your search or filter values</span>
                  </td>
                </tr>
              ) : (
                // Standard Rows rendering
                students.map((student) => {
                  const initial = student.firstName ? student.firstName[0].toUpperCase() : 'S'
                  return (
                    <motion.tr 
                      key={student._id}
                      whileHover={{ backgroundColor: '#F8FAFC' }}
                      transition={{ duration: 0.15 }}
                      className="group transition-colors h-[78px] hover:bg-[#F8FAFC]"
                    >
                      {/* Checkbox Column */}
                      <td className="pl-6 py-3">
                        <input
                          type="checkbox"
                          checked={selectedStudents.some(sel => sel._id === student._id)}
                          onChange={() => handleSelectStudent(student)}
                          className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Photo Column */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {student.photo?.secure_url ? (
                          <img 
                            src={student.photo.secure_url} 
                            alt={student.firstName} 
                            className="h-12 w-12 rounded-full object-cover shadow-sm border border-slate-200/50" 
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm select-none">
                            {initial}
                          </div>
                        )}
                      </td>

                      {/* Student ID */}
                      <td className="px-4 py-3 text-slate-800 font-bold">
                        {student.studentId}
                      </td>

                      {/* Name / Email */}
                      <td className="px-4 py-3 text-left">
                        <span className="text-[14px] font-bold text-slate-800 block">
                          {student.firstName} {student.middleName ? student.middleName + ' ' : ''}{student.lastName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">{student.email}</span>
                      </td>

                      {/* Class */}
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-100/50">
                          {student.class}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3 text-slate-400 font-bold hidden lg:table-cell">
                        {student.phone}
                      </td>

                      {/* Admission Date */}
                      <td className="px-4 py-3 text-slate-500 font-medium hidden xl:table-cell">
                        {student.admissionDate ? formatDateToDDMMYYYY(student.admissionDate) : 'N/A'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black border select-none",
                          student.status === 'Active' && "bg-emerald-50 text-emerald-700 border-emerald-100",
                          student.status === 'Inactive' && "bg-red-50 text-red-700 border-red-100",
                          student.status === 'Graduated' && "bg-blue-50 text-blue-700 border-blue-100"
                        )}>
                          {student.status}
                        </span>
                      </td>

                      {/* Action triggers */}
                      <td className="pr-6 py-3 text-right">
                        <div className="flex justify-end relative">
                           <button
                            onClick={(e) => handleDropdownClick(e, student._id)}
                            className="h-8 w-8 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 cursor-pointer shadow-sm transition-colors select-none"
                            title="Actions"
                          >
                            <MoreVertical className="h-4.5 w-4.5" />
                          </button>
                          
                          {openRowMenuId === student._id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setOpenRowMenuId(null)} 
                              />
                              <div className={cn(
                                "absolute right-0 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1 text-left select-none",
                                openDropdownDirection === 'up' ? "bottom-full mb-2 z-[60]" : "top-full mt-2 z-[60]"
                              )}>
                                <button
                                  onClick={() => {
                                    setOpenRowMenuId(null);
                                    handleViewProfile(student);
                                  }}
                                  className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span>View Profile</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setOpenRowMenuId(null);
                                    handleOpenEdit(student);
                                  }}
                                  className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit3 className="h-4 w-4" />
                                  <span>Edit Student</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setOpenRowMenuId(null);
                                    handleDownloadIDCard(student);
                                  }}
                                  className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Download className="h-4 w-4" />
                                  <span>Download ID Card</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setOpenRowMenuId(null);
                                    handleOpenActivationInfo(student);
                                  }}
                                  className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <KeyRound className="h-4 w-4" />
                                  <span>Activation Info</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setOpenRowMenuId(null);
                                    handlePrintProfile(student);
                                  }}
                                  className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Printer className="h-4 w-4" />
                                  <span>Print Profile</span>
                                </button>
                                <div className="border-t border-slate-100 my-1" />
                                <button
                                  onClick={() => {
                                    setOpenRowMenuId(null);
                                    setCurrentStudent(student);
                                    setIsDeleteConfirmOpen(true);
                                  }}
                                  className="w-full px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>Delete Student</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Modern Pagination Controls */}
        {!loading && !error && students.length > 0 && (() => {
          const startIndex = total === 0 ? 0 : (page - 1) * limit + 1;
          const endIndex = Math.min(page * limit, total);
          return (
            <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-4 select-none">
              <span className="text-[11px] text-slate-400 font-black">
                Showing {startIndex}–{endIndex} of {total} students
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
                disabled={page === pages}
                onClick={() => setPage(prev => Math.min(prev + 1, pages))}
                className="h-8 px-3 rounded-full border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          )
        })()}
      </div>

      {/* 5. MODAL LAYER overlays */}
      <AnimatePresence>
        
        {/* ADD / EDIT STUDENT MODAL */}
        {isAddEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={spring}
              style={{ borderRadius: '28px', border: '1px solid #ECECEC' }}
              className="bg-white p-7 w-full max-w-4xl shadow-premium-3 relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => { if (!submitting) setIsAddEditModalOpen(false); }}
                disabled={submitting}
                className="absolute right-5 top-5 h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1">
                {currentStudent ? 'Edit Student Profile' : 'Register New Student'}
              </h3>
              <p className="text-[11px] font-bold text-slate-400 mb-6">
                Fill in the academic, personal, contact, and upload info to document the student file
              </p>

              {formError && (
                <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Uploading progress notification for saving process */}
              {submitting && uploadProgressMsg && (
                <div className="p-3 mb-4 rounded-xl bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-600 flex items-center gap-2">
                  <RefreshCw className="h-4.5 w-4.5 animate-spin shrink-0" />
                  <span>{uploadProgressMsg}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-8 text-left">
                <fieldset disabled={submitting} className="contents">
                
                {/* SECTION 1: PERSONAL DETAILS */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-blue-600 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <User className="h-4.5 w-4.5" />
                    <span>Personal Details</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* First Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">First Name *</label>
                      <input
                        type="text"
                        required
                        value={formFields.firstName}
                        onChange={(e) => setFormFields({ ...formFields, firstName: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                      />
                      {validationErrors.firstName && (
                        <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.firstName}</p>
                      )}
                    </div>

                    {/* Middle Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Middle Name</label>
                      <input
                        type="text"
                        value={formFields.middleName}
                        onChange={(e) => setFormFields({ ...formFields, middleName: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                      />
                      {validationErrors.middleName && (
                        <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.middleName}</p>
                      )}
                    </div>

                    {/* Last Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={formFields.lastName}
                        onChange={(e) => setFormFields({ ...formFields, lastName: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                      />
                      {validationErrors.lastName && (
                        <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.lastName}</p>
                      )}
                    </div>

                    {/* Gender */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Gender</label>
                      <select
                        value={formFields.gender}
                        onChange={(e) => setFormFields({ ...formFields, gender: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-600 bg-white focus:border-blue-500 outline-none cursor-pointer"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {validationErrors.gender && (
                        <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.gender}</p>
                      )}
                    </div>

                    {/* DOB */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Date of Birth *</label>
                      <input
                        type="text"
                        required
                        placeholder="DD/MM/YYYY"
                        value={formFields.dateOfBirth}
                        onChange={(e) => setFormFields({ ...formFields, dateOfBirth: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                      />
                      {validationErrors.dateOfBirth && (
                        <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.dateOfBirth}</p>
                      )}
                    </div>

                    {/* Blood Group */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Blood Group</label>
                      <input
                        type="text"
                        placeholder="e.g. A+, O-"
                        value={formFields.bloodGroup}
                        onChange={(e) => setFormFields({ ...formFields, bloodGroup: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                      />
                      {validationErrors.bloodGroup && (
                        <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.bloodGroup}</p>
                      )}
                    </div>

                    {/* Category */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Category</label>
                      <select
                        value={formFields.category}
                        onChange={(e) => setFormFields({ ...formFields, category: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-600 bg-white focus:border-blue-500 outline-none cursor-pointer"
                      >
                        <option value="General">General</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="EWS">EWS</option>
                        <option value="Other">Other</option>
                      </select>
                      {validationErrors.category && (
                        <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.category}</p>
                      )}
                    </div>

                    {/* Religion */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Religion</label>
                      <input
                        type="text"
                        placeholder="e.g. Hinduism"
                        value={formFields.religion}
                        onChange={(e) => setFormFields({ ...formFields, religion: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                      />
                      {validationErrors.religion && (
                        <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.religion}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION 2: ACADEMIC DETAILS */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-blue-600 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <BookOpen className="h-4.5 w-4.5" />
                    <span>Academic Details</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Student ID */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Student ID</label>
                      <input
                        type="text"
                        disabled
                        value={currentStudent ? formFields.studentId || currentStudent.studentId : 'CK2026xxxx (Auto-generated)'}
                        className="w-full h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-400"
                      />
                    </div>

                    {/* Admission Date */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Admission Date</label>
                      <input
                        type="text"
                        placeholder="DD/MM/YYYY"
                        value={formFields.admissionDate}
                        onChange={(e) => setFormFields({ ...formFields, admissionDate: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                      />
                      {validationErrors.admissionDate && (
                        <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.admissionDate}</p>
                      )}
                    </div>

                    {/* Class */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Class/Grade *</label>
                      <select
                        required
                        value={formFields.class}
                        onChange={(e) => setFormFields({ ...formFields, class: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-600 bg-white focus:border-blue-500 outline-none cursor-pointer"
                      >
                        <option value="">Select Class</option>
                        {classes.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      {validationErrors.class && (
                        <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.class}</p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Status</label>
                      <select
                        value={formFields.status}
                        onChange={(e) => setFormFields({ ...formFields, status: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-600 bg-white focus:border-blue-500 outline-none cursor-pointer"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Graduated">Graduated</option>
                      </select>
                      {validationErrors.status && (
                        <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.status}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION 3: CONTACT DETAILS */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-blue-600 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <Info className="h-4.5 w-4.5" />
                    <span>Contact Details</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Student Phone */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Student Phone (10 Digits) *</label>
                      <input
                        type="text"
                        required
                        value={formFields.phone}
                        onChange={(e) => setFormFields({ ...formFields, phone: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                      />
                      {validationErrors.phone && (
                        <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.phone}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formFields.email}
                        onChange={(e) => setFormFields({ ...formFields, email: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                      />
                      {validationErrors.email && (
                        <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.email}</p>
                      )}
                    </div>

                    {/* Parent Phone */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Parent Phone</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={formFields.parentPhone}
                          onChange={(e) => setFormFields({ ...formFields, parentPhone: e.target.value })}
                          className="flex-1 h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                          placeholder="Primary parent phone"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormFields({
                              ...formFields,
                              additionalParentPhones: [...(formFields.additionalParentPhones || []), '']
                            })
                          }}
                          className="h-10 w-10 shrink-0 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition font-black text-lg flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      {validationErrors.parentPhone && (
                        <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.parentPhone}</p>
                      )}

                      {/* Additional Parent Phones */}
                      {formFields.additionalParentPhones && formFields.additionalParentPhones.map((phone, idx) => (
                        <div key={idx} className="flex gap-2 items-center mt-2">
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => {
                              const updated = [...formFields.additionalParentPhones]
                              updated[idx] = e.target.value
                              setFormFields({ ...formFields, additionalParentPhones: updated })
                            }}
                            className="flex-1 h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                            placeholder={`Additional phone ${idx + 2}`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...formFields.additionalParentPhones]
                              updated.splice(idx, 1)
                              setFormFields({ ...formFields, additionalParentPhones: updated })
                            }}
                            className="h-10 w-10 shrink-0 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition font-black text-lg flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Full Address</label>
                      <input
                        type="text"
                        value={formFields.address}
                        onChange={(e) => setFormFields({ ...formFields, address: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                      />
                      {validationErrors.address && (
                        <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.address}</p>
                      )}
                    </div>

                    {/* City */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">City</label>
                      <input
                        type="text"
                        value={formFields.city}
                        onChange={(e) => setFormFields({ ...formFields, city: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                      />
                      {validationErrors.city && (
                        <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.city}</p>
                      )}
                    </div>

                    {/* Pincode */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Pincode (6 Digits)</label>
                      <input
                        type="text"
                        value={formFields.pincode}
                        onChange={(e) => setFormFields({ ...formFields, pincode: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                      />
                      {validationErrors.pincode && (
                        <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.pincode}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION 4: PARENT DETAILS */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-blue-600 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <Briefcase className="h-4.5 w-4.5" />
                    <span>Parent Details</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Father Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Father's Name</label>
                      <input
                        type="text"
                        value={formFields.fatherName}
                        onChange={(e) => setFormFields({ ...formFields, fatherName: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                      />
                    </div>

                    {/* Mother Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Mother's Name</label>
                      <input
                        type="text"
                        value={formFields.motherName}
                        onChange={(e) => setFormFields({ ...formFields, motherName: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                      />
                    </div>

                    {/* Occupation */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Occupation</label>
                      <input
                        type="text"
                        value={formFields.occupation}
                        onChange={(e) => setFormFields({ ...formFields, occupation: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 5: EMERGENCY CONTACT DETAILS */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-blue-600 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <Phone className="h-4.5 w-4.5" />
                    <span>Emergency Contact Details</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Emergency Contact Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Emergency Contact Name</label>
                      <input
                        type="text"
                        value={formFields.emergencyContact?.name || ''}
                        onChange={(e) => setFormFields({
                          ...formFields,
                          emergencyContact: { ...(formFields.emergencyContact || {}), name: e.target.value }
                        })}
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                        placeholder="e.g. Richard Doe"
                      />
                    </div>

                    {/* Emergency Contact Relationship */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Emergency Contact Relationship</label>
                      <input
                        type="text"
                        value={formFields.emergencyContact?.relation || ''}
                        onChange={(e) => setFormFields({
                          ...formFields,
                          emergencyContact: { ...(formFields.emergencyContact || {}), relation: e.target.value }
                        })}
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                        placeholder="e.g. Uncle, Neighbor"
                      />
                    </div>

                    {/* Emergency Contact Phone */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Emergency Contact Phone</label>
                      <input
                        type="text"
                        value={formFields.emergencyContact?.phone || ''}
                        onChange={(e) => setFormFields({
                          ...formFields,
                          emergencyContact: { ...(formFields.emergencyContact || {}), phone: e.target.value }
                        })}
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                        placeholder="10-digit phone number"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 6: PHOTO UPLOAD */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-blue-600 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <Camera className="h-4.5 w-4.5" />
                    <span>Profile Photo</span>
                  </h4>
                  
                  <div className="flex flex-col sm:flex-row gap-6 items-center">
                    {/* Drag and drop panel */}
                    <div className={cn(
                      "flex-1 w-full border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-6 text-center transition-colors relative cursor-pointer",
                      submitting && "pointer-events-none opacity-50"
                    )}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoDrop}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Camera className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <span className="text-xs font-bold text-slate-500 block">
                        {formPhotoFile ? formPhotoFile.name : 'Drag & drop profile picture or click to select'}
                      </span>
                    </div>

                    {/* Preview box */}
                    {formPhotoPreview && (
                      <div className="h-24 w-24 rounded-2xl overflow-hidden shadow-sm border border-slate-200 relative shrink-0">
                        <img src={formPhotoPreview} alt="Preview" className="h-full w-full object-cover" />
                        {formPhotoPreview === currentStudent?.photo?.secure_url ? (
                          <button
                            type="button"
                            onClick={handleDeletePhoto}
                            className="absolute top-1 right-1 h-5 w-5 bg-red-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow hover:bg-red-700 transition-colors"
                            title="Delete photo permanently"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { setFormPhotoFile(null); setFormPhotoPreview(null); }}
                            className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center cursor-pointer shadow hover:bg-red-600 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddEditModalOpen(false)}
                    className="h-10 px-5 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-500 cursor-pointer transition-colors active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-xs font-extrabold text-white cursor-pointer transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                  >
                    {submitting && <RefreshCw className="h-4.5 w-4.5 animate-spin" />}
                    <span>{submitting ? (currentStudent ? 'Saving...' : 'Creating...') : (currentStudent ? 'Save Changes' : 'Register Student')}</span>
                  </button>
                </div>
                </fieldset>
              </form>
            </motion.div>
          </div>
        )}

        {/* VIEW STUDENT DETAILS MODAL */}
        {isViewModalOpen && currentStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={spring}
              style={{ borderRadius: '28px', border: '1px solid #ECECEC' }}
              className="bg-white p-7 w-full max-w-2xl shadow-premium-3 relative max-h-[90vh] overflow-y-auto text-left custom-scrollbar"
            >
              <div className="absolute right-14 top-5 flex items-center gap-2">
                <button
                  onClick={() => handlePrintProfile(currentStudent)}
                  className="h-8 px-3 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-700 cursor-pointer shadow-sm transition-colors text-xs font-bold gap-1.5"
                  title="Print Profile"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print</span>
                </button>
              </div>

              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="absolute right-5 top-5 h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col sm:flex-row gap-6 items-start pb-4 border-b border-slate-100">
                {currentStudent.photo?.secure_url ? (
                  <img 
                    src={currentStudent.photo.secure_url} 
                    alt={currentStudent.firstName} 
                    className="h-20 w-20 rounded-2xl object-cover shadow-sm border border-slate-200/50 shrink-0" 
                  />
                ) : (
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xl shadow-sm select-none shrink-0">
                    {currentStudent.firstName ? currentStudent.firstName[0].toUpperCase() : 'S'}
                  </div>
                )}
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-100/50">
                      ID: {currentStudent.studentId}
                    </span>
                    <span className={cn(
                      "inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black border",
                      currentStudent.status === 'Active' && "bg-emerald-50 text-emerald-700 border-emerald-100",
                      currentStudent.status === 'Inactive' && "bg-red-50 text-red-700 border-red-100",
                      currentStudent.status === 'Graduated' && "bg-blue-50 text-blue-700 border-blue-100"
                    )}>
                      {currentStudent.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none mt-1">
                    {currentStudent.firstName} {currentStudent.middleName ? currentStudent.middleName + ' ' : ''}{currentStudent.lastName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-semibold mt-1">
                    <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {currentStudent.email}</span>
                    <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {currentStudent.phone}</span>
                  </div>
                  {/* Completeness Indicator */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="text-[10px] font-extrabold text-slate-500">Profile Complete: {calculateCompleteness(currentStudent)}%</span>
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${calculateCompleteness(currentStudent)}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-slate-100 mt-4 overflow-x-auto select-none shrink-0 scrollbar-none gap-2">
                {[
                  { id: 'info', label: 'Details' },
                  { id: 'portal', label: 'Portal Account' },
                  { id: 'docs', label: 'Documents' },
                  { id: 'notes', label: 'Notes' },
                  { id: 'history', label: 'Activity Logs' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveProfileTab(tab.id)}
                    className={cn(
                      "pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap",
                      activeProfileTab === tab.id 
                        ? "border-blue-600 text-blue-600 font-extrabold" 
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: DETAILS */}
              {activeProfileTab === 'info' && (
                <div className="space-y-6 py-5 max-h-[50vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Academic Record</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Class/Grade:</span><span className="font-extrabold text-slate-700">{currentStudent.class}</span></div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Admission Date:</span><span className="font-extrabold text-slate-700">{currentStudent.admissionDate ? formatDateToDDMMYYYY(currentStudent.admissionDate) : 'N/A'}</span></div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Personal Details</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Gender:</span><span className="font-extrabold text-slate-700">{currentStudent.gender}</span></div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Date of Birth:</span><span className="font-extrabold text-slate-700">{currentStudent.dateOfBirth ? formatDateToDDMMYYYY(currentStudent.dateOfBirth) : 'N/A'}</span></div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Blood Group:</span><span className="font-extrabold text-slate-700">{currentStudent.bloodGroup || 'N/A'}</span></div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Category:</span><span className="font-extrabold text-slate-700">{currentStudent.category || 'N/A'}</span></div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Religion:</span><span className="font-extrabold text-slate-700">{currentStudent.religion || 'N/A'}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Parent details</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Father's Name:</span><span className="font-extrabold text-slate-700">{currentStudent.fatherName || 'N/A'}</span></div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Mother's Name:</span><span className="font-extrabold text-slate-700">{currentStudent.motherName || 'N/A'}</span></div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Occupation:</span><span className="font-extrabold text-slate-700">{currentStudent.occupation || 'N/A'}</span></div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Emergency Contact & Phone</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Parent Phone:</span><span className="font-extrabold text-slate-700">{currentStudent.parentPhone || 'N/A'}</span></div>
                        {currentStudent.additionalParentPhones && currentStudent.additionalParentPhones.map((ph, index) => (
                          <div key={index} className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-400 font-semibold">Parent Phone {index + 2}:</span>
                            <span className="font-extrabold text-slate-700">{ph}</span>
                          </div>
                        ))}
                        <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Emergency Name:</span><span className="font-extrabold text-slate-700">{currentStudent.emergencyContact?.name || 'N/A'}</span></div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Emergency Phone:</span><span className="font-extrabold text-slate-700">{currentStudent.emergencyContact?.phone || 'N/A'}</span></div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Relation:</span><span className="font-extrabold text-slate-700">{currentStudent.emergencyContact?.relation || 'N/A'}</span></div>
                      </div>
                    </div>
                  </div>

                  {currentStudent.address && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Address Info</h4>
                      <div className="text-xs text-slate-600 font-semibold flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/50">
                        <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{currentStudent.address}, {currentStudent.city}, {currentStudent.state}, {currentStudent.country} - {currentStudent.pincode}</span>
                      </div>
                    </div>
                  )}

                  {/* Student Leaving / Transfer Info */}
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Leaving / Transfer Information</h4>
                    {currentStudent.leavingInfo && currentStudent.leavingInfo.date ? (
                      <div className="bg-red-50/50 border border-red-100 p-3.5 rounded-2xl text-xs space-y-1.5 text-left">
                        <p className="font-extrabold text-red-700">Student Has Left the Institute</p>
                        <p><span className="font-bold text-slate-500">Leaving Date:</span> <span className="font-extrabold text-slate-700">{formatDateToDDMMYYYY(currentStudent.leavingInfo.date)}</span></p>
                        <p><span className="font-bold text-slate-500">Reason:</span> <span className="font-semibold text-slate-700">{currentStudent.leavingInfo.reason || 'N/A'}</span></p>
                        <p><span className="font-bold text-slate-500">Notes:</span> <span className="font-semibold text-slate-700">{currentStudent.leavingInfo.notes || 'N/A'}</span></p>
                      </div>
                    ) : (
                      <form onSubmit={handleLeavingSubmit} className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-3">
                        <p className="text-[10px] font-extrabold text-slate-500">Record student departure/transfer:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Leaving Date (DD/MM/YYYY)"
                            required
                            value={leavingDate}
                            onChange={(e) => setLeavingDate(e.target.value)}
                            className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Reason (e.g. Relocated, Course Complete)"
                            value={leavingReason}
                            onChange={(e) => setLeavingReason(e.target.value)}
                            className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none bg-white"
                          />
                        </div>
                        <textarea
                          placeholder="Leaving/Transfer Notes"
                          value={leavingNotes}
                          onChange={(e) => setLeavingNotes(e.target.value)}
                          className="w-full p-3 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none h-16 bg-white resize-none"
                        />
                        <button
                          type="submit"
                          disabled={recordingLeaving}
                          className="h-9 px-4 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-all disabled:opacity-50"
                        >
                          {recordingLeaving ? 'Recording...' : 'Record Departure / Mark Inactive'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: PORTAL ACCOUNT */}
              {activeProfileTab === 'portal' && (
                <div className="space-y-6 py-5 max-h-[50vh] overflow-y-auto pr-1 text-xs">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Portal Access Information</h4>
                    
                    <div className="space-y-2.5">
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-400 font-semibold">Registered Email:</span>
                        <span className="font-extrabold text-slate-700">{currentStudent.portalAccount?.email || currentStudent.email}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-400 font-semibold">Activation Status:</span>
                        <span className={cn(
                          "font-black px-2.5 py-0.5 rounded-full border text-[10px]",
                          currentStudent.portalAccount 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        )}>
                          {currentStudent.portalAccount ? 'Activated' : 'Not Activated'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-400 font-semibold">Account Status:</span>
                        <span className={cn(
                          "font-black px-2.5 py-0.5 rounded-full border text-[10px]",
                          currentStudent.portalAccount?.isActive 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                            : "bg-red-50 text-red-700 border-red-100"
                        )}>
                          {currentStudent.portalAccount ? (currentStudent.portalAccount.isActive ? 'Active' : 'Disabled') : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-400 font-semibold">Last Login:</span>
                        <span className="font-extrabold text-slate-700">
                          {currentStudent.portalAccount?.lastLogin 
                            ? new Date(currentStudent.portalAccount.lastLogin).toLocaleString() 
                            : 'Never'}
                        </span>
                      </div>
                    </div>

                    {currentStudent.portalAccount ? (
                      <div className="pt-4 border-t border-slate-100">
                        <button
                          onClick={handleTogglePortalAccess}
                          className={cn(
                            "h-10 px-5 rounded-xl text-xs font-extrabold text-white cursor-pointer shadow-md transition-all active:scale-95",
                            currentStudent.portalAccount.isActive 
                              ? "bg-red-600 hover:bg-red-700" 
                              : "bg-emerald-600 hover:bg-emerald-700"
                          )}
                        >
                          {currentStudent.portalAccount.isActive ? 'Disable Portal Access' : 'Enable Portal Access'}
                        </button>
                      </div>
                    ) : (
                      <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl text-amber-800 flex items-start gap-2.5 mt-2">
                        <Info className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-black text-amber-900 leading-tight">Activation Pending</p>
                          <p className="text-[11px] mt-1 font-semibold">
                            This student has not activated their portal account. They can activate it at `/auth/activate` using their registered email and student ID.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: DOCUMENTS */}
              {activeProfileTab === 'docs' && (
                <div className="space-y-6 py-5 max-h-[50vh] overflow-y-auto pr-1 text-xs">
                  {/* Document upload form */}
                  <form onSubmit={handleDocumentSubmit} className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Upload Student Profile Document</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400">Document Name</label>
                        <input
                          type="text"
                          required
                          value={docName}
                          onChange={(e) => setDocName(e.target.value)}
                          className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none bg-white"
                          placeholder="e.g. Identity Document"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400">Document Type</label>
                        <select
                          value={docType}
                          onChange={(e) => setDocType(e.target.value)}
                          className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none bg-white cursor-pointer"
                        >
                          <option value="Identity Document">Identity Document</option>
                          <option value="Previous Academic Record">Previous Academic Record</option>
                          <option value="Admission Document">Admission Document</option>
                          <option value="Certificate">Certificate</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 items-center">
                      <input
                        type="file"
                        required
                        onChange={(e) => setDocFile(e.target.files[0])}
                        className="text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                      <button
                        type="submit"
                        disabled={uploadingDoc}
                        className="h-9 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-extrabold cursor-pointer transition-all disabled:opacity-50 ml-auto"
                      >
                        {uploadingDoc ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  </form>

                  {/* Documents list */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Uploaded Documents</h4>
                    {(!currentStudent.documents || currentStudent.documents.length === 0) ? (
                      <p className="text-slate-400 italic">No documents uploaded for this student.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {currentStudent.documents.map((doc, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 border border-slate-150 rounded-2xl bg-white shadow-sm">
                            <div>
                              <p className="font-extrabold text-slate-800 leading-tight">{doc.name}</p>
                              <p className="text-[10px] font-semibold text-slate-400 mt-1">
                                {doc.type} &bull; Uploaded on {new Date(doc.uploadDate).toLocaleDateString()} &bull; {(doc.fileSize / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="h-7 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                              >
                                View
                              </a>
                              <button
                                onClick={() => handleDeleteDocument(doc._id)}
                                className="h-7 w-7 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer shadow-sm"
                                title="Delete Document"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: INTERNAL NOTES */}
              {activeProfileTab === 'notes' && (
                <div className="space-y-6 py-5 max-h-[50vh] overflow-y-auto pr-1 text-xs">
                  {/* Add internal note form */}
                  <form onSubmit={handleNoteSubmit} className="space-y-3">
                    <textarea
                      required
                      placeholder="Add an internal note visible only to staff..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none h-20 resize-none bg-slate-50/50"
                    />
                    <button
                      type="submit"
                      disabled={addingNote}
                      className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-extrabold cursor-pointer transition-all disabled:opacity-50"
                    >
                      {addingNote ? 'Adding...' : 'Add Internal Note'}
                    </button>
                  </form>

                  {/* Notes list */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Internal Notes</h4>
                    {(!currentStudent.internalNotes || currentStudent.internalNotes.length === 0) ? (
                      <p className="text-slate-400 italic">No notes added yet.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {currentStudent.internalNotes.map((note, idx) => (
                          <div key={idx} className="p-3 border border-slate-150 rounded-2xl bg-white shadow-sm relative">
                            <p className="text-slate-700 font-semibold text-[11px] leading-relaxed pr-6">{note.text}</p>
                            <div className="flex justify-between items-center mt-2.5 text-[9px] text-slate-400 font-bold">
                              <span>By: {note.createdBy} &bull; {new Date(note.createdAt).toLocaleString()}</span>
                              <button
                                onClick={() => handleDeleteInternalNote(note._id)}
                                className="text-red-500 hover:text-red-600 cursor-pointer font-black"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: HISTORY & LOGS */}
              {activeProfileTab === 'history' && (
                <div className="space-y-6 py-5 max-h-[50vh] overflow-y-auto pr-1 text-xs">
                  {/* Class / Promotion History */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Class & Promotion History</h4>
                    {(!currentStudent.classHistory || currentStudent.classHistory.length === 0) ? (
                      <p className="text-slate-400 italic">No class history available.</p>
                    ) : (
                      <div className="border border-slate-150 rounded-2xl bg-white overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase border-b border-slate-150 tracking-wider">
                              <th className="px-4 py-2">Old Class</th>
                              <th className="px-4 py-2">New Class</th>
                              <th className="px-4 py-2">Date</th>
                              <th className="px-4 py-2">Changed By</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentStudent.classHistory.map((hist, idx) => (
                              <tr key={idx} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                                <td className="px-4 py-2 font-semibold text-slate-600">{hist.oldClass}</td>
                                <td className="px-4 py-2 font-extrabold text-blue-600">{hist.newClass}</td>
                                <td className="px-4 py-2 text-slate-400 font-bold">{new Date(hist.promotionDate).toLocaleDateString()}</td>
                                <td className="px-4 py-2 text-slate-500 font-bold">{hist.promotedBy}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Administrative Activity Logs */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Activity Logs</h4>
                    {(!currentStudent.history || currentStudent.history.length === 0) ? (
                      <p className="text-slate-400 italic">No log entries available.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {currentStudent.history.slice().reverse().map((log, idx) => (
                          <div key={idx} className="p-3 border border-slate-150 rounded-2xl bg-white shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-slate-800">{log.action}</span>
                              <span className="text-[9px] text-slate-400 font-bold">{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-500 font-semibold mt-1 text-[11px]">{log.details}</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-1.5">Performed by: {log.performedBy}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* UPLOAD STUDENT PHOTO MODAL */}
        {/* DELETE CONFIRM MODAL */}
        {isDeleteConfirmOpen && currentStudent && (
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
                  Delete Student Profile
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 font-semibold">
                  Are you sure you want to delete this student? This action cannot be undone.
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
                  onClick={handleDeleteStudent}
                  className="flex-1 h-10 rounded-full bg-red-600 hover:bg-red-700 text-xs font-extrabold text-white cursor-pointer shadow-md transition-all active:scale-95"
                >
                  Delete Student
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
                  Delete {selectedStudents.length} Students?
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
        {/* BULK STATUS UPDATE MODAL */}
        {isBulkStatusModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={spring}
              style={{ borderRadius: '24px', border: '1px solid #ECECEC' }}
              className="bg-white p-6 w-full max-w-sm shadow-premium-3 relative text-center space-y-4"
            >
              <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto shadow-sm">
                <Layers className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 tracking-tight leading-none mb-1">
                  Change Status for {selectedStudents.length} Students
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 font-semibold">
                  Select the new status for all selected student profiles:
                </p>
              </div>

              <div className="text-left space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Select Status</label>
                <select
                  value={bulkTargetStatus}
                  onChange={(e) => setBulkTargetStatus(e.target.value)}
                  className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none bg-white cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Graduated">Graduated</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsBulkStatusModalOpen(false)}
                  disabled={bulkStatusUpdating}
                  className="flex-1 h-10 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-500 cursor-pointer transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkStatusChangeSubmit}
                  disabled={bulkStatusUpdating}
                  className="flex-1 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-xs font-extrabold text-white cursor-pointer shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {bulkStatusUpdating && <RefreshCw className="h-4.5 w-4.5 animate-spin" />}
                  <span>Apply Change</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* PROMOTE STUDENTS MODAL */}
        {isPromoteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={spring}
              style={{ borderRadius: '28px', border: '1px solid #ECECEC' }}
              className="bg-white p-7 w-full max-w-md shadow-premium-3 relative text-left flex flex-col gap-6"
            >
              <button 
                onClick={() => setIsPromoteModalOpen(false)}
                className="absolute right-5 top-5 h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1">
                  Promote Selected Students
                </h3>
                <p className="text-[11px] font-bold text-slate-400">
                  Bulk promote {selectedStudents.length} selected students to their next grades
                </p>
              </div>

              {selectedStudents.some(s => s.class === 'Class 12 Science' || s.class === 'Class 12 Commerce') ? (
                /* Class 12 Blocked State */
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-center space-y-2">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
                    <span className="text-xs font-black text-red-700 block">
                      These students have already completed the highest class and cannot be promoted.
                    </span>
                  </div>
                </div>
              ) : (
                /* Standard Promotion Flow */
                <div className="space-y-4">
                  {selectedStudents.some(s => s.class === 'Class 10') && (
                    <div className="space-y-1.5 animate-in fade-in duration-200">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Choose Stream (For Class 10 Students)</label>
                      <select
                        value={selectedStream}
                        onChange={(e) => setSelectedStream(e.target.value)}
                        className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-600 bg-white cursor-pointer outline-none focus:border-blue-500"
                      >
                        <option value="Class 11 Science">Class 11 Science</option>
                        <option value="Class 11 Commerce">Class 11 Commerce</option>
                      </select>
                    </div>
                  )}

                  {/* Confirmation Warning Block */}
                  <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl text-center">
                    <span className="text-xs font-black text-slate-700 block">
                      You are about to promote {selectedStudents.length} {selectedStudents.length === 1 ? 'student' : 'students'}.
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 block mt-1">
                      This action cannot be undone.
                    </span>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPromoteModalOpen(false)}
                  className="h-10 px-5 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-500 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePromoteStudents}
                  disabled={promoting || selectedStudents.length === 0 || selectedStudents.some(s => s.class === 'Class 12 Science' || s.class === 'Class 12 Commerce')}
                  className="h-10 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-xs font-extrabold text-white cursor-pointer shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {promoting && <RefreshCw className="h-4.5 w-4.5 animate-spin" />}
                  <span>Promote Students</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* VIEW ACTIVATION INFO MODAL */}
        {isActivationInfoOpen && currentStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ borderRadius: '24px' }}
              className="bg-white p-6 w-full max-w-md shadow-premium-3 relative text-left"
            >
              <button 
                onClick={() => setIsActivationInfoOpen(false)}
                className="absolute right-5 top-5 h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-2xl bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Account Activation Info</h3>
                  <p className="text-xs font-semibold text-slate-400">Institutional student onboarding status</p>
                </div>
              </div>

              {loadingActivation ? (
                <div className="py-10 text-center">
                  <RefreshCw className="h-6 w-6 text-brand-blue-500 animate-spin mx-auto mb-2" />
                  <span className="text-xs font-semibold text-slate-400">Fetching activation details...</span>
                </div>
              ) : (
                <div className="space-y-4 py-2">
                  <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2.5 text-xs font-bold text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Student ID</span>
                      <span className="font-mono text-slate-900">{currentStudent.studentId}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Registered Email</span>
                      <span className="text-slate-800">{activationData?.email || activationData?.maskedEmail || 'N/A'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Account Status</span>
                      <span className={cn(
                        "inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black border",
                        activationData?.status === 'Activated' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                      )}>
                        {activationData?.status || 'Not Activated'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-[11px] font-semibold text-blue-800 leading-relaxed">
                    {activationData?.status === 'Activated' ? (
                      <span>This student account is active. The student can log in using their email and password.</span>
                    ) : (
                      <span>To activate, the student should visit <strong>/auth/activate</strong>, select Student, and enter Student ID <strong>{currentStudent.studentId}</strong>. Verification code will be sent to their registered email.</span>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setIsActivationInfoOpen(false)}
                  className="h-9 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
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
