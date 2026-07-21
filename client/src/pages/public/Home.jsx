import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, BookOpen } from 'lucide-react'

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
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  }

  const statItems = [
    { value: '10,000+', label: 'Students' },
    { value: '98%', label: 'Success Rate' },
    { value: '15+', label: 'Years of Excellence' },
    { value: '50+', label: 'Expert Faculty' }
  ]

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-white pt-24 pb-16">
      
      {/* 1. Stripe/Linear style grid backdrop lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f3f5_1px,transparent_1px),linear-gradient(to_bottom,#f1f3f5_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_10%,#000_70%,transparent_100%)] z-0" />
      
      {/* 2. Apple style blurred radial gradients */}
      <div className="absolute top-0 left-1/4 h-[400px] w-[600px] rounded-full bg-brand-blue-50/60 filter blur-[80px] -translate-y-1/2 z-0" />
      <div className="absolute top-1/4 right-1/4 h-[300px] w-[500px] rounded-full bg-brand-orange-50/40 filter blur-[100px] z-0" />

      {/* 3. Hero content wrapper */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center select-none"
      >
        {/* Sparkle badge */}
        <motion.div 
          variants={itemVariants}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-blue-100 bg-brand-blue-50/50 text-xs font-semibold text-brand-blue-600 mb-6 shadow-premium-1 backdrop-blur-sm"
        >
          <Sparkles className="h-3.5 w-3.5 text-brand-orange-500 animate-pulse" />
          <span>Surat's Premier Coaching Academy</span>
        </motion.div>

        {/* Title / Headline */}
        <motion.h1 
          variants={itemVariants}
          className="text-4xl sm:text-6xl font-bold tracking-tight text-[var(--text-primary)] max-w-4xl leading-[1.1] sm:leading-[1.1]"
        >
          Building Bright Futures, <br />
          <span className="bg-gradient-to-r from-brand-blue-500 via-brand-blue-600 to-brand-orange-500 bg-clip-text text-transparent">
            One Student at a Time.
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p 
          variants={itemVariants}
          className="mt-6 text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed font-normal"
        >
          Empowering students from Class 1 to 12 in Science and Commerce through expert teaching, personalized learning and academic excellence.
        </motion.p>

        {/* Call to Actions (CTAs) */}
        <motion.div 
          variants={itemVariants}
          className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <a
            href="#contact"
            className="px-6 h-12 rounded-premium-md bg-brand-blue-500 hover:bg-brand-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-premium-1 hover:shadow-premium-2 transition-all duration-200 active:scale-98"
          >
            Enroll Now
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#courses"
            className="px-6 h-12 rounded-premium-md border border-[var(--border-light)] bg-white/80 backdrop-blur-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-98"
          >
            <BookOpen className="h-4 w-4 text-[var(--text-secondary)]" />
            Explore Courses
          </a>
        </motion.div>

        {/* Statistics Cards Grid */}
        <motion.div 
          variants={itemVariants}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 w-full"
        >
          {statItems.map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="p-6 bg-white/70 backdrop-blur-sm border border-[var(--border-light)] rounded-premium-xl shadow-premium-1 flex flex-col items-center text-center relative group"
            >
              {/* Highlight top border gradient bar on hover */}
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-brand-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-t-full" />
              
              <h3 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                <AnimatedCounter value={item.value} />
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] font-semibold tracking-wide uppercase mt-1.5">
                {item.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
