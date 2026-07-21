import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
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
  ShieldCheck, 
  Zap, 
  GraduationCap 
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

export default function Home() {
  const videoTrackRef = useRef(null)
  const videoRef = useRef(null)
  const [videoDuration, setVideoDuration] = useState(0)
  const [scrolledNav, setScrolledNav] = useState(false)

  // Scroll Progress tracking for the 300vh pure video track
  const { scrollYProgress } = useScroll({
    target: videoTrackRef,
    offset: ['start start', 'end end']
  })

  // Smooth physics spring for ultra-smooth video scrubbing
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 25,
    restDelta: 0.001
  })

  // Fade out pure video scroll indicator as user scrolls
  const initialScrollHintOpacity = useTransform(smoothProgress, [0, 0.25], [1, 0])
  
  // Transition website navbar & page content in as video finishes (progress 0.7 to 1.0)
  const pageTransitionOpacity = useTransform(smoothProgress, [0.75, 0.95], [0, 1])
  const pageTransitionY = useTransform(smoothProgress, [0.75, 0.95], [60, 0])
  const pageTransitionScale = useTransform(smoothProgress, [0.75, 0.95], [0.97, 1])
  
  // Video overlay darkens slightly as website transitions in
  const videoDarkenOverlay = useTransform(smoothProgress, [0.7, 0.95], [0, 0.65])

  // Handle Video Metadata & Sync currentTime to scroll progress
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

  // Silky-smooth 60fps/120fps continuous lerp loop for video frame scrubbing
  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoDuration) return

    video.pause() // Pause video so native playback motor doesn't conflict with scrubbing

    let animationFrameId

    const updateFrame = () => {
      const latest = smoothProgress.get()
      if (videoDuration && isFinite(latest)) {
        const targetTime = Math.min(videoDuration - 0.05, Math.max(0, latest * videoDuration))
        const diff = targetTime - video.currentTime

        // Linear interpolation (lerp) for liquid smooth scrubbing without keyframe stutter
        if (Math.abs(diff) > 0.001) {
          if ('fastSeek' in video && Math.abs(diff) > 0.3) {
            video.fastSeek(targetTime)
          } else {
            video.currentTime += diff * 0.18
          }
        }
      }
      animationFrameId = requestAnimationFrame(updateFrame)
    }

    animationFrameId = requestAnimationFrame(updateFrame)

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [smoothProgress, videoDuration])

  // Track window scroll for sticky navbar styling after transition
  useEffect(() => {
    const handleScroll = () => {
      setScrolledNav(window.scrollY > window.innerHeight * 2.2)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const statItems = [
    { value: '10,000+', label: 'Students Enrolled' },
    { value: '98%', label: 'Success Rate' },
    { value: '15+', label: 'Years of Excellence' },
    { value: '50+', label: 'Expert Faculty' }
  ]

  const erpFeatures = [
    {
      icon: <Brain className="h-6 w-6 text-purple-600" />,
      title: 'Groq AI Assistant',
      desc: 'Sub-50ms query answers in Hindi, Hinglish, English, Marathi, and Gujarati with live MongoDB Atlas context.'
    },
    {
      icon: <FileCheck className="h-6 w-6 text-indigo-600" />,
      title: '1-Click AI Quiz Generator',
      desc: 'Instantly generates 3 to 30-question printable exam papers + teacher answer keys from study materials.'
    },
    {
      icon: <Users className="h-6 w-6 text-blue-600" />,
      title: 'Student & Attendance Tracking',
      desc: 'Real-time daily attendance tracking, RFID support, and automated SMS/Email alerts to parents.'
    },
    {
      icon: <Award className="h-6 w-6 text-amber-600" />,
      title: 'Exam & Performance Analytics',
      desc: 'Subject rank matrices, grade percentile graphs, and automated progress report generation.'
    },
    {
      icon: <Calendar className="h-6 w-6 text-emerald-600" />,
      title: 'Smart Timetable & Substitution',
      desc: 'Conflict-free period scheduling and 1-click AI faculty substitution when teachers are on leave.'
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-cyan-600" />,
      title: 'Automated Fee Management',
      desc: 'Track installment dues, pending payments, partial receipts, and comprehensive financial reports.'
    }
  ]

  return (
    <div className="relative min-h-screen w-full bg-white font-sans text-slate-800 selection:bg-brand-blue-500 selection:text-white">
      
      {/* Dynamic Navbar (Appears when video scroll finishes and website content transitions in) */}
      <motion.header
        style={{ opacity: pageTransitionOpacity }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 flex items-center justify-between px-8 md:px-16 w-full border-b border-transparent pointer-events-auto",
          scrolledNav 
            ? "bg-white/85 backdrop-blur-md border-b-slate-200 shadow-sm" 
            : "bg-white/40 backdrop-blur-md border-b-white/20"
        )}
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-brand-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform duration-200">
              CK
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-900">C.K. Classes</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#home" className="hover:text-brand-blue-500 transition-colors">Home</a>
            <a href="#courses" className="hover:text-brand-blue-500 transition-colors">Courses</a>
            <a href="#features" className="hover:text-brand-blue-500 transition-colors">ERP Features</a>
            <a href="#portals" className="hover:text-brand-blue-500 transition-colors">Portals</a>
            <a href="#contact" className="hover:text-brand-blue-500 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors px-3 py-2"
            >
              Login
            </Link>
            <a 
              href="/login" 
              className="px-4 py-2 rounded-xl bg-brand-blue-500 text-white hover:bg-brand-blue-600 shadow-md active:scale-95 transition-all text-xs font-semibold"
            >
              Get Admission
            </a>
          </div>
        </div>
      </motion.header>

      {/* ========================================================================= */}
      {/* 1. PURE SCROLL-DRIVEN VIDEO SECTION (No navbar, no headers on initial load)  */}
      {/* ========================================================================= */}
      <div ref={videoTrackRef} className="relative h-[300vh] w-full">
        
        {/* Sticky Fullscreen Frame */}
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center bg-black">
          
          {/* HTML5 Video element with GPU hardware acceleration */}
          <video
            ref={videoRef}
            src="/videos/classes.mp4"
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full object-cover object-center z-0 transform-gpu will-change-transform"
          />

          {/* Dynamic Darken Overlay on transition */}
          <motion.div 
            style={{ opacity: videoDarkenOverlay }}
            className="absolute inset-0 bg-slate-950 z-10 pointer-events-none" 
          />

          {/* Initial Subtle Scroll Hint at Bottom (Fades out as user scrolls) */}
          <motion.div 
            style={{ opacity: initialScrollHintOpacity }}
            className="absolute bottom-10 z-20 flex flex-col items-center gap-2 text-white/90 text-xs font-semibold uppercase tracking-widest pointer-events-none bg-black/40 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 shadow-2xl"
          >
            <span>Scroll to play video & enter website</span>
            <ChevronDown className="h-4 w-4 text-amber-300 animate-bounce" />
          </motion.div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. WEBSITE CONTENT SECTION (Transitions in AFTER video scroll finishes)    */}
      {/* ========================================================================= */}
      <motion.div 
        style={{ 
          opacity: pageTransitionOpacity, 
          y: pageTransitionY,
          scale: pageTransitionScale
        }}
        id="home"
        className="relative z-30 min-h-screen bg-white text-slate-800 pt-20 pb-24 -mt-20 border-t border-slate-200"
      >
        {/* Background Grid Accent */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f3f5_1px,transparent_1px),linear-gradient(to_bottom,#f1f3f5_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_10%,#000_70%,transparent_100%)] z-0 pointer-events-none" />
        <div className="absolute top-0 left-1/4 h-[400px] w-[600px] rounded-full bg-brand-blue-50/60 filter blur-[80px] -translate-y-1/2 z-0 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-24">
          
          {/* Main Hero Section */}
          <div className="text-center flex flex-col items-center pt-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-blue-100 bg-brand-blue-50/70 text-xs font-semibold text-brand-blue-600 mb-6 shadow-xs backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-brand-orange-500 animate-pulse" />
              <span>Surat's Premier Coaching Academy & Institutional ERP 2.0</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 max-w-4xl leading-[1.1]">
              Building Bright Futures, <br />
              <span className="bg-gradient-to-r from-brand-blue-500 via-brand-blue-600 to-brand-orange-500 bg-clip-text text-transparent">
                One Student at a Time.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed font-normal">
              Empowering students from Class 1 to 12 in Science and Commerce through expert teaching, personalized learning, real-time AI query resolution, and academic excellence.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a
                href="/login"
                className="px-6 h-12 rounded-xl bg-brand-blue-500 hover:bg-brand-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
              >
                Enroll Now
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#courses"
                className="px-6 h-12 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm text-slate-800 hover:bg-slate-50 font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
              >
                <BookOpen className="h-4 w-4 text-slate-500" />
                Explore Courses
              </a>
            </div>
          </div>

          {/* Statistics Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
            {statItems.map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center text-center relative group"
              >
                <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-brand-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-t-full" />
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  <AnimatedCounter value={item.value} />
                </h3>
                <p className="text-xs text-slate-500 font-semibold tracking-wide uppercase mt-1.5">
                  {item.label}
                </p>
              </motion.div>
            ))}
          </div>

          {/* ERP Core Features Section */}
          <div id="features" className="space-y-10 pt-6">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-bold text-brand-blue-600 tracking-widest uppercase">Institutional Intelligence</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                AI-Powered ERP Modules for School & Coaching Control
              </h2>
              <p className="text-sm text-slate-600">
                Integrated Groq Llama 3.3 AI, MongoDB Atlas, and modern academic management workflows.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {erpFeatures.map((feat, i) => (
                <div 
                  key={i} 
                  className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-brand-blue-300 transition duration-300 space-y-4 hover:shadow-lg group"
                >
                  <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {feat.icon}
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 tracking-tight">{feat.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Role Access Section */}
          <div id="portals" className="bg-slate-50 p-8 sm:p-12 rounded-3xl border border-slate-200 space-y-8 text-center">
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Role-Based Access Portals</h3>
              <p className="text-xs text-slate-600">Log in with role-specific permissions and scope</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
                <div className="h-10 w-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
                <h4 className="font-bold text-slate-900">Admin Portal</h4>
                <p className="text-xs text-slate-600">Complete institutional oversight, financial reports, faculty management & system settings.</p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
                <div className="h-10 w-10 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-sm">2</div>
                <h4 className="font-bold text-slate-900">Faculty Portal</h4>
                <p className="text-xs text-slate-600">Attendance entry, 1-click AI exam paper generator, homework assignments & student feedback logs.</p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
                <div className="h-10 w-10 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 font-bold text-sm">3</div>
                <h4 className="font-bold text-slate-900">Student & Parent Portal</h4>
                <p className="text-xs text-slate-600">Check academic performance, view assigned homework, fee payment receipts & exam schedules.</p>
              </div>
            </div>

            <div className="pt-2">
              <Link 
                to="/login"
                className="inline-flex items-center gap-2 px-8 h-12 rounded-xl bg-brand-blue-500 text-white font-bold text-sm shadow-md hover:bg-brand-blue-600 transition"
              >
                Access ERP Management Portal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t border-slate-200 pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} C.K. Classes. Parvat Patiya, Surat, India. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/login" className="hover:text-brand-blue-500 transition">Portal Login</Link>
              <a href="#features" className="hover:text-brand-blue-500 transition">ERP Features</a>
            </div>
          </footer>

        </div>
      </motion.div>
    </div>
  )
}
