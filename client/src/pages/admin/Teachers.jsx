import { useAuth } from '../../contexts/AuthContext';
import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Upload, 
  Eye, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  Check, 
  RefreshCw, 
  Briefcase,
  X,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  Printer,
  Camera,
  SlidersHorizontal
} from 'lucide-react'
import api from '@/services/api'
import { cn } from '@/utils/cn'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import * as XLSX from 'xlsx'
import { motion, AnimatePresence } from 'framer-motion'

const spring = { type: 'spring', stiffness: 350, damping: 28 }

export default function Teachers() {
  const { user } = useAuth();
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
  const [statusFilter, setStatusFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [minExperienceFilter, setMinExperienceFilter] = useState('')
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false)
  const [sortField, setSortField] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false)
  const [currentTeacher, setCurrentTeacher] = useState(null) // null for create
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [selectedTeachers, setSelectedTeachers] = useState([])
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // Toast notification state
  const [toast, setToast] = useState(null)
  
  // Photo file input
  const [formPhotoFile, setFormPhotoFile] = useState(null)
  const [formPhotoPreview, setFormPhotoPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Local Form state
  const [formFields, setFormFields] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    dateOfBirth: '',
    email: '',
    phone: '',
    bloodGroup: '',
    qualification: '',
    experience: '',
    subjects: '',
    salary: '',
    joiningDate: '',
    address: '',
    city: '',
    pincode: '',
    emergencyPhone: '',
    status: 'Active'
  })
  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    if (isAddEditModalOpen || isViewModalOpen || isDeleteConfirmOpen || isBulkDeleteConfirmOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isAddEditModalOpen, isViewModalOpen, isDeleteConfirmOpen, isBulkDeleteConfirmOpen])

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  // Load teachers list
  const fetchTeachers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/teachers', {
        params: {
          page,
          limit,
          search,
          status: statusFilter,
          gender: genderFilter,
          subject: subjectFilter,
          minExperience: minExperienceFilter,
          sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 }
        }
      })
      if (res && res.success) {
        setTeachers(res.data.teachers || [])
        setTotalPages(res.data.pagination?.pages || 1)
        setTotal(res.data.pagination?.total || 0)
        setStats(res.data.stats || null)
      } else {
        setError(res.message || 'Failed to retrieve teachers')
      }
    } catch (err) {
      console.error('Fetch teachers error:', err)
      setError(err.message || 'Failed to retrieve teachers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [page, statusFilter, genderFilter, subjectFilter, minExperienceFilter, sortField, sortOrder, search])

  const activeChips = [
    ...(search ? [{ id: 'search', label: `Search: "${search}"`, onRemove: () => { setSearch(''); setPage(1); } }] : []),
    ...(statusFilter ? [{ id: 'status', label: `Status: ${statusFilter}`, onRemove: () => { setStatusFilter(''); setPage(1); } }] : []),
    ...(genderFilter ? [{ id: 'gender', label: `Gender: ${genderFilter}`, onRemove: () => { setGenderFilter(''); setPage(1); } }] : []),
    ...(subjectFilter ? [{ id: 'subject', label: `Subject: ${subjectFilter}`, onRemove: () => { setSubjectFilter(''); setPage(1); } }] : []),
    ...(minExperienceFilter ? [{ id: 'exp', label: `Min Exp: ${minExperienceFilter}+ Yrs`, onRemove: () => { setMinExperienceFilter(''); setPage(1); } }] : []),
    ...(sortField !== 'createdAt' || sortOrder !== 'desc' ? [{ id: 'sort', label: `Sorted`, onRemove: () => { setSortField('createdAt'); setSortOrder('desc'); setPage(1); } }] : [])
  ]

  const hasActiveFilters = activeChips.length > 0
  const advancedFilterCount = [genderFilter, subjectFilter, minExperienceFilter].filter(Boolean).length

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setGenderFilter('')
    setSubjectFilter('')
    setMinExperienceFilter('')
    setSortField('createdAt')
    setSortOrder('desc')
    setPage(1)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchTeachers()
  }

  // Handle modal openings
  const handleOpenCreate = () => {
    setCurrentTeacher(null)
    setFormPhotoFile(null)
    setFormPhotoPreview(null)
    setFormFields({
      firstName: '',
      lastName: '',
      gender: 'Male',
      dateOfBirth: '',
      email: '',
      phone: '',
      bloodGroup: '',
      qualification: '',
      experience: '',
      subjects: '',
      salary: '',
      joiningDate: new Date().toISOString().split('T')[0],
      address: '',
      city: '',
      pincode: '',
      emergencyPhone: '',
      status: 'Active'
    })
    setValidationErrors({})
    setIsAddEditModalOpen(true)
  }

  const handleOpenEdit = (teacher) => {
    setCurrentTeacher(teacher)
    setFormPhotoFile(null)
    setFormPhotoPreview(teacher.photo?.secure_url || null)
    
    const dob = teacher.dateOfBirth ? teacher.dateOfBirth.split('T')[0] : ''
    const joiningDate = teacher.joiningDate ? teacher.joiningDate.split('T')[0] : ''
    const subjects = Array.isArray(teacher.subjects) ? teacher.subjects.join(', ') : ''

    setFormFields({
      firstName: teacher.firstName || '',
      lastName: teacher.lastName || '',
      gender: teacher.gender || 'Male',
      dateOfBirth: dob,
      email: teacher.email || '',
      phone: teacher.phone || '',
      bloodGroup: teacher.bloodGroup || '',
      qualification: teacher.qualification || '',
      experience: teacher.experience !== undefined ? teacher.experience : '',
      subjects: subjects,
      salary: teacher.salary !== undefined ? teacher.salary : '',
      joiningDate: joiningDate,
      address: teacher.address || '',
      city: teacher.city || '',
      pincode: teacher.pincode || '',
      emergencyPhone: teacher.emergencyPhone || '',
      status: teacher.status || 'Active'
    })
    setValidationErrors({})
    setIsAddEditModalOpen(true)
  }

  const handleOpenView = (teacher) => {
    setCurrentTeacher(teacher)
    setIsViewModalOpen(true)
  }

  const handleOpenDelete = (teacher) => {
    setCurrentTeacher(teacher)
    setIsDeleteConfirmOpen(true)
  }

  // Handle Photo input select
  const handlePhotoSelect = (e) => {
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
    if (!currentTeacher || !currentTeacher._id) return
    try {
      setSubmitting(true)
      const res = await api.delete(`/teachers/${currentTeacher._id}/photo`)
      if (res && res.success) {
        showToast('success', 'Profile photo deleted successfully.')
        setFormPhotoPreview(null)
        setFormPhotoFile(null)
        setCurrentTeacher(prev => ({
          ...prev,
          photo: { public_id: '', secure_url: '' }
        }))
        fetchTeachers()
      } else {
        showToast('error', res.message || 'Failed to delete photo')
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to delete photo')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownloadIDCard = async (teacher) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [54, 86]
      })

      // 1. Draw Background and Borders
      doc.setFillColor(255, 255, 255)
      doc.rect(0, 0, 54, 86, 'F')

      // Draw primary brand header banner (Hex: #0F172A - slate-900 / premium dark look for teachers)
      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, 54, 14, 'F')

      // Draw red accent stripe below header (Hex: #EF4444 - modern red)
      doc.setFillColor(239, 68, 68)
      doc.rect(0, 14, 54, 1, 'F')

      // Draw brand logo badge
      doc.setFillColor(255, 255, 255)
      doc.circle(9, 7, 3, 'F')

      // Draw diamond cap inside badge
      doc.setDrawColor(15, 23, 42)
      doc.setLineWidth(0.3)
      doc.line(7.5, 7, 9, 5.5)
      doc.line(9, 5.5, 10.5, 7)
      doc.line(10.5, 7, 9, 8.5)
      doc.line(9, 8.5, 7.5, 7)
      doc.line(10.5, 7, 11, 9)

      // Header Text: Brand name
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.text(user?.tenantName ? user.tenantName.toUpperCase() : 'INSTITUTION', 15, 6.5)

      // Subheader Text: Teacher ID Card label
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(4.5)
      doc.text('INSTRUCTOR ID CARD', 15, 10.5)

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
        doc.ellipse(27, 33.5, 6, 3.5, 'F')
      }

      if (teacher.photo?.secure_url) {
        try {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = teacher.photo.secure_url + '?cb=' + Date.now()
          })
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth || img.width
          canvas.height = img.naturalHeight || img.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          const dataUrl = canvas.toDataURL('image/jpeg')
          doc.addImage(dataUrl, 'JPEG', 17, 19, 20, 20)
        } catch (e) {
          console.warn('Failed to load teacher photo for ID card. Using placeholder.', e)
          drawDefaultAvatar()
        }
      } else {
        drawDefaultAvatar()
      }

      // 3. Teacher Name & ID Card label text
      const fullName = `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim()
      doc.setTextColor(30, 41, 59) // Slate-800
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.text(fullName.toUpperCase(), 27, 43, { align: 'center' })

      // Highlighted Teacher ID text block
      doc.setFillColor(248, 250, 252) // Slate-50 background
      doc.rect(14, 45.5, 26, 3.5, 'F')
      doc.setDrawColor(226, 232, 240) // Slate-200 border
      doc.rect(14, 45.5, 26, 3.5)
      
      doc.setTextColor(15, 23, 42) // Slate-900
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(5.5)
      doc.text(`ID: ${teacher.teacherId || 'N/A'}`, 27, 48.2, { align: 'center' })

      // 4. Teacher Information Grid
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

      const formattedJoin = teacher.joiningDate ? teacher.joiningDate.split('T')[0] : 'N/A'

      printRow('QUALIFICATION:', teacher.qualification, startY)
      printRow('EXPERIENCE:', `${teacher.experience || 0} Years`, startY + stepY)
      
      // Join subjects list for ID card display
      const subjectsStr = (teacher.subjects || []).join(', ')
      const truncatedSubjects = subjectsStr.length > 20 ? subjectsStr.substring(0, 18) + '...' : subjectsStr
      printRow('SUBJECTS:', truncatedSubjects, startY + stepY * 2)
      printRow('PHONE:', teacher.phone, startY + stepY * 3)
      printRow('JOIN DATE:', formattedJoin, startY + stepY * 4)

      // 5. Generate QR Code
      const qrText = `Teacher ID: ${teacher.teacherId || 'N/A'}\nName: ${fullName}\nQualification: ${teacher.qualification || 'N/A'}\nSubjects: ${subjectsStr}\nPhone: ${teacher.phone || 'N/A'}`
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

      doc.save(`TeacherID_${teacher.teacherId || 'Profile'}.pdf`)
      showToast('success', 'Teacher ID card generated successfully.')
    } catch (error) {
      console.error('Error generating teacher PDF ID card:', error)
      showToast('error', error.message || 'Failed to generate ID Card')
    }
  }

  const handlePrintProfile = async (teacher) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Draw brand header banner (Hex: #0F172A - Slate-900)
      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, 210, 36, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      doc.text(user?.tenantName ? user.tenantName.toUpperCase() : 'INSTITUTION', 15, 16)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text('COACHING CLASS ERP SYSTEM - TEACHER PROFILE REPORT', 15, 22)
      doc.setFontSize(7.5)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 29)

      // Draw brand logo badge decoration on top right
      doc.setFillColor(255, 255, 255)
      doc.circle(185, 18, 7, 'F')
      doc.setDrawColor(239, 68, 68) // red accent logo border
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

      if (teacher.photo?.secure_url) {
        try {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = teacher.photo.secure_url + '?cb=' + Date.now()
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
          console.warn('Could not render photo for teacher A4 report, using placeholder', e)
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
      const fullName = `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim()
      doc.text(fullName.toUpperCase(), 15, 54)

      doc.setFontSize(10)
      doc.setTextColor(239, 68, 68) // red accent ID color
      doc.text(`Teacher ID: ${teacher.teacherId || 'N/A'}`, 15, 60)

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

      // Professional Information Section
      drawSectionHeader('Professional Information')
      const formattedSalary = teacher.salary ? `Rs. ${Number(teacher.salary).toLocaleString()}` : 'N/A'
      drawFieldsGrid([
        ['Qualification:', teacher.qualification, 'Experience:', `${teacher.experience || 0} Years`],
        ['Assigned Subjects:', (teacher.subjects || []).join(', '), 'Joining Date:', teacher.joiningDate ? teacher.joiningDate.split('T')[0] : 'N/A'],
        ['Monthly Salary:', formattedSalary, 'Status:', teacher.status || 'Active']
      ])

      // Personal Information Section
      drawSectionHeader('Personal Information')
      drawFieldsGrid([
        ['Gender:', teacher.gender, 'Date of Birth:', teacher.dateOfBirth ? teacher.dateOfBirth.split('T')[0] : 'N/A'],
        ['Blood Group:', teacher.bloodGroup || 'N/A']
      ])

      // Contact Details Section
      drawSectionHeader('Contact Details')
      drawFieldsGrid([
        ['Phone Number:', teacher.phone, 'Email Address:', teacher.email]
      ])

      // Emergency Contact Section
      drawSectionHeader('Emergency Contact')
      drawFieldsGrid([
        ['Emergency Phone:', teacher.emergencyPhone || 'N/A']
      ])

      // Address Section
      drawSectionHeader('Address details')
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(8.5)
      const fullAddressStr = `${teacher.address || ''}, ${teacher.city || ''} - ${teacher.pincode || ''}`
      const splitAddress = doc.splitTextToSize(fullAddressStr, 170)
      doc.text(splitAddress, 18, currentY)

      doc.save(`TeacherProfile_${teacher.teacherId || 'Profile'}.pdf`)
      showToast('success', 'Teacher A4 Profile PDF report downloaded.')
    } catch (e) {
      console.error('Error generating printable teacher profile:', e)
      showToast('error', 'Failed to generate printable teacher profile')
    }
  }

  // Form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setValidationErrors({})
    setSubmitting(true)

    const payload = {
      ...formFields,
      experience: Number(formFields.experience),
      salary: Number(formFields.salary),
      subjects: formFields.subjects.split(',').map(s => s.trim()).filter(Boolean)
    }

    try {
      let savedTeacher
      if (currentTeacher) {
        // Edit Teacher
        const res = await api.put(`/teachers/${currentTeacher._id}`, payload)
        if (res && res.success) {
          savedTeacher = res.data
          showToast('success', 'Teacher profile updated successfully.')
        } else {
          showToast('error', res.message || 'Failed to update teacher.')
          setSubmitting(false)
          return
        }
      } else {
        // Create Teacher
        const res = await api.post('/teachers', payload)
        if (res && res.success) {
          savedTeacher = res.data
          showToast('success', 'Teacher profile created successfully.')
        } else {
          showToast('error', res.message || 'Failed to create teacher.')
          setSubmitting(false)
          return
        }
      }

      // If photo file selected, upload it
      if (formPhotoFile && savedTeacher) {
        const formData = new FormData()
        formData.append('photo', formPhotoFile)
        await api.post(`/teachers/${savedTeacher._id}/photo`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      }

      setIsAddEditModalOpen(false)
      fetchTeachers()
    } catch (err) {
      console.error('Submit form error:', err)
      if (err.errors) {
        const errsMap = {}
        err.errors.forEach(e => {
          errsMap[e.field] = e.message
        })
        setValidationErrors(errsMap)
      } else {
        showToast('error', err.message || 'Failed to save teacher profile')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Teacher
  const handleDeleteTeacher = async () => {
    try {
      const res = await api.delete(`/teachers/${currentTeacher._id}`)
      if (res && res.success) {
        showToast('success', 'Teacher deleted successfully.')
        setIsDeleteConfirmOpen(false)
        fetchTeachers()
      } else {
        showToast('error', res.message || 'Failed to delete teacher.')
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to delete teacher.')
    }
  }

  const handleSelectTeacher = (teacher) => {
    setSelectedTeachers(prev => {
      const exists = prev.some(t => t._id === teacher._id)
      if (exists) {
        return prev.filter(t => t._id !== teacher._id)
      } else {
        return [...prev, teacher]
      }
    })
  }

  const handleSelectAllPage = () => {
    const allPageSelected = teachers.length > 0 && teachers.every(t => selectedTeachers.some(sel => sel._id === t._id))
    if (allPageSelected) {
      setSelectedTeachers(prev => prev.filter(sel => !teachers.some(t => t._id === sel._id)))
    } else {
      setSelectedTeachers(prev => {
        const newSelection = [...prev]
        teachers.forEach(t => {
          if (!newSelection.some(sel => sel._id === t._id)) {
            newSelection.push(t)
          }
        })
        return newSelection
      })
    }
  }

  const handleBulkDelete = async () => {
    try {
      setBulkDeleting(true)
      const ids = selectedTeachers.map(t => t._id)
      const res = await api.delete('/teachers/bulk', { data: { ids } })
      if (res && res.success) {
        showToast('success', res.message || 'Successfully deleted selected teachers.')
        setSelectedTeachers([])
        setIsBulkDeleteConfirmOpen(false)
        fetchTeachers()
      } else {
        showToast('error', res.message || 'Failed to delete selected teachers')
      }
    } catch (e) {
      console.error('Bulk delete error:', e)
      showToast('error', e.message || 'Failed to delete selected teachers')
    } finally {
      setBulkDeleting(false)
    }
  }

  // Export CSV Handler
  const handleExportCSV = async () => {
    if (total === 0) {
      return showToast('error', 'No teachers available to export.')
    }

    try {
      const res = await api.get('/teachers', {
        params: {
          page: 1,
          limit: total,
          search,
          status: statusFilter,
          sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 }
        }
      })

      if (res && res.success && res.data.teachers && res.data.teachers.length > 0) {
        const listToExport = res.data.teachers
        const headers = [
          'Teacher ID', 'Full Name', 'Gender', 'Date of Birth', 'Phone', 'Email',
          'Qualification', 'Experience (Years)', 'Subjects', 'Salary', 'Joining Date',
          'Address', 'City', 'Pincode', 'Status'
        ]

        const rows = listToExport.map(t => {
          const fullName = `${t.firstName || ''} ${t.lastName || ''}`.trim()
          const dob = t.dateOfBirth ? t.dateOfBirth.split('T')[0] : 'N/A'
          const joiningDate = t.joiningDate ? t.joiningDate.split('T')[0] : 'N/A'
          const subjects = Array.isArray(t.subjects) ? t.subjects.join('; ') : 'N/A'

          return [
            t.teacherId || 'N/A',
            fullName,
            t.gender || 'N/A',
            dob,
            t.phone || 'N/A',
            t.email || 'N/A',
            t.qualification || 'N/A',
            t.experience || 0,
            subjects,
            t.salary || 0,
            joiningDate,
            t.address || 'N/A',
            t.city || 'N/A',
            t.pincode || 'N/A',
            t.status || 'Active'
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
        link.setAttribute("download", `teachers_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (err) {
      showToast('error', 'Failed to export CSV')
    }
  }

  // Export Excel Handler
  const handleExportExcel = async () => {
    if (total === 0) {
      return showToast('error', 'No teachers available to export.')
    }

    try {
      const res = await api.get('/teachers', {
        params: {
          page: 1,
          limit: total,
          search,
          status: statusFilter,
          sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 }
        }
      })

      if (res && res.success && res.data.teachers && res.data.teachers.length > 0) {
        const listToExport = res.data.teachers
        const headers = [
          'Teacher ID', 'Full Name', 'Gender', 'Date of Birth', 'Phone', 'Email',
          'Qualification', 'Experience (Years)', 'Subjects', 'Salary', 'Joining Date',
          'Address', 'City', 'Pincode', 'Status'
        ]

        const dataRows = listToExport.map(t => {
          const fullName = `${t.firstName || ''} ${t.lastName || ''}`.trim()
          return [
            t.teacherId || 'N/A',
            fullName,
            t.gender || 'N/A',
            t.dateOfBirth ? t.dateOfBirth.split('T')[0] : 'N/A',
            t.phone || 'N/A',
            t.email || 'N/A',
            t.qualification || 'N/A',
            t.experience || 0,
            Array.isArray(t.subjects) ? t.subjects.join(', ') : 'N/A',
            t.salary || 0,
            t.joiningDate ? t.joiningDate.split('T')[0] : 'N/A',
            t.address || 'N/A',
            t.city || 'N/A',
            t.pincode || 'N/A',
            t.status || 'Active'
          ]
        })

        const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Teachers')
        XLSX.writeFile(wb, `teachers_${new Date().toISOString().split('T')[0]}.xlsx`)
        showToast('success', 'Excel report downloaded.')
      }
    } catch (err) {
      showToast('error', 'Failed to export Excel report')
    }
  }

  // Export PDF Report Handler
  const handleExportPDF = () => {
    if (total === 0) {
      return showToast('error', 'No teachers available to export.')
    }

    try {
      const doc = new jsPDF()
      
      // Title Banner
      doc.setFillColor(30, 41, 59)
      doc.rect(0, 0, 210, 30, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(16)
      doc.text(user?.tenantName ? user.tenantName.toUpperCase() + ' ERP' : 'INSTITUTION ERP', 14, 18)
      doc.setFontSize(10)
      doc.setFont('Helvetica', 'normal')
      doc.text('Teacher Directory Report', 14, 24)
      
      const dateStr = new Date().toLocaleDateString()
      doc.text(`Generated: ${dateStr}`, 160, 20)

      doc.setTextColor(30, 41, 59)
      doc.setFontSize(12)
      doc.setFont('Helvetica', 'bold')
      doc.text('Teacher Records List', 14, 40)
      
      doc.setFontSize(8)
      doc.setFont('Helvetica', 'bold')
      
      const columns = ['Teacher ID', 'Full Name', 'Subjects', 'Qualification', 'Experience', 'Phone', 'Status']
      const colWidths = [25, 45, 30, 30, 20, 25, 15]
      const startX = 14
      let startY = 48

      doc.setFillColor(241, 245, 249)
      doc.rect(startX, startY, 190, 8, 'F')
      doc.rect(startX, startY, 190, 8, 'S')
      
      let curX = startX
      columns.forEach((col, idx) => {
        doc.text(col, curX + 2, startY + 5)
        curX += colWidths[idx]
      })

      doc.setFont('Helvetica', 'normal')
      let curY = startY + 8

      teachers.forEach((t) => {
        if (curY > 270) {
          doc.addPage()
          curY = 20
        }

        const fullName = `${t.firstName} ${t.lastName}`
        const subjectsStr = (t.subjects || []).join(', ')
        const experienceStr = `${t.experience} yrs`

        const rowValues = [
          t.teacherId || 'N/A',
          fullName,
          subjectsStr,
          t.qualification || 'N/A',
          experienceStr,
          t.phone || 'N/A',
          t.status || 'Active'
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

      doc.save(`teachers_${new Date().toISOString().split('T')[0]}.pdf`)
      showToast('success', 'PDF directory report downloaded.')
    } catch (error) {
      console.error('Error generating PDF:', error)
      showToast('error', 'Failed to generate PDF')
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
            <span className="text-brand-blue-600">Teachers</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
            Teacher Management
          </h2>
          <p className="text-[11px] font-bold text-slate-400 mt-1">
            Manage teacher profiles, qualifications, subjects, and salaries
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
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Total Teachers</span>
            <span className="text-xl font-black text-slate-800 leading-tight block mt-0.5">{stats?.total || 0}</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
            <Briefcase className="h-4.5 w-4.5" />
          </div>
        </div>

        <div 
          onClick={() => { setStatusFilter(statusFilter === 'Active' ? '' : 'Active'); setPage(1); }}
          className={cn(
            "bg-white px-5 py-3.5 rounded-2xl border flex items-center justify-between shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-emerald-200 active:scale-[0.98]",
            statusFilter === 'Active' ? "border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-50/10" : "border-slate-100"
          )}
        >
          <div className="text-left">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Active</span>
            <span className="text-xl font-black text-emerald-600 leading-tight block mt-0.5">{stats?.active || 0}</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Check className="h-4.5 w-4.5" />
          </div>
        </div>

        <div 
          onClick={() => { setStatusFilter(statusFilter === 'Inactive' ? '' : 'Inactive'); setPage(1); }}
          className={cn(
            "bg-white px-5 py-3.5 rounded-2xl border flex items-center justify-between shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-slate-300 active:scale-[0.98]",
            statusFilter === 'Inactive' ? "border-slate-400 ring-2 ring-slate-400/10 bg-slate-50" : "border-slate-100"
          )}
        >
          <div className="text-left">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Inactive</span>
            <span className="text-xl font-black text-slate-500 leading-tight block mt-0.5">{stats?.inactive || 0}</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center">
            <X className="h-4.5 w-4.5" />
          </div>
        </div>

        <div 
          onClick={() => { setSortField('experience'); setSortOrder('desc'); setPage(1); }}
          className={cn(
            "bg-white px-5 py-3.5 rounded-2xl border flex items-center justify-between shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-indigo-200 active:scale-[0.98]",
            sortField === 'experience' ? "border-indigo-500 ring-2 ring-indigo-500/10 bg-indigo-50/10" : "border-slate-100"
          )}
        >
          <div className="text-left">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Avg Experience</span>
            <span className="text-xl font-black text-indigo-600 leading-tight block mt-0.5">{stats?.avgExperience || 0} Yrs</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calendar className="h-4.5 w-4.5" />
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
              placeholder="Search by name, email, phone or subjects..."
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

            {/* Status Quick Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-10 px-4 rounded-full border border-slate-200 text-xs font-extrabold text-slate-600 bg-white cursor-pointer outline-none focus:border-blue-500 shadow-sm"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
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
              <option value="salary-desc">Highest Salary</option>
              <option value="experience-desc">Most Experienced</option>
              <option value="firstName-asc">Name A-Z</option>
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
                <Upload className="h-3.5 w-3.5 text-emerald-600" />
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

            {/* Add Teacher Button */}
            <button
              onClick={handleOpenCreate}
              className="h-10 px-5 rounded-full bg-brand-blue-500 hover:bg-brand-blue-600 active:scale-95 text-xs font-extrabold text-white shadow-premium-2 cursor-pointer flex items-center justify-center gap-2 transition-all shrink-0 ml-1"
            >
              <Plus className="h-4 w-4" />
              <span>Add Teacher</span>
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
                className="p-5 bg-slate-50/80 border border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                    Gender
                  </label>
                  <select
                    value={genderFilter}
                    onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
                    className="w-full h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none focus:border-blue-500 shadow-sm"
                  >
                    <option value="">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                    Subject Taught
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics, Physics, Chemistry..."
                    value={subjectFilter}
                    onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }}
                    className="w-full h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none focus:border-blue-500 shadow-sm placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                    Minimum Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 3"
                    value={minExperienceFilter}
                    onChange={(e) => { setMinExperienceFilter(e.target.value); setPage(1); }}
                    className="w-full h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none focus:border-blue-500 shadow-sm placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>

                <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-200/60">
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
          {selectedTeachers.length > 0 && (
            <motion.div
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="absolute top-0 left-0 right-0 h-16 bg-slate-900 text-white px-8 flex items-center justify-between z-20"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-black tracking-wider uppercase text-slate-400">Selected:</span>
                <span className="text-sm font-black bg-slate-800 px-3 py-1 rounded-full">{selectedTeachers.length}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedTeachers([])}
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
                    checked={teachers.length > 0 && teachers.every(t => selectedTeachers.some(sel => sel._id === t._id))}
                    onChange={handleSelectAllPage}
                    className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-4 w-[80px]">Photo</th>
                <th className="px-4">Teacher ID</th>
                <th className="px-4">Full Name</th>
                <th className="px-4">Qualification</th>
                <th className="px-4">Experience</th>
                <th className="px-4">Subjects</th>
                <th className="px-4">Status</th>
                <th className="pr-6 text-right w-[100px]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700 bg-white">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="h-[78px] animate-pulse">
                    <td className="pl-6 py-4.5 w-[50px]">
                      <div className="h-4.5 w-4.5 rounded bg-slate-100" />
                    </td>
                    <td className="px-4 py-4.5">
                      <div className="h-12 w-12 rounded-full bg-slate-100" />
                    </td>
                    <td className="px-4 py-4.5"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-4.5"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-4.5"><div className="h-3 w-16 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-4.5"><div className="h-3 w-20 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-4.5"><div className="h-3 w-16 bg-slate-100 rounded" /></td>
                    <td className="px-4 py-4.5"><div className="h-5 w-14 bg-slate-100 rounded-full" /></td>
                    <td className="pr-6 py-4.5 text-right"><div className="h-8 w-8 bg-slate-100 rounded-full ml-auto" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan="9" className="text-center py-20 text-red-500 font-bold">
                    <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-2" />
                    <span>{error}</span>
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-24 text-slate-400 font-bold">
                    <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <span className="text-[14px] text-slate-500 font-extrabold block">No teachers found</span>
                    <span className="text-xs text-slate-400 block mt-1 font-semibold">Try modifying your search or filters</span>
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => {
                  const initial = teacher.firstName ? teacher.firstName[0].toUpperCase() : 'T'
                  return (
                    <motion.tr 
                      key={teacher._id}
                      whileHover={{ backgroundColor: '#F8FAFC' }}
                      transition={{ duration: 0.15 }}
                      className="group transition-colors h-[78px] hover:bg-[#F8FAFC]"
                    >
                      {/* Checkbox Column */}
                      <td className="pl-6 py-3">
                        <input
                           type="checkbox"
                           checked={selectedTeachers.some(sel => sel._id === teacher._id)}
                           onChange={() => handleSelectTeacher(teacher)}
                           className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Photo Column */}
                      <td className="px-4 py-3">
                        {teacher.photo?.secure_url ? (
                          <img 
                            src={teacher.photo.secure_url} 
                            alt={teacher.firstName} 
                            className="h-12 w-12 rounded-full object-cover shadow-sm border border-slate-200/50" 
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm select-none">
                            {initial}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-800 font-bold">
                        {teacher.teacherId}
                      </td>

                      <td className="px-4 py-3 text-left">
                        <span className="text-[14px] font-bold text-slate-800 block">
                          {teacher.firstName} {teacher.lastName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">{teacher.email}</span>
                      </td>

                      <td className="px-4 py-3 font-bold text-slate-600">
                        {teacher.qualification}
                      </td>

                      <td className="px-4 py-3 text-slate-500 font-semibold">
                        {teacher.experience} Years
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(teacher.subjects || []).map((subject, idx) => (
                            <span 
                              key={idx} 
                              className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-500"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase inline-block border",
                          teacher.status === 'Active'
                            ? 'bg-emerald-50/70 border-emerald-100 text-emerald-600'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        )}>
                          {teacher.status}
                        </span>
                      </td>

                      <td className="pr-6 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          {/* Eye action */}
                          <button
                            onClick={() => handleOpenView(teacher)}
                            className="h-8 w-8 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer shadow-sm transition-colors"
                            title="View Profile"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Edit action */}
                          <button
                            onClick={() => handleOpenEdit(teacher)}
                            className="h-8 w-8 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer shadow-sm transition-colors"
                            title="Edit Teacher"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          {/* Download ID Card action */}
                          <button
                            onClick={() => handleDownloadIDCard(teacher)}
                            className="h-8 w-8 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer shadow-sm transition-colors"
                            title="Download ID Card"
                          >
                            <Download className="h-4 w-4" />
                          </button>

                          {/* Print Profile action */}
                          <button
                            onClick={() => handlePrintProfile(teacher)}
                            className="h-8 w-8 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer shadow-sm transition-colors"
                            title="Print Profile"
                          >
                            <Printer className="h-4 w-4" />
                          </button>

                          {/* Delete action */}
                          <button
                            onClick={() => handleOpenDelete(teacher)}
                            className="h-8 w-8 rounded-full border border-slate-200 hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-600 cursor-pointer shadow-sm transition-colors"
                            title="Delete Teacher"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Panel */}
        {!loading && total > 0 && (
          <div className="pt-5 border-t border-slate-100 flex items-center justify-between select-none flex-none">
            <span className="text-xs text-slate-400 font-bold">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="h-8 px-3.5 rounded-full border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-[11px] font-extrabold text-slate-500 cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Prev</span>
              </button>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="h-8 px-3.5 rounded-full border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-[11px] font-extrabold text-slate-500 cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      <AnimatePresence>
        
        {/* ADD / EDIT MODAL */}
        {isAddEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={spring}
              style={{ borderRadius: '28px', border: '1px solid #ECECEC' }}
              className="bg-white w-full max-w-2xl max-h-[90vh] shadow-premium-3 relative text-left flex flex-col overflow-hidden"
            >
              <button 
                onClick={() => { if (!submitting) setIsAddEditModalOpen(false); }}
                disabled={submitting}
                className="absolute right-5 top-5 h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer z-10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="p-6 md:p-8 pb-4 md:pb-5 flex-none">
                <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1">
                  {currentTeacher ? 'Edit Teacher Profile' : 'Add Teacher'}
                </h3>
                <p className="text-[11px] font-bold text-slate-400">
                  {currentTeacher ? 'Modify existing teacher credentials' : 'Register a new instructor record'}
                </p>
              </div>

              <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col min-h-0">
                <fieldset disabled={submitting} className="contents">
                <div className="flex-1 overflow-y-auto px-6 md:px-8 py-2">
                  {/* 1. Personal Details Section */}
                  <div className="pt-6 pb-4">
                    <h4 className="text-xs font-black text-slate-800 tracking-wide uppercase border-b border-slate-100 pb-2 mb-5">
                      Personal Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-4">
                      {/* First Name */}
                      <div className="space-y-2">
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

                      {/* Last Name */}
                      <div className="space-y-2">
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
                      <div className="space-y-2">
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
                      </div>

                      {/* Date of Birth */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Date of Birth *</label>
                        <input
                          type="date"
                          required
                          value={formFields.dateOfBirth}
                          onChange={(e) => setFormFields({ ...formFields, dateOfBirth: e.target.value })}
                          className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                        />
                        {validationErrors.dateOfBirth && (
                          <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.dateOfBirth}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
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

                      {/* Phone */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Phone Number *</label>
                        <input
                          type="text"
                          required
                          value={formFields.phone}
                          onChange={(e) => setFormFields({ ...formFields, phone: e.target.value })}
                          className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                          placeholder="10 digit number"
                        />
                        {validationErrors.phone && (
                          <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.phone}</p>
                        )}
                      </div>

                      {/* Blood Group */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Blood Group (Optional)</label>
                        <select
                          value={formFields.bloodGroup}
                          onChange={(e) => setFormFields({ ...formFields, bloodGroup: e.target.value })}
                          className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-600 bg-white focus:border-blue-500 outline-none cursor-pointer"
                        >
                          <option value="">Select Blood Group</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                        {validationErrors.bloodGroup && (
                          <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.bloodGroup}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. Professional Details Section */}
                  <div className="pt-6 pb-4">
                    <h4 className="text-xs font-black text-slate-800 tracking-wide uppercase border-b border-slate-100 pb-2 mb-5">
                      Professional Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-4">
                      {/* Qualification */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Qualification *</label>
                        <input
                          type="text"
                          required
                          value={formFields.qualification}
                          onChange={(e) => setFormFields({ ...formFields, qualification: e.target.value })}
                          className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                          placeholder="e.g. M.Sc. Physics"
                        />
                        {validationErrors.qualification && (
                          <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.qualification}</p>
                        )}
                      </div>

                      {/* Experience */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Experience (Years) *</label>
                        <input
                          type="number"
                          required
                          value={formFields.experience}
                          onChange={(e) => setFormFields({ ...formFields, experience: e.target.value })}
                          className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                          placeholder="Years of Experience"
                        />
                        {validationErrors.experience && (
                          <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.experience}</p>
                        )}
                      </div>

                      {/* Subjects */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Subjects (Comma separated) *</label>
                        <input
                          type="text"
                          required
                          value={formFields.subjects}
                          onChange={(e) => setFormFields({ ...formFields, subjects: e.target.value })}
                          className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                          placeholder="e.g. Physics, Mathematics"
                        />
                        {validationErrors.subjects && (
                          <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.subjects}</p>
                        )}
                      </div>

                      {/* Salary */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Salary *</label>
                        <div className="relative">
                          <span className="absolute left-4 top-2.5 text-xs font-extrabold text-slate-400">₹</span>
                          <input
                            type="number"
                            required
                            value={formFields.salary}
                            onChange={(e) => setFormFields({ ...formFields, salary: e.target.value })}
                            className="w-full h-10 pl-8 pr-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                            placeholder="Salary amount"
                          />
                        </div>
                        {validationErrors.salary && (
                          <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.salary}</p>
                        )}
                      </div>

                      {/* Joining Date */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Joining Date *</label>
                        <input
                          type="date"
                          required
                          value={formFields.joiningDate}
                          onChange={(e) => setFormFields({ ...formFields, joiningDate: e.target.value })}
                          className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                        />
                        {validationErrors.joiningDate && (
                          <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.joiningDate}</p>
                        )}
                      </div>

                      {/* Status */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Status</label>
                        <select
                          value={formFields.status}
                          onChange={(e) => setFormFields({ ...formFields, status: e.target.value })}
                          className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-600 bg-white focus:border-blue-500 outline-none cursor-pointer"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 3. Address Section */}
                  <div className="pt-6 pb-4">
                    <h4 className="text-xs font-black text-slate-800 tracking-wide uppercase border-b border-slate-100 pb-2 mb-5">
                      Address
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-5 gap-x-4">
                      {/* Full Address */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Full Address</label>
                        <input
                          type="text"
                          value={formFields.address}
                          onChange={(e) => setFormFields({ ...formFields, address: e.target.value })}
                          className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                          placeholder="Street details"
                        />
                      </div>

                      {/* City */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">City</label>
                        <input
                          type="text"
                          value={formFields.city}
                          onChange={(e) => setFormFields({ ...formFields, city: e.target.value })}
                          className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                          placeholder="City"
                        />
                      </div>

                      {/* Pincode */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Pincode</label>
                        <input
                          type="text"
                          value={formFields.pincode}
                          onChange={(e) => setFormFields({ ...formFields, pincode: e.target.value })}
                          className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                          placeholder="6 digit pincode"
                        />
                        {validationErrors.pincode && (
                          <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.pincode}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4. Emergency Details Section */}
                  <div className="pt-6 pb-4">
                    <h4 className="text-xs font-black text-slate-800 tracking-wide uppercase border-b border-slate-100 pb-2 mb-5">
                      Emergency Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-4">
                      {/* Emergency Phone */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Emergency Contact Number (Optional)</label>
                        <input
                          type="text"
                          value={formFields.emergencyPhone}
                          onChange={(e) => setFormFields({ ...formFields, emergencyPhone: e.target.value })}
                          className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 outline-none"
                          placeholder="Emergency phone number"
                        />
                        {validationErrors.emergencyPhone && (
                          <p className="text-[10px] font-extrabold text-red-500 mt-1">{validationErrors.emergencyPhone}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 5. Profile Photo Section */}
                  <div className="pt-6 pb-4">
                    <h4 className="text-xs font-black text-slate-800 tracking-wide uppercase border-b border-slate-100 pb-2 mb-5">
                      Profile Photo
                    </h4>
                    <div className="flex items-center gap-4">
                      {formPhotoPreview ? (
                        <div className="relative h-14 w-14 shrink-0">
                          <img 
                            src={formPhotoPreview} 
                            alt="preview" 
                            className="h-14 w-14 rounded-full object-cover border border-slate-200/50 shadow-sm" 
                          />
                          {formPhotoPreview === currentTeacher?.photo?.secure_url ? (
                            <button
                              type="button"
                              onClick={handleDeletePhoto}
                              className="absolute -top-1 -right-1 h-5 w-5 bg-red-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow hover:bg-red-700 transition-colors"
                              title="Delete photo permanently"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => { setFormPhotoFile(null); setFormPhotoPreview(null); }}
                              className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center cursor-pointer shadow hover:bg-red-600 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-black border border-slate-200/50 shadow-sm select-none uppercase shrink-0">
                          No Photo
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[11px] file:font-extrabold file:bg-slate-100 file:text-slate-600 hover:file:bg-slate-200 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="px-6 md:px-8 py-5 flex-none border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddEditModalOpen(false)}
                    className="h-10 px-5 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-500 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-6 rounded-full bg-brand-blue-500 hover:bg-brand-blue-600 text-xs font-extrabold text-white cursor-pointer shadow-premium-2 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    {submitting && <RefreshCw className="h-4.5 w-4.5 animate-spin" />}
                    <span>{submitting ? (currentTeacher ? 'Saving...' : 'Creating...') : (currentTeacher ? 'Save Changes' : 'Create Teacher')}</span>
                  </button>
                </div>
                </fieldset>
              </form>
            </motion.div>
          </div>
        )}

        {/* VIEW DETAILS PROFILE MODAL */}
        {isViewModalOpen && currentTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={spring}
              style={{ borderRadius: '28px', border: '1px solid #ECECEC' }}
              className="bg-white p-7 w-full max-w-2xl shadow-premium-3 relative max-h-[90vh] overflow-y-auto text-left"
            >
              <div className="absolute right-14 top-5 flex items-center gap-2">
                <button
                  onClick={() => handlePrintProfile(currentTeacher)}
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

              <div className="flex flex-col sm:flex-row gap-6 items-start pb-6 border-b border-slate-100">
                {currentTeacher.photo?.secure_url ? (
                  <img 
                    src={currentTeacher.photo.secure_url} 
                    alt={currentTeacher.firstName} 
                    className="h-24 w-24 rounded-2xl object-cover shadow-sm border border-slate-200/50 shrink-0" 
                  />
                ) : (
                  <div className="h-24 w-24 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-sm select-none shrink-0">
                    {currentTeacher.firstName ? currentTeacher.firstName[0].toUpperCase() : 'T'}
                  </div>
                )}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-100/50">
                    ID: {currentTeacher.teacherId}
                  </span>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none mt-1">
                    {currentTeacher.firstName} {currentTeacher.lastName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-semibold mt-1">
                    <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {currentTeacher.email}</span>
                    <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {currentTeacher.phone}</span>
                  </div>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wide uppercase inline-block border mt-2",
                    currentTeacher.status === 'Active'
                      ? 'bg-emerald-50/70 border-emerald-100 text-emerald-600'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  )}>
                    {currentTeacher.status}
                  </span>
                </div>
              </div>

              {/* Teacher Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-slate-100">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Professional Information</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Qualification:</span><span className="font-extrabold text-slate-700">{currentTeacher.qualification || 'N/A'}</span></div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Experience:</span><span className="font-extrabold text-slate-700">{currentTeacher.experience || 0} Years</span></div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Salary:</span><span className="font-extrabold text-slate-700">Rs. {currentTeacher.salary?.toLocaleString() || 0}</span></div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Joining Date:</span><span className="font-extrabold text-slate-700">{currentTeacher.joiningDate ? currentTeacher.joiningDate.split('T')[0] : 'N/A'}</span></div>
                    <div className="flex flex-col gap-1 border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400 font-semibold">Assigned Subjects:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(currentTeacher.subjects || []).map((subject, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600">
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Personal Details</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Gender:</span><span className="font-extrabold text-slate-700">{currentTeacher.gender || 'N/A'}</span></div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Date of Birth:</span><span className="font-extrabold text-slate-700">{currentTeacher.dateOfBirth ? currentTeacher.dateOfBirth.split('T')[0] : 'N/A'}</span></div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Blood Group:</span><span className="font-extrabold text-slate-700">{currentTeacher.bloodGroup || 'N/A'}</span></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-slate-100">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Emergency Contact</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-slate-400 font-semibold">Emergency Number:</span><span className="font-extrabold text-slate-700">{currentTeacher.emergencyPhone || 'N/A'}</span></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Address Info</h4>
                  <div className="text-xs text-slate-600 font-semibold flex items-start gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/50">
                    <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{currentTeacher.address || 'N/A'}{currentTeacher.city ? `, ${currentTeacher.city}` : ''}{currentTeacher.pincode ? ` - ${currentTeacher.pincode}` : ''}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* DELETE CONFIRM MODAL */}
        {isDeleteConfirmOpen && currentTeacher && (
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
                  Delete Teacher Profile
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 font-semibold">
                  Are you sure you want to delete this teacher? This action cannot be undone.
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
                  onClick={handleDeleteTeacher}
                  className="flex-1 h-10 rounded-full bg-red-600 hover:bg-red-700 text-xs font-extrabold text-white cursor-pointer shadow-md transition-all active:scale-95"
                >
                  Delete Teacher
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
                  Delete {selectedTeachers.length} Teachers?
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
