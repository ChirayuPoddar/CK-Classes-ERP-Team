import React, { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import { 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  ShieldCheck, 
  Brain, 
  FileCheck, 
  Users, 
  Calendar, 
  Award, 
  ChevronDown, 
  Zap, 
  CheckCircle2, 
  GraduationCap, 
  Layers 
} from 'lucide-react'

// Self-contained Animated Counter component for metrics
const AnimatedCounter = ({ value, duration = 1.5 }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const end = parseInt(value.replace(/[^0-9]/g, ''), 10)
    if (isNaN(end)) return

    const totalSteps = 60
    const increment = end / totalSteps
    const intervalTime = (duration * 1000) / totalSteps

    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.ceil(start))
      }
    }, intervalTime)

    return () => clearInterval(timer)
  }, [value, duration])

  const suffix = value.replace(/[0-9,]/g, '')
  return (
    <span>
      {count.toLocaleString()}{suffix}
    </span>
  )
}

export default function Home() {
  const videoTrackRef = useRef(null)
  const videoRef = useRef(null)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [videoDuration, setVideoDuration] = useState(0)

  // Scroll Progress tracking for the 300vh video section
  const { scrollYProgress } = useScroll({
    target: videoTrackRef,
    offset: ['start start', 'end end']
  })

  // Smooth spring physics for fluid video frame scrubbing
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  // Fade animations based on scroll progress
  const videoOverlayOpacity = useTransform(smoothProgress, [0, 0.7, 0.95, 1], [0.5, 0.4, 0.85, 1])
  const heroTextOpacity = useTransform(smoothProgress, [0, 0.3, 0.6], [1, 0.8, 0])
  const heroTextY = useTransform(smoothProgress, [0, 0.5], [0, -60])
  
  const endCalloutOpacity = useTransform(smoothProgress, [0.5, 0.8, 0.95, 1], [0, 1, 1, 0])
  const endCalloutScale = useTransform(smoothProgress, [0.5, 0.8, 1], [0.9, 1, 1.05])

  // Handle Video Metadata & Frame Scrubbing
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setVideoDuration(video.duration || 5)
      setIsVideoLoaded(true)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    if (video.readyState >= 1) {
      handleLoadedMetadata()
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [])

  // Sync scroll percentage to video currentTime
  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoDuration) return

    let animationFrameId

    const unsubscribe = smoothProgress.on('change', (latest) => {
      if (videoDuration && isFinite(latest)) {
        animationFrameId = requestAnimationFrame(() => {
          const targetTime = Math.min(videoDuration - 0.05, Math.max(0, latest * videoDuration))
          if (Math.abs(video.currentTime - targetTime) > 0.03) {
            video.currentTime = targetTime
          }
        })
      }
    })

    return () => {
      unsubscribe()
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [smoothProgress, videoDuration])

  const statItems = [
    { value: '10,000+', label: 'Students Enrolled' },
    { value: '98%', label: 'Exam Success Rate' },
    { value: '15+', label: 'Years of Excellence' },
    { value: '50+', label: 'Expert Faculty' }
  ]

  const erpFeatures = [
    {
      icon: <Brain className="h-6 w-6 text-purple-600" />,
      title: 'Groq AI Assistant',
      desc: 'Sub-50ms ultra-fast query answers in Hindi, Hinglish, English, Marathi, and Gujarati with live MongoDB context.'
    },
    {
      icon: <FileCheck className="h-6 w-6 text-indigo-600" />,
      title: '1-Click AI Quiz Generator',
      desc: 'Instantly generates 3 to 30-question printable exam papers + teacher answer keys from study materials.'
    },
    {
      icon: <Users className="h-6 w-6 text-blue-600" />,
      title: 'Student & Attendance Tracking',
      desc: 'Real-time daily attendance tracking, RFID integration, automated SMS/Email alerts to parents.'
    },
    {
      icon: <Award className="h-6 w-6 text-amber-600" />,
      title: 'Exam & Result Analytics',
      desc: 'Class rank matrices, subject percentile graphs, and automated progress report generation.'
    },
    {
      icon: <Calendar className="h-6 w-6 text-emerald-600" />,
      title: 'Smart Timetable & Substitution',
      desc: 'Conflict-free period scheduling and 1-click AI faculty substitution when teachers are on leave.'
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-cyan-600" />,
      title: 'Automated Fee Management',
      desc: 'Track fee installment dues, pending payments, partial receipts, and comprehensive financial reports.'
    }
  ]

  return (
    <div className="relative min-h-screen w-full bg-slate-950 font-sans text-slate-100 selection:bg-indigo-500 selection:text-white">
      
      {/* ========================================================================= */}
      {/* 1. SCROLL-DRIVEN VIDEO HERO TRACK (300vh Pinning Container)               */}
      {/* ========================================================================= */}
      <div ref={videoTrackRef} className="relative h-[300vh] w-full">
        
        {/* Sticky Fullscreen Frame */}
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
          
          {/* HTML5 Video element */}
          <video
            ref={videoRef}
            src="/videos/classes.mp4"
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full object-cover object-center z-0 filter brightness-95 contrast-105"
          />

          {/* Dynamic Ambient Gradient Overlays */}
          <motion.div 
            style={{ opacity: videoOverlayOpacity }}
            className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/60 z-10 pointer-events-none" 
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(2,6,23,0.85)_100%)] z-10 pointer-events-none" />

          {/* Hero Content Overlay (Visible at Start of Scroll) */}
          <motion.div 
            style={{ opacity: heroTextOpacity, y: heroTextY }}
            className="relative z-20 max-w-5xl mx-auto px-6 text-center flex flex-col items-center select-none"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-bold text-indigo-300 mb-6 backdrop-blur-md shadow-lg">
              <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
              <span>C.K. CLASSES INSTITUTIONAL ERP 2.0</span>
            </div>

            <h1 className="text-4xl sm:text-7xl font-black tracking-tight text-white max-w-4xl leading-[1.08]">
              Building Bright Futures, <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
                One Student at a Time.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl leading-relaxed font-normal">
              Empowering students from Class 1 to 12 in Science & Commerce through expert faculty, real-time AI analytics, and institutional management.
            </p>

            {/* Scroll Indicator */}
            <motion.div 
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="mt-12 flex flex-col items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-widest"
            >
              <span>Scroll down to continue</span>
              <ChevronDown className="h-5 w-5 text-indigo-400" />
            </motion.div>
          </motion.div>

          {/* End Callout Overlay (Fades in near end of video scroll) */}
          <motion.div
            style={{ opacity: endCalloutOpacity, scale: endCalloutScale }}
            className="absolute z-20 max-w-3xl mx-auto px-6 text-center flex flex-col items-center pointer-events-none"
          >
            <div className="h-14 w-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 backdrop-blur-xl flex items-center justify-center mb-4 shadow-2xl">
              <GraduationCap className="h-8 w-8 text-amber-300" />
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Welcome to C.K. Classes ERP
            </h2>
            <p className="mt-3 text-sm sm:text-lg text-slate-300 max-w-xl">
              Scroll further to explore our AI-powered portal and academic management features.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TRANSITION & ERP LANDING CONTENT SECTION                                */}
      {/* ========================================================================= */}
      <div className="relative z-30 bg-slate-950 border-t border-slate-800/80 text-slate-100 pt-20 pb-24">
        
        {/* Background Grid Accent */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-24">

          {/* Call to Actions & Launch Banner */}
          <div className="bg-gradient-to-r from-indigo-900/50 via-purple-900/40 to-slate-900 p-8 sm:p-12 rounded-3xl border border-indigo-500/20 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-xl">
            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
                <Zap className="h-3.5 w-3.5 text-amber-300" />
                <span>Live Portal Active</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Ready to Access the ERP Management Portal?
              </h3>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl">
                Sign in to manage classes, generate AI test papers, check student attendance, and monitor fee receipts in real-time.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full sm:w-auto">
              <a
                href="/login"
                className="px-8 h-13 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-600/30 transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <span>Launch ERP Management</span>
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#features"
                className="px-6 h-13 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200"
              >
                <BookOpen className="h-4 w-4 text-slate-400" />
                <span>Explore Features</span>
              </a>
            </div>
          </div>

          {/* Institutional Statistics Counters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {statItems.map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                className="p-6 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl flex flex-col items-center text-center relative group overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  <AnimatedCounter value={item.value} />
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-2">
                  {item.label}
                </p>
              </motion.div>
            ))}
          </div>

          {/* ERP Core Capabilities Grid */}
          <div id="features" className="space-y-10">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-bold text-indigo-400 tracking-widest uppercase">Comprehensive Modules</span>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Designed for Complete Institutional Control
              </h2>
              <p className="text-sm text-slate-400">
                Powered by Groq Llama 3.3 AI, MongoDB Atlas, and modern web workflows.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {erpFeatures.map((feat, i) => (
                <div 
                  key={i} 
                  className="p-6 bg-slate-900/70 border border-slate-800/80 rounded-2xl hover:border-slate-700 transition duration-300 space-y-4 hover:shadow-2xl hover:shadow-indigo-500/10 group"
                >
                  <div className="h-12 w-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {feat.icon}
                  </div>
                  <h4 className="text-lg font-bold text-white tracking-tight">{feat.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Access Portals Breakdown */}
          <div className="space-y-8 pt-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Role-Based Access Portals</h3>
              <p className="text-xs text-slate-400">Log in with role-specific permissions and scopes</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-3 text-center">
                <div className="h-10 w-10 mx-auto rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm">1</div>
                <h4 className="font-bold text-white">Admin Portal</h4>
                <p className="text-xs text-slate-400">Full access to institute analytics, user management, fee receipts & global settings.</p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-3 text-center">
                <div className="h-10 w-10 mx-auto rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">2</div>
                <h4 className="font-bold text-white">Faculty Portal</h4>
                <p className="text-xs text-slate-400">Class attendance entry, 1-click AI exam paper generator & student feedback logs.</p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-3 text-center">
                <div className="h-10 w-10 mx-auto rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-sm">3</div>
                <h4 className="font-bold text-white">Student & Parent Portal</h4>
                <p className="text-xs text-slate-400">View progress report cards, assigned homeworks, exam schedules & fee dues.</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-12 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© 2026 C.K. Classes ERP Platform. Parvat Patiya, Surat, India. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="/login" className="hover:text-indigo-400 transition">Management Login</a>
              <a href="#features" className="hover:text-indigo-400 transition">ERP Features</a>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
