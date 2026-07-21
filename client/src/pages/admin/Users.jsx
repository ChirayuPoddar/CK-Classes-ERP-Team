import React, { useState, useEffect, useCallback } from 'react'
import { 
  Plus, 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  Check, 
  RefreshCw, 
  ShieldAlert, 
  Laptop, 
  Smartphone, 
  Key, 
  Lock, 
  Unlock, 
  X, 
  LogOut, 
  BookOpen, 
  GraduationCap, 
  Users as UsersIcon,
  UserCheck
} from 'lucide-react'
import api from '@/services/api'
import { cn } from '@/utils/cn'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import DashboardStatCard from '@/components/common/DashboardStatCard'
import { TablePagination, TableRowActions } from '@/components/common/DataTable'

const roles = ['All', 'Admin', 'Teacher', 'Student', 'Parent', 'Receptionist', 'Accountant']
const statuses = ['All', 'Active', 'Blocked']

export default function Users() {
  const { user: currentUser } = useAuth()

  // State management
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [unlinkedProfiles, setUnlinkedProfiles] = useState({ unlinkedTeachers: [], unlinkedStudents: [], allStudents: [] })

  // Search & Filtering states
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsersCount, setTotalUsersCount] = useState(0)

  // Toast notification state
  const [toast, setToast] = useState(null)
  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4500)
  }

  // Active Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false)
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false)
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false)
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Selected Record & Form States
  const [selectedUser, setSelectedUser] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [formErrors, setFormErrors] = useState({})

  const [formFields, setFormFields] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'Teacher',
    password: '',
    linkedTeacher: '',
    linkedStudent: '',
    linkedChildren: []
  })

  // Frontend helper: Phone normalization
  const normalizePhone = (ph) => {
    if (!ph) return ''
    const digits = ph.replace(/\D/g, '')
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
    return digits
  }

  // Frontend helper: Phone validation
  const validatePhone = (ph) => {
    if (!ph) return true
    const norm = normalizePhone(ph)
    return /^[6-9]\d{9}$/.test(norm)
  }

  // Frontend helper: Email validation
  const validateEmail = (em) => {
    if (!em) return false
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.trim().toLowerCase())
  }

  // Fetch Unlinked Profiles
  const fetchUnlinkedProfiles = useCallback(async () => {
    try {
      const res = await api.get('/users/unlinked-profiles')
      if (res && res.success && res.data) {
        setUnlinkedProfiles(res.data)
      }
    } catch {
      // Catch silently
    }
  }, [])

  // Fetch Users Listing
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        role: roleFilter !== 'All' ? roleFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined
      }
      const res = await api.get('/users', { params })
      if (res && res.success && res.data) {
        setUsers(res.data.users || [])
        setTotalPages(res.data.totalPages || 1)
        setTotalUsersCount(res.data.total || 0)
      }
    } catch {
      setError('Failed to load users list.')
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter, statusFilter])

  // Fetch KPI Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/users/stats')
      if (res && res.success && res.data) {
        setStats(res.data)
      }
    } catch {
      // Catch silently
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    fetchStats()
    fetchUnlinkedProfiles()
  }, [fetchStats, fetchUnlinkedProfiles])

  // Open Create Modal
  const handleOpenCreate = () => {
    setSelectedUser(null)
    setFormFields({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'Teacher',
      password: '',
      linkedTeacher: '',
      linkedStudent: '',
      linkedChildren: []
    })
    setFormErrors({})
    fetchUnlinkedProfiles()
    setIsAddEditModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (user) => {
    setSelectedUser(user)
    setFormFields({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Teacher',
      password: '',
      linkedTeacher: user.linkedTeacher?._id || user.linkedTeacher || '',
      linkedStudent: user.linkedStudent?._id || user.linkedStudent || '',
      linkedChildren: (user.linkedChildren || []).map(c => c._id || c)
    })
    setFormErrors({})
    fetchUnlinkedProfiles()
    setIsAddEditModalOpen(true)
  }

  // Open View Details Drawer
  const handleOpenView = async (user) => {
    try {
      const res = await api.get(`/users/${user._id}`)
      if (res && res.success && res.data) {
        setSelectedUser(res.data)
      } else {
        setSelectedUser(user)
      }
    } catch {
      setSelectedUser(user)
    }
    setIsViewDetailsOpen(true)
  }

  // Open Manage Sessions Modal
  const handleOpenSessions = async (user) => {
    try {
      const res = await api.get(`/users/${user._id}`)
      if (res && res.success && res.data) {
        setSelectedUser(res.data)
      } else {
        setSelectedUser(user)
      }
    } catch {
      setSelectedUser(user)
    }
    setIsSessionsModalOpen(true)
  }

  // Open Reset Password Modal
  const handleOpenResetPassword = (user) => {
    setSelectedUser(user)
    setNewPassword('')
    setIsResetPasswordOpen(true)
  }

  // Open Block / Unblock Modal
  const handleOpenBlock = (user) => {
    setSelectedUser(user)
    setIsBlockModalOpen(true)
  }

  // Open Delete Confirmation Modal
  const handleOpenDelete = (user) => {
    setSelectedUser(user)
    setIsDeleteModalOpen(true)
  }

  // Frontend helper: Password policy validation
  const validatePasswordFormat = (pwd) => {
    if (!pwd) return false
    return pwd.length >= 8 &&
      /[A-Z]/.test(pwd) &&
      /[a-z]/.test(pwd) &&
      /[0-9]/.test(pwd) &&
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)
  }

  // Save User (Create or Update)
  const handleSaveUser = async (e) => {
    e.preventDefault()
    const errors = {}

    if (!formFields.firstName.trim() || formFields.firstName.trim().length < 2) {
      errors.firstName = 'First name is required (min 2 characters).'
    }
    if (!formFields.lastName.trim() || formFields.lastName.trim().length < 1) {
      errors.lastName = 'Last name is required.'
    }
    
    if (!formFields.email.trim()) {
      errors.email = 'Email address is required.'
    } else if (!validateEmail(formFields.email)) {
      errors.email = 'Please enter a valid email address.'
    }

    if (formFields.phone && !validatePhone(formFields.phone)) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile number.'
    }

    if (!selectedUser && !formFields.password) {
      errors.password = 'Password is required for new accounts.'
    } else if (formFields.password && !validatePasswordFormat(formFields.password)) {
      errors.password = 'Password must be min 8 chars with 1 uppercase, 1 lowercase, 1 number & 1 special character.'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      showToast('error', 'Please correct the highlighted form errors.')
      return
    }

    setSubmitting(true)
    setFormErrors({})

    try {
      const payload = {
        firstName: formFields.firstName.trim(),
        lastName: formFields.lastName.trim(),
        email: formFields.email.toLowerCase().trim(),
        phone: normalizePhone(formFields.phone),
        role: formFields.role.toLowerCase(),
        linkedTeacher: formFields.role === 'Teacher' ? formFields.linkedTeacher || null : null,
        linkedStudent: formFields.role === 'Student' ? formFields.linkedStudent || null : null,
        linkedChildren: formFields.role === 'Parent' ? formFields.linkedChildren : []
      }

      if (formFields.password) {
        payload.password = formFields.password
      }

      let res
      if (selectedUser) {
        res = await api.patch(`/users/${selectedUser._id}`, payload)
      } else {
        res = await api.post('/users', payload)
      }

      if (res && res.success) {
        showToast('success', selectedUser ? 'User account updated successfully.' : 'User account created successfully.')
        setIsAddEditModalOpen(false)
        fetchUsers()
        fetchStats()
        fetchUnlinkedProfiles()
      } else {
        showToast('error', res.message || res.error?.message || 'Failed to save user.')
      }
    } catch (err) {
      const data = err.response?.data
      const msg = data?.message || data?.error?.message || 'Failed to save user account.'
      const code = data?.code || data?.error?.code
      const field = data?.error?.field

      if (code === 'EMAIL_ALREADY_EXISTS' || code === 'DUPLICATE_EMAIL' || field === 'email') {
        setFormErrors(prev => ({ ...prev, email: 'An account with this email address already exists.' }))
      } else if (code === 'PHONE_ALREADY_EXISTS' || code === 'DUPLICATE_PHONE' || field === 'phone') {
        setFormErrors(prev => ({ ...prev, phone: 'An account with this phone number already exists.' }))
      } else if (code === 'PROFILE_ALREADY_LINKED') {
        setFormErrors(prev => ({ ...prev, profileLink: 'This profile is already linked to another account.' }))
      } else if (code === 'INVALID_PROFILE_LINK') {
        setFormErrors(prev => ({ ...prev, profileLink: 'Selected profile reference is invalid or does not exist.' }))
      } else if (data?.error?.details && Array.isArray(data.error.details)) {
        const mapped = {}
        data.error.details.forEach(d => {
          if (d.field) mapped[d.field] = d.message
        })
        setFormErrors(prev => ({ ...prev, ...mapped }))
      }

      showToast('error', msg)
    } finally {
      setSubmitting(false)
    }
  }

  // Reset Password Action
  const handleConfirmResetPassword = async (e) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      showToast('error', 'Password must be at least 6 characters long.')
      return
    }

    setSubmitting(true)
    try {
      const res = await api.post(`/users/${selectedUser._id}/reset-password`, { password: newPassword })
      if (res && res.success) {
        showToast('success', 'Password reset successfully. Active sessions have been invalidated.')
        setIsResetPasswordOpen(false)
        fetchUsers()
      } else {
        showToast('error', res.message || res.error?.message || 'Failed to reset password.')
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || err.response?.data?.error?.message || 'Failed to reset password.')
    } finally {
      setSubmitting(false)
    }
  }

  // Generate Random Temp Password
  const handleGenerateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789#@!'
    let temp = ''
    for (let i = 0; i < 10; i++) {
      temp += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewPassword(temp)
    showToast('info', 'Generated temporary password.')
  }

  // Toggle Block / Unblock Action
  const handleConfirmBlockToggle = async () => {
    if (!selectedUser) return
    setSubmitting(true)
    try {
      let res
      if (selectedUser.isActive) {
        res = await api.patch(`/users/${selectedUser._id}/block`)
      } else {
        res = await api.patch(`/users/${selectedUser._id}/unblock`)
      }

      if (res && res.success) {
        showToast('success', selectedUser.isActive ? 'User account blocked successfully.' : 'User account unblocked successfully.')
        setIsBlockModalOpen(false)
        fetchUsers()
        fetchStats()
      } else {
        showToast('error', res.message || res.error?.message || 'Operation failed.')
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || err.response?.data?.error?.message || 'Operation failed.')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete User Action
  const handleConfirmDelete = async () => {
    if (!selectedUser) return
    setSubmitting(true)
    try {
      const res = await api.delete(`/users/${selectedUser._id}`)
      if (res && res.success) {
        showToast('success', 'User account removed. Linked institutional profile data remains preserved.')
        setIsDeleteModalOpen(false)
        fetchUsers()
        fetchStats()
      } else {
        showToast('error', res.message || res.error?.message || 'Failed to remove user account.')
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || err.response?.data?.error?.message || 'Failed to remove user account.')
    } finally {
      setSubmitting(false)
    }
  }

  // Revoke Single Session
  const handleRevokeSession = async (sessionId) => {
    if (!selectedUser) return
    try {
      const res = await api.delete(`/users/${selectedUser._id}/sessions/${sessionId}`)
      if (res && res.success) {
        showToast('success', 'Session revoked.')
        setSelectedUser(res.data)
        fetchUsers()
        fetchStats()
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || err.response?.data?.error?.message || 'Failed to revoke session.')
    }
  }

  // Revoke All Sessions
  const handleRevokeAllSessions = async () => {
    if (!selectedUser) return
    try {
      const res = await api.delete(`/users/${selectedUser._id}/sessions`)
      if (res && res.success) {
        showToast('success', 'All active sessions signed out.')
        setSelectedUser(res.data)
        fetchUsers()
        fetchStats()
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || err.response?.data?.error?.message || 'Failed to revoke sessions.')
    }
  }

  // Format Last Login display string
  const formatLastLogin = (dateStr) => {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()

    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    if (isToday) return `Today, ${timeString}`
    if (isYesterday) return `Yesterday, ${timeString}`
    return `${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
  }

  // Helper for role badge colors
  const getRoleBadge = (roleStr) => {
    const role = roleStr ? roleStr.toLowerCase() : 'staff'
    switch (role) {
      case 'admin':
        return { label: 'Admin', class: 'bg-purple-50 text-purple-700 border-purple-200' }
      case 'teacher':
        return { label: 'Teacher', class: 'bg-blue-50 text-blue-700 border-blue-200' }
      case 'student':
        return { label: 'Student', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      case 'parent':
        return { label: 'Parent', class: 'bg-amber-50 text-amber-700 border-amber-200' }
      case 'receptionist':
        return { label: 'Receptionist', class: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
      case 'accountant':
        return { label: 'Accountant', class: 'bg-rose-50 text-rose-700 border-rose-200' }
      default:
        return { label: roleStr, class: 'bg-slate-50 text-slate-700 border-slate-200' }
    }
  }

  // Helper for Linked Profile display
  const renderLinkedProfileInfo = (userItem) => {
    const role = userItem.role ? userItem.role.toLowerCase() : ''
    if (role === 'teacher' && userItem.linkedTeacher) {
      const t = userItem.linkedTeacher
      return (
        <div className="flex items-center gap-1.5 min-w-0">
          <BookOpen className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span className="truncate text-xs font-bold text-slate-700">{t.firstName} {t.lastName}</span>
        </div>
      )
    }
    if (role === 'student' && userItem.linkedStudent) {
      const s = userItem.linkedStudent
      return (
        <div className="flex items-center gap-1.5 min-w-0">
          <GraduationCap className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span className="truncate text-xs font-bold text-slate-700">{s.firstName} {s.lastName} · {s.class}</span>
        </div>
      )
    }
    if (role === 'parent' && userItem.linkedChildren && userItem.linkedChildren.length > 0) {
      const c = userItem.linkedChildren[0]
      const extraCount = userItem.linkedChildren.length - 1
      return (
        <div className="flex items-center gap-1.5 min-w-0">
          <UsersIcon className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span className="truncate text-xs font-bold text-slate-700">
            Parent of {c.firstName} {c.lastName} {extraCount > 0 ? `+${extraCount}` : ''}
          </span>
        </div>
      )
    }
    return <span className="text-[11px] font-bold text-slate-400">Staff Account</span>
  }

  // Construct context-aware action menu items for each row
  const getContextActions = (item) => {
    const isSelf = currentUser && (currentUser.id === item._id || currentUser.email === item.email)

    const list = [
      {
        label: 'View Details',
        icon: Eye,
        callback: () => handleOpenView(item)
      },
      {
        label: 'Edit User',
        icon: Edit3,
        callback: () => handleOpenEdit(item)
      },
      {
        label: 'Reset Password',
        icon: Key,
        callback: () => handleOpenResetPassword(item)
      },
      {
        label: 'Manage Sessions',
        icon: Laptop,
        callback: () => handleOpenSessions(item)
      }
    ]

    // Self admin cannot block or remove self!
    if (!isSelf) {
      if (item.isActive) {
        list.push({
          label: 'Block User',
          icon: Lock,
          danger: true,
          callback: () => handleOpenBlock(item)
        })
      } else {
        list.push({
          label: 'Unblock User',
          icon: Unlock,
          callback: () => handleOpenBlock(item)
        })
      }

      list.push({
        label: 'Remove Account',
        icon: Trash2,
        danger: true,
        callback: () => handleOpenDelete(item)
      })
    }

    return list
  }

  return (
    <div className="h-full flex flex-col justify-between space-y-6 text-slate-800">
      
      {/* Toast Notification Container */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 select-none",
              toast.type === 'success' && "bg-emerald-50 border-emerald-200 text-emerald-800",
              toast.type === 'error' && "bg-red-50 border-red-200 text-red-800",
              toast.type === 'info' && "bg-blue-50 border-blue-200 text-blue-800"
            )}
          >
            {toast.type === 'success' && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
            <span>Admin</span>
            <span>/</span>
            <span className="text-slate-600">Users</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Users & Access Management</h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Manage accounts, roles, access, and security across C.K. Classes.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="h-10 px-5 rounded-xl bg-brand-blue-500 hover:bg-brand-blue-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </Button>
      </div>

      {/* KPI DASHBOARD CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <DashboardStatCard
          title="Total Users"
          value={stats ? stats.totalUsers : '--'}
          icon={UsersIcon}
          trend=""
          className="bg-white border-slate-100 shadow-sm"
        />
        <DashboardStatCard
          title="Active Users"
          value={stats ? stats.activeUsers : '--'}
          icon={UserCheck}
          trend=""
          className="bg-white border-slate-100 shadow-sm"
        />
        <DashboardStatCard
          title="Blocked Users"
          value={stats ? stats.blockedUsers : '--'}
          icon={ShieldAlert}
          trend=""
          className="bg-white border-slate-100 shadow-sm"
        />
        <DashboardStatCard
          title="Active Sessions"
          value={stats ? stats.activeSessionsCount : '--'}
          icon={Laptop}
          trend=""
          className="bg-white border-slate-100 shadow-sm"
        />
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 select-none">
        
        {/* Role & Status Filter Badges */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <span className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-wider">Role</span>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setPage(1)
              }}
              className="h-8 px-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              {roles.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <span className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-wider">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="h-8 px-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              {statuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-xs font-semibold placeholder:text-slate-400 outline-none focus:border-brand-blue-500 bg-white transition-colors"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* MAIN USERS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex-1 flex flex-col justify-between">
        <div className="overflow-x-auto min-h-0">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-wider text-slate-400 select-none">
                <th className="py-3.5 pl-6 pr-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Linked Profile</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Last Login</th>
                <th className="py-3.5 px-4 text-center">Sessions</th>
                <th className="py-3.5 pr-6 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-brand-blue-500" />
                      <span>Loading accounts...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-red-500 font-bold">
                    {error}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-medium">
                    No user accounts match your criteria.
                  </td>
                </tr>
              ) : (
                users.map((item) => {
                  const roleBadge = getRoleBadge(item.role)
                  return (
                    <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* USER COLUMN */}
                      <td className="py-3.5 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-600 text-xs shrink-0 select-none">
                            {item.firstName ? item.firstName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <span className="font-extrabold text-slate-900 block truncate">{item.firstName} {item.lastName}</span>
                            <span className="text-[11px] text-slate-400 font-semibold block truncate">{item.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* ROLE COLUMN */}
                      <td className="py-3.5 px-4 select-none">
                        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black border tracking-wide inline-block", roleBadge.class)}>
                          {roleBadge.label}
                        </span>
                      </td>

                      {/* LINKED PROFILE COLUMN */}
                      <td className="py-3.5 px-4">
                        {renderLinkedProfileInfo(item)}
                      </td>

                      {/* STATUS COLUMN */}
                      <td className="py-3.5 px-4 select-none">
                        {item.isActive ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black border bg-emerald-50 text-emerald-600 border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black border bg-red-50 text-red-600 border-red-200">
                            Blocked
                          </span>
                        )}
                      </td>

                      {/* LAST LOGIN COLUMN */}
                      <td className="py-3.5 px-4 text-slate-500 font-bold select-none whitespace-nowrap">
                        {formatLastLogin(item.lastLogin)}
                      </td>

                      {/* SESSIONS COUNTER COLUMN */}
                      <td className="py-3.5 px-4 text-center select-none">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-extrabold font-mono">
                          {item.activeSessionsCount || 0} / {item.maxSessions || (item.role === 'admin' ? 5 : item.role === 'student' ? 1 : 2)}
                        </span>
                      </td>

                      {/* THREE DOT ACTIONS COLUMN */}
                      <td className="py-3.5 pr-6 pl-4 text-right">
                        <TableRowActions actions={getContextActions(item)} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* TABLE PAGINATION */}
        <TablePagination
          page={page}
          totalPages={totalPages}
          total={totalUsersCount}
          onPrev={() => setPage(prev => Math.max(prev - 1, 1))}
          onNext={() => setPage(prev => Math.min(prev + 1, totalPages))}
        />
      </div>

      {/* CREATE / EDIT USER MODAL */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          if (!submitting) setIsAddEditModalOpen(false)
        }}
        title={selectedUser ? "Edit User Account" : "Add User Account"}
        size="lg"
      >
        <form onSubmit={handleSaveUser} className="space-y-4 text-left text-xs font-bold text-slate-700 select-none">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name *"
              type="text"
              placeholder="E.g., Aarav"
              value={formFields.firstName}
              onChange={(e) => setFormFields(prev => ({ ...prev, firstName: e.target.value }))}
              error={formErrors.firstName}
              className="text-xs font-semibold"
            />

            <Input
              label="Last Name *"
              type="text"
              placeholder="E.g., Sharma"
              value={formFields.lastName}
              onChange={(e) => setFormFields(prev => ({ ...prev, lastName: e.target.value }))}
              error={formErrors.lastName}
              className="text-xs font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address *"
              type="email"
              placeholder="aarav@example.com"
              value={formFields.email}
              onChange={(e) => setFormFields(prev => ({ ...prev, email: e.target.value }))}
              error={formErrors.email}
              className="text-xs font-semibold"
            />

            <Input
              label="Phone Number (10 digits)"
              type="text"
              placeholder="9876543210"
              value={formFields.phone}
              onChange={(e) => setFormFields(prev => ({ ...prev, phone: e.target.value }))}
              error={formErrors.phone}
              className="text-xs font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Role Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Account Role *</label>
              <select
                value={formFields.role}
                onChange={(e) => {
                  const val = e.target.value
                  setFormFields(prev => ({ 
                    ...prev, 
                    role: val,
                    linkedTeacher: '',
                    linkedStudent: '',
                    linkedChildren: []
                  }))
                }}
                className="h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold outline-none bg-white focus:border-brand-blue-500 transition-colors w-full cursor-pointer"
              >
                {roles.filter(r => r !== 'All').map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Read-Only Concurrent Sessions Limit Display */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Max Concurrent Logins</label>
              <div className="h-10 px-3 border border-slate-200 bg-slate-50 rounded-xl flex items-center justify-between text-xs font-extrabold text-slate-600">
                <span>{formFields.role === 'Student' ? '1 Concurrent Device' : '2 Concurrent Devices'}</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-black uppercase">Role Rule</span>
              </div>
            </div>
          </div>

          {/* DYNAMIC PROFILE LINKING SELECTORS */}
          <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50/50 space-y-3">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">Profile Linking</span>

            {formFields.role === 'Teacher' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">Link Existing Teacher Profile</label>
                <select
                  value={formFields.linkedTeacher}
                  onChange={(e) => setFormFields(prev => ({ ...prev, linkedTeacher: e.target.value }))}
                  className="h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold outline-none bg-white focus:border-brand-blue-500 w-full"
                >
                  <option value="">Select Unlinked Teacher Profile...</option>
                  {unlinkedProfiles.unlinkedTeachers.map(t => (
                    <option key={t._id} value={t._id}>{t.firstName} {t.lastName} ({t.email})</option>
                  ))}
                </select>
              </div>
            )}

            {formFields.role === 'Student' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">Link Existing Student Profile</label>
                <select
                  value={formFields.linkedStudent}
                  onChange={(e) => setFormFields(prev => ({ ...prev, linkedStudent: e.target.value }))}
                  className="h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold outline-none bg-white focus:border-brand-blue-500 w-full"
                >
                  <option value="">Select Unlinked Student Profile...</option>
                  {unlinkedProfiles.unlinkedStudents.map(s => (
                    <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.studentId} · {s.class})</option>
                  ))}
                </select>
              </div>
            )}

            {formFields.role === 'Parent' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600">Link Student Children (Select Multiple)</label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 bg-white rounded-xl p-2.5 space-y-1.5">
                  {unlinkedProfiles.allStudents.length === 0 ? (
                    <span className="text-[11px] text-slate-400 font-semibold block">No active students available</span>
                  ) : (
                    unlinkedProfiles.allStudents.map(s => {
                      const isChecked = formFields.linkedChildren.includes(s._id)
                      return (
                        <label key={s._id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormFields(prev => ({ ...prev, linkedChildren: [...prev.linkedChildren, s._id] }))
                              } else {
                                setFormFields(prev => ({ ...prev, linkedChildren: prev.linkedChildren.filter(id => id !== s._id) }))
                              }
                            }}
                            className="rounded border-slate-300 text-brand-blue-500 focus:ring-brand-blue-500"
                          />
                          <span>{s.firstName} {s.lastName} ({s.studentId} · {s.class})</span>
                        </label>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {['Admin', 'Receptionist', 'Accountant'].includes(formFields.role) && (
              <p className="text-[11px] font-semibold text-slate-500">
                Staff accounts operate standalone without requiring a separate student or teacher institutional profile.
              </p>
            )}
          </div>

          {/* PASSWORD FIELD (NEW USER OR OVERWRITE) */}
          <Input
            label={selectedUser ? "New Password (Leave blank to keep existing)" : "Password *"}
            type="password"
            placeholder="••••••••"
            value={formFields.password}
            onChange={(e) => setFormFields(prev => ({ ...prev, password: e.target.value }))}
            error={formErrors.password}
            className="text-xs font-semibold"
          />

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-4 select-none">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
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
                <span>Save User Account</span>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAILS DRAWER / MODAL */}
      <Modal
        isOpen={isViewDetailsOpen}
        onClose={() => setIsViewDetailsOpen(false)}
        title="User Account Details"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-5 text-left text-xs font-semibold text-slate-600 select-none">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-brand-blue-50 border border-brand-blue-200 flex items-center justify-center font-black text-brand-blue-600 text-base">
                  {selectedUser.firstName ? selectedUser.firstName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">{selectedUser.firstName} {selectedUser.lastName}</h3>
                  <span className="text-xs font-bold text-slate-400 block">{selectedUser.email}</span>
                </div>
              </div>
              <span className={cn("px-3 py-1 rounded-full text-xs font-black border", getRoleBadge(selectedUser.role).class)}>
                {getRoleBadge(selectedUser.role).label}
              </span>
            </div>

            {/* Account & Profile metadata grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Phone Number</span>
                <span className="text-slate-800 font-bold block mt-0.5">{selectedUser.phone || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Account Status</span>
                <span className={cn("font-bold block mt-0.5", selectedUser.isActive ? "text-emerald-600" : "text-red-600")}>
                  {selectedUser.isActive ? 'Active' : 'Blocked'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Last Login</span>
                <span className="text-slate-800 font-bold block mt-0.5">{formatLastLogin(selectedUser.lastLogin)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Account Created</span>
                <span className="text-slate-800 font-bold block mt-0.5">
                  {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '--'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Session Limit</span>
                <span className="text-slate-800 font-bold block mt-0.5">{selectedUser.maxSessions || 2} concurrent logins</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Linked Profile</span>
                <span className="text-slate-800 font-bold block mt-0.5">{renderLinkedProfileInfo(selectedUser)}</span>
              </div>
            </div>

            {/* Contextual actions from details view */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewDetailsOpen(false)
                  handleOpenSessions(selectedUser)
                }}
                className="h-9 px-4 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5"
              >
                <Laptop className="h-4 w-4 text-brand-blue-500" />
                <span>Manage Sessions ({selectedUser.activeSessions?.length || 0})</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsViewDetailsOpen(false)}
                className="h-9 px-5 rounded-full text-xs font-extrabold text-slate-500"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MANAGE ACTIVE SESSIONS MODAL */}
      <Modal
        isOpen={isSessionsModalOpen}
        onClose={() => setIsSessionsModalOpen(false)}
        title="Manage Active Sessions"
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4 text-left text-xs font-semibold text-slate-700 select-none">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">{selectedUser.firstName} {selectedUser.lastName}</h4>
                <span className="text-[11px] text-slate-400 font-medium block">{selectedUser.email}</span>
              </div>
              {(selectedUser.activeSessions && selectedUser.activeSessions.length > 0) && (
                <button
                  type="button"
                  onClick={handleRevokeAllSessions}
                  className="text-[11px] font-extrabold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out All Devices</span>
                </button>
              )}
            </div>

            {(!selectedUser.activeSessions || selectedUser.activeSessions.length === 0) ? (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center text-slate-400 text-xs font-semibold">
                No active login sessions detected for this account.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {selectedUser.activeSessions.map((session) => (
                  <div key={session.sessionId} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3">
                      {session.device === 'Mobile Device' ? (
                        <Smartphone className="h-5 w-5 text-brand-blue-500 shrink-0" />
                      ) : (
                        <Laptop className="h-5 w-5 text-brand-blue-500 shrink-0" />
                      )}
                      <div>
                        <span className="text-xs font-extrabold text-slate-800 block">{session.device} ({session.browser})</span>
                        <span className="text-[10px] text-slate-400 font-semibold block">
                          Login: {new Date(session.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => handleRevokeSession(session.sessionId)}
                      className="h-7 px-3 text-[10px] font-extrabold text-red-600 border-red-200 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setIsSessionsModalOpen(false)}
                className="h-9 px-5 rounded-full text-xs font-extrabold text-slate-500"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* RESET PASSWORD MODAL */}
      <Modal
        isOpen={isResetPasswordOpen}
        onClose={() => setIsResetPasswordOpen(false)}
        title="Reset Password"
        size="sm"
      >
        {selectedUser && (
          <form onSubmit={handleConfirmResetPassword} className="space-y-4 text-left text-xs font-semibold text-slate-700 select-none">
            <p className="text-slate-500 leading-relaxed">
              Set a new temporary password for <strong className="text-slate-900">{selectedUser.firstName} {selectedUser.lastName}</strong>. Resetting password will terminate all active sessions on other devices.
            </p>

            <div className="space-y-2">
              <Input
                label="New Password *"
                type="password"
                placeholder="Enter new password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="text-xs font-semibold"
              />

              <button
                type="button"
                onClick={handleGenerateTempPassword}
                className="text-[11px] font-extrabold text-brand-blue-600 hover:text-brand-blue-700 cursor-pointer"
              >
                + Generate Random Temporary Password
              </button>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => setIsResetPasswordOpen(false)}
                className="h-9 px-4 rounded-full text-xs font-bold text-slate-500"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="h-9 px-5 rounded-full text-xs font-extrabold bg-brand-blue-500 hover:bg-brand-blue-600 text-white"
              >
                {submitting ? 'Updating...' : 'Reset Password'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* BLOCK / UNBLOCK CONFIRM MODAL */}
      <Modal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        title={selectedUser?.isActive ? "Block User Account" : "Unblock User Account"}
        size="sm"
      >
        {selectedUser && (
          <div className="space-y-4 text-left text-xs font-semibold text-slate-700 select-none">
            <div className={cn(
              "flex items-start gap-3 p-4 rounded-2xl border",
              selectedUser.isActive ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-emerald-50 border-emerald-200 text-emerald-900"
            )}>
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-extrabold">{selectedUser.isActive ? "Confirm Account Block" : "Confirm Account Activation"}</h4>
                <p className="text-[11px] leading-relaxed">
                  {selectedUser.isActive ? (
                    <span>
                      <strong className="text-slate-900">{selectedUser.firstName} {selectedUser.lastName}</strong> will immediately lose access to the ERP and all active sessions will be signed out. Their institutional records (attendance, fees, marks) will remain completely intact.
                    </span>
                  ) : (
                    <span>
                      Unblocking <strong className="text-slate-900">{selectedUser.firstName} {selectedUser.lastName}</strong> will restore login eligibility.
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <Button
                variant="outline"
                disabled={submitting}
                onClick={() => setIsBlockModalOpen(false)}
                className="h-9 px-4 rounded-full text-xs font-bold text-slate-500"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmBlockToggle}
                disabled={submitting}
                className={cn(
                  "h-9 px-5 rounded-full text-xs font-extrabold text-white",
                  selectedUser.isActive ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
                )}
              >
                {submitting ? 'Processing...' : (selectedUser.isActive ? 'Block Account' : 'Unblock Account')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE USER CONFIRM MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Remove User Account"
        size="sm"
      >
        {selectedUser && (
          <div className="space-y-4 text-left text-xs font-semibold text-slate-700 select-none">
            <div className="flex items-start gap-3 bg-red-50 p-4 rounded-2xl border border-red-200 text-red-900">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-extrabold text-red-900">Permanent Account Removal</h4>
                <p className="text-[11px] text-red-700 leading-relaxed">
                  Are you sure you want to remove the login account for <strong className="text-red-950">{selectedUser.firstName} {selectedUser.lastName}</strong> ({selectedUser.email})?
                </p>
                <p className="text-[10px] text-red-600 font-bold mt-1">
                  Note: This removes ERP authentication login credentials ONLY. Student or Teacher institutional profiles, attendance, fees, and exam records will NOT be deleted.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <Button
                variant="outline"
                disabled={submitting}
                onClick={() => setIsDeleteModalOpen(false)}
                className="h-9 px-4 rounded-full text-xs font-bold text-slate-500"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="h-9 px-5 rounded-full text-xs font-extrabold bg-red-600 hover:bg-red-700 text-white"
              >
                {submitting ? 'Removing...' : 'Remove User Account'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}
