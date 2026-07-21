import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Bell, 
  ChevronDown, 
  Plus, 
  MessageSquare, 
  Sun,
  Search
} from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

export const Navbar = ({ collapsed }) => {
  const { user } = useAuth()
  const location = useLocation()
  const [searchFocused, setSearchFocused] = useState(false)

  // Generate breadcrumb pathing elements
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean)
    if (paths.length === 0) return <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dashboard</span>
    return paths.map((path, index) => {
      const isLast = index === paths.length - 1
      const formatted = path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ')
      return (
        <span key={path} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {index > 0 && <span className="font-normal text-slate-300">/</span>}
          <span className={isLast ? "text-blue-600 font-extrabold" : "text-slate-400"}>
            {formatted}
          </span>
        </span>
      )
    })
  }

  // Animation spring constants
  const springConfig = { type: 'spring', stiffness: 350, damping: 30 }

  return (
    <motion.header 
      animate={{ left: collapsed ? 128 : 344 }}
      transition={springConfig}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'blur(36px)',
        WebkitBackdropFilter: 'blur(36px)',
        border: '1px solid rgba(255, 255, 255, 0.55)',
        boxShadow: '0 10px 40px rgba(15, 23, 42, 0.04)',
      }}
      className="fixed top-5 right-10 h-[76px] z-20 rounded-[26px] flex items-center justify-between px-6 select-none"
    >
      {/* LEFT SECTION: Small Breadcrumbs */}
      <div className="flex items-center gap-1.5 shrink-0 text-left">
        {getBreadcrumbs()}
      </div>

      {/* CENTER SECTION: Expandable Glass Command Search Bar */}
      <div className="flex-1 flex justify-center px-4 max-md:hidden">
        <motion.div 
          animate={{ 
            scale: searchFocused ? 1.01 : 1,
            width: searchFocused ? 420 : 380,
            boxShadow: searchFocused ? '0 12px 30px rgba(37,99,235,0.06)' : '0 2px 8px rgba(0,0,0,0.01)'
          }}
          transition={springConfig}
          className={cn(
            "relative h-[54px] rounded-full border flex items-center bg-white/40 backdrop-blur-sm transition-all duration-300 px-4",
            searchFocused ? "border-blue-500/40 ring-4 ring-blue-50/50 bg-white" : "border-slate-200/50"
          )}
        >
          <Search className="h-4.5 w-4.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search students, teachers, homework..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full h-full pl-3 pr-12 text-xs font-semibold bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="absolute right-4 h-6 px-2 rounded-full border border-slate-200 bg-white text-[9px] font-black text-slate-400 flex items-center justify-center shadow-sm select-none">
            ⌘ K
          </kbd>
        </motion.div>
      </div>

      {/* RIGHT SECTION: Action Triggers & Glass Profile Widget */}
      <div className="flex items-center gap-3.5 shrink-0">
        
        {/* Create Button (Height 48px, blue-to-purple gradient) */}
        <motion.button 
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-12 px-5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-premium-1 cursor-pointer border border-blue-400/20 active:scale-95"
        >
          <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
            <Plus className="h-4 w-4 text-white" />
          </motion.div>
          <span>Create</span>
        </motion.button>

        {/* Circular Glass Button: Messages */}
        <motion.button 
          whileHover={{ y: -2, scale: 1.08, rotate: -4 }}
          whileTap={{ scale: 0.95 }}
          className="h-11 w-11 rounded-full border border-slate-200/60 bg-white/50 backdrop-blur flex items-center justify-center text-slate-400 hover:text-slate-700 shadow-sm cursor-pointer transition-all"
        >
          <MessageSquare className="h-4 w-4" />
        </motion.button>

        {/* Circular Glass Button: Theme Toggle */}
        <motion.button 
          whileHover={{ y: -2, scale: 1.08, rotate: 12 }}
          whileTap={{ scale: 0.95 }}
          className="h-11 w-11 rounded-full border border-slate-200/60 bg-white/50 backdrop-blur flex items-center justify-center text-slate-400 hover:text-slate-700 shadow-sm cursor-pointer transition-all"
        >
          <Sun className="h-4 w-4" />
        </motion.button>

        {/* Circular Glass Button: Notifications */}
        <motion.button 
          whileHover={{ y: -2, scale: 1.08, rotate: 6 }}
          whileTap={{ scale: 0.95 }}
          className="h-11 w-11 rounded-full border border-slate-200/60 bg-white/50 backdrop-blur flex items-center justify-center text-slate-400 hover:text-slate-700 shadow-sm cursor-pointer relative transition-all"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-3.5 right-3.5 h-1.5 w-1.5 rounded-full bg-brand-orange-500 ring-2 ring-white animate-pulse" />
        </motion.button>

        {/* Floating Profile Widget Card */}
        <motion.div 
          whileHover={{ y: -2, scale: 1.02 }}
          className="flex items-center gap-2.5 pl-3 pr-4 py-1.5 border border-slate-200/50 rounded-full bg-white/50 backdrop-blur-sm cursor-pointer hover:bg-white transition-all shadow-sm max-sm:hidden"
        >
          <div className="relative shrink-0 flex items-center justify-center p-[2px]">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-xs text-white shadow-sm">
              {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
          </div>
          <div className="text-left leading-none max-lg:hidden">
            <h4 className="text-xs font-bold text-slate-800">{user?.firstName}</h4>
            <span className="text-[9px] font-bold text-slate-400 capitalize block mt-0.5">{user?.role}</span>
          </div>
          <ChevronDown className="h-3 w-3 text-slate-400 max-lg:hidden" />
        </motion.div>

      </div>
    </motion.header>
  )
}
