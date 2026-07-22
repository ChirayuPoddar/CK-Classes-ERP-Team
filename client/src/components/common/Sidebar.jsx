import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  BookOpen, 
  ClipboardList, 
  CreditCard, 
  Settings, 
  LogOut, 
  Bell, 
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Book,
  CheckSquare
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { motion, AnimatePresence } from 'framer-motion'

import { hasPermission, PERMISSIONS } from '@/utils/permissions'

export const Sidebar = ({ collapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const getNavigationByRole = (role) => {
    const isStudentOrParent = role === 'student' || role === 'parent'
    const rolePrefix = isStudentOrParent ? 'student' : (role || 'admin')

    const masterNavList = [
      { name: 'Dashboard', path: `/${rolePrefix}`, icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_VIEW },
      { name: 'Timetable', path: `/${rolePrefix}/timetable`, icon: Calendar, permission: PERMISSIONS.TIMETABLE_VIEW },
      { name: 'Attendance', path: `/${rolePrefix}/attendance`, icon: CheckSquare, permission: PERMISSIONS.ATTENDANCE_VIEW },
      { name: 'Homework', path: `/${rolePrefix}/homework`, icon: ClipboardList, permission: PERMISSIONS.HOMEWORK_VIEW },
      { name: 'Exams', path: `/${rolePrefix}/exams`, icon: ClipboardList, permission: PERMISSIONS.EXAMS_VIEW },
      { name: 'Announcements', path: `/${rolePrefix}/announcements`, icon: Bell, permission: PERMISSIONS.ANNOUNCEMENTS_VIEW },
      { name: 'Books/Resources', path: `/${rolePrefix}/resources`, icon: BookOpen, permission: PERMISSIONS.RESOURCES_VIEW },
      { name: 'Students', path: `/${rolePrefix}/students`, icon: GraduationCap, permission: PERMISSIONS.STUDENTS_VIEW },
      { name: 'Teachers', path: `/${rolePrefix}/teachers`, icon: Briefcase, permission: PERMISSIONS.TEACHERS_VIEW },
      { name: 'Subjects', path: `/${rolePrefix}/subjects`, icon: Book, permission: PERMISSIONS.SUBJECTS_VIEW },
      { name: 'Users', path: `/${rolePrefix}/users`, icon: Users, permission: PERMISSIONS.USERS_VIEW },
      { name: 'Fees', path: `/${rolePrefix}/fees`, icon: CreditCard, permission: PERMISSIONS.FEES_VIEW },
      { name: 'Reports', path: `/${rolePrefix}/reports`, icon: ClipboardList, permission: PERMISSIONS.REPORTS_VIEW },
      { name: 'Settings', path: `/${rolePrefix}/settings`, icon: Settings, permission: PERMISSIONS.SETTINGS_VIEW }
    ]

    return masterNavList.filter(item => !item.permission || hasPermission(role, item.permission))
  }

  const navItems = getNavigationByRole(user?.role)

  // Apple & Linear spring configuration parameters
  const springConfig = { type: 'spring', stiffness: 350, damping: 28, mass: 1 }

  const itemVariants = (isActive) => ({
    idle: { x: 0, y: 0 },
    hover: { 
      x: isActive || collapsed ? 0 : 6,
      backgroundColor: isActive ? 'transparent' : 'rgba(241,245,249,0.4)',
      transition: { type: 'spring', stiffness: 350, damping: 25 }
    }
  })

  const iconVariants = {
    idle: { scale: 1, rotate: 0 },
    hover: { 
      scale: 1.08, 
      rotate: 4,
      transition: { type: 'spring', stiffness: 350, damping: 20 }
    }
  }

  return (
    <motion.aside 
      animate={{ width: collapsed ? 88 : 300 }}
      transition={springConfig}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.82)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255, 255, 255, 0.55)',
        boxShadow: '0 40px 120px rgba(15, 23, 42, 0.08)',
      }}
      className="fixed top-[18px] bottom-[18px] left-[18px] z-30 select-none rounded-[32px] flex flex-col overflow-hidden"
    >
      {/* 1. Brand Logo Header Section (generous whitespace, 84px height) */}
      <div className="h-[96px] px-6 flex items-center justify-between relative shrink-0">
        <div className="flex items-center gap-4 overflow-hidden">
          {/* Logo with subtle vertical floating animation */}
          <motion.div 
            animate={{ y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            whileHover={{ scale: 1.05, rotate: 6 }}
            className="h-[52px] w-[52px] rounded-[20px] bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-md shrink-0 cursor-pointer relative overflow-hidden"
          >
            <span className="relative z-10">{user?.tenantName ? user.tenantName.substring(0, 2).toUpperCase() : 'ERP'}</span>
            <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
          </motion.div>
          
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap text-left"
              >
                <h1 className="font-extrabold text-[18px] tracking-tight text-slate-800 leading-tight">{user?.tenantName || 'Institutional ERP'}</h1>
                <p className="text-[11px] text-slate-400 font-extrabold tracking-[3px] uppercase mt-0.5">Management ERP</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Small circular glass collapse toggle button */}
        {!collapsed && (
          <motion.button
            whileHover={{ scale: 1.08, rotate: -180 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleCollapse}
            className="h-8 w-8 rounded-full border border-slate-200/50 bg-white/70 backdrop-blur flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 shadow-sm shrink-0 cursor-pointer active:scale-95 ml-2"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </motion.button>
        )}
      </div>

      {/* Collapsed Chevron Toggle Trigger centered in logo box */}
      {collapsed && (
        <div className="h-[36px] flex items-center justify-center shrink-0 mb-4">
          <motion.button
            whileHover={{ scale: 1.08, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleCollapse}
            className="h-8 w-8 rounded-full border border-slate-200/50 bg-white/70 backdrop-blur flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 shadow-sm cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        </div>
      )}

      {/* 2. Navigation items with expanded spacing */}
      <nav className="flex-grow px-4.5 pt-8 pb-4 space-y-[18px] overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              to={item.path}
              className="block relative no-underline outline-none group"
            >
              <motion.div
                variants={itemVariants(isActive)}
                initial="idle"
                whileHover="hover"
                className={cn(
                  "h-[54px] rounded-[18px] pl-3 flex items-center gap-[16px] text-xs font-semibold transition-all relative overflow-hidden whitespace-nowrap select-none",
                  isActive 
                    ? "text-white" 
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {/* Active Pill slides smoothly with soft Indigo/Blue gradient */}
                {isActive && (
                  <motion.div 
                    layoutId="activeNavBackgroundJonyIve"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 z-0 shadow-[0_8px_20px_rgba(79,70,229,0.22)]"
                    transition={springConfig}
                  />
                )}

                {/* Tiny glowing marker line on left edge */}
                {isActive && (
                  <span className="absolute left-1.5 top-3.5 bottom-3.5 w-[3px] bg-white rounded-full shadow-[0_0_8px_white] z-10" />
                )}
                
                {/* Icon Container (rounded 12px) */}
                <div className={cn(
                  "h-9 w-9 rounded-[12px] flex items-center justify-center shrink-0 z-10 transition-colors duration-250",
                  isActive ? "bg-white/10" : "bg-transparent group-hover:bg-slate-100/50"
                )}>
                  {/* Smaller icon size (18px equivalent) */}
                  <motion.div variants={iconVariants} className="flex items-center justify-center">
                    <Icon className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"
                    )} />
                  </motion.div>
                </div>
                
                {/* Text Label */}
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="relative z-10 overflow-hidden font-semibold"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Collapsed Mode Tooltip overlay */}
                {collapsed && (
                  <span className="absolute left-[78px] bg-slate-900/95 backdrop-blur text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-premium-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300 ease-out whitespace-nowrap z-50 pointer-events-none">
                    {item.name}
                  </span>
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* 3. User Card section */}
      <div className="p-4.5 shrink-0 overflow-hidden">
        <motion.div 
          whileHover={{ y: -3 }}
          transition={springConfig}
          className={cn(
            "p-3 rounded-[22px] flex items-center justify-between border shadow-sm transition-all duration-300",
            collapsed 
              ? "bg-transparent border-transparent justify-center"
              : "bg-white/40 border-white/50 backdrop-blur-sm shadow-[0_10px_25px_rgba(0,0,0,0.01)]"
          )}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Avatar Circle with animated ring */}
            <div className="relative shrink-0 flex items-center justify-center p-[2px]">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 animate-spin opacity-40" style={{ animationDuration: '6s' }} />
              <div className="h-8.5 w-8.5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0 relative z-10 border border-white">
                {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
              </div>
              {/* Online Green dot status indicator */}
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white z-20 shadow-sm" />
            </div>
            
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden whitespace-nowrap text-left"
                >
                  <h4 className="text-xs font-bold text-slate-800 truncate">
                    {user?.firstName}
                  </h4>
                  <p className="text-[10px] font-semibold text-slate-400 capitalize truncate">
                    {user?.role}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Circular Logout Button with red hover glows */}
          {!collapsed && (
            <motion.button 
              whileHover={{ 
                scale: 1.08, 
                rotate: 90,
                backgroundColor: 'rgba(239, 68, 68, 0.08)', 
                color: '#EF4444',
                boxShadow: '0 0 12px rgba(239, 68, 68, 0.2)' 
              }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="h-8.5 w-8.5 rounded-full border border-slate-200/50 bg-white flex items-center justify-center text-slate-400 cursor-pointer shrink-0 transition-colors shadow-sm"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </motion.button>
          )}
        </motion.div>
      </div>
    </motion.aside>
  )
}
