import { useAuth } from '../../contexts/AuthContext';
import React, { useState, useEffect, useCallback } from 'react'
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  CreditCard, 
  FileText,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  AlertCircle,
  Check,
  RefreshCw,
  Eye,
  Download
} from 'lucide-react'
import api from '@/services/api'
import { cn } from '@/utils/cn'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import SearchableSelect from '@/components/common/SearchableSelect'
import DashboardStatCard from '@/components/common/DashboardStatCard'
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell 
} from 'recharts'

const spring = { type: 'spring', stiffness: 350, damping: 28 }

const tabsList = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    description: 'Overview of collections, outstanding balances, and recent payment logs.',
    icon: LayoutDashboard 
  },
  { 
    id: 'structure', 
    label: 'Fee Structure', 
    description: 'Configure tuition fees, transport fees and fee plans.',
    icon: BookOpen 
  },
  { 
    id: 'student', 
    label: 'Student Fees', 
    description: 'Manage student fee assignments, dues, and record payments.',
    icon: Users 
  },
  { 
    id: 'receipts', 
    label: 'Receipts', 
    description: 'Search, view, download and print payment receipt records.',
    icon: FileText 
  }
]

const classes = [
  'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11 Science', 'Class 11 Commerce',
  'Class 12 Science', 'Class 12 Commerce'
]

const academicYears = [
  '2024-2025',
  '2025-2026',
  '2026-2027',
  '2027-2028',
  '2028-2029'
]

export default function FeeManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard')
  const currentTabInfo = tabsList.find(tab => tab.id === activeTab) || tabsList[0]

  // Common Dropdowns state for Assigning Fee
  const [dropdownStudents, setDropdownStudents] = useState([])
  const [dropdownFeeStructures, setDropdownFeeStructures] = useState([])

  // Dashboard Stats States
  const [dashboardStats, setDashboardStats] = useState(null)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState(null)

  // Fee Structure States
  const [feeStructures, setFeeStructures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Pagination & Filtering state (Fee Structure)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortField] = useState('createdAt')
  const [sortOrder] = useState('desc')

  // Modals state (Fee Structure)
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false)
  const [currentFeeStructure, setCurrentFeeStructure] = useState(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [selectedFeeStructures, setSelectedFeeStructures] = useState([])
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // -------------------------------------------------------------
  // Student Fees States
  // -------------------------------------------------------------
  const [studentFees, setStudentFees] = useState([])
  const [studentFeesLoading, setStudentFeesLoading] = useState(true)
  const [studentFeesError, setStudentFeesError] = useState(null)

  // Pagination & Filtering state (Student Fees)
  const [studentPage, setStudentPage] = useState(1)
  const [studentLimit] = useState(10)
  const [studentTotalPages, setStudentTotalPages] = useState(1)
  const [studentTotal, setStudentTotal] = useState(0)

  const [studentSearch, setStudentSearch] = useState('')
  const [studentCourseFilter, setStudentCourseFilter] = useState('')
  const [studentYearFilter, setStudentYearFilter] = useState('')
  const [studentStatusFilter, setStudentStatusFilter] = useState('')

  // Modals state (Student Fees)
  const [isAssignFeeModalOpen, setIsAssignFeeModalOpen] = useState(false)
  const [currentStudentFee, setCurrentStudentFee] = useState(null) // null for create
  const [isStudentViewModalOpen, setIsStudentViewModalOpen] = useState(false)
  const [isStudentDeleteConfirmOpen, setIsStudentDeleteConfirmOpen] = useState(false)
  const [selectedStudentFees, setSelectedStudentFees] = useState([])
  const [isStudentBulkDeleteConfirmOpen, setIsStudentBulkDeleteConfirmOpen] = useState(false)
  const [studentBulkDeleting, setStudentBulkDeleting] = useState(false)

  // Add Payment Modal State
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false)
  const [paymentFormFields, setPaymentFormFields] = useState({
    amount: '',
    paymentMethod: 'Cash',
    remarks: ''
  })

  // Assign Fee Form state
  const [assignFormFields, setAssignFormFields] = useState({
    student: '',
    feeStructure: '',
    tuitionFee: '',
    transportFee: '',
    totalFee: '',
    dueDate: ''
  })

  // -------------------------------------------------------------
  // Receipts States
  // -------------------------------------------------------------
  const [receipts, setReceipts] = useState([])
  const [receiptsLoading, setReceiptsLoading] = useState(true)
  const [receiptsError, setReceiptsError] = useState(null)
  
  const [receiptSearch, setReceiptSearch] = useState('')
  const [receiptPage, setReceiptPage] = useState(1)
  const [receiptLimit] = useState(10)
  const [receiptTotalPages, setReceiptTotalPages] = useState(1)
  const [receiptTotal, setReceiptTotal] = useState(0)

  // View Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)

  // Toast notification state
  const [toast, setToast] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Local Form state (Fee Structure)
  const [formFields, setFormFields] = useState({
    course: '',
    academicYear: '2026-2027',
    tuitionFee: '',
    transportFee: '',
    status: 'Active'
  })
  const [validationErrors, setValidationErrors] = useState({})

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  // Fetch dropdown data for Assigning Modal
  const fetchDropdownData = async () => {
    try {
      const [studsRes, structuresRes] = await Promise.all([
        api.get('/students', { params: { page: 1, limit: 1000, status: 'Active' } }),
        api.get('/fee-structures', { params: { page: 1, limit: 1000, status: 'Active' } })
      ])
      if (studsRes && studsRes.success) {
        setDropdownStudents(studsRes.data.students || [])
      }
      if (structuresRes && structuresRes.success) {
        setDropdownFeeStructures(structuresRes.data.feeStructures || [])
      }
    } catch (err) {
      console.error('Failed to load dropdown data:', err)
    }
  }

  // Fetch unified dashboard statistics aggregates
  const fetchDashboardStats = useCallback(async () => {
    setDashboardLoading(true)
    setDashboardError(null)
    try {
      const res = await api.get('/student-fees/dashboard-stats')
      if (res && res.success) {
        setDashboardStats(res.data || null)
      } else {
        setDashboardError('Failed to fetch dashboard statistics')
      }
    } catch (err) {
      console.error('Fetch dashboard stats error:', err)
      setDashboardError(err.message || 'Server error occurred')
    } finally {
      setDashboardLoading(false)
    }
  }, [])

  // Fetch fee structures matching parameters
  const fetchFeeStructures = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/fee-structures', {
        params: {
          page,
          limit,
          search,
          course: courseFilter,
          academicYear: yearFilter,
          status: statusFilter,
          sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 }
        }
      })

      if (res && res.success) {
        setFeeStructures(res.data.feeStructures || [])
        setTotal(res.data.pagination?.total || 0)
        setTotalPages(res.data.pagination?.pages || 1)
      } else {
        setError('Failed to fetch fee structures list')
      }
    } catch (err) {
      console.error('Fetch fee structures error:', err)
      setError(err.message || 'Server error occurred')
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, courseFilter, yearFilter, statusFilter, sortField, sortOrder])

  // Fetch student fees matching parameters
  const fetchStudentFees = useCallback(async () => {
    setStudentFeesLoading(true)
    setStudentFeesError(null)
    try {
      const res = await api.get('/student-fees', {
        params: {
          page: studentPage,
          limit: studentLimit,
          search: studentSearch,
          course: studentCourseFilter,
          academicYear: studentYearFilter,
          status: studentStatusFilter
        }
      })

      if (res && res.success) {
        setStudentFees(res.data.studentFees || [])
        setStudentTotal(res.data.pagination?.total || 0)
        setStudentTotalPages(res.data.pagination?.pages || 1)
      } else {
        setStudentFeesError('Failed to fetch student fees list')
      }
    } catch (err) {
      console.error('Fetch student fees error:', err)
      setStudentFeesError(err.message || 'Server error occurred')
    } finally {
      setStudentFeesLoading(false)
    }
  }, [studentPage, studentLimit, studentSearch, studentCourseFilter, studentYearFilter, studentStatusFilter])

  // Fetch payment receipts
  const fetchReceipts = useCallback(async () => {
    setReceiptsLoading(true)
    setReceiptsError(null)
    try {
      const res = await api.get('/student-fees/receipts', {
        params: {
          page: receiptPage,
          limit: receiptLimit,
          search: receiptSearch
        }
      })
      if (res && res.success) {
        setReceipts(res.data.receipts || [])
        setReceiptTotal(res.data.pagination?.total || 0)
        setReceiptTotalPages(res.data.pagination?.pages || 1)
      } else {
        setReceiptsError('Failed to fetch receipts list')
      }
    } catch (err) {
      console.error('Fetch receipts error:', err)
      setReceiptsError(err.message || 'Server error occurred')
    } finally {
      setReceiptsLoading(false)
    }
  }, [receiptPage, receiptLimit, receiptSearch])

  // Run fetches reactively
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardStats()
    } else if (activeTab === 'structure') {
      fetchFeeStructures()
    } else if (activeTab === 'student') {
      fetchStudentFees()
      fetchDropdownData()
    } else if (activeTab === 'receipts') {
      fetchReceipts()
    }
  }, [activeTab, fetchDashboardStats, fetchFeeStructures, fetchStudentFees, fetchReceipts])

  // Reset pagination index to 1 when filters or searches change
  const handleSearchChange = (val) => {
    setSearch(val)
    setPage(1)
  }

  const handleStudentSearchChange = (val) => {
    setStudentSearch(val)
    setStudentPage(1)
  }

  const handleReceiptSearchChange = (val) => {
    setReceiptSearch(val)
    setReceiptPage(1)
  }

  // Trigger searches
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchFeeStructures()
  }

  const handleStudentSearchSubmit = (e) => {
    e.preventDefault()
    setStudentPage(1)
    fetchStudentFees()
  }

  const handleReceiptSearchSubmit = (e) => {
    e.preventDefault()
    setReceiptPage(1)
    fetchReceipts()
  }

  // Clear filters
  const clearFilters = () => {
    setSearch('')
    setCourseFilter('')
    setYearFilter('')
    setStatusFilter('')
    setPage(1)
  }

  const clearStudentFilters = () => {
    setStudentSearch('')
    setStudentCourseFilter('')
    setStudentYearFilter('')
    setStudentStatusFilter('')
    setStudentPage(1)
  }

  // Selection Checkboxes (Fee Structure)
  const handleSelectFeeStructure = (fs) => {
    if (selectedFeeStructures.some(s => s._id === fs._id)) {
      setSelectedFeeStructures(selectedFeeStructures.filter(s => s._id !== fs._id))
    } else {
      setSelectedFeeStructures([...selectedFeeStructures, fs])
    }
  }

  const handleSelectAllPage = () => {
    const allPageSelected = feeStructures.length > 0 && feeStructures.every(fs => selectedFeeStructures.some(sel => sel._id === fs._id))
    if (allPageSelected) {
      setSelectedFeeStructures(selectedFeeStructures.filter(sel => !feeStructures.some(fs => fs._id === sel._id)))
    } else {
      const toAdd = feeStructures.filter(fs => !selectedFeeStructures.some(sel => sel._id === fs._id))
      setSelectedFeeStructures([...selectedFeeStructures, ...toAdd])
    }
  }

  // Selection Checkboxes (Student Fees)
  const handleSelectStudentFee = (sf) => {
    if (selectedStudentFees.some(s => s._id === sf._id)) {
      setSelectedStudentFees(selectedStudentFees.filter(s => s._id !== sf._id))
    } else {
      setSelectedStudentFees([...selectedStudentFees, sf])
    }
  }

  const handleSelectAllStudentPage = () => {
    const allPageSelected = studentFees.length > 0 && studentFees.every(sf => selectedStudentFees.some(sel => sel._id === sf._id))
    if (allPageSelected) {
      setSelectedStudentFees(selectedStudentFees.filter(sel => !studentFees.some(sf => sf._id === sel._id)))
    } else {
      const toAdd = studentFees.filter(sf => !selectedStudentFees.some(sel => sel._id === sf._id))
      setSelectedStudentFees([...selectedStudentFees, ...toAdd])
    }
  }

  // Add/Edit trigger (Fee Structure)
  const handleOpenCreate = () => {
    setCurrentFeeStructure(null)
    setFormFields({
      course: classes[0] || '',
      academicYear: '2026-2027',
      tuitionFee: '',
      transportFee: '',
      status: 'Active'
    })
    setValidationErrors({})
    setIsAddEditModalOpen(true)
  }

  const handleOpenEdit = (fs) => {
    setCurrentFeeStructure(fs)
    setFormFields({
      course: fs.course || '',
      academicYear: fs.academicYear || '2026-2027',
      tuitionFee: fs.tuitionFee !== undefined ? String(fs.tuitionFee) : '',
      transportFee: fs.transportFee !== undefined ? String(fs.transportFee) : '',
      status: fs.status || 'Active'
    })
    setValidationErrors({})
    setIsAddEditModalOpen(true)
  }

  const handleOpenDelete = (fs) => {
    setCurrentFeeStructure(fs)
    setIsDeleteConfirmOpen(true)
  }

  // Assign Fee / Edit Assignment triggers (Student Fees)
  const handleOpenAssignFee = () => {
    setCurrentStudentFee(null)
    setAssignFormFields({
      student: '',
      feeStructure: '',
      tuitionFee: '',
      transportFee: '',
      totalFee: '',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })
    setValidationErrors({})
    setIsAssignFeeModalOpen(true)
  }

  const handleOpenEditStudentFee = (sf) => {
    setCurrentStudentFee(sf)
    setAssignFormFields({
      student: sf.student?._id || sf.student || '',
      feeStructure: sf.feeStructure?._id || sf.feeStructure || '',
      tuitionFee: sf.tuitionFee !== undefined ? String(sf.tuitionFee) : '',
      transportFee: sf.transportFee !== undefined ? String(sf.transportFee) : '',
      totalFee: sf.totalFee !== undefined ? String(sf.totalFee) : '',
      dueDate: sf.dueDate ? sf.dueDate.split('T')[0] : ''
    })
    setValidationErrors({})
    setIsAssignFeeModalOpen(true)
  }

  const handleOpenViewStudentFee = (sf) => {
    setCurrentStudentFee(sf)
    setIsStudentViewModalOpen(true)
  }

  const handleOpenDeleteStudentFee = (sf) => {
    setCurrentStudentFee(sf)
    setIsStudentDeleteConfirmOpen(true)
  }

  // Add Payment Modal trigger
  const handleOpenAddPayment = (sf) => {
    setCurrentStudentFee(sf)
    setPaymentFormFields({
      amount: '',
      paymentMethod: 'Cash',
      remarks: ''
    })
    setValidationErrors({})
    setIsAddPaymentModalOpen(true)
  }

  // Dynamic fee calculations inside Assign Fee Modal
  const handleSelectStudentForAssign = (studentId) => {
    setAssignFormFields(prev => ({ ...prev, student: studentId }))
  }

  const handleSelectStructureForAssign = (fsId) => {
    const fs = dropdownFeeStructures.find(item => item._id === fsId)
    if (fs) {
      const tuition = fs.tuitionFee || 0
      const transport = fs.transportFee || 0
      setAssignFormFields(prev => ({
        ...prev,
        feeStructure: fsId,
        tuitionFee: String(tuition),
        transportFee: String(transport),
        totalFee: String(tuition + transport)
      }))
    }
  }

  const handleTuitionChange = (val) => {
    const t = parseFloat(val) || 0
    const tr = parseFloat(assignFormFields.transportFee) || 0
    setAssignFormFields(prev => ({
      ...prev,
      tuitionFee: val,
      totalFee: String(t + tr)
    }))
  }

  const handleTransportChange = (val) => {
    const t = parseFloat(assignFormFields.tuitionFee) || 0
    const tr = parseFloat(val) || 0
    setAssignFormFields(prev => ({
      ...prev,
      transportFee: val,
      totalFee: String(t + tr)
    }))
  }

  // Save changes (Fee Structure)
  const handleSaveFeeStructure = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setValidationErrors({})

    const errors = {}
    if (!formFields.course) {
      errors.course = 'Course is required'
    }
    if (!formFields.academicYear) {
      errors.academicYear = 'Academic year is required'
    }

    const tFee = parseFloat(formFields.tuitionFee)
    if (isNaN(tFee) || tFee < 0) {
      errors.tuitionFee = 'Tuition fee must be greater than or equal to 0'
    }

    const trFee = parseFloat(formFields.transportFee)
    if (isNaN(trFee) || trFee < 0) {
      errors.transportFee = 'Transport fee must be greater than or equal to 0'
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      setSubmitting(false)
      showToast('error', 'Please correct the highlighted fields.')
      return
    }

    try {
      let res
      const payload = {
        course: formFields.course,
        academicYear: formFields.academicYear,
        tuitionFee: tFee,
        transportFee: trFee,
        status: formFields.status
      }

      if (currentFeeStructure) {
        res = await api.put(`/fee-structures/${currentFeeStructure._id}`, payload)
      } else {
        res = await api.post('/fee-structures', payload)
      }

      if (res && res.success) {
        showToast('success', currentFeeStructure ? 'Fee structure updated.' : 'Fee structure created successfully.')
        setIsAddEditModalOpen(false)
        fetchFeeStructures()
      } else {
        showToast('error', res.message || 'Operation failed')
      }
    } catch (err) {
      console.error('Save fee structure error:', err)
      const msg = err.response?.data?.message || err.message || 'Server error occurred'
      showToast('error', msg)
    } finally {
      setSubmitting(false)
    }
  }

  // Save changes (Student Fees Assignment)
  const handleSaveStudentFee = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setValidationErrors({})

    const errors = {}
    if (!assignFormFields.student) {
      errors.student = 'Student selection is required'
    }
    if (!assignFormFields.feeStructure) {
      errors.feeStructure = 'Fee structure selection is required'
    }
    if (!assignFormFields.dueDate) {
      errors.dueDate = 'Due date is required'
    }

    const tFee = parseFloat(assignFormFields.tuitionFee)
    if (isNaN(tFee) || tFee < 0) {
      errors.tuitionFee = 'Tuition fee must be greater than or equal to 0'
    }

    const trFee = parseFloat(assignFormFields.transportFee)
    if (isNaN(trFee) || trFee < 0) {
      errors.transportFee = 'Transport fee must be greater than or equal to 0'
    }

    const totalF = parseFloat(assignFormFields.totalFee)
    if (isNaN(totalF) || totalF < 0) {
      errors.totalFee = 'Total fee must be greater than or equal to 0'
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      setSubmitting(false)
      showToast('error', 'Please correct the highlighted fields.')
      return
    }

    try {
      let res
      const payload = {
        student: assignFormFields.student,
        feeStructure: assignFormFields.feeStructure,
        tuitionFee: tFee,
        transportFee: trFee,
        totalFee: totalF,
        dueDate: assignFormFields.dueDate
      }

      if (currentStudentFee) {
        res = await api.put(`/student-fees/${currentStudentFee._id}`, payload)
      } else {
        res = await api.post('/student-fees', payload)
      }

      if (res && res.success) {
        showToast('success', currentStudentFee ? 'Fee assignment updated.' : 'Fee structure assigned successfully.')
        setIsAssignFeeModalOpen(false)
        fetchStudentFees()
      } else {
        showToast('error', res.message || 'Operation failed')
      }
    } catch (err) {
      console.error('Save student fee error:', err)
      const msg = err.response?.data?.message || err.message || 'Server error occurred'
      showToast('error', msg)
    } finally {
      setSubmitting(false)
    }
  }

  // Record a payment against an assigned student fee
  const handleSavePayment = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setValidationErrors({})

    const errors = {}
    const amount = parseFloat(paymentFormFields.amount)
    const pending = (currentStudentFee.totalFee || 0) - (currentStudentFee.paidAmount || 0)

    if (isNaN(amount) || amount <= 0) {
      errors.amount = 'Amount must be greater than 0'
    } else if (amount > pending) {
      errors.amount = `Amount cannot exceed the pending balance of ₹${pending.toLocaleString('en-IN')}`
    }

    if (!paymentFormFields.paymentMethod) {
      errors.paymentMethod = 'Payment mode is required'
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      setSubmitting(false)
      showToast('error', 'Please correct the highlighted fields.')
      return
    }

    try {
      const res = await api.post(`/student-fees/${currentStudentFee._id}/payments`, {
        amount,
        paymentMethod: paymentFormFields.paymentMethod,
        remarks: paymentFormFields.remarks
      })

      if (res && res.success) {
        showToast('success', `Payment of ₹${amount.toLocaleString('en-IN')} recorded successfully.`)
        setIsAddPaymentModalOpen(false)
        fetchStudentFees()
      } else {
        showToast('error', res.message || 'Failed to record payment')
      }
    } catch (err) {
      console.error('Record payment error:', err)
      const msg = err.response?.data?.message || err.message || 'Server error occurred'
      showToast('error', msg)
    } finally {
      setSubmitting(false)
    }
  }

  // Delete single (Fee Structure)
  const handleDeleteFeeStructure = async () => {
    if (!currentFeeStructure) return
    try {
      const res = await api.delete(`/fee-structures/${currentFeeStructure._id}`)
      if (res && res.success) {
        showToast('success', 'Fee structure deleted successfully.')
        setIsDeleteConfirmOpen(false)
        setSelectedFeeStructures(selectedFeeStructures.filter(s => s._id !== currentFeeStructure._id))
        fetchFeeStructures()
      } else {
        showToast('error', res.message || 'Failed to delete fee structure')
      }
    } catch (err) {
      showToast('error', err.message || 'Delete operation failed')
    }
  }

  // Delete single (Student Fee Assignment)
  const handleDeleteStudentFee = async () => {
    if (!currentStudentFee) return
    try {
      const res = await api.delete(`/student-fees/${currentStudentFee._id}`)
      if (res && res.success) {
        showToast('success', 'Student fee assignment deleted successfully.')
        setIsStudentDeleteConfirmOpen(false)
        setSelectedStudentFees(selectedStudentFees.filter(s => s._id !== currentStudentFee._id))
        fetchStudentFees()
      } else {
        showToast('error', res.message || 'Failed to delete fee assignment')
      }
    } catch (err) {
      showToast('error', err.message || 'Delete operation failed')
    }
  }

  // Bulk deletes
  const handleBulkDelete = async () => {
    if (selectedFeeStructures.length === 0) return
    setBulkDeleting(true)
    try {
      const ids = selectedFeeStructures.map(s => s._id)
      const res = await api.delete('/fee-structures/bulk', { data: { ids } })
      if (res && res.success) {
        showToast('success', `Successfully deleted ${selectedFeeStructures.length} fee structures.`)
        setSelectedFeeStructures([])
        setIsBulkDeleteConfirmOpen(false)
        fetchFeeStructures()
      } else {
        showToast('error', res.message || 'Bulk delete failed')
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to execute bulk deletion')
    } finally {
      setBulkDeleting(false)
    }
  }

  const handleStudentBulkDelete = async () => {
    if (selectedStudentFees.length === 0) return
    setStudentBulkDeleting(true)
    try {
      const ids = selectedStudentFees.map(s => s._id)
      const res = await api.delete('/student-fees/bulk', { data: { ids } })
      if (res && res.success) {
        showToast('success', `Successfully deleted ${selectedStudentFees.length} assignments.`)
        setSelectedStudentFees([])
        setIsStudentBulkDeleteConfirmOpen(false)
        fetchStudentFees()
      } else {
        showToast('error', res.message || 'Bulk delete failed')
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to execute bulk deletion')
    } finally {
      setStudentBulkDeleting(false)
    }
  }

  // Trigger browser print window with custom document body write (No external packages needed)
  const handlePrintReceipt = (receipt) => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${receipt.receiptNo}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 40px; }
            .header { text-align: center; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: 800; color: #1E3A8A; }
            .title { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #666; margin-top: 5px; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
            .col { line-height: 1.6; }
            .col strong { color: #111; }
            .amount-box { background-color: #F3F4F6; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 40px; }
            .amount-title { font-size: 10px; text-transform: uppercase; color: #666; letter-spacing: 1px; }
            .amount-value { font-size: 32px; font-weight: 900; color: #10B981; margin-top: 5px; }
            .footer { margin-top: 80px; text-align: center; border-top: 1px solid #E5E7EB; padding-top: 20px; font-size: 12px; color: #999; }
            .signature { margin-top: 40px; display: flex; justify-content: space-between; }
            .sig-line { border-top: 1px solid #999; width: 200px; text-align: center; padding-top: 5px; margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">{user?.tenantName ? user.tenantName.toUpperCase() : 'INSTITUTION'}</div>
            <div class="title">Official Payment Receipt</div>
          </div>
          <div class="amount-box">
            <div class="amount-title">Amount Paid</div>
            <div class="amount-value">₹${receipt.amount.toLocaleString('en-IN')}</div>
          </div>
          <div class="details">
            <div class="col">
              <strong>Receipt Number:</strong> ${receipt.receiptNo}<br/>
              <strong>Payment Date:</strong> ${new Date(receipt.paidAt).toLocaleDateString()}<br/>
              <strong>Payment Mode:</strong> ${receipt.paymentMethod}
            </div>
            <div class="col">
              <strong>Student Name:</strong> ${receipt.studentName}<br/>
              <strong>Admission Number:</strong> ${receipt.admissionNo}<br/>
              <strong>Course / Year:</strong> ${receipt.course} [${receipt.academicYear}]
            </div>
          </div>
          <div class="signature">
            <div>
              <strong>Collected By:</strong> ${receipt.collectedBy || 'Admin'}<br/>
              <strong>Status:</strong> Completed
            </div>
            <div class="sig-line">Authorized Signatory</div>
          </div>
          <div class="footer">
            Thank you for your payment. For any queries, please email billing@ckclasses.com
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  // Format dropdown select options
  const studentOptions = dropdownStudents.map(s => ({
    value: s._id,
    label: `${s.firstName} ${s.lastName} (${s.studentId}) - ${s.class}`,
    searchText: `${s.firstName} ${s.lastName} ${s.studentId} ${s.class}`
  }))

  const structureOptions = dropdownFeeStructures.map(fs => ({
    value: fs._id,
    label: `${fs.course} [${fs.academicYear}] (Tuition: ₹${fs.tuitionFee?.toLocaleString('en-IN')}, Transport: ₹${fs.transportFee?.toLocaleString('en-IN')})`,
    searchText: `${fs.course} ${fs.academicYear}`
  }))

  return (
    <div className="flex-1 w-full h-full text-slate-800 flex flex-col gap-6 select-none min-h-0 bg-transparent overflow-y-auto pr-1 custom-scrollbar">
      
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="text-left space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase select-none">
            <span>Admin</span>
            <span>/</span>
            <span className="text-brand-blue-600">Fees</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none mt-1">
            Fee Management
          </h2>
          <p className="text-[11px] font-bold text-slate-400 mt-1.5">
            Configure fee structure, track student balances, manage collections, and receipts
          </p>
        </div>
      </div>

      {/* 2. Custom Tabs Switcher Bar */}
      <div 
        style={{ borderRadius: '24px', border: '1px solid #ECECEC' }}
        className="px-7 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex items-center gap-6 shrink-0 select-none overflow-x-auto custom-scrollbar"
      >
        {tabsList.map(tab => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "py-4.5 text-xs font-black uppercase tracking-wider relative cursor-pointer whitespace-nowrap outline-none",
                isActive ? "text-brand-blue-600" : "text-slate-400 hover:text-slate-650"
              )}
            >
              {tab.label}
              {isActive && (
                <motion.div 
                  layoutId="activeFeeTabLine" 
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-blue-500 rounded-full" 
                  transition={spring}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* 3. Main Active Content View Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18, ease: 'easeInOut' }}
          className="flex-grow flex flex-col gap-5 min-h-0 text-left"
        >
          {/* Tab Page Header & Description */}
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">
              {currentTabInfo.label}
            </h3>
            <p className="text-xs font-bold text-slate-400">
              {currentTabInfo.description}
            </p>
          </div>

          {/* --------------------------------------------------------- */}
          {/* DASHBOARD TAB PANEL                                       */}
          {/* --------------------------------------------------------- */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-6">
              {dashboardLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white border border-slate-100 rounded-3xl">
                  <RefreshCw className="h-7 w-7 text-blue-500 animate-spin" />
                  <span className="text-xs font-bold text-slate-400">Loading dashboard stats...</span>
                </div>
              ) : dashboardError ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white border border-red-100 rounded-3xl text-red-500">
                  <AlertCircle className="h-7 w-7" />
                  <span className="text-xs font-bold">{dashboardError}</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                    <DashboardStatCard
                      title="Total Fee Structures"
                      value={dashboardStats?.totalFeeStructures || 0}
                      subtitle="Configured courses/years"
                      icon={BookOpen}
                      iconBgColor="bg-blue-50"
                      iconColor="text-blue-500"
                      className="py-3 px-5"
                    />
                    <DashboardStatCard
                      title="Active Fee Structures"
                      value={dashboardStats?.activeFeeStructures || 0}
                      subtitle="Active configurations"
                      icon={Check}
                      iconBgColor="bg-emerald-50"
                      iconColor="text-emerald-500"
                      valueColor="text-emerald-600"
                      className="py-3 px-5"
                    />
                    <DashboardStatCard
                      title="Assigned Students"
                      value={dashboardStats?.totalStudentFeeRecords || 0}
                      subtitle="Assigned fee profiles"
                      icon={Users}
                      iconBgColor="bg-indigo-50"
                      iconColor="text-indigo-500"
                      className="py-3 px-5"
                    />
                    <DashboardStatCard
                      title="Paid Students"
                      value={dashboardStats?.paidStudents || 0}
                      subtitle="Fully settled"
                      icon={Check}
                      iconBgColor="bg-emerald-50"
                      iconColor="text-emerald-500"
                      valueColor="text-emerald-600"
                      className="py-3 px-5"
                    />
                    <DashboardStatCard
                      title="Partial Students"
                      value={dashboardStats?.partialStudents || 0}
                      subtitle="Partially settled"
                      icon={AlertCircle}
                      iconBgColor="bg-amber-50"
                      iconColor="text-amber-500"
                      valueColor="text-amber-600"
                      className="py-3 px-5"
                    />
                    <DashboardStatCard
                      title="Unpaid Students"
                      value={dashboardStats?.unpaidStudents || 0}
                      subtitle="No payments recorded"
                      icon={AlertCircle}
                      iconBgColor="bg-red-50"
                      iconColor="text-red-500"
                      valueColor="text-red-650"
                      className="py-3 px-5"
                    />
                    <DashboardStatCard
                      title="Total Fee Collected"
                      value={`₹${(dashboardStats?.totalFeeCollected || 0).toLocaleString('en-IN')}`}
                      subtitle="Total collected amount"
                      icon={CreditCard}
                      iconBgColor="bg-emerald-50"
                      iconColor="text-emerald-500"
                      valueColor="text-emerald-600"
                      className="py-3 px-5"
                    />
                    <DashboardStatCard
                      title="Total Pending Amount"
                      value={`₹${(dashboardStats?.totalPendingAmount || 0).toLocaleString('en-IN')}`}
                      subtitle="Total outstanding amount"
                      icon={CreditCard}
                      iconBgColor="bg-red-50"
                      iconColor="text-red-500"
                      valueColor="text-red-650"
                      className="py-3 px-5"
                    />
                  </div>

                  {/* Dashboard grids details */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Monthly Collections Chart */}
                    <div 
                      style={{ borderRadius: '28px', border: '1px solid #ECECEC' }}
                      className="bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)] space-y-4"
                    >
                      <h4 className="text-xs font-black text-slate-800 tracking-tight uppercase">Monthly Collections</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dashboardStats?.monthlyCollections || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: 9, fill: '#94A3B8', fontWeight: 700 }} />
                            <YAxis tickLine={false} axisLine={false} style={{ fontSize: 9, fill: '#94A3B8', fontWeight: 700 }} />
                            <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px', fontWeight: 'bold' }} />
                            <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                              {(dashboardStats?.monthlyCollections || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3B82F6' : '#6366F1'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Right: Students with Highest Pending Fees */}
                    <div 
                      style={{ borderRadius: '28px', border: '1px solid #ECECEC' }}
                      className="bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)] space-y-4"
                    >
                      <h4 className="text-xs font-black text-slate-800 tracking-tight uppercase">Highest Outstanding Balances</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[400px]">
                          <thead className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 h-8 border-b border-slate-100">
                            <tr>
                              <th>Student</th>
                              <th>Course</th>
                              <th>Pending</th>
                              <th>Total/Paid</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-[10px] font-semibold text-slate-600">
                            {dashboardStats?.highestPendingStudents?.map(s => (
                              <tr key={s._id} className="h-11">
                                <td className="font-extrabold text-slate-800">{s.studentName}</td>
                                <td>{s.course}</td>
                                <td className="font-mono text-red-500 font-extrabold">₹{s.pendingAmount.toLocaleString('en-IN')}</td>
                                <td className="text-slate-400 font-mono">₹{s.totalFee.toLocaleString('en-IN')} / ₹{s.paidAmount.toLocaleString('en-IN')}</td>
                              </tr>
                            ))}
                            {(!dashboardStats?.highestPendingStudents || dashboardStats.highestPendingStudents.length === 0) && (
                              <tr>
                                <td colSpan="4" className="py-6 text-center text-slate-400">No outstanding balances.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Bottom Left: Recent Payments */}
                    <div 
                      style={{ borderRadius: '28px', border: '1px solid #ECECEC' }}
                      className="bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)] space-y-4 lg:col-span-2"
                    >
                      <h4 className="text-xs font-black text-slate-800 tracking-tight uppercase">Recent Receipts & Payments</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                          <thead className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 h-8 border-b border-slate-100">
                            <tr>
                              <th>Receipt No</th>
                              <th>Student</th>
                              <th>Amount</th>
                              <th>Payment Mode</th>
                              <th>Date</th>
                              <th>Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-[10px] font-semibold text-slate-650">
                            {dashboardStats?.recentPayments?.map(p => (
                              <tr key={p._id} className="h-11">
                                <td className="font-mono text-blue-650 font-black">{p.receiptNo}</td>
                                <td className="font-extrabold text-slate-800">{p.studentName}</td>
                                <td className="font-mono font-extrabold text-emerald-650">₹{p.amount.toLocaleString('en-IN')}</td>
                                <td>
                                  <span className="px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 font-bold text-[9px]">
                                    {p.paymentMethod}
                                  </span>
                                </td>
                                <td className="text-slate-450">{new Date(p.paidAt).toLocaleDateString()}</td>
                                <td className="text-slate-400 truncate max-w-xs">{p.notes}</td>
                              </tr>
                            ))}
                            {(!dashboardStats?.recentPayments || dashboardStats.recentPayments.length === 0) && (
                              <tr>
                                <td colSpan="6" className="py-6 text-center text-slate-400">No recent payments.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Bottom Right: Upcoming Due Payments */}
                    <div 
                      style={{ borderRadius: '28px', border: '1px solid #ECECEC' }}
                      className="bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)] space-y-4 lg:col-span-2"
                    >
                      <h4 className="text-xs font-black text-slate-800 tracking-tight uppercase">Upcoming Due Payments</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                          <thead className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 h-8 border-b border-slate-100">
                            <tr>
                              <th>Student</th>
                              <th>Admission No</th>
                              <th>Pending Amount</th>
                              <th>Due Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-[10px] font-semibold text-slate-600">
                            {dashboardStats?.upcomingDuePayments?.map(s => (
                              <tr key={s._id} className="h-11">
                                <td className="font-extrabold text-slate-800">{s.studentName}</td>
                                <td className="font-mono font-extrabold text-slate-500">{s.admissionNo}</td>
                                <td className="font-mono text-red-500 font-extrabold">₹{s.pendingAmount.toLocaleString('en-IN')}</td>
                                <td className="text-slate-455 font-extrabold">{new Date(s.dueDate).toLocaleDateString()}</td>
                              </tr>
                            ))}
                            {(!dashboardStats?.upcomingDuePayments || dashboardStats.upcomingDuePayments.length === 0) && (
                              <tr>
                                <td colSpan="4" className="py-6 text-center text-slate-400">No upcoming due payments.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'structure' && (
            <>
              {/* Controls Row */}
              <div 
                style={{ borderRadius: '24px', border: '1px solid #ECECEC' }}
                className="p-5 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0"
              >
                <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
                  <input
                    type="text"
                    placeholder="Search by course or academic year..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full h-10 pl-11 pr-5 rounded-full border border-slate-200 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50/50"
                  />
                  <Search className="absolute left-4 top-2.5 h-4.5 w-4.5 text-slate-400" />
                </form>

                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={courseFilter}
                    onChange={(e) => { setCourseFilter(e.target.value); setPage(1); }}
                    className="h-10 px-4 bg-white border border-slate-200 rounded-full text-xs font-extrabold text-slate-550 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
                  >
                    <option value="">All Courses</option>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>

                  <select
                    value={yearFilter}
                    onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
                    className="h-10 px-4 bg-white border border-slate-200 rounded-full text-xs font-extrabold text-slate-550 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
                  >
                    <option value="">All Academic Years</option>
                    {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="h-10 px-4 bg-white border border-slate-200 rounded-full text-xs font-extrabold text-slate-550 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>

                  {(search || courseFilter || yearFilter || statusFilter) && (
                    <button
                      onClick={clearFilters}
                      className="h-10 px-4.5 rounded-full border border-red-200 hover:bg-red-50 text-xs font-extrabold text-red-500 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      Clear
                    </button>
                  )}

                  <div className="h-6 w-[1px] bg-slate-200 mx-1" />

                  <button
                    onClick={handleOpenCreate}
                    className="h-10 px-5 rounded-full bg-brand-blue-500 hover:bg-brand-blue-600 active:scale-95 text-xs font-extrabold text-white shadow-premium-2 cursor-pointer flex items-center justify-center gap-2 transition-all shrink-0 font-sans"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Structure</span>
                  </button>
                </div>
              </div>

              {/* Table listing */}
              <div 
                style={{ borderRadius: '28px', border: '1px solid #ECECEC' }}
                className="bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex-grow flex flex-col justify-between relative overflow-hidden min-h-[350px]"
              >
                <AnimatePresence>
                  {selectedFeeStructures.length > 0 && (
                    <motion.div
                      initial={{ y: -60, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -60, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className="absolute top-0 left-0 right-0 h-16 bg-slate-900 text-white px-8 flex items-center justify-between z-20"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black tracking-wider uppercase text-slate-400">Selected:</span>
                        <span className="text-sm font-black bg-slate-800 px-3 py-1 rounded-full">{selectedFeeStructures.length}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedFeeStructures([])}
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

                <div className="overflow-y-auto overflow-x-auto flex-grow min-h-0">
                  <table className="w-full text-left min-w-[900px]">
                    <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest select-none">
                      <tr className="h-14">
                        <th className="pl-6 w-[50px]">
                          <input
                            type="checkbox"
                            checked={feeStructures.length > 0 && feeStructures.every(fs => selectedFeeStructures.some(sel => sel._id === fs._id))}
                            onChange={handleSelectAllPage}
                            className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </th>
                        <th className="px-4">Course</th>
                        <th className="px-4">Academic Year</th>
                        <th className="px-4">Tuition Fee</th>
                        <th className="px-4">Transport Fee</th>
                        <th className="px-4">Status</th>
                        <th className="px-6 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100/50 text-[11px] font-bold text-slate-600">
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="py-20 text-center">
                            <div className="flex flex-col items-center justify-center gap-3">
                              <RefreshCw className="h-7 w-7 text-blue-500 animate-spin" />
                              <span className="text-xs font-bold text-slate-400">Loading fee structures...</span>
                            </div>
                          </td>
                        </tr>
                      ) : feeStructures.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-24 text-center">
                            <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                              <div className="h-14 w-14 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200/50 text-slate-300">
                                <BookOpen className="h-7 w-7" />
                              </div>
                              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">No Fee Structures Found</h4>
                              <p className="text-[10px] text-slate-400 leading-normal">
                                We couldn't find any fee structures matching your criteria. Try adding one or resetting queries.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        feeStructures.map((fs) => {
                          const isSelected = selectedFeeStructures.some(s => s._id === fs._id)

                          return (
                            <tr 
                              key={fs._id}
                              className={cn(
                                "h-[68px] hover:bg-slate-50/50 transition-colors group",
                                isSelected && "bg-blue-50/20 hover:bg-blue-50/30"
                              )}
                            >
                              <td className="pl-6">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleSelectFeeStructure(fs)}
                                  className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              </td>

                              <td className="px-4 text-xs font-black text-slate-800">
                                {fs.course}
                              </td>

                              <td className="px-4 font-extrabold text-slate-550">
                                {fs.academicYear}
                              </td>

                              <td className="px-4 font-mono font-extrabold text-slate-800">
                                ₹{fs.tuitionFee?.toLocaleString('en-IN')}
                              </td>

                              <td className="px-4 font-mono font-extrabold text-slate-800">
                                ₹{fs.transportFee?.toLocaleString('en-IN')}
                              </td>

                              <td className="px-4">
                                <span className={cn(
                                  "px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase inline-block border",
                                  fs.status === 'Active'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : 'bg-slate-100 text-slate-400 border-slate-200'
                                )}>
                                  {fs.status}
                                </span>
                              </td>

                              <td className="px-6 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOpenEdit(fs)}
                                    className="h-8 w-8 rounded-full bg-white hover:bg-slate-50 border border-slate-200/50 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors shadow-sm cursor-pointer"
                                    title="Edit Fee Structure"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenDelete(fs)}
                                    className="h-8 w-8 rounded-full bg-white hover:bg-red-50 border border-slate-200/50 flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors shadow-sm cursor-pointer"
                                    title="Delete Fee Structure"
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

                {/* Pagination Controls */}
                {!loading && !error && feeStructures.length > 0 && (
                  <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-4 select-none flex-none">
                    <span className="text-[11px] text-slate-400 font-black">
                      Page {page} of {totalPages} (Total: {total})
                    </span>
                    <div className="flex gap-2">
                      <button 
                        disabled={page === 1}
                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                        className="h-8 px-3 rounded-full border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-550 disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span>Previous</span>
                      </button>
                      <button 
                        disabled={page === totalPages}
                        onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                        className="h-8 px-3 rounded-full border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-550 disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        <span>Next</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'student' && (
            <>
              {/* Controls Row */}
              <div 
                style={{ borderRadius: '24px', border: '1px solid #ECECEC' }}
                className="p-5 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0"
              >
                <form onSubmit={handleStudentSearchSubmit} className="flex-1 max-w-md relative">
                  <input
                    type="text"
                    placeholder="Search by student name or ID..."
                    value={studentSearch}
                    onChange={(e) => handleStudentSearchChange(e.target.value)}
                    className="w-full h-10 pl-11 pr-5 rounded-full border border-slate-200 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50/50"
                  />
                  <Search className="absolute left-4 top-2.5 h-4.5 w-4.5 text-slate-400" />
                </form>

                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={studentCourseFilter}
                    onChange={(e) => { setStudentCourseFilter(e.target.value); setStudentPage(1); }}
                    className="h-10 px-4 bg-white border border-slate-200 rounded-full text-xs font-extrabold text-slate-550 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
                  >
                    <option value="">All Courses</option>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>

                  <select
                    value={studentYearFilter}
                    onChange={(e) => { setStudentYearFilter(e.target.value); setStudentPage(1); }}
                    className="h-10 px-4 bg-white border border-slate-200 rounded-full text-xs font-extrabold text-slate-550 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
                  >
                    <option value="">All Academic Years</option>
                    {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>

                  <select
                    value={studentStatusFilter}
                    onChange={(e) => { setStudentStatusFilter(e.target.value); setStudentPage(1); }}
                    className="h-10 px-4 bg-white border border-slate-200 rounded-full text-xs font-extrabold text-slate-550 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Overdue">Overdue</option>
                  </select>

                  {(studentSearch || studentCourseFilter || studentYearFilter || studentStatusFilter) && (
                    <button
                      onClick={clearStudentFilters}
                      className="h-10 px-4.5 rounded-full border border-red-200 hover:bg-red-50 text-xs font-extrabold text-red-500 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      Clear
                    </button>
                  )}

                  <div className="h-6 w-[1px] bg-slate-200 mx-1" />

                  <button
                    onClick={handleOpenAssignFee}
                    className="h-10 px-5 rounded-full bg-brand-blue-500 hover:bg-brand-blue-600 active:scale-95 text-xs font-extrabold text-white shadow-premium-2 cursor-pointer flex items-center justify-center gap-2 transition-all shrink-0 font-sans"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Assign Fee</span>
                  </button>
                </div>
              </div>

              {/* Table Listing */}
              <div 
                style={{ borderRadius: '28px', border: '1px solid #ECECEC' }}
                className="bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex-grow flex flex-col justify-between relative overflow-hidden min-h-[350px]"
              >
                <AnimatePresence>
                  {selectedStudentFees.length > 0 && (
                    <motion.div
                      initial={{ y: -60, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -60, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className="absolute top-0 left-0 right-0 h-16 bg-slate-900 text-white px-8 flex items-center justify-between z-20"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black tracking-wider uppercase text-slate-400">Selected:</span>
                        <span className="text-sm font-black bg-slate-800 px-3 py-1 rounded-full">{selectedStudentFees.length}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedStudentFees([])}
                          className="h-9 px-4 rounded-full border border-slate-700 hover:bg-slate-800 text-xs font-extrabold text-slate-300 cursor-pointer transition-colors"
                        >
                          Cancel Selection
                        </button>
                        <button
                          onClick={() => setIsStudentBulkDeleteConfirmOpen(true)}
                          className="h-9 px-5 rounded-full bg-red-600 hover:bg-red-700 text-xs font-extrabold text-white cursor-pointer shadow-md transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Selected</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="overflow-y-auto overflow-x-auto flex-grow min-h-0">
                  <table className="w-full text-left min-w-[1000px]">
                    <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest select-none">
                      <tr className="h-14">
                        <th className="pl-6 w-[50px]">
                          <input
                            type="checkbox"
                            checked={studentFees.length > 0 && studentFees.every(sf => selectedStudentFees.some(sel => sel._id === sf._id))}
                            onChange={handleSelectAllStudentPage}
                            className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </th>
                        <th className="px-4">Student Name</th>
                        <th className="px-4">Admission Number</th>
                        <th className="px-4">Course</th>
                        <th className="px-4">Academic Year</th>
                        <th className="px-4">Total Fee</th>
                        <th className="px-4">Paid Amount</th>
                        <th className="px-4">Pending Amount</th>
                        <th className="px-4">Due Date</th>
                        <th className="px-4">Status</th>
                        <th className="px-6 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100/50 text-[11px] font-bold text-slate-600">
                      {studentFeesLoading ? (
                        <tr>
                          <td colSpan="11" className="py-20 text-center">
                            <div className="flex flex-col items-center justify-center gap-3">
                              <RefreshCw className="h-7 w-7 text-blue-500 animate-spin" />
                              <span className="text-xs font-bold text-slate-400">Loading student fees...</span>
                            </div>
                          </td>
                        </tr>
                      ) : studentFees.length === 0 ? (
                        <tr>
                          <td colSpan="11" className="py-24 text-center">
                            <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                              <div className="h-14 w-14 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200/50 text-slate-300">
                                <Users className="h-7 w-7" />
                              </div>
                              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">No Student Fees Assigned</h4>
                              <p className="text-[10px] text-slate-400 leading-normal">
                                We couldn't find any student fee assignments. Click the "Assign Fee" button to set up a new record.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        studentFees.map((sf) => {
                          const isSelected = selectedStudentFees.some(s => s._id === sf._id)
                          const studentName = sf.student 
                            ? `${sf.student.firstName} ${sf.student.lastName}`
                            : 'Unknown Student'
                          const admissionNumber = sf.student?.studentId || 'N/A'
                          const pendingAmount = (sf.totalFee || 0) - (sf.paidAmount || 0)
                          
                          const courseName = sf.feeStructure?.course || sf.course || 'N/A'
                          const academicYearName = sf.feeStructure?.academicYear || sf.academicYear || 'N/A'

                          return (
                            <tr 
                              key={sf._id}
                              className={cn(
                                "h-[68px] hover:bg-slate-50/50 transition-colors group",
                                isSelected && "bg-blue-50/20 hover:bg-blue-50/30"
                              )}
                            >
                              <td className="pl-6">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleSelectStudentFee(sf)}
                                  className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              </td>

                              <td className="px-4 text-xs font-black text-slate-800">
                                {studentName}
                              </td>

                              <td className="px-4 font-mono font-extrabold text-slate-550">
                                {admissionNumber}
                              </td>

                              <td className="px-4 text-slate-700">
                                {courseName}
                              </td>

                              <td className="px-4 text-slate-550 font-extrabold">
                                {academicYearName}
                              </td>

                              <td className="px-4 font-mono font-extrabold text-slate-800">
                                ₹{sf.totalFee?.toLocaleString('en-IN')}
                              </td>

                              <td className="px-4 font-mono font-extrabold text-emerald-655">
                                ₹{sf.paidAmount?.toLocaleString('en-IN')}
                              </td>

                              <td className="px-4 font-mono font-extrabold text-red-500">
                                ₹{pendingAmount?.toLocaleString('en-IN')}
                              </td>

                              <td className="px-4 text-slate-455 font-extrabold">
                                {sf.dueDate ? new Date(sf.dueDate).toLocaleDateString() : 'N/A'}
                              </td>

                              <td className="px-4">
                                <span className={cn(
                                  "px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase inline-block border",
                                  sf.status === 'Paid' && 'bg-emerald-50 text-emerald-700 border-emerald-100',
                                  sf.status === 'Partial' && 'bg-amber-50 text-amber-700 border-amber-100',
                                  sf.status === 'Unpaid' && 'bg-red-50 text-red-700 border-red-100',
                                  sf.status === 'Overdue' && 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse'
                                )}>
                                  {sf.status}
                                </span>
                              </td>

                              <td className="px-6 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {pendingAmount > 0 && (
                                    <button
                                      onClick={() => handleOpenAddPayment(sf)}
                                      className="h-8 w-8 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-650 transition-colors shadow-sm cursor-pointer"
                                      title="Record a Payment"
                                    >
                                      <CreditCard className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleOpenViewStudentFee(sf)}
                                    className="h-8 w-8 rounded-full bg-white hover:bg-slate-50 border border-slate-200/50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors shadow-sm cursor-pointer"
                                    title="View details"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditStudentFee(sf)}
                                    className="h-8 w-8 rounded-full bg-white hover:bg-slate-50 border border-slate-200/50 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors shadow-sm cursor-pointer"
                                    title="Edit assignment rates"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenDeleteStudentFee(sf)}
                                    className="h-8 w-8 rounded-full bg-white hover:bg-red-50 border border-slate-200/50 flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors shadow-sm cursor-pointer"
                                    title="Delete assignment"
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

                {/* Pagination Controls */}
                {!studentFeesLoading && !studentFeesError && studentFees.length > 0 && (
                  <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-4 select-none flex-none">
                    <span className="text-[11px] text-slate-400 font-black">
                      Page {studentPage} of {studentTotalPages} (Total: {studentTotal})
                    </span>
                    <div className="flex gap-2">
                      <button 
                        disabled={studentPage === 1}
                        onClick={() => setStudentPage(prev => Math.max(prev - 1, 1))}
                        className="h-8 px-3 rounded-full border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span>Previous</span>
                      </button>
                      <button 
                        disabled={studentPage === studentTotalPages}
                        onClick={() => setStudentPage(prev => Math.min(prev + 1, studentTotalPages))}
                        className="h-8 px-3 rounded-full border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        <span>Next</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* --------------------------------------------------------- */}
          {/* RECEIPTS TAB PANEL                                        */}
          {/* --------------------------------------------------------- */}
          {activeTab === 'receipts' && (
            <>
              {/* Controls Row */}
              <div 
                style={{ borderRadius: '24px', border: '1px solid #ECECEC' }}
                className="p-5 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0"
              >
                <form onSubmit={handleReceiptSearchSubmit} className="flex-1 max-w-md relative">
                  <input
                    type="text"
                    placeholder="Search by receipt number, student name or ID..."
                    value={receiptSearch}
                    onChange={(e) => handleReceiptSearchChange(e.target.value)}
                    className="w-full h-10 pl-11 pr-5 rounded-full border border-slate-200 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50/50"
                  />
                  <Search className="absolute left-4 top-2.5 h-4.5 w-4.5 text-slate-400" />
                </form>

                {receiptSearch && (
                  <button
                    onClick={() => { setReceiptSearch(''); setReceiptPage(1); }}
                    className="h-10 px-4.5 rounded-full border border-red-200 hover:bg-red-50 text-xs font-extrabold text-red-500 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>

              {/* Table Listing */}
              <div 
                style={{ borderRadius: '28px', border: '1px solid #ECECEC' }}
                className="bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex-grow flex flex-col justify-between relative overflow-hidden min-h-[350px]"
              >
                <div className="overflow-y-auto overflow-x-auto flex-grow min-h-0">
                  <table className="w-full text-left min-w-[900px]">
                    <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest select-none">
                      <tr className="h-14">
                        <th className="pl-6">Receipt Number</th>
                        <th className="px-4">Student</th>
                        <th className="px-4">Amount</th>
                        <th className="px-4">Payment Method</th>
                        <th className="px-4">Collected Date</th>
                        <th className="px-6 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100/50 text-[11px] font-bold text-slate-650">
                      {receiptsLoading ? (
                        <tr>
                          <td colSpan="6" className="py-20 text-center">
                            <div className="flex flex-col items-center justify-center gap-3">
                              <RefreshCw className="h-7 w-7 text-blue-500 animate-spin" />
                              <span className="text-xs font-bold text-slate-400">Loading receipts logs...</span>
                            </div>
                          </td>
                        </tr>
                      ) : receipts.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-24 text-center">
                            <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                              <div className="h-14 w-14 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200/50 text-slate-300">
                                <FileText className="h-7 w-7" />
                              </div>
                              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">No Receipts Found</h4>
                              <p className="text-[10px] text-slate-400 leading-normal">
                                Once you record payment transactions inside the Student Fees operational view, receipts will populate automatically here.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        receipts.map((r) => (
                          <tr key={r._id} className="h-14 hover:bg-slate-50/50 transition-colors">
                            <td className="pl-6 font-mono text-blue-650 font-black text-xs">
                              {r.receiptNo}
                            </td>
                            <td className="px-4 text-xs font-black text-slate-800">
                              {r.studentName}
                            </td>
                            <td className="px-4 font-mono font-extrabold text-emerald-650">
                              ₹{r.amount?.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-650 font-bold border border-slate-200 text-[10px]">
                                {r.paymentMethod}
                              </span>
                            </td>
                            <td className="px-4 text-slate-450">
                              {new Date(r.paidAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => { setSelectedReceipt(r); setIsReceiptModalOpen(true); }}
                                  className="h-8 w-8 rounded-full bg-white hover:bg-slate-50 border border-slate-200/50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors shadow-sm cursor-pointer"
                                  title="View Receipt Detail"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handlePrintReceipt(r)}
                                  className="h-8 w-8 rounded-full bg-white hover:bg-blue-50 border border-slate-200/50 flex items-center justify-center text-slate-450 hover:text-blue-600 transition-colors shadow-sm cursor-pointer"
                                  title="Print / Save PDF"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {!receiptsLoading && !receiptsError && receipts.length > 0 && (
                  <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-4 select-none flex-none">
                    <span className="text-[11px] text-slate-400 font-black">
                      Page {receiptPage} of {receiptTotalPages} (Total: {receiptTotal})
                    </span>
                    <div className="flex gap-2">
                      <button 
                        disabled={receiptPage === 1}
                        onClick={() => setReceiptPage(prev => Math.max(prev - 1, 1))}
                        className="h-8 px-3 rounded-full border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span>Previous</span>
                      </button>
                      <button 
                        disabled={receiptPage === receiptTotalPages}
                        onClick={() => setReceiptPage(prev => Math.min(prev + 1, receiptTotalPages))}
                        className="h-8 px-3 rounded-full border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        <span>Next</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

        </motion.div>
      </AnimatePresence>

      {/* CREATE / EDIT MODAL (Fee Structure) */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={currentFeeStructure ? "Edit Fee Structure" : "Create Fee Structure"}
        size="md"
      >
        <form onSubmit={handleSaveFeeStructure} className="space-y-5 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">
                Course / Class *
              </label>
              <select
                value={formFields.course}
                onChange={(e) => setFormFields({ ...formFields, course: e.target.value })}
                className={cn(
                  "w-full h-10 px-3 rounded-premium-md border border-[var(--border-light)] bg-white text-sm text-[var(--text-primary)] shadow-premium-1 focus:border-brand-blue-500 focus:outline-none focus:ring-4 focus:ring-brand-blue-50/50 transition-all duration-200",
                  validationErrors.course && "border-[var(--danger-solid)]"
                )}
              >
                <option value="">Select Course</option>
                {classes.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {validationErrors.course && (
                <p className="text-[11px] font-medium text-[var(--danger-text)] mt-0.5">{validationErrors.course}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">
                Academic Year *
              </label>
              <select
                value={formFields.academicYear}
                onChange={(e) => setFormFields({ ...formFields, academicYear: e.target.value })}
                className={cn(
                  "w-full h-10 px-3 rounded-premium-md border border-[var(--border-light)] bg-white text-sm text-[var(--text-primary)] shadow-premium-1 focus:border-brand-blue-500 focus:outline-none focus:ring-4 focus:ring-brand-blue-50/50 transition-all duration-200",
                  validationErrors.academicYear && "border-[var(--danger-solid)]"
                )}
              >
                <option value="">Select Academic Year</option>
                {academicYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              {validationErrors.academicYear && (
                <p className="text-[11px] font-medium text-[var(--danger-text)] mt-0.5">{validationErrors.academicYear}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Tuition Fee (₹) *"
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 15000"
              value={formFields.tuitionFee}
              onChange={(e) => setFormFields({ ...formFields, tuitionFee: e.target.value })}
              error={validationErrors.tuitionFee}
            />

            <Input
              label="Transport Fee (₹) *"
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 5000"
              value={formFields.transportFee}
              onChange={(e) => setFormFields({ ...formFields, transportFee: e.target.value })}
              error={validationErrors.transportFee}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">
              Status
            </label>
            <select
              value={formFields.status}
              onChange={(e) => setFormFields({ ...formFields, status: e.target.value })}
              className="w-full h-10 px-3 rounded-premium-md border border-[var(--border-light)] bg-white text-sm text-[var(--text-primary)] shadow-premium-1 focus:border-brand-blue-500 focus:outline-none focus:ring-4 focus:ring-brand-blue-50/50 transition-all duration-200"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
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
              {currentFeeStructure ? "Update" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION (Fee Structure) */}
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Delete Fee Structure"
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
              Are you sure you want to delete this fee structure? This configuration will be permanently removed.
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
              onClick={handleDeleteFeeStructure}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* BULK DELETE CONFIRMATION (Fee Structure) */}
      <Modal
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        title="Delete Selected Configurations"
        size="sm"
      >
        <div className="text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto shadow-sm">
            <Trash2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-tight leading-none mb-1">
              Confirm Bulk Deletion
            </h3>
            <p className="text-xs text-slate-455 mt-1.5 font-semibold leading-relaxed">
              Are you sure you want to delete the {selectedFeeStructures.length} selected configurations? This action cannot be undone.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setIsBulkDeleteConfirmOpen(false)}
              disabled={bulkDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              isLoading={bulkDeleting}
              disabled={bulkDeleting}
              onClick={handleBulkDelete}
            >
              Delete All
            </Button>
          </div>
        </div>
      </Modal>

      {/* ASSIGN / EDIT STUDENT FEE MODAL */}
      <Modal
        isOpen={isAssignFeeModalOpen}
        onClose={() => setIsAssignFeeModalOpen(false)}
        title={currentStudentFee ? "Edit Fee Assignment Rates" : "Assign Fee Structure"}
        size="md"
      >
        <form onSubmit={handleSaveStudentFee} className="space-y-5 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">
                Select Student *
              </label>
              {currentStudentFee ? (
                <div className="w-full h-11 px-4 border rounded-[16px] text-xs font-semibold text-slate-550 bg-slate-100 flex items-center cursor-not-allowed">
                  {currentStudentFee.student 
                    ? `${currentStudentFee.student.firstName} ${currentStudentFee.student.lastName} (${currentStudentFee.student.studentId})`
                    : 'N/A'}
                </div>
              ) : (
                <SearchableSelect
                  placeholder="Select student..."
                  value={assignFormFields.student}
                  onChange={handleSelectStudentForAssign}
                  options={studentOptions}
                  error={!!validationErrors.student}
                />
              )}
              {validationErrors.student && (
                <p className="text-[11px] font-medium text-[var(--danger-text)] mt-0.5">{validationErrors.student}</p>
              )}
            </div>

            {/* Fee structure selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">
                Select Fee Structure *
              </label>
              {currentStudentFee ? (
                <div className="w-full h-11 px-4 border rounded-[16px] text-xs font-semibold text-slate-550 bg-slate-100 flex items-center cursor-not-allowed">
                  {currentStudentFee.feeStructure?.course || currentStudentFee.course} [{currentStudentFee.feeStructure?.academicYear || currentStudentFee.academicYear}]
                </div>
              ) : (
                <SearchableSelect
                  placeholder="Select configuration..."
                  value={assignFormFields.feeStructure}
                  onChange={handleSelectStructureForAssign}
                  options={structureOptions}
                  error={!!validationErrors.feeStructure}
                />
              )}
              {validationErrors.feeStructure && (
                <p className="text-[11px] font-medium text-[var(--danger-text)] mt-0.5">{validationErrors.feeStructure}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tuition Fee */}
            <Input
              label="Tuition Fee (₹) *"
              type="number"
              min="0"
              step="any"
              value={assignFormFields.tuitionFee}
              onChange={(e) => handleTuitionChange(e.target.value)}
              error={validationErrors.tuitionFee}
            />

            {/* Transport Fee */}
            <Input
              label="Transport Fee (₹) *"
              type="number"
              min="0"
              step="any"
              value={assignFormFields.transportFee}
              onChange={(e) => handleTransportChange(e.target.value)}
              error={validationErrors.transportFee}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Fee (Calculated) */}
            <Input
              label="Total Fee (₹)"
              type="number"
              disabled
              value={assignFormFields.totalFee}
              error={validationErrors.totalFee}
              className="bg-slate-50"
            />

            {/* Due Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">
                Due Date *
              </label>
              <input
                type="date"
                value={assignFormFields.dueDate ? assignFormFields.dueDate.split('T')[0] : ''}
                onChange={(e) => setAssignFormFields({ ...assignFormFields, dueDate: e.target.value })}
                className={cn(
                  "w-full h-10 px-3 rounded-premium-md border border-[var(--border-light)] bg-white text-sm text-[var(--text-primary)] shadow-premium-1 focus:border-brand-blue-500 focus:outline-none focus:ring-4 focus:ring-brand-blue-50/50 transition-all duration-200",
                  validationErrors.dueDate && "border-[var(--danger-solid)]"
                )}
              />
              {validationErrors.dueDate && (
                <p className="text-[11px] font-medium text-[var(--danger-text)] mt-0.5">{validationErrors.dueDate}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={() => setIsAssignFeeModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={submitting}
              disabled={submitting}
            >
              {currentStudentFee ? "Update" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ADD PAYMENT MODAL */}
      <Modal
        isOpen={isAddPaymentModalOpen}
        onClose={() => setIsAddPaymentModalOpen(false)}
        title="Record Payment"
        size="md"
      >
        {currentStudentFee && (
          <form onSubmit={handleSavePayment} className="space-y-5 text-left">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-slate-650">
                <span>Student Name:</span>
                <span className="text-slate-800 font-black">
                  {currentStudentFee.student ? `${currentStudentFee.student.firstName} ${currentStudentFee.student.lastName}` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-650">
                <span>Course & Academic Year:</span>
                <span className="text-slate-800 font-extrabold">
                  {currentStudentFee.feeStructure?.course || currentStudentFee.course} [{currentStudentFee.feeStructure?.academicYear || currentStudentFee.academicYear}]
                </span>
              </div>
              <hr className="border-slate-100" />
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Total Fee</span>
                  <span className="text-xs font-black text-slate-800 font-mono">₹{currentStudentFee.totalFee?.toLocaleString('en-IN')}</span>
                </div>
                <div className="border-x border-slate-100">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Paid Amount</span>
                  <span className="text-xs font-black text-emerald-600 font-mono">₹{currentStudentFee.paidAmount?.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Pending</span>
                  <span className="text-xs font-black text-red-500 font-mono">₹{((currentStudentFee.totalFee || 0) - (currentStudentFee.paidAmount || 0)).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Payment Amount */}
              <Input
                label="Payment Amount (₹) *"
                type="number"
                min="0.01"
                step="any"
                placeholder="e.g. 5000"
                value={paymentFormFields.amount}
                onChange={(e) => setPaymentFormFields({ ...paymentFormFields, amount: e.target.value })}
                error={validationErrors.amount}
              />

              {/* Payment Method */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">
                  Payment Mode *
                </label>
                <select
                  value={paymentFormFields.paymentMethod}
                  onChange={(e) => setPaymentFormFields({ ...paymentFormFields, paymentMethod: e.target.value })}
                  className="w-full h-10 px-3 rounded-premium-md border border-[var(--border-light)] bg-white text-sm text-[var(--text-primary)] shadow-premium-1 focus:border-brand-blue-500 focus:outline-none focus:ring-4 focus:ring-brand-blue-50/50 transition-all duration-200"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            {/* Remarks */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">
                Remarks / Notes
              </label>
              <textarea
                placeholder="Optional payment notes..."
                value={paymentFormFields.remarks}
                onChange={(e) => setPaymentFormFields({ ...paymentFormFields, remarks: e.target.value })}
                rows="2.5"
                className="w-full p-3 rounded-premium-md border border-[var(--border-light)] bg-white text-xs font-bold text-[var(--text-primary)] shadow-premium-1 focus:border-brand-blue-500 focus:outline-none focus:ring-4 focus:ring-brand-blue-55/40 outline-none transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                onClick={() => setIsAddPaymentModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={submitting}
                disabled={submitting}
              >
                Save Payment
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* VIEW DETAILS MODAL */}
      <Modal
        isOpen={isStudentViewModalOpen}
        onClose={() => setIsStudentViewModalOpen(false)}
        title="Student Fee Details & Payment History"
        size="lg"
      >
        {currentStudentFee && (
          <div className="space-y-6 text-left text-xs font-bold text-slate-700">
            
            {/* Student & Course Details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-brand-blue-600 uppercase tracking-widest">
                  Student Information
                </h4>
                <div className="grid grid-cols-3 gap-y-2 text-[11px]">
                  <span className="text-slate-400">Full Name:</span>
                  <span className="col-span-2 font-black text-slate-800">
                    {currentStudentFee.student 
                      ? `${currentStudentFee.student.firstName} ${currentStudentFee.student.lastName}`
                      : 'Unknown'}
                  </span>
                  
                  <span className="text-slate-400">Admission No:</span>
                  <span className="col-span-2 font-mono font-extrabold text-slate-800">
                    {currentStudentFee.student?.studentId || 'N/A'}
                  </span>
                  
                  <span className="text-slate-400">Class Grade:</span>
                  <span className="col-span-2 text-slate-800">{currentStudentFee.student?.class || 'N/A'}</span>
                  
                  <span className="text-slate-400">Email Address:</span>
                  <span className="col-span-2 text-slate-800 font-semibold truncate">{currentStudentFee.student?.email || 'N/A'}</span>
                  
                  <span className="text-slate-400">Phone Number:</span>
                  <span className="col-span-2 text-slate-800 font-mono">{currentStudentFee.student?.phone || 'N/A'}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-brand-blue-600 uppercase tracking-widest">
                  Assigned Setup
                </h4>
                <div className="grid grid-cols-3 gap-y-2 text-[11px]">
                  <span className="text-slate-400">Fee Scheme:</span>
                  <span className="col-span-2 text-slate-800 font-black">
                    {currentStudentFee.feeStructure?.course || currentStudentFee.course}
                  </span>

                  <span className="text-slate-400">Academic Year:</span>
                  <span className="col-span-2 text-slate-800 font-black">
                    {currentStudentFee.feeStructure?.academicYear || currentStudentFee.academicYear}
                  </span>

                  <span className="text-slate-400">Tuition Rate:</span>
                  <span className="col-span-2 text-slate-800 font-mono">₹{currentStudentFee.tuitionFee?.toLocaleString('en-IN')}</span>

                  <span className="text-slate-400">Transport Rate:</span>
                  <span className="col-span-2 text-slate-800 font-mono">₹{currentStudentFee.transportFee?.toLocaleString('en-IN')}</span>

                  <span className="text-slate-400">Due Date:</span>
                  <span className="col-span-2 text-slate-800 font-black">
                    {currentStudentFee.dueDate ? new Date(currentStudentFee.dueDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Overview block */}
            <div className="grid grid-cols-3 gap-4 border border-slate-100 p-5 rounded-2xl">
              <div className="text-center">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Total Amount</span>
                <span className="text-lg font-black text-slate-800 mt-1 block">
                  ₹{currentStudentFee.totalFee?.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-center border-x border-slate-100">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Total Paid</span>
                <span className="text-lg font-black text-emerald-600 mt-1 block">
                  ₹{currentStudentFee.paidAmount?.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-center">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Pending Amount</span>
                <span className="text-lg font-black text-red-500 mt-1 block">
                  ₹{((currentStudentFee.totalFee || 0) - (currentStudentFee.paidAmount || 0)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Payment history transactions list */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-brand-blue-600 uppercase tracking-widest pb-1 border-b border-slate-100">
                Payment History
              </h4>
              <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[9px] uppercase tracking-wider font-extrabold text-slate-400 h-9">
                    <tr>
                      <th className="pl-4">Receipt No</th>
                      <th className="px-4">Date</th>
                      <th className="px-4">Amount</th>
                      <th className="px-4">Payment Method</th>
                      <th className="px-4">Collected By</th>
                      <th className="px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-[10px] font-semibold text-slate-650">
                    {currentStudentFee.payments && currentStudentFee.payments.length > 0 ? (
                      currentStudentFee.payments.map((p, idx) => (
                        <tr key={p._id || idx} className="h-10">
                          <td className="pl-4 font-mono text-blue-650 font-black">
                            {p.receiptNo || 'N/A'}
                          </td>
                          <td className="px-4 text-slate-550 font-medium">
                            {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 font-mono font-extrabold text-slate-800">
                            ₹{p.amount?.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                              {p.paymentMethod}
                            </span>
                          </td>
                          <td className="px-4 text-slate-800">
                            {p.collectedBy || 'Admin'}
                          </td>
                          <td className="px-4 text-slate-400 truncate max-w-[150px]" title={p.notes}>
                            {p.notes || '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                          No payments recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                onClick={() => setIsStudentViewModalOpen(false)}
              >
                Close
              </Button>
            </div>

          </div>
        )}
      </Modal>

      {/* DELETE CONFIRMATION (Student Fee Assignment) */}
      <Modal
        isOpen={isStudentDeleteConfirmOpen}
        onClose={() => setIsStudentDeleteConfirmOpen(false)}
        title="Delete Student Fee Assignment"
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
              Are you sure you want to delete this fee assignment? This action cannot be undone.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setIsStudentDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleDeleteStudentFee}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* BULK DELETE CONFIRMATION (Student Fees) */}
      <Modal
        isOpen={isStudentBulkDeleteConfirmOpen}
        onClose={() => setIsStudentBulkDeleteConfirmOpen(false)}
        title="Delete Selected Assignments"
        size="sm"
      >
        <div className="text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto shadow-sm">
            <Trash2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-tight leading-none mb-1">
              Confirm Bulk Deletion
            </h3>
            <p className="text-xs text-slate-455 mt-1.5 font-semibold leading-relaxed">
              Are you sure you want to delete the {selectedStudentFees.length} selected configurations? This action will remove all assignments.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setIsStudentBulkDeleteConfirmOpen(false)}
              disabled={studentBulkDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              isLoading={studentBulkDeleting}
              disabled={studentBulkDeleting}
              onClick={handleStudentBulkDelete}
            >
              Delete All
            </Button>
          </div>
        </div>
      </Modal>

      {/* RECEIPT VIEW MODAL */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Official Payment Receipt"
        size="md"
      >
        {selectedReceipt && (
          <div className="space-y-6 text-left text-xs font-bold text-slate-700">
            <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-5">
              <div className="text-center border-b border-blue-100 pb-4">
                <h2 className="text-lg font-black text-slate-800 tracking-tight">{user?.tenantName ? user.tenantName.toUpperCase() : 'INSTITUTION'}</h2>
                <p className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase mt-1">Official Payment Receipt</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[11px] leading-relaxed">
                <div>
                  <span className="text-slate-400 block font-semibold">Receipt Number:</span>
                  <span className="font-mono text-blue-650 font-black">{selectedReceipt.receiptNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Date of Payment:</span>
                  <span className="text-slate-800 font-black">{new Date(selectedReceipt.paidAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Student Name:</span>
                  <span className="text-slate-800 font-black">{selectedReceipt.studentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Admission Number:</span>
                  <span className="text-slate-800 font-mono font-extrabold">{selectedReceipt.admissionNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Course & Year:</span>
                  <span className="text-slate-800 font-extrabold">{selectedReceipt.course} [{selectedReceipt.academicYear}]</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Payment Mode:</span>
                  <span className="text-slate-850 font-extrabold">{selectedReceipt.paymentMethod}</span>
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200/50 rounded-xl text-center space-y-1">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold">Total Amount Collected</span>
                <span className="text-2xl font-black text-emerald-650 font-mono">₹{selectedReceipt.amount?.toLocaleString('en-IN')}</span>
              </div>

              <div className="text-slate-400 text-[10px] font-medium italic text-center pt-2">
                Collected by: {selectedReceipt.collectedBy || 'Admin'} • Auto-generated by CK Management ERP
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                onClick={() => setIsReceiptModalOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => handlePrintReceipt(selectedReceipt)}
                className="flex items-center gap-1.5"
              >
                <Download className="h-4 w-4" />
                <span>Print / Save PDF</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}
