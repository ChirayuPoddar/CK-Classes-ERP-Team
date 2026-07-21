import React, { useState, useEffect } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

export const PublicLayout = () => {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-brand-blue-500 selection:text-white">
      {/* Sticky Premium Navbar */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 flex items-center justify-between px-8 md:px-16 w-full border-b border-transparent",
          scrolled 
            ? "bg-white/80 backdrop-blur-md border-b-[var(--border-light)] shadow-premium-1" 
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          {/* Brand Logo Placeholder */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-premium-md bg-brand-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-premium-1 group-hover:scale-105 transition-transform duration-200">
              CK
            </div>
            <span className="font-bold text-sm tracking-tight text-[var(--text-primary)]">C.K. Classes</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[var(--text-secondary)]">
            <Link to="/" className="hover:text-brand-blue-500 transition-colors">Home</Link>
            <a href="#courses" className="hover:text-brand-blue-500 transition-colors">Courses</a>
            <a href="#faculty" className="hover:text-brand-blue-500 transition-colors">Faculty</a>
            <a href="#results" className="hover:text-brand-blue-500 transition-colors">Results</a>
            <a href="#gallery" className="hover:text-brand-blue-500 transition-colors">Gallery</a>
            <a href="#contact" className="hover:text-brand-blue-500 transition-colors">Contact</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-4">
            <Link 
              to="/auth/login" 
              className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-3 py-2"
            >
              Login
            </Link>
            <a 
              href="#contact" 
              className="px-4 py-2 rounded-premium-md bg-brand-blue-500 text-white hover:bg-brand-blue-600 shadow-premium-1 hover:shadow-premium-2 active:scale-95 transition-all text-xs font-semibold"
            >
              Get Admission
            </a>
          </div>
        </div>
      </motion.header>

      {/* Main Page View (Adds top padding to prevent content overlap with sticky navbar) */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Landing Footer */}
      <footer className="border-t border-t-[var(--border-light)] py-8 bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center text-xs text-[var(--text-tertiary)] font-medium">
          <span>© {new Date().getFullYear()} C.K. Classes. Parvat Patiya, Surat, India. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="hover:underline">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
