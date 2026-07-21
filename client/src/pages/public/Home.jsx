import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  Brain, 
  FileCheck, 
  Users, 
  Calendar, 
  Award, 
  ChevronDown, 
  ShieldCheck 
} from 'lucide-react'
import { cn } from '@/utils/cn'

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

// Self-contained Floating Particles Background Component
const FloatingParticles = ({ count = 55 }) => {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    const colorOptions = [
      'bg-amber-300 shadow-[0_0_8px_#fde047]',
      'bg-amber-400 shadow-[0_0_10px_#fbbf24]',
      'bg-yellow-200 shadow-[0_0_6px_#fef08a]',
      'bg-indigo-300 shadow-[0_0_8px_#a5b4fc]',
      'bg-cyan-300 shadow-[0_0_8px_#67e8f9]'
    ]

    const generated = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      color: colorOptions[Math.floor(Math.random() * colorOptions.length)],
      duration: Math.random() * 5 + 3,
      delay: Math.random() * 4,
      driftX: (Math.random() - 0.5) * 40
    }))

    setParticles(generated)
  }, [count])

  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0.1, y: 0 }}
          animate={{
            y: [-25, 25, -25],
            x: [0, p.driftX, 0],
            opacity: [0.25, 0.95, 0.25],
            scale: [0.8, 1.4, 0.8]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut'
          }}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%'
          }}
          className={p.color}
        />
      ))}
    </div>
  )
}

export default function Home() {
  const videoTrackRef = useRef(null)
  const videoRef = useRef(null)
  const [videoDuration, setVideoDuration] = useState(0)
  const [showNavbar, setShowNavbar] = useState(false)

  // Scroll Progress tracking for the 220vh pure video track
  const { scrollYProgress } = useScroll({
    target: videoTrackRef,
    offset: ['start start', 'end end']
  })

  // Fade out pure video scroll indicator as user scrolls
  const initialScrollHintOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0])

  // Handle Video Metadata
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setVideoDuration(video.duration || 5)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    if (video.readyState >= 1) {
      handleLoadedMetadata()
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [])

  // Scrubbing & Exact Last 1-Second Ambient Video Loop
  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoDuration) return

    let animationFrameId
    let isSeeking = false

    const handleSeeked = () => {
      isSeeking = false
    }

    video.addEventListener('seeked', handleSeeked)

    const updateFrame = () => {
      if (!videoDuration) return

      const latest = scrollYProgress.get()

      // When scroll reaches end of video track (latest >= 0.85), play seamless ambient loop of EXACT last 1.0 second
      if (latest >= 0.85) {
        const loopStart = Math.max(0, videoDuration - 1.0)
        if (video.paused) {
          video.play().catch(() => {})
        }
        if (video.currentTime >= videoDuration - 0.05 || video.currentTime < loopStart) {
          video.currentTime = loopStart
        }
      } else {
        // Normal scroll-driven scrubbing
        if (!video.paused) {
          video.pause()
        }
        if (!isSeeking) {
          const targetTime = Math.min(videoDuration - 0.05, Math.max(0, latest * videoDuration))
          const diff = targetTime - video.currentTime

          if (Math.abs(diff) > 0.01) {
            isSeeking = true
            video.currentTime = video.currentTime + diff * 0.35
          }
        }
      }

      animationFrameId = requestAnimationFrame(updateFrame)
    }

    animationFrameId = requestAnimationFrame(updateFrame)

    return () => {
      video.removeEventListener('seeked', handleSeeked)
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [scrollYProgress, videoDuration])

  // Show navbar when user scrolls into website content section
  useEffect(() => {
    const handleScroll = () => {
      setShowNavbar(window.scrollY > window.innerHeight * 0.6)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const statItems = [
    { value: '10,000+', label: 'Students Enrolled' },
    { value: '98%', label: 'Exam Success Rate' },
    { value: '15+', label: 'Years of Excellence' },
    { value: '50+', label: 'Expert Faculty' }
  ]

  const erpFeatures = [
    {
      icon: <Brain className="h-6 w-6 text-amber-400" />,
      title: 'Groq AI Assistant',
      desc: 'Sub-50ms query answers in Hindi, Hinglish, English, Marathi, and Gujarati with live MongoDB Atlas context.'
    },
    {
      icon: <FileCheck className="h-6 w-6 text-yellow-400" />,
      title: '1-Click AI Quiz Generator',
      desc: 'Instantly generates 3 to 30-question printable exam papers + teacher answer keys from study materials.'
    },
    {
      icon: <Users className="h-6 w-6 text-amber-300" />,
      title: 'Student & Attendance Tracking',
      desc: 'Real-time daily attendance tracking, RFID support, and automated SMS/Email alerts to parents.'
    },
    {
      icon: <Award className="h-6 w-6 text-amber-500" />,
      title: 'Exam & Performance Analytics',
      desc: 'Subject rank matrices, grade percentile graphs, and automated progress report generation.'
    },
    {
      icon: <Calendar className="h-6 w-6 text-[#fbbf24]" />,
      title: 'Smart Timetable & Substitution',
      desc: 'Conflict-free period scheduling and 1-click AI faculty substitution when teachers are on leave.'
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-amber-200" />,
      title: 'Automated Fee Management',
      desc: 'Track installment dues, pending payments, partial receipts, and comprehensive financial reports.'
    }
  ]

  return (
    <div className="relative min-h-screen w-full bg-[#030712] font-sans text-white selection:bg-amber-500 selection:text-slate-950">
      
      {/* Floating Glowing Particles Layer */}
      <FloatingParticles count={55} />

      {/* Dynamic Dark Modern Navbar (Fades in when scrolling into content) */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ 
          opacity: showNavbar ? 1 : 0, 
          y: showNavbar ? 0 : -20 
        }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#030712]/95 backdrop-blur-xl border-b border-amber-500/20 shadow-2xl flex items-center justify-between px-8 md:px-16 w-full pointer-events-auto"
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform duration-200">
              CK
            </div>
            <span className="font-bold text-base tracking-tight text-white">C.K. Classes</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-100">
            <a href="#home" className="hover:text-amber-400 transition-colors">Home</a>
            <a href="#courses" className="hover:text-amber-400 transition-colors">Courses</a>
            <a href="#features" className="hover:text-amber-400 transition-colors">ERP Features</a>
            <a href="#portals" className="hover:text-amber-400 transition-colors">Portals</a>
            <a href="#contact" className="hover:text-amber-400 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className="text-xs font-bold text-slate-100 hover:text-amber-300 transition-colors px-3 py-2"
            >
              Login
            </Link>
            <a 
              href="/login" 
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/40 active:scale-95 transition-all text-xs font-black"
            >
              Get Admission
            </a>
          </div>
        </div>
      </motion.header>

      {/* ========================================================================= */}
      {/* 1. PURE SCROLL-DRIVEN VIDEO SECTION (No navbar, no headers on initial load)  */}
      {/* ========================================================================= */}
      <div ref={videoTrackRef} className="relative h-[220vh] w-full">
        
        {/* Sticky Fullscreen Frame */}
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center bg-black">
          
          {/* HTML5 Video element with GPU hardware acceleration */}
          <video
            ref={videoRef}
            src="/videos/classes.mp4"
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full object-cover object-center z-0 transform-gpu will-change-transform brightness-100 contrast-105"
          />

          {/* Initial Subtle Scroll Hint at Bottom (Fades out as user scrolls) */}
          <motion.div 
            style={{ opacity: initialScrollHintOpacity }}
            className="absolute bottom-10 z-20 flex flex-col items-center gap-2 text-white text-xs font-bold uppercase tracking-widest pointer-events-none bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-full border border-amber-400/40 shadow-2xl"
          >
            <span>Scroll to play video & enter website</span>
            <ChevronDown className="h-4 w-4 text-amber-300 animate-bounce" />
          </motion.div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. GOLDEN LIGHT CINEMATIC UI (Connected directly to video light rays)       */}
      {/* ========================================================================= */}
      <div 
        id="home"
        className="relative z-30 min-h-screen bg-[#030712] text-white pt-16 pb-24 border-t border-amber-500/30 shadow-[0_-15px_50px_rgba(245,158,11,0.25)]"
      >
        {/* Radiant Golden Light Beams (Matching classes.mp4 video light rays) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[650px] bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(245,158,11,0.3),transparent_100%)] z-0 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[350px] bg-[radial-gradient(ellipse_50%_35%_at_50%_0%,rgba(251,191,36,0.35),transparent_100%)] z-0 filter blur-[40px] pointer-events-none" />
        
        {/* Top Golden Light Beam Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent z-10 shadow-[0_0_35px_rgba(251,191,36,0.9)]" />

        {/* Dark Space Grid Accent */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_10%,#000_70%,transparent_100%)] z-0 opacity-60 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-24">
          
          {/* Main Hero Section */}
          <div className="text-center flex flex-col items-center pt-8">
            <div className="inline-flex items-center gap-2 px-4.5 py-1.5 rounded-full border border-amber-400/60 bg-amber-500/20 text-xs font-bold text-amber-200 mb-6 shadow-xl shadow-amber-500/20 backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
              <span className="font-sketch text-sm sm:text-base tracking-wide text-amber-200">Surat's Premier Coaching Academy & Institutional ERP 2.0</span>
            </div>

            <h1 className="text-4xl sm:text-7xl font-black tracking-tight text-white max-w-4xl leading-[1.08] drop-shadow-2xl">
              Building Bright Futures, <br />
              <span className="font-handwriting text-5xl sm:text-8xl tracking-wide bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-200 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(245,158,11,0.6)] font-bold">
                One Student at a Time.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-xl text-[#F8FAFC] max-w-2xl leading-relaxed font-semibold drop-shadow-md">
              Empowering students from Class 1 to 12 in Science and Commerce through expert faculty, real-time AI analytics, and academic excellence.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a
                href="/login"
                className="px-8 h-13 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/30 transition-all duration-200 active:scale-95 cursor-pointer"
              >
                Enroll Now
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#courses"
                className="px-6 h-13 rounded-2xl border border-amber-500/40 bg-slate-900/90 text-amber-200 hover:bg-slate-800 font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-lg"
              >
                <BookOpen className="h-4 w-4 text-amber-300" />
                Explore Courses
              </a>
            </div>
          </div>

          {/* Statistics Cards Grid with Golden Light Bars */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
            {statItems.map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="p-6 bg-[#0B132B] border border-amber-500/30 rounded-2xl shadow-2xl flex flex-col items-center text-center relative group overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-t-full shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
                <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  <AnimatedCounter value={item.value} />
                </h3>
                <p className="text-xs text-amber-300 font-extrabold uppercase tracking-widest mt-2">
                  {item.label}
                </p>
              </motion.div>
            ))}
          </div>

          {/* ERP Core Features Section */}
          <div id="features" className="space-y-10 pt-6">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="font-handwriting text-2xl font-bold text-amber-300 tracking-wide">✨ Institutional Intelligence</span>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                AI-Powered ERP Modules for School & Coaching Control
              </h2>
              <p className="text-sm sm:text-base text-[#F1F5F9] font-medium">
                Integrated Groq Llama 3.3 AI, MongoDB Atlas, and modern academic management workflows.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {erpFeatures.map((feat, i) => (
                <div 
                  key={i} 
                  className="p-6 bg-[#0B132B] border border-slate-800 rounded-2xl hover:border-amber-400/60 transition duration-300 space-y-4 hover:shadow-2xl hover:shadow-amber-500/20 group"
                >
                  <div className="h-12 w-12 rounded-xl bg-slate-800/90 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {feat.icon}
                  </div>
                  <h4 className="text-lg font-black text-white tracking-tight">{feat.title}</h4>
                  <p className="text-xs sm:text-sm text-[#E2E8F0] leading-relaxed font-normal">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Role Access Section */}
          <div id="portals" className="bg-gradient-to-b from-[#0B132B] via-slate-950 to-black p-8 sm:p-12 rounded-3xl border border-amber-500/30 space-y-8 text-center shadow-2xl">
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">Role-Based Access Portals</h3>
              <p className="text-xs sm:text-sm text-[#F1F5F9] font-medium">Log in with role-specific permissions and scope</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div className="p-6 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-3">
                <div className="h-10 w-10 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 font-black text-sm">1</div>
                <h4 className="font-black text-white">Admin Portal</h4>
                <p className="text-xs sm:text-sm text-[#E2E8F0] font-normal">Complete institutional oversight, financial reports, faculty management & system settings.</p>
              </div>

              <div className="p-6 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-3">
                <div className="h-10 w-10 rounded-full bg-yellow-500/20 border border-yellow-400/50 flex items-center justify-center text-yellow-300 font-black text-sm">2</div>
                <h4 className="font-black text-white">Faculty Portal</h4>
                <p className="text-xs sm:text-sm text-[#E2E8F0] font-normal">Attendance entry, 1-click AI exam paper generator, homework assignments & student feedback logs.</p>
              </div>

              <div className="p-6 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-3">
                <div className="h-10 w-10 rounded-full bg-amber-400/20 border border-amber-300/50 flex items-center justify-center text-amber-200 font-black text-sm">3</div>
                <h4 className="font-black text-white">Student & Parent Portal</h4>
                <p className="text-xs sm:text-sm text-[#E2E8F0] font-normal">Check academic performance, view assigned homework, fee payment receipts & exam schedules.</p>
              </div>
            </div>

            <div className="pt-2">
              <Link 
                to="/login"
                className="inline-flex items-center gap-2 px-8 h-12 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 transition"
              >
                Access ERP Management Portal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t border-slate-800/80 pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-300 font-medium gap-4">
            <p>© {new Date().getFullYear()} C.K. Classes ERP Platform. Parvat Patiya, Surat, India. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/login" className="hover:text-amber-300 transition">Portal Login</Link>
              <a href="#features" className="hover:text-amber-300 transition">ERP Features</a>
            </div>
          </footer>

        </div>
      </div>
    </div>
  )
}
