import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, ShieldCheck, Lock, Eye, EyeOff, KeyRound, RefreshCw, AlertCircle } from 'lucide-react'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const { forgotPassword, verifyResetOtp, resetPasswordWithToken } = useAuth()

  // Multi-step state: 1: Email, 2: OTP, 3: Password, 4: Success
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [infoMsg, setInfoMsg] = useState(null)
  const [cooldown, setCooldown] = useState(0)

  const inputRefs = useRef([])

  // Resend cooldown timer interval
  useEffect(() => {
    let timer
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(prev => prev - 1), 1000)
    }
    return () => clearInterval(timer)
  }, [cooldown])

  // Helper: Live password policy checklist
  const passwordCriteria = {
    minLength: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword),
    matchConfirm: newPassword.length > 0 && newPassword === confirmPassword
  }
  const isPasswordValid = Object.values(passwordCriteria).every(Boolean)

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.')
      return
    }

    setLoading(true)
    setErrorMsg(null)
    setInfoMsg(null)

    try {
      const msg = await forgotPassword(email.trim())
      setInfoMsg(msg)
      setCooldown(60)
      setStep(2)
    } catch (err) {
      const data = err.response?.data
      const msg = data?.message || data?.error?.message || 'Failed to request verification code.'
      if (err.response?.status === 429) {
        setCooldown(60)
        setStep(2)
      }
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return
    setLoading(true)
    setErrorMsg(null)
    try {
      const msg = await forgotPassword(email.trim())
      setInfoMsg(msg)
      setCooldown(60)
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || 'Failed to resend code.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Handle OTP input changes & auto-focus
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.')
      return
    }

    setLoading(true)
    setErrorMsg(null)

    try {
      const res = await verifyResetOtp(email.trim(), otpCode)
      if (res && res.resetToken) {
        setResetToken(res.resetToken)
        setStep(3)
      } else {
        setErrorMsg('Invalid verification token response.')
      }
    } catch (err) {
      const data = err.response?.data
      const msg = data?.message || data?.error?.message || 'Invalid or expired verification code.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!isPasswordValid) {
      setErrorMsg('Please satisfy all password policy criteria.')
      return
    }

    setLoading(true)
    setErrorMsg(null)

    try {
      await resetPasswordWithToken(resetToken, newPassword, confirmPassword)
      setStep(4)
    } catch (err) {
      const data = err.response?.data
      const msg = data?.message || data?.error?.message || 'Failed to reset password.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-4 text-left select-none"
    >
      {/* STEP HEADER */}
      <div className="mb-2">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-brand-blue-500" />
          {step === 1 && "Forgot Password"}
          {step === 2 && "Enter Verification Code"}
          {step === 3 && "Set New Password"}
          {step === 4 && "Password Reset Complete"}
        </h2>
        <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
          {step === 1 && "Enter your registered email address to receive a 6-digit verification code."}
          {step === 2 && `Enter the 6-digit verification code sent to ${email}.`}
          {step === 3 && "Create a new strong password for your C.K. Classes account access."}
          {step === 4 && "Your password has been changed successfully. All active device sessions have been revoked."}
        </p>
      </div>

      {/* ERROR ALERT */}
      {errorMsg && (
        <div className="p-3 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* INFO ALERT */}
      {infoMsg && step === 2 && (
        <div className="p-3 text-xs font-semibold text-brand-blue-700 bg-brand-blue-50 border border-brand-blue-200 rounded-xl flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-brand-blue-600" />
          <span>{infoMsg}</span>
        </div>
      )}

      {/* STEP 1: EMAIL REQUEST */}
      {step === 1 && (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <Input
            label="Registered Email Address *"
            type="email"
            placeholder="e.g. user@ckclasses.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="text-xs font-semibold"
          />

          <Button
            type="submit"
            disabled={loading || !email}
            className="w-full h-10 rounded-full text-xs font-extrabold bg-brand-blue-500 hover:bg-brand-blue-600 text-white flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Sending Code...</span>
              </>
            ) : (
              <span>Send Verification Code</span>
            )}
          </Button>

          <div className="text-center pt-2">
            <Link 
              to="/auth/login" 
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-blue-600 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Sign In
            </Link>
          </div>
        </form>
      )}

      {/* STEP 2: OTP VERIFICATION */}
      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">6-Digit Verification Code *</label>
            <div className="flex justify-between gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  disabled={loading}
                  className="w-10 h-11 border border-slate-200 rounded-xl text-center font-black text-base text-slate-800 bg-white focus:border-brand-blue-500 outline-none transition-colors"
                />
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || otp.join('').length !== 6}
            className="w-full h-10 rounded-full text-xs font-extrabold bg-brand-blue-500 hover:bg-brand-blue-600 text-white flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Verifying Code...</span>
              </>
            ) : (
              <span>Verify Code</span>
            )}
          </Button>

          <div className="flex items-center justify-between pt-2 text-xs font-semibold text-slate-500">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="hover:text-slate-800 transition-colors"
            >
              Change Email
            </button>

            {cooldown > 0 ? (
              <span className="text-slate-400 font-mono text-[11px]">Resend in {cooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-brand-blue-600 font-bold hover:underline"
              >
                Resend Code
              </button>
            )}
          </div>
        </form>
      )}

      {/* STEP 3: SET NEW PASSWORD */}
      {step === 3 && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="relative">
            <Input
              label="New Password *"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              className="text-xs font-semibold pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <Input
            label="Confirm New Password *"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            className="text-xs font-semibold"
          />

          {/* PASSWORD POLICY CHECKLIST */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px] font-semibold text-slate-600">
            <span className="font-extrabold uppercase text-[10px] tracking-wider text-slate-400 block mb-1">Password Requirements</span>
            <div className="grid grid-cols-2 gap-1.5">
              <span className={passwordCriteria.minLength ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                {passwordCriteria.minLength ? '✓' : '•'} At least 8 characters
              </span>
              <span className={passwordCriteria.hasUpper ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                {passwordCriteria.hasUpper ? '✓' : '•'} 1 Uppercase letter
              </span>
              <span className={passwordCriteria.hasLower ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                {passwordCriteria.hasLower ? '✓' : '•'} 1 Lowercase letter
              </span>
              <span className={passwordCriteria.hasNumber ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                {passwordCriteria.hasNumber ? '✓' : '•'} 1 Number (0-9)
              </span>
              <span className={passwordCriteria.hasSpecial ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                {passwordCriteria.hasSpecial ? '✓' : '•'} 1 Special character
              </span>
              <span className={passwordCriteria.matchConfirm ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                {passwordCriteria.matchConfirm ? '✓' : '•'} Passwords match
              </span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !isPasswordValid}
            className="w-full h-10 rounded-full text-xs font-extrabold bg-brand-blue-500 hover:bg-brand-blue-600 text-white flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Resetting Password...</span>
              </>
            ) : (
              <span>Update Password</span>
            )}
          </Button>
        </form>
      )}

      {/* STEP 4: SUCCESS STATE */}
      {step === 4 && (
        <div className="text-center space-y-5 py-2">
          <div className="h-14 w-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>

          <Button
            onClick={() => navigate('/auth/login')}
            className="w-full h-10 rounded-full text-xs font-extrabold bg-brand-blue-500 hover:bg-brand-blue-600 text-white"
          >
            Proceed to Sign In
          </Button>
        </div>
      )}
    </motion.div>
  )
}
