import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  GraduationCap, 
  UserCheck, 
  Layers, 
  TrendingUp, 
  CheckCircle, 
  ClipboardList, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  UserPlus,
  FileUp,
  Receipt,
  Megaphone,
  Calendar,
  CheckSquare,
  Plus,
  BookOpen,
  FileText,
  Search,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Bell,
  Activity,
  Server,
  Database,
  Cloud,
  Mail,
  CreditCard,
  Wifi,
  Cake,
  PartyPopper,
  GraduationCap as ExamIcon,
  ShieldCheck,
  Filter,
  ArrowUpDown,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuth } from '@/contexts/AuthContext'

// Recharts imports for premium SaaS charts
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

// Custom premium Stripe-inspired KPI Card component
const KpiCard = ({ kpi, cardVariants }) => {
  const Icon = kpi.icon

  const parentVariants = {
    idle: { y: 0 },
    hover: { y: -4 }
  }

  const transitionSpec = { duration: 0.25, ease: [0.25, 1, 0.5, 1] }

  return (
    <motion.div
      variants={parentVariants}
      initial="idle"
      whileHover="hover"
      transition={transitionSpec}
      style={{
        borderRadius: '24px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #ECECEC',
      }}
      className="p-8 flex flex-col justify-between relative text-left shadow-[0_8px_30px_rgba(0,0,0,0.015)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.04)] cursor-pointer transition-shadow"
    >
      {/* Top Row: Category Label and Border-only Icon Button */}
      <div className="flex justify-between items-start">
        <span className="text-[12px] font-bold uppercase tracking-wider text-slate-400 block leading-none">
          {kpi.title}
        </span>
        <div className="h-8 w-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {/* Middle Row: Numbers & Status Badge */}
      <div className="flex justify-between items-end mt-5">
        <div>
          <h3 className="text-[36px] font-extrabold tracking-tight text-slate-800 leading-none">
            {kpi.value}
          </h3>
          <p className="text-[11px] font-semibold text-slate-400 mt-2 leading-none">
            {kpi.description}
          </p>
        </div>
        
        {/* Growth badge sits on the RIGHT side */}
        <span className={cn(
          "px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide border shadow-sm shrink-0 mb-0.5",
          kpi.isPositive
            ? "bg-emerald-50/60 text-emerald-700 border-emerald-100/50"
            : "bg-red-50/60 text-red-700 border-red-100/50"
        )}>
          {kpi.change}
        </span>
      </div>

      {/* Bottom Row: Tiny Premium Stripe-like Sparkline */}
      <div className="w-full h-[36px] mt-6 pointer-events-none opacity-40">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 160 36" preserveAspectRatio="none">
          <path
            d={kpi.sparklineRedesign}
            fill="none"
            stroke={kpi.sparklineStroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </motion.div>
  )
}

// 1. AnalyticsCard wrapper
const AnalyticsCard = ({ children, className }) => {
  return (
    <div 
      style={{
        height: '420px',
        borderRadius: '28px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #ECECEC',
      }}
      className={cn(
        "p-8 flex flex-col justify-between relative text-left shadow-[0_8px_30px_rgba(0,0,0,0.015)] bg-white",
        className
      )}
    >
      {children}
    </div>
  )
}

// 2. ChartLegend pill indicators
const ChartLegend = ({ items }) => {
  return (
    <div className="flex items-center gap-2 max-sm:hidden">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-1.5 bg-slate-50/50 border border-slate-100 rounded-full px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          <span className="text-[10px] font-bold text-slate-500 leading-none">{item.name}</span>
        </div>
      ))}
    </div>
  )
}

// 3. ChartHeader settings controls
const ChartHeader = ({ title, description, legend }) => {
  const [activeFilter, setActiveFilter] = useState('30D')
  const filters = ['7D', '30D', '90D']

  return (
    <div className="flex justify-between items-start select-none shrink-0 mb-4 z-10">
      <div className="text-left space-y-1">
        <h3 className="text-sm font-extrabold text-slate-800 tracking-tight leading-none">
          {title}
        </h3>
        <p className="text-[11px] font-semibold text-slate-400 leading-none mt-1">
          {description}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Custom Legend (small pills) */}
        {legend}

        {/* Time Filter Buttons */}
        <div className="flex items-center bg-slate-50 border border-slate-200/40 rounded-full p-0.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer",
                activeFilter === f
                  ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button className="h-7 w-7 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-700 shadow-sm cursor-pointer transition-colors active:scale-95">
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// 4. ChartTooltip custom floating widget
const ChartTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 p-3.5 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.12)] text-left select-none z-50">
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
          {label}
        </p>
        {payload.map((entry, idx) => (
          <p key={idx} className="text-xs font-semibold text-white mt-1 first:mt-0">
            {entry.name}: <span className="font-bold">{formatter ? formatter(entry.value) : entry.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

// 5. StatusBadge component with soft theme colors
const StatusBadge = ({ status }) => {
  const maps = {
    Active: "bg-emerald-50 text-emerald-700 border-emerald-100/50",
    Paid: "bg-emerald-50 text-emerald-700 border-emerald-100/50",
    Pending: "bg-amber-50 text-amber-700 border-amber-100/50",
    Partial: "bg-amber-50 text-amber-700 border-amber-100/50",
    Inactive: "bg-red-50/60 text-red-700 border-red-100/50",
    Overdue: "bg-red-50/60 text-red-700 border-red-100/50"
  }

  const colorClass = maps[status] || "bg-slate-50 text-slate-600 border-slate-200/50"

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border shadow-sm select-none",
      colorClass
    )}>
      {status}
    </span>
  )
}

// 6. AvatarCell component
const AvatarCell = ({ name, email }) => {
  const initial = name ? name[0].toUpperCase() : 'U'
  return (
    <div className="flex items-center gap-3">
      <div className="h-8.5 w-8.5 rounded-full bg-slate-50 border border-slate-200/40 flex items-center justify-center font-extrabold text-xs text-slate-600 shrink-0">
        {initial}
      </div>
      <div className="text-left leading-none">
        <span className="text-xs font-bold text-slate-800 block">{name}</span>
        {email && <span className="text-[10px] font-semibold text-slate-400 block mt-1 leading-none">{email}</span>}
      </div>
    </div>
  )
}

// 7. ActionMenu button (fades in on hover of .group)
const ActionMenu = ({ icon: ActionIcon, onClick, title }) => {
  return (
    <button
      onClick={onClick}
      title={title}
      className="h-8 w-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700 shadow-sm cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
    >
      <ActionIcon className="h-4 w-4" />
    </button>
  )
}

// 8. TableHeader container
const TableHeader = ({ title, description, searchValue, onSearchChange, onFilter, onSort, onExport, onRefresh }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none shrink-0 mb-6 pb-2">
      <div className="text-left space-y-1">
        <h3 className="text-sm font-extrabold text-slate-800 tracking-tight leading-none">
          {title}
        </h3>
        <p className="text-[11px] font-semibold text-slate-400 leading-none mt-1">
          {description}
        </p>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-center">
        <div className="relative w-44 flex items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-full border border-slate-200 bg-slate-50/50 text-[11px] text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-colors shadow-inner"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={onFilter} title="Filter" className="h-8 px-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center gap-1 text-[10px] font-bold text-slate-500 shadow-sm cursor-pointer transition-colors active:scale-95">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
          </button>
          <button onClick={onSort} title="Sort" className="h-8 px-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center gap-1 text-[10px] font-bold text-slate-500 shadow-sm cursor-pointer transition-colors active:scale-95">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>Sort</span>
          </button>
          <button onClick={onExport} title="Export" className="h-8 w-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700 shadow-sm cursor-pointer transition-colors active:scale-95">
            <Download className="h-3.5 w-3.5" />
          </button>
          <button onClick={onRefresh} title="Refresh" className="h-8 w-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700 shadow-sm cursor-pointer transition-colors active:scale-95">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// 9. Pagination component
const Pagination = ({ current, total, onPrev, onNext }) => {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2 select-none">
      <div className="flex items-center gap-4">
        <span className="text-[11px] text-slate-400 font-bold">
          Showing 1 to {current} of {total} entries
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-bold">Rows per page:</span>
          <select className="bg-slate-50 border border-slate-200/50 rounded-full px-2 py-0.5 text-[10px] font-bold text-slate-500 focus:outline-none shadow-sm cursor-pointer">
            <option>5</option>
            <option>10</option>
            <option>20</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button disabled variant="secondary" size="sm" className="h-8 px-2 flex items-center justify-center rounded-full shadow-sm">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button disabled variant="secondary" size="sm" className="h-8 px-2 flex items-center justify-center rounded-full shadow-sm">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// 10. DataTable container card
const DataTable = ({ children }) => {
  return (
    <div 
      style={{
        borderRadius: '28px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #ECECEC',
      }}
      className="p-8 flex flex-col justify-between h-full bg-white shadow-[0_8px_30px_rgba(0,0,0,0.015)]"
    >
      {children}
    </div>
  )
}

// 11. QuickActionCard component (Raycast & Linear inspired)
const QuickActionCard = ({ action }) => {
  const Icon = action.icon

  return (
    <motion.button
      whileHover={{ 
        y: -8,
        boxShadow: '0 20px 40px rgba(15,23,42,0.08)'
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 350, damping: 22 }}
      className="h-[150px] rounded-[24px] border border-[#ECECEC] bg-white p-6 text-left flex flex-col justify-between relative group cursor-pointer transition-all duration-300 select-none overflow-hidden"
    >
      {/* Subtle blue glow hover backdrop */}
      <div className="absolute inset-0 bg-blue-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[24px]" />
      
      {/* Top section: Icon and Arrow */}
      <div className="flex justify-between items-start w-full">
        <div 
          className="h-[52px] w-[52px] rounded-full bg-[#F8FAFC] flex items-center justify-center text-slate-500 shrink-0 transform group-hover:rotate-8 transition-transform duration-300"
        >
          <Icon className="h-5 w-5" />
        </div>
        
        <div className="h-7 w-7 rounded-full flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
          <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" />
        </div>
      </div>

      {/* Middle section: Text */}
      <div className="mt-2.5 space-y-0.5">
        <h4 className="text-[14px] font-bold text-slate-800 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
          {action.title}
        </h4>
        <p className="text-[12px] text-slate-400 font-semibold leading-normal truncate">
          {action.desc}
        </p>
      </div>

      {/* Bottom section: Keyboard Shortcut Badge */}
      <div className="flex justify-between items-center w-full select-none pt-1">
        <span className="inline-flex items-center px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-[10px] font-black text-slate-400">
          {action.shortcut}
        </span>
      </div>
    </motion.button>
  )
}

// 12. ActivityRow component
const ActivityRow = ({ activity, isTop }) => {
  const Icon = activity.icon

  return (
    <motion.div
      whileHover={{ 
        x: 6,
        backgroundColor: '#F8FAFC'
      }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
      style={{
        borderLeft: isTop ? '3px solid #2563EB' : 'none'
      }}
      className={cn(
        "h-[72px] flex items-center justify-between gap-4 px-6 border-b border-b-slate-100 last:border-b-0 cursor-pointer select-none",
        isTop ? "pl-[21px]" : "pl-6"
      )}
    >
      {/* Left side: Icon, Title, Description */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* 44px Icon Container with scale transition on hover */}
        <div className="h-11 w-11 rounded-full bg-slate-50 border border-slate-200/50 flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-105">
          <Icon className={cn("h-4 w-4", activity.color.split(' ')[0])} />
        </div>
        
        {/* Text Details */}
        <div className="text-left leading-none min-w-0 flex-1 space-y-1.5">
          <span className="text-[16px] font-semibold text-slate-800 block truncate">
            {activity.title}
          </span>
          <span className="text-[13px] text-slate-400 font-medium block truncate font-medium">
            {activity.desc}
          </span>
        </div>
      </div>

      {/* Right side: Category tag, Time, Chevron */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Category Pill Tag */}
        <span className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-slate-200/30",
          activity.color
        )}>
          {activity.category}
        </span>

        {/* Shorthand Time */}
        <span className="text-[11px] font-bold text-slate-400 w-12 text-right">
          {activity.time}
        </span>

        {/* Muted Chevron */}
        <ChevronRight className="h-4 w-4 text-slate-300" />
      </div>
    </motion.div>
  )
}

// 13. ActivityFeed container component
const ActivityFeed = ({ children }) => {
  return (
    <div 
      style={{
        borderRadius: '28px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #ECECEC',
      }}
      className="p-8 flex flex-col justify-between bg-white shadow-[0_8px_30px_rgba(0,0,0,0.015)]"
    >
      {children}
    </div>
  )
}

// 14. DataListCard container card
const DataListCard = ({ children, className }) => {
  return (
    <div 
      style={{
        borderRadius: '28px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #ECECEC',
      }}
      className={cn(
        "p-7 flex flex-col justify-between h-full bg-white shadow-[0_8px_30px_rgba(0,0,0,0.015)]",
        className
      )}
    >
      {children}
    </div>
  )
}

// 15. AdmissionRow list element
const AdmissionRow = ({ adm }) => {
  const initial = adm.name ? adm.name[0].toUpperCase() : 'S'
  return (
    <motion.div
      whileHover={{ 
        x: 4,
        boxShadow: '0 8px 24px rgba(15,23,42,0.04)'
      }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      style={{
        gridTemplateColumns: '64px minmax(220px, 2.5fr) minmax(130px, 1fr) minmax(140px, 1.3fr) 110px 100px 44px'
      }}
      className="h-[78px] grid items-center gap-4 px-4 hover:bg-[#F8FAFC] transition-colors duration-220 select-none border-b border-slate-100 last:border-b-0 cursor-pointer rounded-2xl group w-full"
    >
      {/* 1st column: Avatar */}
      <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
        {initial}
      </div>
      
      {/* 2nd column: Student name & email */}
      <div className="text-left leading-none min-w-0 space-y-1">
        <span className="text-[16px] font-semibold text-slate-800 block leading-none">
          {adm.name}
        </span>
        <span className="text-[13px] text-slate-400 font-medium block truncate leading-none">
          {adm.email}
        </span>
      </div>

      {/* 3rd column: Class pill */}
      <div className="w-fit">
        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-blue-50/50 text-blue-700 border border-blue-100/50">
          {adm.grade}
        </span>
      </div>

      {/* 4th column: Parent name */}
      <div className="text-xs text-slate-400 font-medium text-left">
        {adm.parent}
      </div>

      {/* 5th column: Date */}
      <div className="text-xs text-slate-400 font-semibold text-left">
        {adm.date}
      </div>

      {/* 6th column: Status */}
      <div className="justify-self-end">
        <StatusBadge status={adm.status} />
      </div>

      {/* 7th column: Actions */}
      <div className="justify-self-end">
        <ActionMenu icon={MoreHorizontal} title="More Actions" onClick={() => {}} />
      </div>
    </motion.div>
  )
}

// 16. PaymentRow list element
const PaymentRow = ({ pmt, idx }) => {
  const initial = pmt.student ? pmt.student[0].toUpperCase() : 'P'
  const email = pmt.student.toLowerCase().replace(' ', '.') + '@gmail.com'
  const invoiceId = `#INV-2026-${String(idx + 1).padStart(3, '0')}`

  return (
    <motion.div
      whileHover={{ 
        x: 4,
        boxShadow: '0 8px 24px rgba(15,23,42,0.04)'
      }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      style={{
        gridTemplateColumns: '64px minmax(240px, 2.6fr) 120px 140px 90px 100px 44px'
      }}
      className="h-[78px] grid items-center gap-4 px-4 hover:bg-[#F8FAFC] transition-colors duration-220 select-none border-b border-slate-100 last:border-b-0 cursor-pointer rounded-2xl group w-full"
    >
      {/* 1st column: Avatar */}
      <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
        {initial}
      </div>
      
      {/* 2nd column: Student name & email */}
      <div className="text-left leading-none min-w-0 space-y-1">
        <span className="text-[16px] font-semibold text-slate-800 block leading-none">
          {pmt.student}
        </span>
        <span className="text-[13px] text-slate-400 font-medium block truncate leading-none">
          {email}
        </span>
      </div>

      {/* 3rd column: Amount & Invoice ID (Amount: 18px, Bold, Blue) */}
      <div className="space-y-1 leading-none text-left">
        <span className="text-[18px] font-black text-blue-600 block leading-none">
          {pmt.amount}
        </span>
        <span className="text-[11px] font-bold text-slate-400 block leading-none">
          {invoiceId}
        </span>
      </div>

      {/* 4th column: Method badge */}
      <div className="text-left">
        <span className="inline-flex px-2.5 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-[10px] text-slate-500 font-bold select-none">
          {pmt.method}
        </span>
      </div>

      {/* 5th column: Date */}
      <div className="text-left text-xs text-slate-400 font-semibold">
        {pmt.date}
      </div>

      {/* 6th column: Status */}
      <div className="justify-self-end">
        <StatusBadge status={pmt.status} />
      </div>

      {/* 7th column: Actions */}
      <div className="justify-self-end">
        <ActionMenu icon={Download} title="Download Receipt" onClick={() => {}} />
      </div>
    </motion.div>
  )
}

// 17. Modern Pagination container (Next/Prev rounded buttons)
const ModernPagination = ({ current, total }) => {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2 select-none">
      <span className="text-[11px] text-slate-400 font-black">
        {current}–{current} of {total} entries
      </span>
      <div className="flex gap-2">
        <button disabled className="h-8 px-3 rounded-full border border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 flex items-center justify-center shrink-0 cursor-default">
          Previous
        </button>
        <button disabled className="h-8 px-3 rounded-full border border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 flex items-center justify-center shrink-0 cursor-default">
          Next
        </button>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentsSearch, setPaymentsSearch] = useState('')
  const [activityFilter, setActivityFilter] = useState('All')
  const [selectedDay, setSelectedDay] = useState(3) // default selection
  const [greeting, setGreeting] = useState('Afternoon')

  // Calculate dynamic greeting based on time of day
  useEffect(() => {
    const hr = new Date().getHours()
    if (hr < 12) setGreeting('Morning')
    else if (hr < 18) setGreeting('Afternoon')
    else setGreeting('Evening')
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  }

  const timelineVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  }

  const timelineItemVariants = {
    hidden: { opacity: 0, x: -12 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring', stiffness: 280, damping: 25 }
    }
  }

  // 8 premium KPI card items specifications (Apple & Stripe inspired layout)
  const kpis = [
    {
      id: 'students',
      title: 'Total Students',
      value: '1,248',
      description: 'Active registered learners',
      icon: Users,
      isPositive: true,
      change: '+12.4%',
      sparklineRedesign: 'M0,28 Q30,10 60,30 T120,12 T160,8',
      sparklineStroke: '#2563EB',
      iconColor: 'text-blue-600'
    },
    {
      id: 'teachers',
      title: 'Total Teachers',
      value: '32',
      description: 'Expert faculty mentors',
      icon: GraduationCap,
      isPositive: true,
      change: '+4.2%',
      sparklineRedesign: 'M0,30 Q32,24 64,32 T128,16 T160,12',
      sparklineStroke: '#94A3B8',
      iconColor: 'text-slate-600'
    },
    {
      id: 'parents',
      title: 'Total Parents',
      value: '982',
      description: 'Linked parent profiles',
      icon: UserCheck,
      isPositive: true,
      change: '+8.1%',
      sparklineRedesign: 'M0,32 Q35,18 70,26 T140,10 T160,8',
      sparklineStroke: '#94A3B8',
      iconColor: 'text-slate-600'
    },
    {
      id: 'batches',
      title: 'Active Batches',
      value: '18',
      description: 'Concurrent running classes',
      icon: Layers,
      isPositive: true,
      change: '0.0%',
      sparklineRedesign: 'M0,18 L50,18 L100,18 L160,18',
      sparklineStroke: '#94A3B8',
      iconColor: 'text-slate-600'
    },
    {
      id: 'revenue',
      title: 'Revenue',
      value: '₹12.48L',
      description: 'Accrued tuition earnings',
      icon: TrendingUp,
      isPositive: true,
      change: '+22.8%',
      sparklineRedesign: 'M0,32 Q20,28 40,16 T80,20 T128,6 T160,2',
      sparklineStroke: '#2563EB',
      iconColor: 'text-blue-600'
    },
    {
      id: 'attendance',
      title: 'Attendance',
      value: '94.2%',
      description: 'Class check-in average',
      icon: CheckCircle,
      isPositive: false,
      change: '-1.5%',
      sparklineRedesign: 'M0,8 Q32,12 64,32 T128,30 T160,24',
      sparklineStroke: '#10B981',
      iconColor: 'text-emerald-600'
    },
    {
      id: 'homework',
      title: 'Homework',
      value: '42',
      description: 'Assignments pending review',
      icon: ClipboardList,
      isPositive: false,
      change: '-8.4%',
      sparklineRedesign: 'M0,6 Q35,12 70,26 T140,32 T160,34',
      sparklineStroke: '#EF4444',
      iconColor: 'text-red-600'
    },
    {
      id: 'fees',
      title: 'Fee Status',
      value: '86.5%',
      description: 'Fee installments cleared',
      icon: Wallet,
      isPositive: true,
      change: '+5.7%',
      sparklineRedesign: 'M0,32 Q26,24 53,16 T106,14 T160,6',
      sparklineStroke: '#2563EB',
      iconColor: 'text-blue-600'
    }
  ]

  // Mock data for analytics chart sections
  const growthData = [
    { name: 'Jan', students: 800 },
    { name: 'Feb', students: 920 },
    { name: 'Mar', students: 1050 },
    { name: 'Apr', students: 1100 },
    { name: 'May', students: 1180 },
    { name: 'Jun', students: 1248 }
  ]

  const revenueData = [
    { name: 'Jan', accrued: 150000, collected: 130000 },
    { name: 'Feb', accrued: 180000, collected: 160000 },
    { name: 'Mar', accrued: 200000, collected: 185000 },
    { name: 'Apr', accrued: 220000, collected: 210000 },
    { name: 'May', accrued: 240000, collected: 230000 },
    { name: 'Jun', accrued: 250000, collected: 248200 }
  ]

  const attendanceData = [
    { name: 'Mon', rate: 92.5 },
    { name: 'Tue', rate: 93.8 },
    { name: 'Wed', rate: 94.1 },
    { name: 'Thu', rate: 93.9 },
    { name: 'Fri', rate: 94.5 },
    { name: 'Sat', rate: 94.2 }
  ]

  const distributionData = [
    { name: 'Paid', value: 65, color: '#2563EB' },
    { name: 'Partial', value: 20, color: '#EA580C' },
    { name: 'Unpaid', value: 15, color: '#EF4444' }
  ]

  // Mock data for recent activities timeline
  const activities = [
    {
      icon: UserPlus,
      title: 'New Student Registered',
      desc: 'Aryan Sharma enrolled in Grade 12 Math/Sci batch.',
      time: '12 min',
      category: 'Admission',
      color: 'text-blue-500 bg-blue-50'
    },
    {
      icon: GraduationCap,
      title: 'Teacher Added',
      desc: 'Mrs. Smita Patel registered as Physics Faculty.',
      time: '45 min',
      category: 'Faculty',
      color: 'text-teal-600 bg-teal-50'
    },
    {
      icon: FileUp,
      title: 'Homework Uploaded',
      desc: 'H.C. Verma Chapter 6 Exercises posted to Batch XII-A.',
      time: '2 hr',
      category: 'Homework',
      color: 'text-purple-600 bg-purple-50'
    },
    {
      icon: Receipt,
      title: 'Fee Received',
      desc: 'Accrued terminal installment ₹18,500 cleared for Rohan Varma.',
      time: '3 hr',
      category: 'Finance',
      color: 'text-emerald-600 bg-emerald-50'
    },
    {
      icon: Megaphone,
      title: 'Announcement Published',
      desc: 'Surat district terminal monsoon holiday notification posted.',
      time: '5 hr',
      category: 'Announcement',
      color: 'text-amber-600 bg-amber-50'
    },
    {
      icon: Calendar,
      title: 'Exam Scheduled',
      desc: 'Unit test syllabus mapped for Batch XI Commerce.',
      time: '1 day',
      category: 'Exam',
      color: 'text-indigo-600 bg-indigo-50'
    },
    {
      icon: Users,
      title: 'Parent Meeting Created',
      desc: 'Term 1 progress validation review session opened.',
      time: '2 days',
      category: 'Admission',
      color: 'text-blue-500 bg-blue-50'
    },
    {
      icon: CheckSquare,
      title: 'Attendance Submitted',
      desc: 'Schedules attendance sheets verified for Batch X-B.',
      time: '2 days',
      category: 'Faculty',
      color: 'text-teal-600 bg-teal-50'
    }
  ]

  // Mock data for quick actions
  const quickActions = [
    {
      title: 'Add Student',
      desc: 'Register a student profile',
      icon: UserPlus,
      shortcut: '⌘S'
    },
    {
      title: 'Add Teacher',
      desc: 'Register teacher credentials',
      icon: GraduationCap,
      shortcut: '⌘T'
    },
    {
      title: 'Create Batch',
      desc: 'Setup schedules & structures',
      icon: Layers,
      shortcut: '⌘B'
    },
    {
      title: 'Upload Material',
      desc: 'Post PDFs and reading logs',
      icon: BookOpen,
      shortcut: '⌘U'
    },
    {
      title: 'Publish News',
      desc: 'Broadcast platform notices',
      icon: Megaphone,
      shortcut: '⌘P'
    },
    {
      title: 'Schedule Exam',
      desc: 'Setup mock papers & marks',
      icon: Calendar,
      shortcut: '⌘E'
    }
  ]

  // Mock data for Admissions Table
  const admissions = [
    { name: 'Aryan Sharma', email: 'aryan.sharma@gmail.com', grade: 'Class 12 Sci', parent: 'Rajesh Sharma', date: '02 Jul, 2026', status: 'Active' },
    { name: 'Sneha Patel', email: 'sneha.patel@yahoo.com', grade: 'Class 10 Sci', parent: 'Vipul Patel', date: '01 Jul, 2026', status: 'Active' },
    { name: 'Meera Nair', email: 'meera.nair@hotmail.com', grade: 'Class 11 Comm', parent: 'Hari Nair', date: '28 Jun, 2026', status: 'Pending' },
    { name: 'Kabir Mehta', email: 'kabir.mehta@gmail.com', grade: 'Class 12 Comm', parent: 'Amit Mehta', date: '25 Jun, 2026', status: 'Active' }
  ]

  // Mock data for payments table
  const payments = [
    { student: 'Rohan Varma', amount: '₹18,500', method: 'UPI', date: '03 Jul, 2026', status: 'Paid' },
    { student: 'Ananya Sen', amount: '₹12,000', method: 'Card', date: '02 Jul, 2026', status: 'Paid' },
    { student: 'Dev Patel', amount: '₹24,000', method: 'Cash', date: '30 Jun, 2026', status: 'Partial' },
    { student: 'Riya Shah', amount: '₹15,000', method: 'UPI', date: '28 Jun, 2026', status: 'Overdue' }
  ]

  // Shared chart elements
  const chartFont = { fontSize: 10, fill: '#64748B', fontWeight: 650 }
  const gridStroke = '#F1F3F5'

  // Custom tooltips styling wrapper
  const CustomTooltip = ({ active, payload, label, formatter }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-800 p-3 rounded-premium-md shadow-premium-3 text-left">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
          {payload.map((entry, idx) => (
            <p key={idx} className="text-xs font-semibold text-white">
              {entry.name}: <span className="font-bold">{formatter ? formatter(entry.value) : entry.value}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Filter admissions based on search inputs
  const filteredAdmissions = admissions.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.parent.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.grade.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Filter payments based on search inputs
  const filteredPayments = payments.filter(item => 
    item.student.toLowerCase().includes(paymentsSearch.toLowerCase()) || 
    item.method.toLowerCase().includes(paymentsSearch.toLowerCase())
  )

  // Calendar setup properties
  const calendarDays = [
    { day: 29, currentMonth: false, events: [] },
    { day: 30, currentMonth: false, events: [] },
    { day: 1, currentMonth: true, events: [{ type: 'holiday', title: 'National Doctors Day' }] },
    { day: 2, currentMonth: true, events: [] },
    { day: 3, currentMonth: true, events: [{ type: 'exam', title: 'Grade 12 Physics Unit Test' }, { type: 'birthday', title: 'Rahul Patel' }] },
    { day: 4, currentMonth: true, events: [] },
    { day: 5, currentMonth: true, events: [{ type: 'parent', title: 'Parent Meeting X' }] },
    { day: 6, currentMonth: true, events: [] },
    { day: 7, currentMonth: true, events: [] },
    { day: 8, currentMonth: true, events: [{ type: 'faculty', title: 'Syllabus Alignment Meet' }] },
    { day: 9, currentMonth: true, events: [] },
    { day: 10, currentMonth: true, events: [] },
    { day: 11, currentMonth: true, events: [] },
    { day: 12, currentMonth: true, events: [] },
    { day: 13, currentMonth: true, events: [] },
    { day: 14, currentMonth: true, events: [] },
    { day: 15, currentMonth: true, events: [] },
    { day: 16, currentMonth: true, events: [] },
    { day: 17, currentMonth: true, events: [] },
    { day: 18, currentMonth: true, events: [] },
    { day: 19, currentMonth: true, events: [] },
    { day: 20, currentMonth: true, events: [] },
    { day: 21, currentMonth: true, events: [] },
    { day: 22, currentMonth: true, events: [] },
    { day: 23, currentMonth: true, events: [] },
    { day: 24, currentMonth: true, events: [] },
    { day: 25, currentMonth: true, events: [] },
    { day: 26, currentMonth: true, events: [] },
    { day: 27, currentMonth: true, events: [] },
    { day: 28, currentMonth: true, events: [] },
    { day: 29, currentMonth: true, events: [] },
    { day: 30, currentMonth: true, events: [] },
    { day: 31, currentMonth: true, events: [] },
    { day: 1, currentMonth: false, events: [] },
    { day: 2, currentMonth: false, events: [] }
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const activeEvents = [
    { type: 'exam', title: 'Grade 12 Physics Unit Test', time: '10:00 AM - 12:00 PM', desc: 'Chapter 1 to 4 syllabus review', color: 'border-l-orange-500 bg-orange-50/40 text-orange-700', icon: ExamIcon },
    { type: 'parent', title: 'Parent Meeting Grade 10', time: '02:30 PM - 04:00 PM', desc: 'Term 1 progress validation feedback', color: 'border-l-purple-500 bg-purple-50/40 text-purple-700', icon: Users },
    { type: 'faculty', title: 'Faculty Syllabus Sync', time: '05:00 PM - 06:00 PM', desc: 'Alignment targets check-in', color: 'border-l-blue-500 bg-brand-blue-50/40 text-brand-blue-700', icon: GraduationCap },
    { type: 'birthday', title: 'Chirayu Poddar Birthday', time: 'All Day Event', desc: 'Happy Birthday Admin', color: 'border-l-pink-500 bg-pink-50/40 text-pink-700', icon: Cake },
    { type: 'holiday', title: 'Guru Purnima Holiday', time: 'All Day Event', desc: 'Institute operational holiday', color: 'border-l-red-500 bg-red-50/40 text-red-700', icon: PartyPopper }
  ]

  // Notifications
  const notifications = [
    { icon: UserPlus, title: 'New Admission Registered', desc: 'Amit Patel registered successfully in Batch XII Sci.', time: '5 mins ago', unread: true },
    { icon: FileUp, title: 'Homework Submitted', desc: 'Batch XI-A Mathematics assignment uploaded by 14 students.', time: '18 mins ago', unread: true },
    { icon: Wallet, title: 'Fee Payment Processed', desc: 'Installment ₹24,000 received from Dev Patel.', time: '1 hour ago', unread: false },
    { icon: GraduationCap, title: 'New Teacher Profile Active', desc: 'Mr. Anil Shah joined Chemistry Faculty board.', time: '2 hours ago', unread: false },
    { icon: BookOpen, title: 'Study Module Uploaded', desc: 'New Organic Chemistry notes uploaded to study library.', time: '1 day ago', unread: false },
    { icon: Bell, title: 'Upcoming Faculty Meeting', desc: 'Quarterly review scheduled for Saturday at 4 PM.', time: '2 days ago', unread: false }
  ]

  // Reports
  const reports = [
    { title: 'Attendance Report', desc: 'Daily check-in percentages', icon: CheckCircle, chart: 'M0,15 Q30,5 60,20 T120,8', color: 'text-emerald-500 hover:border-emerald-200 hover:ring-4 hover:ring-emerald-50/50' },
    { title: 'Revenue Report', desc: 'Tuition fees ledger logs', icon: TrendingUp, chart: 'M0,20 Q30,12 60,18 T120,4', color: 'text-brand-blue-500 hover:border-brand-blue-200 hover:ring-4 hover:ring-brand-blue-50/50' },
    { title: 'Student Performance', desc: 'Exam score sheets curve', icon: Users, chart: 'M0,25 Q30,15 60,10 T120,6', color: 'text-purple-500 hover:border-purple-200 hover:ring-4 hover:ring-purple-50/50' },
    { title: 'Teacher Performance', desc: 'Faculty lecture feedback', icon: GraduationCap, chart: 'M0,12 Q30,15 60,8 T120,5', color: 'text-teal-500 hover:border-teal-200 hover:ring-4 hover:ring-teal-50/50' },
    { title: 'Homework Report', desc: 'Submissions validation score', icon: ClipboardList, chart: 'M0,8 Q30,12 60,5 T120,2', color: 'text-amber-500 hover:border-amber-200 hover:ring-4 hover:ring-amber-50/50' },
    { title: 'Exam Report', desc: 'Platform grade percentages', icon: ExamIcon, chart: 'M0,22 Q30,18 60,20 T120,10', color: 'text-orange-500 hover:border-orange-200 hover:ring-4 hover:ring-orange-50/50' }
  ]

  // System status
  const systemStatus = [
    { name: 'Database', status: 'operational', label: 'Online', icon: Database },
    { name: 'Backend API', status: 'operational', label: 'Connected', icon: Server },
    { name: 'Cloudinary CDN', status: 'operational', label: 'Active', icon: Cloud },
    { name: 'Email (SMTP)', status: 'operational', label: 'Operational', icon: Mail },
    { name: 'Payment Gateway', status: 'degraded', label: 'Degraded', icon: CreditCard },
    { name: 'Socket.io', status: 'operational', label: 'Connected', icon: Wifi }
  ]

  return (
    <div className="space-y-[64px] select-none">
      
      {/* Dynamic Header Greeting (Navbar -> 48px -> Greeting -> 40px -> Cards) */}
      <div className="text-left mt-12 mb-10">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 leading-none">
          Good {greeting}, {user?.firstName || 'Chirayu'} 👋
        </h2>
        <p className="text-xs font-semibold text-slate-400 mt-2 leading-none">
          Admin Control Room — Real-time statistics ledger and management metrics.
        </p>
      </div>

      {/* 8 Premium KPI Cards Grid with increased spacing (28-32px spacing) */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
      >
        {kpis.map((kpi, idx) => (
          <KpiCard key={idx} kpi={kpi} cardVariants={cardVariants} />
        ))}
      </motion.div>

      {/* Analytics Charts Grid (2x2 with Stripe gradients) */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2"
      >
        {/* Chart 1: Student Growth */}
        <motion.div variants={cardVariants}>
          <AnalyticsCard>
            <ChartHeader
              title="Student Growth"
              description="Active registrations trend chart"
              legend={<ChartLegend items={[{ name: 'Students', color: '#2563EB' }]} />}
            />
            <div className="flex-1 min-h-0 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData} margin={{ top: 12, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="studentGrowthGradientRefactor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.08} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" tick={chartFont} tickLine={false} axisLine={false} />
                  <YAxis tick={chartFont} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="students"
                    name="Students"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#studentGrowthGradientRefactor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </AnalyticsCard>
        </motion.div>

        {/* Chart 2: Revenue Overview */}
        <motion.div variants={cardVariants}>
          <AnalyticsCard>
            <ChartHeader
              title="Revenue Overview"
              description="Accrued vs collected fees comparison"
              legend={<ChartLegend items={[{ name: 'Accrued', color: '#94A3B8' }, { name: 'Collected', color: '#2563EB' }]} />}
            />
            <div className="flex-1 min-h-0 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 12, right: 10, left: -10, bottom: 0 }} barGap={5}>
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" tick={chartFont} tickLine={false} axisLine={false} />
                  <YAxis tick={chartFont} tickLine={false} axisLine={false} formatter={(v) => `₹${v/1000}k`} />
                  <Tooltip content={<ChartTooltip formatter={(v) => `₹${v.toLocaleString()}`} />} cursor={{ fill: 'rgba(148,163,184,0.04)' }} />
                  <Bar dataKey="accrued" name="Accrued Fee" fill="#94A3B8" opacity={0.35} radius={[6, 6, 0, 0]} maxBarSize={16} />
                  <Bar dataKey="collected" name="Collected Fee" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AnalyticsCard>
        </motion.div>

        {/* Chart 3: Attendance Trend */}
        <motion.div variants={cardVariants}>
          <AnalyticsCard>
            <ChartHeader
              title="Attendance Trend"
              description="Weekly check-in percentages tracker"
              legend={<ChartLegend items={[{ name: 'Attendance', color: '#10B981' }]} />}
            />
            <div className="flex-1 min-h-0 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceData} margin={{ top: 12, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" tick={chartFont} tickLine={false} axisLine={false} />
                  <YAxis tick={chartFont} tickLine={false} axisLine={false} domain={[90, 96]} formatter={(v) => `${v}%`} />
                  <Tooltip content={<ChartTooltip formatter={(v) => `${v}%`} />} cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }} />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    name="Attendance"
                    stroke="#10B981"
                    strokeWidth={2}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                    dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </AnalyticsCard>
        </motion.div>

        {/* Chart 4: Fee Collection Distribution */}
        <motion.div variants={cardVariants}>
          <AnalyticsCard>
            <ChartHeader
              title="Fee Distribution"
              description="Status breakdown of billed fee accounts"
              legend={<ChartLegend items={[{ name: 'Paid', color: '#2563EB' }, { name: 'Partial', color: '#EA580C' }, { name: 'Unpaid', color: '#EF4444' }]} />}
            />
            <div className="flex-1 min-h-0 w-full mt-2 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="h-full w-full max-w-[200px] flex items-center justify-center shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip formatter={(v) => `${v}%`} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-grow w-full flex flex-col gap-3 justify-center text-left">
                {distributionData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-b-slate-100 pb-2 last:border-b-0">
                    <div className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-bold text-slate-500">{item.name}</span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-800">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </AnalyticsCard>
        </motion.div>
      </motion.div>

      {/* Row 3: Recent Activity Timeline */}
      <div className="w-full">
        <ActivityFeed>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none shrink-0 mb-6 pb-2">
            <div className="text-left space-y-1">
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight leading-none">
                Recent Activity
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 leading-none mt-1">
                Real-time activity logs across administrative departments
              </p>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              {/* Filter pills: All / Today */}
              <div className="flex items-center bg-slate-50 border border-slate-200/40 rounded-full p-0.5">
                {['All', 'Today'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActivityFilter(filter)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer",
                      activityFilter === filter
                        ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* View All ghost button */}
              <button className="h-8 px-3 rounded-full border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-500 shadow-sm cursor-pointer transition-colors active:scale-95">
                View All
              </button>
            </div>
          </div>

          {/* Desktop 8 rows visible block with internal scroll */}
          <div className="flex-1 w-full h-[576px] overflow-y-auto pr-1">
            <div className="flex flex-col">
              {activities.map((act, index) => (
                <ActivityRow key={index} activity={act} isTop={index === 0} />
              ))}
            </div>
          </div>

          {/* Bottom centered link */}
          <div className="flex justify-center border-t border-slate-100 pt-4 mt-2">
            <button className="text-[11px] font-extrabold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-1 active:scale-95 transition-all">
              <span>View activity history</span>
              <span className="text-xs">→</span>
            </button>
          </div>
        </ActivityFeed>
      </div>

      {/* Row 3.5: Quick Actions Command Center (Raycast & Linear style) */}
      <div 
        style={{
          borderRadius: '28px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #ECECEC',
        }}
        className="p-8 flex flex-col gap-6 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.015)]"
      >
        <div className="flex justify-between items-center select-none shrink-0 border-b border-b-slate-100 pb-4">
          <div className="text-left space-y-1">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 leading-none">
              Quick Actions
            </h3>
            <p className="text-[11px] font-semibold text-slate-400 leading-none mt-1">
              Instant action triggers for management operations
            </p>
          </div>
          <button className="h-8 px-3 rounded-full border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-500 shadow-sm cursor-pointer transition-colors active:scale-95">
            View All
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {quickActions.map((action, idx) => (
            <QuickActionCard key={idx} action={action} />
          ))}
        </div>
      </div>

      {/* Row 4: Recent Admissions Table & Recent Fee Payments Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
        
        {/* Recent Admissions Table */}
        <DataListCard>
          <TableHeader 
            title="Recent Admissions"
            description="Newly registered student enrollment lists"
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            onFilter={() => {}}
            onSort={() => {}}
            onExport={() => {}}
            onRefresh={() => {}}
          />

          <div className="flex-1 w-full overflow-y-auto max-h-[390px] pr-1">
            <div className="flex flex-col">
              {filteredAdmissions.length > 0 ? (
                filteredAdmissions.map((adm, index) => (
                  <AdmissionRow key={index} adm={adm} />
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 font-bold">
                  No records matched search
                </div>
              )}
            </div>
          </div>

          <ModernPagination current={filteredAdmissions.length} total={admissions.length} />
        </DataListCard>

        {/* Recent Fee Payments Table */}
        <DataListCard>
          <TableHeader 
            title="Recent Payments"
            description="Tuition invoice payment transactions ledger"
            searchValue={paymentsSearch}
            onSearchChange={setPaymentsSearch}
            onFilter={() => {}}
            onSort={() => {}}
            onExport={() => {}}
            onRefresh={() => {}}
          />

          <div className="flex-1 w-full overflow-y-auto max-h-[390px] pr-1">
            <div className="flex flex-col">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((pmt, idx) => (
                  <PaymentRow key={idx} pmt={pmt} idx={idx} />
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 font-bold">
                  No records matched search
                </div>
              )}
            </div>
          </div>

          <ModernPagination current={filteredPayments.length} total={payments.length} />
        </DataListCard>

      </div>

      {/* SECTION 1 & 2: Upcoming Events & Notifications Center */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 pt-2">
        
        {/* Upcoming Events: Apple Calendar Style Layout */}
        <div className="lg:col-span-3">
          <Card className="p-6 h-full flex flex-col gap-6 bg-white border border-slate-200/50 shadow-premium-2">
            <div>
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-[var(--text-secondary)]">Upcoming Events Calendar</h3>
              <p className="text-[11px] text-[var(--text-tertiary)] font-bold mt-0.5">Academic events, test grids, and holiday mappings</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Monthly Calendar View */}
              <div className="md:col-span-7 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)] select-none">
                  <span>July 2026</span>
                  <div className="flex gap-1">
                    <button className="p-1 hover:bg-slate-50 border border-slate-200 rounded-premium-sm active:scale-95 transition-all"><ChevronLeft className="h-3 w-3" /></button>
                    <button className="p-1 hover:bg-slate-50 border border-slate-200 rounded-premium-sm active:scale-95 transition-all"><ChevronRight className="h-3 w-3" /></button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5 text-center select-none">
                  {dayNames.map((name) => (
                    <span key={name} className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-wider py-1">
                      {name}
                    </span>
                  ))}
                  {calendarDays.map((d, idx) => {
                    const isSelected = selectedDay === d.day && d.currentMonth
                    const hasEvent = d.events.length > 0

                    return (
                      <button
                        key={idx}
                        onClick={() => d.currentMonth && setSelectedDay(d.day)}
                        disabled={!d.currentMonth}
                        className={cn(
                          "h-8.5 rounded-premium-md flex flex-col items-center justify-center relative text-xs font-bold focus:outline-none transition-all duration-200 cursor-pointer",
                          !d.currentMonth && "text-[var(--text-tertiary)] opacity-30 cursor-default",
                          d.currentMonth && !isSelected && "hover:bg-slate-50 text-[var(--text-primary)]",
                          isSelected && "bg-brand-blue-500 text-white shadow-premium-2 scale-105"
                        )}
                      >
                        <span>{d.day}</span>
                        {hasEvent && (
                          <span className={cn(
                            "absolute bottom-1 h-1 w-1 rounded-full",
                            isSelected ? "bg-white" : "bg-brand-orange-500"
                          )} />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Today's Events list */}
              <div className="md:col-span-5 space-y-3">
                <h4 className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                  Events on July {selectedDay}
                </h4>
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {activeEvents.map((evt, index) => {
                    const EvtIcon = evt.icon

                    return (
                      <motion.div 
                        key={index}
                        whileHover={{ y: -2, scale: 1.01 }}
                        className={cn(
                          "p-3 rounded-premium-md border-l-[3.5px] text-left space-y-1 transition-all duration-200 shadow-sm",
                          evt.color
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <EvtIcon className="h-3.5 w-3.5 shrink-0" />
                          <h5 className="text-[11px] font-extrabold tracking-tight">{evt.title}</h5>
                        </div>
                        <p className="text-[10px] font-semibold opacity-85">{evt.time}</p>
                        <p className="text-[10px] opacity-70 leading-normal font-medium">{evt.desc}</p>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Notifications Center */}
        <div className="lg:col-span-2">
          <Card className="p-6 h-full flex flex-col gap-6 bg-white border border-slate-200/50 shadow-premium-2">
            <div>
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-[var(--text-secondary)]">Notifications Center</h3>
              <p className="text-[11px] text-[var(--text-tertiary)] font-bold mt-0.5">Recent system messages and alerts logs</p>
            </div>

            <div className="space-y-3 flex-1 max-h-[300px] overflow-y-auto pr-1">
              {notifications.map((notif, index) => {
                const NotifIcon = notif.icon

                return (
                  <motion.div
                    key={index}
                    whileHover={{ x: 4, scale: 1.01 }}
                    className="p-3 bg-white border border-slate-200/60 hover:border-slate-300 rounded-premium-xl shadow-sm flex items-start justify-between gap-3 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-8.5 w-8.5 rounded-premium-md bg-slate-50 text-[var(--text-secondary)] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <NotifIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-[var(--text-primary)]">{notif.title}</h4>
                          {notif.unread && (
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-orange-500 animate-ping" />
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 leading-normal">
                          {notif.desc}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-[var(--text-tertiary)] shrink-0 whitespace-nowrap">
                      {notif.time}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </Card>
        </div>

      </div>

      {/* SECTION 3: Reports Overview */}
      <div className="space-y-4 pt-2">
        <div>
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-[var(--text-secondary)]">Reports Overview</h3>
          <p className="text-[11px] text-[var(--text-tertiary)] font-bold mt-0.5">Downloadable analytical summary ledger documents</p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6"
        >
          {reports.map((report, idx) => {
            const RepIcon = report.icon

            return (
              <motion.div key={idx} variants={cardVariants}>
                <Card isInteractive className={cn("p-4 flex flex-col justify-between h-full gap-3 group relative border border-slate-200/50 hover:scale-102 hover:-translate-y-0.5 transition-all duration-300 bg-white shadow-premium-1")}>
                  
                  {/* Highlight Glow borders on hover */}
                  <div className="absolute inset-0 border border-transparent rounded-premium-xl group-hover:border-brand-blue-500/20 transition-all duration-300 pointer-events-none" />

                  <div className="flex items-center justify-between relative z-10">
                    <div className={cn("h-7.5 w-7.5 rounded-premium-md bg-slate-50 flex items-center justify-center shadow-sm", report.color)}>
                      <RepIcon className="h-4 w-4" />
                    </div>
                    <button className="p-1 rounded-premium-sm hover:bg-brand-blue-50 text-[var(--text-tertiary)] hover:text-brand-blue-500 transition-colors active:scale-95 cursor-pointer">
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="text-left mt-1 relative z-10">
                    <h4 className="text-xs font-bold text-[var(--text-primary)] line-clamp-1 group-hover:text-brand-blue-600 transition-colors">{report.title}</h4>
                    <p className="text-[9px] text-[var(--text-tertiary)] font-bold mt-0.5 line-clamp-1">{report.desc}</p>
                  </div>

                  <div className={cn("w-full h-8 mt-1 border-t border-slate-100 pt-2 shrink-0 relative z-10", report.color)}>
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 120 30" preserveAspectRatio="none">
                      <path
                        d={report.chart}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      {/* SECTION 4: System Status */}
      <div className="space-y-4 pt-2">
        <div>
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-[var(--text-secondary)]">System Status</h3>
          <p className="text-[11px] text-[var(--text-tertiary)] font-bold mt-0.5">Operational readiness monitor logs for integration APIs</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {systemStatus.map((sys, idx) => {
            const SysIcon = sys.icon
            const isDegraded = sys.status === 'degraded'

            return (
              <Card key={idx} className="p-4 flex flex-col justify-between gap-3 text-left bg-white border border-slate-200/50 hover:border-slate-300 transition-all shadow-premium-1">
                <div className="flex items-center justify-between">
                  <div className="h-7.5 w-7.5 rounded-premium-md border border-slate-200/60 bg-slate-50 text-[var(--text-secondary)] flex items-center justify-center shadow-sm">
                    <SysIcon className="h-4 w-4" />
                  </div>
                  {/* Status Indicator circle with pulsing glows */}
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className={cn(
                      "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                      isDegraded ? 'bg-amber-400' : 'bg-emerald-400'
                    )} />
                    <span className={cn(
                      "relative inline-flex rounded-full h-2.5 w-2.5 shadow-sm",
                      isDegraded ? 'bg-amber-500' : 'bg-emerald-500'
                    )} />
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">{sys.name}</h4>
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-wider block mt-0.5",
                    isDegraded ? 'text-amber-600' : 'text-emerald-600'
                  )}>
                    {sys.label}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* SECTION 5: Footer */}
      <footer className="border-t border-slate-200 pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-bold text-[var(--text-tertiary)] tracking-wide select-none pb-4">
        <div className="flex items-center gap-2">
          <Server className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
          <span>CK-ERP v1.2.0-stable</span>
          <span className="text-[var(--border-strong)]">|</span>
          <span className="flex items-center gap-1.5 text-emerald-600">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            Server Operational
          </span>
        </div>
        <div>
          <span>Last Sync: {new Date().toLocaleTimeString()} (IST)</span>
        </div>
        <div>
          <span>© {new Date().getFullYear()} C.K. Classes. Surat, Gujarat, India. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
