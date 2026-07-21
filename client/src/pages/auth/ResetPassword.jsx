import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight } from 'lucide-react'

const resetPasswordSchema = z.object({
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
  confirmPassword: z.string().min(6, { message: "Confirm password is required" })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
})

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { resetPassword } = useAuth()
  const [errorMsg, setErrorMsg] = useState(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(resetPasswordSchema)
  })

  const onSubmit = async (data) => {
    try {
      setErrorMsg(null)
      await resetPassword(token, data.password)
      setSuccess(true)
    } catch (err) {
      setErrorMsg(err.message || 'Verification token is invalid or has expired.')
    }
  }

  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full text-center space-y-6"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-[var(--success-bg)] flex items-center justify-center text-[var(--success-solid)]">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Password updated</h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Your login password has been changed successfully. You can now use your new password.
          </p>
        </div>

        <Link 
          to="/auth/login" 
          className="inline-flex items-center justify-center gap-2 w-full h-10 px-4 rounded-premium-md bg-brand-blue-500 text-white hover:bg-brand-blue-600 transition-colors font-semibold text-xs"
        >
          Proceed to Sign In
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full space-y-4"
    >
      <div className="mb-2">
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Set a strong, secure password for your C.K. Classes account access.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs font-semibold text-[var(--danger-text)] bg-[var(--danger-bg)] border border-red-200 rounded-premium-md">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button 
          type="submit" 
          variant="primary" 
          className="w-full mt-2" 
          isLoading={isSubmitting}
        >
          Reset Password
        </Button>
      </form>
    </motion.div>
  )
}
