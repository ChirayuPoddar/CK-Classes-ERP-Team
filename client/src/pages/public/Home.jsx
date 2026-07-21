import React, { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
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
  GraduationCap 
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
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const videoRef = useRef(null)

  const [videoLoaded, setVideoLoaded] = useState(false)
  const durationRef = useRef(0)
  const targetTimeRef = useRef(0)
  const currentTimeRef = useRef(0)

  // Track scroll progress over a 400vh container for maximum smooth scrubbing
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  })

  // Smooth physics spring for butter-smooth motion
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 25,
    mass: 0.2,
    restDelta: 0.0001
  })

  // Fade out hero overlay as user scrolls down
  const heroOpacity = useTransform(smoothProgress, [0, 0.25], [1, 0])
  const heroY = useTransform(smoothProgress, [0, 0.25], [0, -50])

  // Fade in end callout right before video completes
  const calloutOpacity = useTransform(smoothProgress, [0.6, 0.85, 0.95], [0, 1, 0])
  const calloutScale = useTransform(smoothProgress, [0.6, 0.85, 0.95], [0.92, 1, 1.04])

  // Full Screen Canvas Resize Handler with Object-Cover math
  const renderFrame = () => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video || video.readyState < 2) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = window.innerWidth
    const height = window.innerHeight

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr
      canvas.height = height * dpr
    }

    ctx.scale(dpr, dpr)

    // Calculate aspect ratio object-cover math
    const vWidth = video.videoWidth || 1920
    const vHeight = video.videoHeight || 1080
    const vAspect = vWidth / vHeight
    const cAspect = width / height

    let drawW, drawH, drawX, drawY

    if (cAspect > vAspect) {
      drawW = width
      drawH = width / vAspect
      drawX = 0
      drawY = (height - drawH) / 2
    } else {
      drawH = height
      drawW = height * vAspect
      drawX = (width - drawW) / 2
      drawY = 0
    }

    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(video, drawX, drawY, drawW, drawH)
  }

  // Load video metadata
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onLoaded = () => {
      durationRef.current = video.duration || 5
      setVideoLoaded(true)
      video.currentTime = 0
      setTimeout(renderFrame, 100)
    }

    video.addEventListener('loadedmetadata', onLoaded)
    video.addEventListener('seeked', renderFrame)

    if (video.readyState >= 1) {
      onLoaded()
    }

    const onResize = () => {
      renderFrame()
    }
    window.addEventListener('resize', onResize)

    return () => {
      video.removeEventListener('loadedmetadata', onLoaded)
      video.removeEventListener('seeked', renderFrame)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // Smooth RAF Lerp Loop
  useEffect(() => {
    let animId

    const updateLoop = () => {
      const video = videoRef.current
      if (video && durationRef.current) {
        // High-precision lerp smoothing (0.12 factor)
        const diff = targetTimeRef.current - currentTimeRef.current
        if (Math.abs(diff) > 0.001) {
          currentTimeRef.current += diff * 0.18
          video.currentTime = currentTimeRef.current
        }
      }
      animId = requestAnimationFrame(updateLoop)
    }

    animId = requestAnimationFrame(updateLoop)

    const unsub = smoothProgress.on('change', (progressVal) => {
      if (durationRef.current) {
        const clamped = Math.min(0.999, Math.max(0, progressVal))
        targetTimeRef.current = clamped * durationRef.current
      }
    })

    return () => {
      unsub()
      if (animId) cancelAnimationFrame(animId)
    }
  }, [smoothProgress])

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
      
      {/* Hidden HTML5 Video Source */}
      <video
        ref={videoRef}
        src="/videos/classes.mp4"
        muted
        playsInline
        preload="auto"
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* 1. SCROLL-DRIVEN CANVAS VIDEO CONTAINER (400vh Pinning Container)         */}
      {/* ========================================================================= */}
      <div ref={containerRef} className="relative h-[400vh] w-full">
        
        {/* Sticky Fullscreen Frame */}
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
          
          {/* Hardware Accelerated Canvas for 60FPS Video Scrubbing */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full object-cover z-0 filter brightness-105 contrast-105"
          />

          {/* Vignette & Radial Darkening Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950 z-10 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(2,6,23,0.85)_100%)] z-10 pointer-events-none" />

          {/* Initial Hero Text Overlay */}
          <motion.div 
            style={{ opacity: heroOpacity, y: heroY }}
            className="relative z-20 max-w-5xl mx-auto px-6 text-center flex flex-col items-center select-none"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/40 bg-indigo-500/20 text-xs font-bold text-indigo-300 mb-6 backdrop-blur-md shadow-2xl">
              <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
              <span>C.K. CLASSES INSTITUTIONAL ERP 2.0</span>
            </div>

            <h1 className="text-4xl sm:text-7xl font-black tracking-tight text-white max-w-4xl leading-[1.08] drop-shadow-2xl">
              Building Bright Futures, <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
                One Student at a Time.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-xl text-slate-200 max-w-2xl leading-relaxed font-medium drop-shadow-lg">
              Empowering students from Class 1 to 12 in Science & Commerce through expert teaching, personalized learning, and academic excellence.
            </p>

            <motion.div 
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="mt-12 flex flex-col items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-widest bg-slate-900/60 px-4 py-2 rounded-full border border-indigo-500/30 backdrop-blur-md"
            >
              <span>Scroll down to play video</span>
              <ChevronDown className="h-5 w-5 text-amber-300" />
            </motion.div>
          </motion.div>

          {/* End Callout Overlay (Appears right before scroll transition) */}
          <motion.div
            style={{ opacity: calloutOpacity, scale: calloutScale }}
            className="absolute z-20 max-w-3xl mx-auto px-6 text-center flex flex-col items-center pointer-events-none"
          >
            <div className="h-16 w-16 rounded-2xl bg-indigo-600/40 border border-indigo-400/50 backdrop-blur-xl flex items-center justify-center mb-4 shadow-2xl">
              <GraduationCap className="h-9 w-9 text-amber-300" />
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-2xl">
              Welcome to C.K. Classes ERP
            </h2>
            <p className="mt-3 text-sm sm:text-lg text-slate-200 max-w-xl font-medium drop-shadow-md">
              Keep scrolling to enter our AI-powered portal and explore institutional features.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ERP LANDING PAGE CONTENT (Flows in seamlessly after video ends)         */}
      {/* ========================================================================= */}
      <div className="relative z-30 bg-slate-950 border-t border-indigo-500/20 text-slate-100 pt-24 pb-28">
        
        {/* Background Grid Accent */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-24">

          {/* Launch ERP Management CTA Banner */}
          <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-slate-900 p-8 sm:p-14 rounded-3xl border border-indigo-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-2xl">
            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/40">
                <Zap className="h-3.5 w-3.5 text-amber-300" />
                <span>ERP Portal Active & Online</span>
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
                className="px-8 h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-600/40 transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <span>Launch ERP Management</span>
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#features"
                className="px-6 h-14 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200"
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
