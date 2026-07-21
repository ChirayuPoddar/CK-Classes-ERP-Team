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

// Floating Peachy White Light Particles Component
const FloatingParticles = () => {
  const particles = Array.from({ length: 45 }).map((_, i) => ({
    id: i,
    size: Math.random() * 4 + 2, // 2px to 6px
    x: Math.random() * 100, // 0% to 100%
    y: Math.random() * 100, // 0% to 100%
    duration: Math.random() * 7 + 4, // 4s to 11s
    delay: Math.random() * 5,
    opacity: Math.random() * 0.8 + 0.2
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ 
            opacity: 0, 
            y: `${p.y}%`, 
            x: `${p.x}%`,
            scale: 0.5
          }}
          animate={{ 
            opacity: [0, p.opacity, 0],
            y: [`${p.y}%`, `${(p.y - 25 + 100) % 100}%`],
            x: [`${p.x}%`, `${p.x + (Math.random() * 8 - 4)}%`],
            scale: [0.5, 1.4, 0.5]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            backgroundColor: '#FFE4D6',
            boxShadow: `0 0 ${p.size * 3}px #FFC4A8, 0 0 ${p.size * 6}px #FFE4D6`
          }}
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

  // Scroll Progress tracking for the video track
  const { scrollYProgress } = useScroll({
    target: videoTrackRef,
    offset: ['start start', 'end end']
  })

  // Fade out pure video scroll indicator as user scrolls
  const initialScrollHintOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])

  // Video scales up cleanly into background with crystal-clear focus as user scrolls
  const videoScale = useTransform(scrollYProgress, [0, 0.75, 1], [1, 1.25, 1.4])
  const videoBlur = useTransform(scrollYProgress, [0.35, 0.85], ['blur(0px)', 'blur(1px)'])
  
  // Hero UI emerges FROM DEEP BACK (scale 0.6, opacity 0) TO FRONT (scale 1.0, opacity 1) and remains 100% visible till end
  const uiScale = useTransform(scrollYProgress, [0.15, 0.55], [0.6, 1])
  const uiOpacity = useTransform(scrollYProgress, [0.15, 0.45], [0, 1])
  const uiY = useTransform(scrollYProgress, [0.15, 0.55], [100, 0])

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
            video.currentTime = video.currentTime + diff * 0.22
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
      setShowNavbar(window.scrollY > window.innerHeight * 0.5)
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
      icon: <Brain className="h-6 w-6 text-[#FFE4D6]" />,
      tag: '⚡ 50ms Live AI Answers',
      title: 'Groq AI Academic Assistant',
      desc: 'Sub-50ms query answers in Hindi, Hinglish, English, Marathi, and Gujarati with live MongoDB Atlas context.'
    },
    {
      icon: <FileCheck className="h-6 w-6 text-[#FFD8C4]" />,
      tag: '📝 Board Exam Pattern',
      title: '1-Click AI Quiz Generator',
      desc: 'Instantly generates 3 to 30-question printable exam papers + teacher answer keys from study materials.'
    },
    {
      icon: <Users className="h-6 w-6 text-[#FFF5ED]" />,
      tag: '📱 Parent SMS Alerts',
      title: 'Student & Attendance Tracking',
      desc: 'Real-time daily attendance tracking, RFID support, and automated SMS/Email alerts to parents.'
    },
    {
      icon: <Award className="h-6 w-6 text-[#FFC4A8]" />,
      tag: '📊 Rank & Percentile',
      title: 'Exam & Performance Analytics',
      desc: 'Subject rank matrices, grade percentile graphs, and automated progress report generation.'
    },
    {
      icon: <Calendar className="h-6 w-6 text-[#FFE4D6]" />,
      tag: '🗓️ 0 Class Lapses',
      title: 'Smart Timetable & Substitution',
      desc: 'Conflict-free period scheduling and 1-click AI faculty substitution when teachers are on leave.'
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-[#FFD8C4]" />,
      tag: '💳 Auto Receipts',
      title: 'Automated Fee Management',
      desc: 'Track installment dues, pending payments, partial receipts, and comprehensive financial reports.'
    }
  ]

  return (
    <div className="relative min-h-screen w-full bg-[#030712] font-sans text-white selection:bg-[#FFD8C4] selection:text-slate-950">
      
      {/* Dynamic Dark Modern Navbar (Fades in when scrolling into content) */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ 
          opacity: showNavbar ? 1 : 0, 
          y: showNavbar ? 0 : -20 
        }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#030712]/95 backdrop-blur-xl border-b border-[#FFD8C4]/20 shadow-2xl flex items-center justify-between px-8 md:px-16 w-full pointer-events-auto"
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#FFE4D6] via-[#FFD8C4] to-[#FFC4A8] flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-[#FFD8C4]/30 group-hover:scale-105 transition-transform duration-200">
              CK
            </div>
            <span className="font-bold text-base tracking-tight text-white">C.K. Classes</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-100">
            <a href="#home" className="hover:text-[#FFE4D6] transition-colors">Home</a>
            <a href="#courses" className="hover:text-[#FFE4D6] transition-colors">Courses</a>
            <a href="#features" className="hover:text-[#FFE4D6] transition-colors">ERP Features</a>
            <a href="#portals" className="hover:text-[#FFE4D6] transition-colors">Portals</a>
            <a href="#contact" className="hover:text-[#FFE4D6] transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className="text-xs font-bold text-slate-100 hover:text-[#FFE4D6] transition-colors px-3 py-2"
            >
              Login
            </Link>
            <a 
              href="/login" 
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FFE4D6] via-[#FFD8C4] to-[#FFC4A8] hover:from-[#FFF5ED] hover:to-[#FFD8C4] text-slate-950 shadow-lg shadow-[#FFD8C4]/30 active:scale-95 transition-all text-xs font-black"
            >
              Get Admission
            </a>
          </div>
        </div>
      </motion.header>

      {/* ========================================================================= */}
      {/* 1. 3D BACK-TO-FRONT SCROLL-DRIVEN VIDEO HERO STAGE                       */}
      {/* ========================================================================= */}
      <div ref={videoTrackRef} className="relative h-[400vh] w-full">
        
        {/* Sticky Fullscreen Frame with 3D Depth Perspective */}
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center bg-[#030712] [perspective:1200px]">
          
          {/* HTML5 Video element zooming into background as user scrolls */}
          <motion.video
            ref={videoRef}
            src="/videos/classes.mp4"
            muted
            playsInline
            preload="auto"
            style={{ 
              scale: videoScale,
              filter: videoBlur
            }}
            className="absolute inset-0 h-full w-full object-cover object-center z-0 transform-gpu will-change-transform brightness-105 contrast-110"
          />

          {/* Subtle Radial Contrast Vignette (Keeps video bright & crystal clear while preserving text readability) */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(3,7,18,0.45)_0%,rgba(3,7,18,0.25)_55%,transparent_100%)] z-10 pointer-events-none" />

          {/* DEEP BOTTOM FADE GRADIENT (Fades bottom 65% of video frame to solid 100% pure black #030712) */}
          <div className="absolute bottom-0 left-0 right-0 h-[65vh] bg-gradient-to-b from-transparent via-[#030712]/80 to-[#030712] z-10 pointer-events-none" />

          {/* Radiant Peachy White Light Beams */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[650px] bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(255,228,214,0.32),transparent_100%)] z-10 pointer-events-none" />

          {/* Initial Subtle Scroll Hint at Bottom */}
          <motion.div 
            style={{ opacity: initialScrollHintOpacity }}
            className="absolute bottom-10 z-20 flex flex-col items-center gap-2 text-white text-xs font-bold uppercase tracking-widest pointer-events-none bg-black/70 backdrop-blur-md px-5 py-2.5 rounded-full border border-[#FFD8C4]/50 shadow-2xl"
          >
            <span>Scroll to play video & enter website</span>
            <ChevronDown className="h-4 w-4 text-[#FFE4D6] animate-bounce" />
          </motion.div>

          {/* 3D HERO UI EMERGING FROM BACK TO FRONT RIGHT OVER THE VIDEO WITH HIGH CONTRAST */}
          <motion.div
            style={{
              scale: uiScale,
              opacity: uiOpacity,
              y: uiY
            }}
            className="relative z-30 max-w-5xl mx-auto px-6 text-center flex flex-col items-center pointer-events-auto transform-gpu"
          >
            {/* High-Contrast Peachy White Badge Pill */}
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#FFD8C4]/80 bg-slate-950/80 text-xs sm:text-sm font-bold text-[#FFE4D6] mb-6 shadow-2xl shadow-black/90 backdrop-blur-lg">
              <Sparkles className="h-4 w-4 text-[#FFE4D6] animate-pulse" />
              <span className="font-sketch text-sm sm:text-base tracking-wide text-[#FFE4D6]">Surat's Premier Coaching Academy & Institutional ERP 2.0</span>
            </div>

            {/* Razor-Sharp Title with Heavy Dark Shadow & Peachy White Glow */}
            <h1 className="text-4xl sm:text-7xl font-black tracking-tight text-white max-w-4xl leading-[1.08] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
              Building Bright Futures, <br />
              <span className="font-handwriting text-5xl sm:text-8xl tracking-wide bg-gradient-to-r from-[#FFF5ED] via-[#FFE4D6] to-[#FFC4A8] bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)] filter drop-shadow-[0_0_30px_rgba(255,228,214,0.8)] font-bold">
                One Student at a Time.
              </span>
            </h1>

            {/* High-Contrast Solid Subtitle Card */}
            <p className="mt-6 text-base sm:text-xl text-white font-extrabold max-w-2xl leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] bg-slate-950/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-[#FFD8C4]/30 shadow-2xl shadow-black/80">
              Empowering students from Class 1 to 12 in Science and Commerce through expert faculty, real-time AI analytics, and academic excellence.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a
                href="/login"
                className="px-8 h-13 rounded-2xl bg-gradient-to-r from-[#FFE4D6] via-[#FFD8C4] to-[#FFC4A8] hover:from-[#FFF5ED] hover:to-[#FFD8C4] text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-2xl shadow-[#FFD8C4]/40 transition-all duration-200 active:scale-95 cursor-pointer"
              >
                Enroll Now
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#courses"
                className="px-6 h-13 rounded-2xl border border-[#FFD8C4]/80 bg-slate-950/90 text-[#FFE4D6] hover:bg-slate-900 font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-2xl shadow-black/90"
              >
                <BookOpen className="h-4 w-4 text-[#FFE4D6]" />
                Explore Courses
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CONTINUOUS CINEMATIC WEBSITE CONTENT & MODULE CARDS (Negative Overlap) */}
      {/* ========================================================================= */}
      <div 
        id="home"
        className="relative z-30 min-h-screen bg-[#030712] text-white pt-16 pb-24 -mt-[45vh] overflow-hidden"
      >
        {/* Floating Peachy White Light Sparks & Stardust Particles */}
        <FloatingParticles />

        {/* Radiant Peachy White Light Beams */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[700px] bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(255,228,214,0.3),transparent_100%)] z-0 pointer-events-none" />
        
        {/* Pure Obsidian Black Background */}
        <div className="absolute inset-0 bg-[#030712] z-0 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-24">

          {/* Statistics Cards Grid with Peachy White Light Bars */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full pt-8">
            {statItems.map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -6, scale: 1.03 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="p-6 bg-gradient-to-b from-[#0F172A] via-[#0B132B] to-[#030712] border border-[#FFD8C4]/40 rounded-3xl shadow-2xl flex flex-col items-center text-center relative group overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#FFF5ED] via-[#FFD8C4] to-[#FFB394] opacity-90 group-hover:shadow-[0_0_20px_rgba(255,216,196,0.9)] transition-all duration-300 rounded-t-full" />
                <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  <AnimatedCounter value={item.value} />
                </h3>
                <p className="text-xs text-[#FFE4D6] font-extrabold uppercase tracking-widest mt-2">
                  {item.label}
                </p>
              </motion.div>
            ))}
          </div>

          {/* ERP Core Features Section */}
          <div id="features" className="space-y-10 pt-6">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="font-handwriting text-2xl font-bold text-[#FFE4D6] tracking-wide">✨ Institutional Intelligence</span>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                AI-Powered ERP Modules for School & Coaching Control
              </h2>
              <p className="text-sm sm:text-base text-[#F1F5F9] font-medium">
                Integrated Groq Llama 3.3 AI, MongoDB Atlas, and modern academic management workflows.
              </p>
            </div>

            {/* High-Tech Tuition ERP Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {erpFeatures.map((feat, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ duration: 0.25 }}
                  className="group relative p-7 rounded-3xl bg-gradient-to-b from-[#0F172A]/90 via-[#0B132B]/95 to-[#030712] border border-slate-800/80 hover:border-[#FFD8C4]/80 transition-all duration-300 shadow-2xl hover:shadow-[0_15px_40px_rgba(255,216,196,0.22)] flex flex-col justify-between overflow-hidden"
                >
                  {/* Top Glowing Laser Accent */}
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#FFF5ED] via-[#FFD8C4] to-[#FFB394] opacity-60 group-hover:opacity-100 group-hover:shadow-[0_0_20px_rgba(255,216,196,0.9)] transition-all duration-300" />
                  
                  {/* Subtle Corner Glow */}
                  <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-[#FFD8C4]/10 rounded-full filter blur-2xl group-hover:bg-[#FFD8C4]/25 transition-all duration-300 pointer-events-none" />

                  <div className="space-y-4">
                    {/* Header: Icon + High-Tech Tuition Badge */}
                    <div className="flex items-center justify-between">
                      <div className="h-13 w-13 rounded-2xl bg-gradient-to-tr from-[#FFD8C4]/20 via-[#FFE4D6]/15 to-slate-900 border border-[#FFD8C4]/40 flex items-center justify-center shadow-lg shadow-[#FFD8C4]/10 group-hover:scale-110 group-hover:border-[#FFD8C4] transition-all duration-300">
                        {feat.icon}
                      </div>
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#FFD8C4]/15 border border-[#FFD8C4]/40 text-[#FFE4D6] shadow-sm backdrop-blur-md">
                        {feat.tag}
                      </span>
                    </div>

                    <h4 className="text-lg font-black text-white tracking-tight group-hover:text-[#FFE4D6] transition-colors">
                      {feat.title}
                    </h4>

                    <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed font-normal">
                      {feat.desc}
                    </p>
                  </div>

                  {/* Interactive Action Link */}
                  <div className="pt-6 mt-4 flex items-center justify-between border-t border-slate-800/80 text-xs font-bold text-[#FFE4D6] group-hover:text-white transition-colors">
                    <span className="font-sketch text-sm">Explore Module</span>
                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1.5 transition-transform duration-300 text-[#FFE4D6]" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Role Access Section */}
          <div id="portals" className="bg-gradient-to-b from-[#0F172A] via-[#0B132B] to-[#030712] p-8 sm:p-12 rounded-3xl border border-[#FFD8C4]/40 space-y-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#FFF5ED] via-[#FFD8C4] to-[#FFB394] shadow-[0_0_20px_rgba(255,216,196,0.9)]" />

            <div className="space-y-2">
              <span className="font-handwriting text-2xl font-bold text-[#FFE4D6] tracking-wide">🎓 Portal System</span>
              <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">Role-Based Access Portals</h3>
              <p className="text-xs sm:text-sm text-[#F1F5F9] font-medium">Log in with role-specific permissions and scope</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-[#FFD8C4]/30 space-y-3 relative group hover:border-[#FFD8C4] transition">
                <div className="h-10 w-10 rounded-xl bg-[#FFD8C4]/20 border border-[#FFD8C4]/50 flex items-center justify-center text-[#FFE4D6] font-black text-sm">1</div>
                <h4 className="font-black text-white text-base">Admin Portal</h4>
                <p className="text-xs sm:text-sm text-[#E2E8F0] font-normal leading-relaxed">Complete institutional oversight, financial reports, faculty management & system settings.</p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950/80 border border-[#FFD8C4]/30 space-y-3 relative group hover:border-[#FFD8C4] transition">
                <div className="h-10 w-10 rounded-xl bg-[#FFE4D6]/20 border border-[#FFE4D6]/50 flex items-center justify-center text-[#FFE4D6] font-black text-sm">2</div>
                <h4 className="font-black text-white text-base">Faculty Portal</h4>
                <p className="text-xs sm:text-sm text-[#E2E8F0] font-normal leading-relaxed">Attendance entry, 1-click AI exam paper generator, homework assignments & student feedback logs.</p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950/80 border border-[#FFD8C4]/30 space-y-3 relative group hover:border-[#FFD8C4] transition">
                <div className="h-10 w-10 rounded-full bg-[#FFC4A8]/20 border border-[#FFC4A8]/50 flex items-center justify-center text-[#FFE4D6] font-black text-sm">3</div>
                <h4 className="font-black text-white text-base">Student & Parent Portal</h4>
                <p className="text-xs sm:text-sm text-[#E2E8F0] font-normal leading-relaxed">Check academic performance, view assigned homework, fee payment receipts & exam schedules.</p>
              </div>
            </div>

            <div className="pt-2">
              <Link 
                to="/login"
                className="inline-flex items-center gap-2 px-8 h-12 rounded-xl bg-gradient-to-r from-[#FFE4D6] via-[#FFD8C4] to-[#FFC4A8] hover:from-[#FFF5ED] hover:to-[#FFD8C4] text-slate-950 font-black text-sm shadow-xl shadow-[#FFD8C4]/30 transition"
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
              <Link to="/login" className="hover:text-[#FFE4D6] transition">Portal Login</Link>
              <a href="#features" className="hover:text-[#FFE4D6] transition">ERP Features</a>
            </div>
          </footer>

        </div>
      </div>
    </div>
  )
}
