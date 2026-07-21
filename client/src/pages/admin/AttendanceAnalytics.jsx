import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft,
  Search,
  Calendar,
  Clock,
  User,
  Check,
  X,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  HelpCircle,
  TrendingDown,
  UserCheck,
  Award,
  AlertCircle,
  History,
  Lock,
  Unlock
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import { cn } from '@/utils/cn'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts'
import * as XLSX from 'xlsx'

const spring = { type: 'spring', stiffness: 350, damping: 28 }

const classesList = [
  'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11 Science', 'Class 11 Commerce',
  'Class 12 Science', 'Class 12 Commerce'
]

const monthsList = [
  { value: '1', name: 'January' },
  { value: '2', name: 'February' },
  { value: '3', name: 'March' },
  { value: '4', name: 'April' },
  { value: '5', name: 'May' },
  { value: '6', name: 'June' },
  { value: '7', name: 'July' },
  { value: '8', name: 'August' },
  { value: '9', name: 'September' },
  { value: '10', name: 'October' },
  { value: '11', name: 'November' },
  { value: '12', name: 'December' }
]

const getStatusColor = (status) => {
  switch (status) {
    case 'Excellent': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    case 'Good': return 'bg-teal-50 text-teal-700 border-teal-100'
    case 'Average': return 'bg-amber-50 text-amber-700 border-amber-100'
    case 'Poor': return 'bg-orange-50 text-orange-700 border-orange-100'
    case 'Critical': return 'bg-rose-50 text-rose-700 border-rose-100'
    default: return 'bg-slate-50 text-slate-700 border-slate-100'
  }
}

const getCalendarDayColor = (status) => {
  switch (status) {
    case 'Present': return 'bg-emerald-500 text-white'
    case 'Absent': return 'bg-rose-500 text-white'
    case 'Late': return 'bg-amber-500 text-white'
    case 'Leave': return 'bg-blue-500 text-white'
    default: return 'bg-slate-100 text-slate-400'
  }
}

const getStatusBadge = (status) => {
  switch (status) {
    case 'Present': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    case 'Absent': return 'bg-rose-50 text-rose-700 border-rose-100'
    case 'Late': return 'bg-amber-50 text-amber-700 border-amber-100'
    case 'Leave': return 'bg-blue-50 text-blue-700 border-blue-100'
    default: return 'bg-slate-50 text-slate-700 border-slate-100'
  }
}

const getAuditTimelineIcon = (action) => {
  switch (action) {
    case 'Created': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
    case 'Edited': return 'bg-blue-50 text-blue-600 border-blue-100'
    case 'Override': return 'bg-amber-50 text-amber-600 border-amber-100'
    case 'Locked': return 'bg-rose-50 text-rose-600 border-rose-100'
    case 'Unlocked': return 'bg-purple-50 text-purple-600 border-purple-100'
    case 'Deleted': return 'bg-red-50 text-red-600 border-red-100'
    default: return 'bg-slate-50 text-slate-600 border-slate-100'
  }
}

export default function AttendanceAnalytics() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  
  // Lists & metadata filters
  const [teachers, setTeachers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [studentsOptions, setStudentsOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  
  // Audit timeline state
  const [timeline, setTimeline] = useState([])
  const [timelineLoading, setTimelineLoading] = useState(false)

  // Filters
  const [classFilter, setClassFilter] = useState('')
  const [teacherFilter, setTeacherFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [selectedStudentFilter, setSelectedStudentFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString())
  
  const getPastDateString = (daysAgo) => {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    return d.toISOString().split('T')[0]
  }
  const [startDate, setStartDate] = useState(getPastDateString(30))
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [thresholdVal, setThresholdVal] = useState(75)
  const [studentSearch, setStudentSearch] = useState('')

  // Analytics Data state
  const [analyticsData, setAnalyticsData] = useState({
    summary: {
      overallPercentage: 0,
      totalSessions: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      leaveCount: 0,
      averageClassAttendance: 0,
      highestClass: 'N/A',
      lowestClass: 'N/A',
      studentsBelowThreshold: 0,
      studentsAbove90: 0,
      totalLateArrivals: 0
    },
    trends: { daily: [], monthly: [] },
    breakdowns: { classWise: [], subjectWise: [], teacherWise: [] },
    studentTable: []
  })

  // Selected student profile view drawer
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [profileTab, setProfileTab] = useState('summary') // 'summary' | 'calendar' | 'subjects'

  // Summary sections active tab
  const [summaryActiveTab, setSummaryActiveTab] = useState('class') // 'class' | 'teacher' | 'subject'

  // Sorting & Pagination for Student Roster table
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const [rosterStudents, setRosterStudents] = useState([])
  const [rosterTotalCount, setRosterTotalCount] = useState(0)
  const [rosterTotalPages, setRosterTotalPages] = useState(1)
  const [rosterLoading, setRosterLoading] = useState(false)

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setPage(1)
  }

  const handleClearFilters = () => {
    setClassFilter('')
    setTeacherFilter('')
    setSubjectFilter('')
    setSelectedStudentFilter('')
    setMonthFilter('')
    setYearFilter(new Date().getFullYear().toString())
    setStartDate(getPastDateString(30))
    setEndDate(new Date().toISOString().split('T')[0])
    setStudentSearch('')
    setPage(1)
  }

  const fetchRoster = async () => {
    if (!isAuthenticated) return
    setRosterLoading(true)
    try {
      const res = await api.get('/attendance/analytics/roster', {
        params: {
          page,
          limit,
          search: studentSearch || undefined,
          sortField,
          sortDirection,
          classId: classFilter || undefined,
          teacherId: teacherFilter || undefined,
          subjectId: subjectFilter || undefined,
          month: monthFilter || undefined,
          year: yearFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        }
      })
      if (res?.success && res?.data) {
        setRosterStudents(res.data.students || [])
        setRosterTotalCount(res.data.totalCount || 0)
        setRosterTotalPages(res.data.totalPages || 1)
      }
    } catch (err) {
      console.error('Roster fetch error:', err)
      showToast('error', 'Failed to retrieve student roster.')
    } finally {
      setRosterLoading(false)
    }
  }

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  // Load system parameter thresholds from database
  const loadSystemSettings = async () => {
    try {
      const res = await api.get('/attendance/settings')
      if (res?.success && res?.data?.attendanceThreshold) {
        setThresholdVal(res.data.attendanceThreshold)
      }
    } catch (err) {
      console.error('Failed to load system config:', err)
    }
  }

  // Load teachers, subjects & students filters
  const fetchFiltersOptions = async () => {
    try {
      const [tRes, sRes, stRes] = await Promise.all([
        api.get('/teachers', { params: { limit: 1000 } }),
        api.get('/subjects', { params: { limit: 1000 } }),
        api.get('/students', { params: { limit: 1000, status: 'Active' } })
      ])
      if (tRes?.success && tRes?.data) setTeachers(tRes.data.teachers || [])
      if (sRes?.success && sRes?.data) setSubjects(sRes.data.subjects || [])
      if (stRes?.success && stRes?.data) setStudentsOptions(stRes.data.students || [])
    } catch (err) {
      console.error('Failed to load filter option arrays:', err)
    }
  }

  // Fetch aggregated analytics dashboard
  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await api.get('/attendance/analytics', {
        params: {
          classId: classFilter || undefined,
          teacherId: teacherFilter || undefined,
          subjectId: subjectFilter || undefined,
          studentId: selectedStudentFilter || undefined,
          month: monthFilter || undefined,
          year: yearFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          threshold: thresholdVal
        }
      })
      if (res?.success && res?.data) {
        setAnalyticsData(res.data)
        setPage(1)
      }
    } catch (err) {
      console.error('Analytics query error:', err)
      showToast('error', 'Failed to retrieve analytics dashboard.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch timeline logs
  const fetchTimeline = async () => {
    setTimelineLoading(true)
    try {
      const res = await api.get('/attendance/timeline')
      if (res?.success && res?.data) {
        setTimeline(res.data)
      }
    } catch (err) {
      console.error('Timeline query error:', err)
    } finally {
      setTimelineLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    loadSystemSettings()
    fetchFiltersOptions()
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return
    fetchAnalytics()
    fetchTimeline()
  }, [classFilter, teacherFilter, subjectFilter, selectedStudentFilter, monthFilter, yearFilter, startDate, endDate, thresholdVal, isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return
    setPage(1)
  }, [classFilter, teacherFilter, subjectFilter, selectedStudentFilter, studentSearch, monthFilter, yearFilter, startDate, endDate, limit, isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return
    fetchRoster()
  }, [classFilter, teacherFilter, subjectFilter, selectedStudentFilter, monthFilter, yearFilter, startDate, endDate, studentSearch, sortField, sortDirection, page, limit, isAuthenticated])

  // Fetch specific student profile analytics
  const handleOpenProfileDrawer = async (studentId) => {
    setProfileLoading(true)
    setIsProfileOpen(true)
    setProfileTab('summary')
    try {
      const res = await api.get(`/attendance/student/${studentId}`)
      if (res?.success && res?.data) {
        setProfileData(res.data)
      }
    } catch (err) {
      console.error('Student profile load error:', err)
      showToast('error', 'Failed to retrieve student profile.')
      setIsProfileOpen(false)
    } finally {
      setProfileLoading(false)
    }
  }

  // Export current student list to Excel
  const handleExportExcel = () => {
    const dataToExport = analyticsData.studentTable.map(s => ({
      'Roll No': s.rollNo,
      'Name': `${s.firstName || ''} ${s.lastName || ''}`.trim(),
      'Class': s.class,
      'Attendance Rate': `${s.rate}%`,
      'Present Count': s.present,
      'Absent Count': s.absent,
      'Late Count': s.late,
      'Leave Count': s.leave,
      'Total Sessions': s.total,
      'Status': s.status
    }))

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Roster")
    XLSX.writeFile(wb, `Attendance_Roster_Class_${classFilter || 'All'}.xlsx`)
    showToast('success', 'Roster list exported to Excel successfully.')
  }

  const handlePrint = () => {
    window.print()
  }

  // Chart data formatting
  const pieData = [
    { name: 'Present', value: analyticsData.summary.presentCount, color: '#10b981' },
    { name: 'Absent', value: analyticsData.summary.absentCount, color: '#f43f5e' },
    { name: 'Late', value: analyticsData.summary.lateCount, color: '#f59e0b' },
    { name: 'Leave', value: analyticsData.summary.leaveCount, color: '#3b82f6' }
  ].filter(p => p.value > 0)

  // Low attendance warning list
  const lowAttendanceList = analyticsData.studentTable.filter(s => s.rate < thresholdVal)

  return (
    <div className="flex-1 w-full h-full text-slate-800 flex flex-col gap-6 select-none min-h-0 bg-transparent print:bg-white print:p-0 print:m-0 overflow-y-auto pr-1 custom-scrollbar">
      
      {/* Inject print layout stylesheet */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: portrait;
            margin: 1cm;
          }
          body, html, #root {
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            color: black !important;
          }
          aside, nav, header, button, .print\\:hidden {
            display: none !important;
          }
          main, .flex, .min-h-screen, div {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            padding: 8px !important;
            text-align: left !important;
          }
        }
      `}} />

      {/* Toast notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "fixed top-6 right-6 z-[100] px-5 py-3.5 rounded-[20px] shadow-premium-3 flex items-center gap-3 border text-xs font-black tracking-wide bg-white max-w-sm select-none print:hidden",
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

      {/* Header */}
      <div className="flex items-center gap-4 shrink-0 justify-between print:hidden">
        <div className="text-left space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
            <span>Admin</span>
            <span>/</span>
            <span className="text-brand-blue-650 cursor-pointer" onClick={() => navigate('/admin/attendance')}>Attendance</span>
            <span>/</span>
            <span className="text-slate-500">Analytics</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={() => navigate('/admin/attendance')}
              className="h-8.5 w-8.5 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
              Attendance Analytics
            </h2>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div 
        style={{ borderRadius: '24px', border: '1px solid #ECECEC' }}
        className="py-5 px-6 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.01)] shrink-0 flex flex-col gap-4 print:hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
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
              className="h-10 w-40 px-4 bg-white border border-slate-200 rounded-full text-xs font-extrabold text-slate-550 focus:outline-none focus:border-blue-500 cursor-pointer"
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
              value={selectedStudentFilter}
              onChange={(e) => setSelectedStudentFilter(e.target.value)}
              className="h-10 w-44 px-4 bg-white border border-slate-200 rounded-full text-xs font-extrabold text-slate-550 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Students</option>
              {studentsOptions.map(st => (
                <option key={st._id} value={st._id}>
                  {`${st.firstName || ''} ${st.lastName || ''}`.trim()} ({st.studentId})
                </option>
              ))}
            </select>

            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="h-10 w-36 px-4 bg-white border border-slate-200 rounded-full text-xs font-extrabold text-slate-550 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Months</option>
              {monthsList.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
            </select>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="h-10 w-28 px-4 bg-white border border-slate-200 rounded-full text-xs font-extrabold text-slate-550 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>

            <div className="flex items-center gap-1.5 h-10 px-3 bg-slate-50 border border-slate-200 rounded-full">
              <span className="text-[9px] font-black text-slate-400 uppercase pr-1.5 border-r border-slate-200">Custom</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-[11px] font-bold text-slate-600 focus:outline-none cursor-pointer"
              />
              <span className="text-[10px] text-slate-300 font-black">—</span>
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

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="h-10 px-4 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-550 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <FileText className="h-4 w-4" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="h-10 px-4 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-555 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Download className="h-4 w-4 text-emerald-500" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Premium Statistics Cards Grid */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', 
          gap: '16px' 
        }}
        className="shrink-0 print:hidden"
      >
        <div style={{ borderRadius: '20px', border: '1px solid #ECECEC' }} className="bg-white p-4.5 text-left flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.005)]">
          <div className="space-y-1">
            <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Overall Rate</span>
            <h4 className={cn("text-2xl font-black leading-none", analyticsData.summary.overallPercentage >= 80 ? "text-emerald-600" : "text-rose-500")}>
              {analyticsData.summary.overallPercentage}%
            </h4>
            <p className="text-[10px] font-medium text-slate-400">Classrooms Average</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div style={{ borderRadius: '20px', border: '1px solid #ECECEC' }} className="bg-white p-4.5 text-left flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.005)]">
          <div className="space-y-1">
            <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Total Sessions</span>
            <h4 className="text-2xl font-black leading-none text-slate-800">
              {analyticsData.summary.totalSessions}
            </h4>
            <p className="text-[10px] font-medium text-slate-400">Recorded Lectures</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        <div style={{ borderRadius: '20px', border: '1px solid #ECECEC' }} className="bg-white p-4.5 text-left flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.005)]">
          <div className="space-y-1">
            <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">High / Low Class</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm font-extrabold text-emerald-600">{analyticsData.summary.highestClass}</span>
              <span className="text-[10px] text-slate-400">/</span>
              <span className="text-xs font-bold text-rose-500">{analyticsData.summary.lowestClass}</span>
            </div>
            <p className="text-[10px] font-medium text-slate-400">Peak vs Bottom</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
            <Award className="h-5 w-5" />
          </div>
        </div>

        <div 
          style={{ borderRadius: '20px', border: '1px solid #ECECEC' }} 
          className="bg-white p-4.5 text-left flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.005)] cursor-pointer hover:border-amber-400 transition-colors"
          onClick={() => {
            const lowSec = document.getElementById('low-attendance-alert-section')
            if (lowSec) lowSec.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          <div className="space-y-1">
            <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Below {thresholdVal}%</span>
            <h4 className="text-2xl font-black leading-none text-amber-600">
              {analyticsData.summary.studentsBelowThreshold}
            </h4>
            <p className="text-[10px] font-bold text-amber-500">Students Alert</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0 print:hidden text-left select-none">
        {/* Chart 1: Daily Trend */}
        <div style={{ borderRadius: '24px', border: '1px solid #ECECEC' }} className="bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.005)] lg:col-span-2">
          <h4 className="text-xs font-black uppercase text-slate-455 tracking-wider mb-4">Daily Attendance Trend</h4>
          <div className="h-64 w-full">
            {analyticsData.trends.daily.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-slate-400 font-bold">No daily trend logs.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.trends.daily}>
                  <defs>
                    <linearGradient id="trendColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 10 }} />
                  <Area type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#trendColor)" name="Attendance Rate %" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Monthly Trend */}
        <div style={{ borderRadius: '24px', border: '1px solid #ECECEC' }} className="bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.005)]">
          <h4 className="text-xs font-black uppercase text-slate-455 tracking-wider mb-4">Monthly Attendance Trend</h4>
          <div className="h-64 w-full">
            {analyticsData.trends.monthly.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-slate-400 font-bold">No monthly trend logs.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.trends.monthly}>
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="rate" stroke="#8b5cf6" strokeWidth={2.5} activeDot={{ r: 6 }} name="Monthly Rate %" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0 print:hidden text-left select-none">
        {/* Chart 3: Record Status Distribution (Pie Chart) */}
        <div style={{ borderRadius: '24px', border: '1px solid #ECECEC' }} className="bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.005)]">
          <h4 className="text-xs font-black uppercase text-slate-455 tracking-wider mb-4">Present vs Absent vs Late vs Leave</h4>
          <div className="h-64 w-full relative flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-slate-400 font-bold">No distribution logs.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 10 }} />
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 4: Subject-wise Attendance */}
        <div style={{ borderRadius: '24px', border: '1px solid #ECECEC' }} className="bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.005)] lg:col-span-2">
          <h4 className="text-xs font-black uppercase text-slate-455 tracking-wider mb-4">Subject-wise Attendance</h4>
          <div className="h-64 w-full">
            {analyticsData.breakdowns.subjectWise.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-slate-400 font-bold">No subject records.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.breakdowns.subjectWise}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="rate" fill="#10b981" radius={[8, 8, 0, 0]} name="Attendance Rate %" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 shrink-0 print:hidden text-left select-none">
        {/* Chart 5: Teacher-wise Attendance */}
        <div style={{ borderRadius: '24px', border: '1px solid #ECECEC' }} className="bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.005)]">
          <h4 className="text-xs font-black uppercase text-slate-455 tracking-wider mb-4">Teacher-wise Attendance</h4>
          <div className="h-64 w-full">
            {analyticsData.breakdowns.teacherWise.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-slate-400 font-bold">No teacher records.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.breakdowns.teacherWise}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="rate" fill="#6366f1" radius={[8, 8, 0, 0]} name="Attendance Rate %" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 6: Class-wise Attendance */}
        <div style={{ borderRadius: '24px', border: '1px solid #ECECEC' }} className="bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.005)]">
          <h4 className="text-xs font-black uppercase text-slate-455 tracking-wider mb-4">Class-wise Attendance</h4>
          <div className="h-64 w-full">
            {analyticsData.breakdowns.classWise.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-slate-400 font-bold">No class records.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.breakdowns.classWise}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="rate" fill="#f59e0b" radius={[8, 8, 0, 0]} name="Attendance Rate %" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Class/Subject/Teacher Summaries Tabs Section */}
      <div 
        style={{ borderRadius: '28px', border: '1px solid #ECECEC', padding: '24px' }}
        className="bg-white shadow-[0_8px_30px_rgba(0,0,0,0.01)] text-left shrink-0 print:hidden"
      >
        <div className="border-b border-slate-100 flex items-center gap-6 shrink-0 select-none pb-2">
          <button
            onClick={() => setSummaryActiveTab('class')}
            className={cn(
              "py-2 text-xs font-black uppercase tracking-wider relative cursor-pointer",
              summaryActiveTab === 'class' ? "text-brand-blue-600 font-black" : "text-slate-400 hover:text-slate-655"
            )}
          >
            Class Summary
            {summaryActiveTab === 'class' && (
              <motion.div layoutId="summaryTabLine" className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-blue-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setSummaryActiveTab('teacher')}
            className={cn(
              "py-2 text-xs font-black uppercase tracking-wider relative cursor-pointer",
              summaryActiveTab === 'teacher' ? "text-brand-blue-600 font-black" : "text-slate-400 hover:text-slate-655"
            )}
          >
            Teacher Summary
            {summaryActiveTab === 'teacher' && (
              <motion.div layoutId="summaryTabLine" className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-blue-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setSummaryActiveTab('subject')}
            className={cn(
              "py-2 text-xs font-black uppercase tracking-wider relative cursor-pointer",
              summaryActiveTab === 'subject' ? "text-brand-blue-600 font-black" : "text-slate-400 hover:text-slate-655"
            )}
          >
            Subject Summary
            {summaryActiveTab === 'subject' && (
              <motion.div layoutId="summaryTabLine" className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-blue-500 rounded-full" />
            )}
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          {summaryActiveTab === 'class' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[9.5px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3 text-center">Students Count</th>
                  <th className="py-2.5 px-3 text-center">Attendance %</th>
                  <th className="py-2.5 px-3 text-center">Present</th>
                  <th className="py-2.5 px-3 text-center">Absent</th>
                  <th className="py-2.5 px-3 text-center">Late</th>
                  <th className="py-2.5 px-3 text-center">Leave</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                {analyticsData.breakdowns.classWise.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-extrabold text-brand-blue-700">{c.name}</td>
                    <td className="py-2.5 px-3 text-center">{c.studentsCount || 0}</td>
                    <td className="py-2.5 px-3 text-center font-black text-slate-800">{c.rate}%</td>
                    <td className="py-2.5 px-3 text-center text-emerald-600">{c.present || 0}</td>
                    <td className="py-2.5 px-3 text-center text-rose-500">{c.absent || 0}</td>
                    <td className="py-2.5 px-3 text-center text-amber-500">{c.late || 0}</td>
                    <td className="py-2.5 px-3 text-center text-blue-500">{c.leave || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {summaryActiveTab === 'teacher' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[9.5px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="py-2.5 px-3">Teacher</th>
                  <th className="py-2.5 px-3 text-center">Conducted Lectures</th>
                  <th className="py-2.5 px-3 text-center">Attendance %</th>
                  <th className="py-2.5 px-3 text-center">Present</th>
                  <th className="py-2.5 px-3 text-center">Absent</th>
                  <th className="py-2.5 px-3 text-center">Late</th>
                  <th className="py-2.5 px-3 text-center">Leave</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                {analyticsData.breakdowns.teacherWise.map((t, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-bold text-slate-800">{t.name}</td>
                    <td className="py-2.5 px-3 text-center">{t.lecturesConducted || 0}</td>
                    <td className="py-2.5 px-3 text-center font-black text-slate-800">{t.rate}%</td>
                    <td className="py-2.5 px-3 text-center text-emerald-650">{t.present || 0}</td>
                    <td className="py-2.5 px-3 text-center text-rose-500">{t.absent || 0}</td>
                    <td className="py-2.5 px-3 text-center text-amber-500">{t.late || 0}</td>
                    <td className="py-2.5 px-3 text-center text-blue-500">{t.leave || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {summaryActiveTab === 'subject' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[9.5px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3 text-center">Lectures</th>
                  <th className="py-2.5 px-3 text-center">Attendance %</th>
                  <th className="py-2.5 px-3 text-center">Highest</th>
                  <th className="py-2.5 px-3 text-center">Lowest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                {analyticsData.breakdowns.subjectWise.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-bold text-slate-800">{s.name}</td>
                    <td className="py-2.5 px-3 text-center">{s.totalLectures || 0}</td>
                    <td className="py-2.5 px-3 text-center font-black text-slate-800">{s.rate}%</td>
                    <td className="py-2.5 px-3 text-center text-emerald-600">{s.highest || 0}%</td>
                    <td className="py-2.5 px-3 text-center text-rose-500">{s.lowest || 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Central Timeline Audit Logs & Alert list Grid */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', 
          gap: '20px' 
        }}
        className="shrink-0 print:hidden"
      >
        {/* Timeline audit feed log */}
        <div 
          style={{ borderRadius: '24px', border: '1px solid #ECECEC', padding: '24px' }}
          className="bg-white shadow-[0_8px_30px_rgba(0,0,0,0.01)] text-left col-span-2 flex flex-col max-h-[380px]"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
            <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5 leading-none">
              <History className="h-4.5 w-4.5 text-slate-500" />
              <span>Attendance Management Timeline Audit Logs</span>
            </h4>
          </div>

          <div className="flex-grow overflow-y-auto mt-4 space-y-3.5 pr-1 custom-scrollbar min-h-0">
            {timelineLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 font-bold">Loading audit logs...</div>
            ) : timeline.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-bold">No timeline audits logged yet.</div>
            ) : (
              timeline.map(log => {
                const initial = log.performedBy?.firstName?.charAt(0) || 'A'
                return (
                  <div key={log._id} className="flex gap-3 text-xs leading-normal">
                    <div className={cn("h-7.5 w-7.5 shrink-0 rounded-full border flex items-center justify-center font-black", getAuditTimelineIcon(log.action))}>
                      {initial}
                    </div>
                    <div className="space-y-0.5 flex-grow">
                      <div className="flex items-center justify-between select-none">
                        <span className="font-extrabold text-slate-800">
                          {log.performedBy ? `${log.performedBy.firstName || ''} ${log.performedBy.lastName || ''}`.trim() : 'System'} ({log.performedBy?.role || 'admin'})
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.createdAt).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-500 font-medium">{log.description}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Low Attendance warning sidebar */}
        <div 
          id="low-attendance-alert-section"
          style={{ borderRadius: '24px', border: '1px solid #ffedd5', padding: '24px' }}
          className="bg-amber-50/15 text-left flex flex-col max-h-[380px]"
        >
          <div className="flex items-center justify-between border-b border-amber-100 pb-3 shrink-0 select-none">
            <h4 className="text-xs font-black text-amber-850 flex items-center gap-1.5 leading-none">
              <AlertCircle className="h-4.5 w-4.5 text-amber-500" />
              <span>Below Alert ({thresholdVal}%)</span>
            </h4>
            <div className="flex items-center gap-1 bg-amber-100/50 px-2 py-0.5 rounded-full text-[10px] font-black text-amber-700">
              {lowAttendanceList.length} Flagged
            </div>
          </div>

          <div className="flex-grow overflow-y-auto mt-4 space-y-3.5 pr-1 custom-scrollbar min-h-0">
            {lowAttendanceList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-bold select-none">No students below threshold.</div>
            ) : (
              lowAttendanceList.map(st => (
                <div 
                  key={st.studentId} 
                  className="p-3 bg-white border border-amber-200/55 rounded-xl flex items-center justify-between gap-3 hover:border-amber-400 transition-colors cursor-pointer"
                  onClick={() => handleOpenProfileDrawer(st.studentId)}
                >
                  <div>
                    <h5 className="font-extrabold text-[12px] text-slate-800">
                      {`${st.firstName || ''} ${st.lastName || ''}`.trim()}
                    </h5>
                    <span className="text-[9.5px] font-semibold text-slate-400">Class: {st.class}</span>
                  </div>
                  <span className="font-black text-xs text-rose-500 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
                    {st.rate}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Roster & Table section */}
      <div 
        style={{ borderRadius: '28px', border: '1px solid #ECECEC', padding: '28px' }}
        className="bg-white shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 shrink-0">
          <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">
            Student Attendance Roster ({rosterTotalCount})
          </h3>

          <div className="relative w-64 h-9">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by name, roll ID..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="h-full w-full pl-9 pr-4 bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-xs font-semibold rounded-full focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto pr-1 mt-4">
          <table className="w-full text-left min-w-[950px] border-collapse">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest select-none sticky top-0 bg-white z-10 border-b border-slate-100">
              <tr>
                <th className="py-3 pl-5">Photo</th>
                <th className="py-3 px-3">Roll No</th>
                <th 
                  className="py-3 px-4 cursor-pointer select-none hover:bg-slate-100/50 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  Student Name {sortField === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer select-none hover:bg-slate-100/50 transition-colors"
                  onClick={() => handleSort('class')}
                >
                  Class {sortField === 'class' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th 
                  className="py-3 px-3 text-center cursor-pointer select-none hover:bg-slate-100/50 transition-colors"
                  onClick={() => handleSort('rate')}
                >
                  Attendance % {sortField === 'rate' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th className="py-3 px-3 text-center">Present</th>
                <th className="py-3 px-3 text-center">Absent</th>
                <th className="py-3 px-3 text-center">Late</th>
                <th className="py-3 px-3 text-center">Leave</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-semibold text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="11" className="py-16 text-center text-slate-400 font-bold">
                    Refreshing stats...
                  </td>
                </tr>
              ) : rosterStudents.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-16 text-center text-slate-400 font-bold">
                    No matching student records found.
                  </td>
                </tr>
              ) : (
                rosterStudents.map((st) => {
                  const initial = st.firstName?.charAt(0) || 'S'
                  return (
                    <tr 
                      key={st.studentId} 
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => handleOpenProfileDrawer(st.studentId)}
                    >
                      <td className="py-3 pl-5" onClick={(e) => e.stopPropagation()}>
                        {st.photo?.secure_url ? (
                          <img
                            src={st.photo.secure_url}
                            alt={st.firstName}
                            className="h-8 w-8 rounded-full object-cover select-none bg-slate-100"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center font-black text-xs select-none">
                            {initial}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-400 uppercase font-black">{st.rollNo}</td>
                      <td className="py-3 px-4 text-slate-850 font-bold">
                        {`${st.firstName || ''} ${st.lastName || ''}`.trim()}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-brand-blue-700">{st.class}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={cn(
                          "font-black text-sm",
                          st.rate >= 80 ? "text-emerald-600" : st.rate >= 75 ? "text-amber-500" : "text-rose-500"
                        )}>
                          {st.rate}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-emerald-655 font-bold">{st.present}</td>
                      <td className="py-3 px-3 text-center text-rose-550 font-bold">{st.absent}</td>
                      <td className="py-3 px-3 text-center text-amber-550 font-bold">{st.late}</td>
                      <td className="py-3 px-3 text-center text-blue-550 font-bold">{st.leave}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase border tracking-wider", getStatusColor(st.status))}>
                          {st.status}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenProfileDrawer(st.studentId)}
                          className="h-7 px-3 border border-slate-100 hover:bg-slate-50 hover:text-blue-600 rounded-full flex items-center justify-center gap-1 cursor-pointer font-bold text-[10.5px] text-slate-555 transition-colors shadow-sm"
                        >
                          <TrendingUp className="h-3 w-3" />
                          <span>View Profile</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {rosterTotalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-4 select-none shrink-0 text-left">
            <span className="text-[11px] font-bold text-slate-400">
              Showing <span className="font-extrabold text-slate-650">{(page - 1) * limit + 1}</span>–
              <span className="font-extrabold text-slate-650">{Math.min(page * limit, rosterTotalCount)}</span> of{' '}
              <span className="font-extrabold text-slate-650">{rosterTotalCount}</span> records
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className="h-8.5 px-3 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-black text-slate-550 cursor-pointer disabled:opacity-40 select-none transition-colors"
              >
                ← Previous
              </button>
              
              {Array.from({ length: rosterTotalPages }).map((_, i) => {
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
                disabled={page === rosterTotalPages}
                onClick={() => setPage(p => Math.min(p + 1, rosterTotalPages))}
                className="h-8.5 px-3 rounded-full border border-slate-200 hover:bg-slate-50 text-xs font-black text-slate-550 cursor-pointer disabled:opacity-40 select-none transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* STUDENT PROFILE DRAWER */}
      <AnimatePresence>
        {isProfileOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs select-none">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={spring}
              className="bg-white w-full max-w-3xl h-full shadow-premium-4 flex flex-col relative text-left"
              style={{ borderLeft: '1px solid #ECECEC' }}
            >
              {/* Drawer Header */}
              <div className="p-7 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="text-left flex items-center gap-3">
                  <div className="h-9 w-9 bg-brand-blue-50 text-brand-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-805 tracking-tight leading-none uppercase">Student Attendance Profile</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">Audit profile logs, calendar view, and subject breakdown</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="h-8.5 w-8.5 rounded-full border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-850 cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {profileLoading ? (
                <div className="flex-grow flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="h-7 w-7 text-blue-500 animate-spin" />
                  <span className="text-xs font-bold text-slate-400">Loading student analytics profile...</span>
                </div>
              ) : profileData ? (
                <div className="flex-grow flex flex-col min-h-0 overflow-y-auto">
                  
                  {/* Top Details panel */}
                  <div className="p-7 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-5 shrink-0 bg-slate-50/20">
                    <div className="flex items-center gap-4">
                      {profileData.student.photo?.secure_url ? (
                        <img
                          src={profileData.student.photo.secure_url}
                          alt={profileData.student.firstName}
                          className="h-16 w-16 rounded-full object-cover shrink-0 select-none border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-brand-blue-500 text-white flex items-center justify-center font-black text-lg shrink-0 select-none shadow-sm">
                          {profileData.student.firstName?.charAt(0) || 'S'}
                        </div>
                      )}

                      <div className="space-y-1">
                        <h4 className="text-lg font-black text-slate-855 tracking-tight leading-none">
                          {`${profileData.student.firstName || ''} ${profileData.student.lastName || ''}`.trim()}
                        </h4>
                        <div className="text-[11px] font-bold text-slate-455">
                          Roll ID: <span className="text-slate-800 font-extrabold uppercase">{profileData.student.studentId}</span> | Class: <span className="text-brand-blue-700 font-extrabold">{profileData.student.class}</span>
                        </div>
                        <div className="pt-0.5">
                          <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider", getStatusColor(profileData.status))}>
                            {profileData.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-left md:text-right select-none">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Overall Rate</span>
                        <span className={cn("text-2xl font-black block mt-1.5", profileData.overallRate >= 75 ? "text-emerald-600" : "text-rose-500")}>
                          {profileData.overallRate}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Attendance Logs</span>
                        <span className="text-2xl font-black text-slate-800 block mt-1.5">
                          {profileData.present} <span className="text-xs font-semibold text-slate-400">/ {profileData.total}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Profile tabs */}
                  <div className="px-7 border-b border-slate-100 flex items-center gap-6 shrink-0 select-none bg-white">
                    <button
                      onClick={() => setProfileTab('summary')}
                      className={cn(
                        "py-3 text-xs font-black uppercase tracking-wider relative cursor-pointer",
                        profileTab === 'summary' ? "text-brand-blue-600" : "text-slate-400 hover:text-slate-655"
                      )}
                    >
                      Summary Trends
                      {profileTab === 'summary' && (
                        <motion.div layoutId="profileTabLine" className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-blue-500 rounded-full" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => setProfileTab('calendar')}
                      className={cn(
                        "py-3 text-xs font-black uppercase tracking-wider relative cursor-pointer",
                        profileTab === 'calendar' ? "text-brand-blue-600" : "text-slate-400 hover:text-slate-655"
                      )}
                    >
                      Monthly Calendar
                      {profileTab === 'calendar' && (
                        <motion.div layoutId="profileTabLine" className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-blue-500 rounded-full" />
                      )}
                    </button>

                    <button
                      onClick={() => setProfileTab('subjects')}
                      className={cn(
                        "py-3 text-xs font-black uppercase tracking-wider relative cursor-pointer",
                        profileTab === 'subjects' ? "text-brand-blue-600" : "text-slate-400 hover:text-slate-655"
                      )}
                    >
                      Subject Breakdown
                      {profileTab === 'subjects' && (
                        <motion.div layoutId="profileTabLine" className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-blue-500 rounded-full" />
                      )}
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="p-7 flex-grow flex flex-col min-h-0 text-left space-y-6">
                    
                    {profileTab === 'summary' && (() => {
                      const weakSubjects = profileData.subjectTable.filter(sub => sub.rate < thresholdVal)
                      const remarksLogs = profileData.recentLogs.filter(log => log.remarks)
                      
                      return (
                        <div className="space-y-5 flex-grow flex flex-col min-h-0">
                          {profileData.overallRate < thresholdVal && (
                            <div className="bg-rose-50 border border-rose-150 p-4 rounded-xl flex items-center gap-3 text-rose-800 text-xs font-semibold shrink-0 select-none">
                              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 animate-pulse" />
                              <div>
                                <span className="font-extrabold text-xs uppercase tracking-wider block text-rose-600">Attendance Warning Alert</span>
                                This student's overall attendance rate of <span className="font-black">{profileData.overallRate}%</span> is below the system alert threshold of <span className="font-black">{thresholdVal}%</span>.
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                            {/* Weak subjects list card */}
                            <div className="bg-amber-50/15 border border-amber-200/50 p-4 rounded-2xl space-y-1.5 text-xs select-none">
                              <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block leading-none">Flagged Weak Subjects</span>
                              {weakSubjects.length === 0 ? (
                                <div className="text-slate-450 font-bold mt-1">No subjects below threshold.</div>
                              ) : (
                                <div className="flex flex-wrap gap-1.5 pt-1.5">
                                  {weakSubjects.map((sub, idx) => (
                                    <span key={idx} className="bg-amber-100/50 border border-amber-200 px-2 py-0.5 rounded-lg text-amber-800 font-extrabold text-[10.5px]">
                                      {sub.subjectName} ({sub.rate}%)
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Teacher remarks log */}
                            <div className="bg-slate-50/60 border border-slate-200 p-4 rounded-2xl space-y-1.5 text-xs select-none">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Instructor Remarks Log</span>
                              {remarksLogs.length === 0 ? (
                                <div className="text-slate-450 italic mt-1">No remarks logged recently.</div>
                              ) : (
                                <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                                  {remarksLogs.map((log, idx) => (
                                    <div key={idx} className="border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                                      <div className="flex items-center justify-between text-[8.5px] font-bold text-slate-400 leading-none">
                                        <span>{log.subject}</span>
                                        <span>{new Date(log.date).toLocaleDateString()}</span>
                                      </div>
                                      <p className="text-slate-700 italic font-semibold mt-0.5">"{log.remarks}"</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Monthly rates trend */}
                        <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl">
                          <h5 className="text-[10px] font-black uppercase text-slate-455 tracking-wider mb-3">Monthly Attendance Progress</h5>
                          <div className="h-44 w-full">
                            {profileData.monthlyTrend.length === 0 ? (
                              <div className="h-full w-full flex items-center justify-center text-xs text-slate-400 font-bold">No progress logs.</div>
                            ) : (
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={profileData.monthlyTrend}>
                                  <defs>
                                    <linearGradient id="profileTrendColor" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="#94a3b8" />
                                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 10 }} />
                                  <Area type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#profileTrendColor)" name="Rate %" />
                                </AreaChart>
                              </ResponsiveContainer>
                            )}
                          </div>
                        </div>

                        {/* Recent logs */}
                        <div className="border border-slate-200/80 rounded-[20px] overflow-hidden flex-grow overflow-y-auto custom-scrollbar min-h-0">
                          <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-slate-50 text-[9.5px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 sticky top-0 bg-white z-10 select-none">
                              <tr>
                                <th className="py-2.5 pl-5">Date</th>
                                <th className="py-2.5 px-3">Subject</th>
                                <th className="py-2.5 px-3 text-center">Status</th>
                                <th className="py-2.5 pr-5">Remarks</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-semibold">
                              {profileData.recentLogs.map((log, index) => (
                                <tr key={index}>
                                  <td className="py-3 pl-5 text-slate-500">
                                    {new Date(log.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </td>
                                  <td className="py-3 px-3 font-extrabold text-slate-800">{log.subject}</td>
                                  <td className="py-3 px-3 text-center">
                                    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[8.5px] font-black border uppercase tracking-wider", getStatusBadge(log.status))}>
                                      {log.status}
                                    </span>
                                  </td>
                                  <td className="py-3 pr-5 text-slate-500 italic max-w-[200px] truncate">
                                    {log.remarks || '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  })()}

                    {profileTab === 'calendar' && (
                      <div className="space-y-4 flex-grow flex flex-col justify-center min-h-0">
                        {/* Legend row */}
                        <div className="flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-wider select-none shrink-0 border-b border-slate-100 pb-2">
                          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-emerald-500" /> Present</span>
                          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-rose-500" /> Absent</span>
                          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-amber-500" /> Late</span>
                          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-blue-500" /> Leave</span>
                        </div>

                        {/* Calendar rendering grid */}
                        <div className="border border-slate-200 p-4.5 rounded-2xl flex-grow flex flex-col justify-between overflow-y-auto custom-scrollbar min-h-0">
                          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 select-none">
                            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                          </div>

                          <div className="grid grid-cols-7 gap-2.5 mt-3 select-none flex-grow">
                            {/* Render days of the month */}
                            {Array.from({ length: 30 }).map((_, idx) => {
                              const day = idx + 1
                              const targetDateStr = `2026-07-${String(day).padStart(2, '0')}`
                              const matched = profileData.calendar.find(c => new Date(c.date).toISOString().split('T')[0] === targetDateStr)
                              
                              return (
                                <div
                                  key={day}
                                  className={cn(
                                    "h-12 w-full rounded-xl flex flex-col items-center justify-center text-xs font-extrabold relative transition-colors cursor-pointer group",
                                    matched ? getCalendarDayColor(matched.status) : "bg-slate-50 text-slate-450 hover:bg-slate-100"
                                  )}
                                >
                                  <span>{day}</span>
                                  {matched && (
                                    <span className="text-[7.5px] block mt-0.5 leading-none opacity-90 truncate max-w-[90%] font-black uppercase">
                                      {matched.subject}
                                    </span>
                                  )}

                                  {/* Tooltip on Hover calendar day */}
                                  {matched && (
                                    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 bg-slate-900 text-white p-3.5 rounded-2xl w-48 shadow-premium-4 space-y-1 font-semibold text-[10px] text-left leading-normal border border-slate-700 pointer-events-none">
                                      <div className="font-black text-xs text-blue-400 uppercase tracking-wide">{matched.subject}</div>
                                      <div>Status: <span className="font-extrabold uppercase">{matched.status}</span></div>
                                      <div>Period: {matched.period} ({matched.time})</div>
                                      {matched.remarks && <div>Notes: "{matched.remarks}"</div>}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {profileTab === 'subjects' && (
                      <div className="border border-slate-200/80 rounded-[20px] overflow-hidden flex-grow overflow-y-auto custom-scrollbar min-h-0">
                        <table className="w-full text-left text-xs text-slate-700">
                          <thead className="bg-slate-50 text-[9.5px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 sticky top-0 bg-white z-10 select-none">
                            <tr>
                              <th className="py-3 pl-5">Subject</th>
                              <th className="py-3 px-3 text-center">Rate</th>
                              <th className="py-3 px-3 text-center">Present</th>
                              <th className="py-3 px-3 text-center">Absent</th>
                              <th className="py-3 px-3 text-center">Late</th>
                              <th className="py-3 px-3 text-center">Leave</th>
                              <th className="py-3 pr-5">Instructor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 font-semibold">
                            {profileData.subjectTable.map((sub, index) => (
                              <tr key={index}>
                                <td className="py-3 pl-5 font-black text-slate-800">{sub.subjectName}</td>
                                <td className="py-3 px-3 text-center">
                                  <span className={cn(
                                    "font-black text-sm",
                                    sub.rate >= 80 ? "text-emerald-600" : sub.rate >= 75 ? "text-amber-500" : "text-rose-500"
                                  )}>
                                    {sub.rate}%
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center text-emerald-600">{sub.present}</td>
                                <td className="py-3 px-3 text-center text-rose-500">{sub.absent}</td>
                                <td className="py-3 px-3 text-center text-amber-500">{sub.late}</td>
                                <td className="py-3 px-3 text-center text-blue-500">{sub.leave}</td>
                                <td className="py-3 pr-5 text-slate-500">{sub.teacher}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                  </div>

                </div>
              ) : (
                <div className="flex-grow flex items-center justify-center text-slate-400 font-bold">Failed to load student.</div>
              )}

              {/* Drawer Footer */}
              <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end shrink-0 select-none">
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="h-10 px-6 border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-slate-550 rounded-full cursor-pointer transition-colors shadow-sm"
                >
                  Close Profile
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
