import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'

const loginSchema = z.object({
  slug: z.string().min(1, { message: "Institution slug is required" }),
  email: z.string().min(1, { message: "Email or username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
  rememberMe: z.boolean().optional()
})

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [errorMsg, setErrorMsg] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  // Grab session expiry flag from URL redirectors
  const isSessionExpired = searchParams.get('session_expired') === 'true'

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false
    }
  })

  const onSubmit = async (data) => {
    try {
      setErrorMsg(null)
      await login(data.email, data.password, data.slug)
      navigate('/dashboard')
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please double-check credentials.')
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full space-y-4"
    >
      {isSessionExpired && (
        <div className="p-3 text-xs font-semibold text-[var(--warning-text)] bg-[var(--warning-bg)] border border-amber-200 rounded-premium-md text-center">
          Your active session expired. Please sign in again.
        </div>
      )}

      {errorMsg && (
        <div className="p-3 text-xs font-semibold text-[var(--danger-text)] bg-[var(--danger-bg)] border border-red-200 rounded-premium-md text-left">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Institution Slug */}
        <div className="relative">
          <Input
            label="Institution Slug"
            type="text"
            placeholder="e.g. ck-classes-main"
            error={errors.slug?.message}
            className="pl-3"
            {...register('slug')}
          />
        </div>

        {/* Email or Username input with icon wrapper */}
        <div className="relative">
          <Input
            label="Email or Username"
            type="text"
            placeholder="keerthi@ckclasses.com or keerthi"
            error={errors.email?.message}
            className="pl-9"
            {...register('email')}
          />
          <Mail className="absolute left-3 top-[34px] h-4 w-4 text-[var(--text-tertiary)]" />
        </div>

        {/* Password input with icon wrapper & visibility toggle */}
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            error={errors.password?.message}
            className="pl-9 pr-10"
            {...register('password')}
          />
          <Lock className="absolute left-3 top-[34px] h-4 w-4 text-[var(--text-tertiary)]" />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[32px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors focus:outline-none"
            tabIndex="-1"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Remember Me and Forgot Password Group */}
        <div className="flex items-center justify-between text-xs pt-1 select-none">
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <input
              type="checkbox"
              className="h-4.5 w-4.5 rounded border-[var(--border-strong)] text-brand-blue-500 focus:ring-brand-blue-100 cursor-pointer shadow-premium-1"
              {...register('rememberMe')}
            />
            Remember me
          </label>
          <Link 
            to="/auth/forgot-password" 
            className="font-semibold text-brand-blue-500 hover:text-brand-blue-600 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button 
          type="submit" 
          variant="primary" 
          className="w-full mt-2 h-11" 
          isLoading={isSubmitting}
        >
          Sign In
        </Button>

        <div className="pt-3 border-t border-[var(--border-light)] text-center text-xs font-semibold text-slate-500">
          Received an activation code?{' '}
          <Link to="/auth/activate" className="font-bold text-brand-blue-500 hover:text-brand-blue-600 transition-colors">
            Activate your account
          </Link>
        </div>
      </form>
    </motion.div>
  )
}
