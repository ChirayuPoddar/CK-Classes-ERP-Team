import React from 'react'
import { Outlet } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export const AuthLayout = () => {
  const { user } = useAuth()
  
  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center bg-[var(--bg-secondary)] overflow-hidden">
      {/* Decorative gradient blur rings */}
      <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-brand-blue-50/50 filter blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-brand-orange-50/30 filter blur-[120px]" />
      
      {/* Modern line matrix pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] z-0" />

      {/* Main card box container */}
      <div className="relative z-10 w-full max-w-[420px] mx-4 px-8 py-10 bg-white/95 border border-[var(--border-light)] rounded-premium-xl shadow-premium-3 flex flex-col items-center backdrop-blur-sm">
        {/* Brand Logo Header */}
        <div className="h-11 w-11 rounded-premium-md bg-brand-blue-500 text-white flex items-center justify-center shadow-premium-2 mb-4 hover:rotate-6 transition-transform duration-300">
          <GraduationCap className="h-6 w-6" />
        </div>
        
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">{user?.tenantName || 'Institutional ERP'}</h2>
        <p className="text-xs text-[var(--text-tertiary)] font-semibold mt-1 mb-8 uppercase tracking-wider">Management Portal</p>

        {/* Dynamic portal contents */}
        <div className="w-full">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
