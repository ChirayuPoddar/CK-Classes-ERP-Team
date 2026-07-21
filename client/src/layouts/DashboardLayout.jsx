import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/common/Sidebar'
import { Navbar } from '@/components/common/Navbar'
import { Menu, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { motion, AnimatePresence } from 'framer-motion'

export const DashboardLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen)
  }

  const toggleCollapse = () => {
    setCollapsed(!collapsed)
  }

  const isNoNavbarPage = [
    '/admin/students', '/admin/teachers', '/admin/subjects', '/admin/timetable', 
    '/admin/attendance', '/admin/attendance/history', '/admin/attendance/analytics', 
    '/students', '/teachers', '/subjects', '/admin/fees', '/admin/homework', 
    '/teacher/homework', '/student/homework', '/admin/exams', '/teacher/exams', '/student/exams',
    '/admin/announcements', '/teacher/announcements', '/student/announcements',
    '/admin/resources', '/teacher/resources', '/student/resources', '/resources',
    '/admin/users'
  ].includes(location.pathname)

  return (
    <div className={cn("bg-[#F8F9FB] text-[var(--text-primary)]", isNoNavbarPage ? "h-screen overflow-hidden" : "min-h-screen")}>
      {/* 1. Desktop Sidebar (floating layout, margins left/top/bottom, hidden on mobile/tablet) */}
      <div className="max-md:hidden">
        <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />
      </div>

      {/* 2. Mobile/Tablet Slide-over Sidebar Drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMobileSidebar}
              className="fixed inset-0 bg-black/35 backdrop-blur-sm z-40 md:hidden"
            />
            {/* Slide-in sidebar container (floating wrapper on mobile) */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="fixed left-4 top-4 bottom-4 z-50 md:hidden"
            >
              <Sidebar collapsed={false} onToggleCollapse={() => {}} />
              {/* Close Button on Mobile Drawer */}
              <button 
                onClick={toggleMobileSidebar}
                className="absolute top-4 right-[-44px] h-9 w-9 bg-white border border-slate-200/60 rounded-full flex items-center justify-center text-[var(--text-primary)] shadow-premium-2 active:scale-95 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. Main Content Wrapper */}
      <div className={cn("flex flex-col", isNoNavbarPage ? "h-full overflow-hidden" : "min-h-screen")}>
        {/* Navbar */}
        {!isNoNavbarPage && (
          <div className="relative">
            {/* Mobile hamburger trigger floating in navbar layer */}
            <button 
              onClick={toggleMobileSidebar}
              className="md:hidden absolute left-8 top-7 h-9 w-9 bg-white border border-slate-200/60 rounded-full flex items-center justify-center text-[var(--text-secondary)] shadow-premium-1 active:scale-95 z-30 cursor-pointer"
            >
              <Menu className="h-4 w-4" />
            </button>
            
            <Navbar collapsed={collapsed} />
          </div>
        )}

        {/* Dashboard content canvas layout with precise margin-left padding, right-spacing, and top-spacing */}
        <motion.main 
          animate={{ paddingLeft: collapsed ? 128 : 344 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          className={cn(
            "pr-10 max-md:px-4 max-md:pl-4 transition-all duration-300 flex flex-col min-h-0",
            isNoNavbarPage ? "pt-8 pb-8 h-full overflow-hidden" : "pt-28 pb-12 flex-grow"
          )}
        >
          <div className={cn("mx-auto w-full", isNoNavbarPage ? "h-full flex flex-col min-h-0 max-w-none" : "max-w-7xl")}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className={cn(isNoNavbarPage && "h-full flex flex-col min-h-0")}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.main>
      </div>
    </div>
  )
}
