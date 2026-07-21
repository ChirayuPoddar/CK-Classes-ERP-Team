import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '@/services/api'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, CheckCircle2, ShieldCheck, Eye, EyeOff, UserCheck, RefreshCw, AlertCircle, GraduationCap, Users, User } from 'lucide-react'

export default function Activate() {
  const navigate = useNavigate()

  // Activation type & wizard steps (1: ID Input, 2: OTP, 3: Password / Linking, 4: Success)
  const [roleType, setRoleType] = useState('student') // 'student' | 'parent' | 'staff'
  const [step, setStep] = useState(1)

  // Form Fields
  const [institutionId, setInstitutionId] = useState('') // Student ID or Teacher ID
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [maskedEmail, setMaskedEmail] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [activationToken, setActivationToken] = useState('')
  const [existingParentUser, setExistingParentUser] = useState(false)
  const [targetName, setTargetName] = useState('')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [infoMsg, setInfoMsg] = useState(null)
  const [cooldown, setCooldown] = useState(0)

  const inputRefs = useRef([])

  useEffect(() => {
    let timer
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(prev => prev - 1), 1000)
    }
    return () => clearInterval(timer)
  }, [cooldown])

  // Live password checklist
  const passwordCriteria = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    matchConfirm: password.length > 0 && password === confirmPassword
  }
  const isPasswordValid = Object.values(passwordCriteria).every(Boolean)

  // Step 1: Request Activation OTP by Institution ID
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault()
    if (!institutionId.trim()) {
      setErrorMsg(roleType === 'staff' ? 'Please enter your Teacher ID.' : 'Please enter your Student ID.')
      return
    }

    setLoading(true)
    setErrorMsg(null)
    setInfoMsg(null)

    try {
      const payload = {
        role: roleType === 'staff' ? 'teacher' : roleType,
        studentId: roleType !== 'staff' ? institutionId.trim() : undefined,
        teacherId: roleType === 'staff' ? institutionId.trim() : undefined
      }

      const res = await api.post('/activation/request-otp', payload)
      if (res && res.success) {
        setMaskedEmail(res.maskedEmail || 'e*****@domain.com')
        setIdentifier(res.identifier || '')
        setTargetName(res.studentName || res.teacherName || '')
        setExistingParentUser(!!res.existingParentUser)
        setCooldown(60)
        setStep(2)
      } else {
        setErrorMsg('Invalid or unavailable activation credentials.')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || 'Invalid or unavailable activation credentials.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  // OTP Input handlers
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

  // Step 2: Verify Activation OTP
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
      const payload = {
        role: roleType === 'staff' ? 'teacher' : roleType,
        studentId: roleType !== 'staff' ? institutionId.trim() : undefined,
        teacherId: roleType === 'staff' ? institutionId.trim() : undefined,
        identifier,
        otp: otpCode
      }

      const res = await api.post('/activation/verify-otp', payload)
      if (res && res.success) {
        if (res.accountExists && roleType === 'parent') {
          // Parent account already exists: auto-linked child!
          setInfoMsg(res.message || 'Child successfully linked to your existing parent account.')
          setStep(4)
        } else if (res.activationToken) {
          setActivationToken(res.activationToken)
          setStep(3)
        }
      } else {
        setErrorMsg('Verification failed. Please try again.')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || 'Invalid or expired verification code.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Complete Activation & Create Password
  const handleCompleteActivation = async (e) => {
    if (e) e.preventDefault()
    if (!isPasswordValid) {
      setErrorMsg('Please satisfy all password policy criteria.')
      return
    }

    setLoading(true)
    setErrorMsg(null)

    try {
      const payload = {
        activationToken,
        role: roleType === 'staff' ? 'teacher' : roleType,
        studentId: roleType !== 'staff' ? institutionId.trim() : undefined,
        teacherId: roleType === 'staff' ? institutionId.trim() : undefined,
        password,
        confirmPassword
      }

      const res = await api.post('/activation/complete', payload)
      if (res && res.success) {
        setInfoMsg(res.message || 'Account activated successfully. Please sign in.')
        setStep(4)
      } else {
        setErrorMsg(res.message || 'Failed to complete account activation.')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || 'Failed to complete account activation.'
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-4 text-left select-none"
    >
      {/* HEADER */}
      <div className="mb-2">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-brand-blue-500" />
          Activate Your Account
        </h2>
        <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
          {step === 1 && "Enter your unique permanent institution ID to request an activation code."}
          {step === 2 && `Enter the 6-digit verification code sent to ${maskedEmail}.`}
          {step === 3 && "Set a secure password for your C.K. Classes account access."}
          {step === 4 && "Your C.K. Classes account is active and ready for login."}
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
      {infoMsg && (
        <div className="p-3 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>{infoMsg}</span>
        </div>
      )}

      {/* STEP 1: ROLE SELECTOR & ID INPUT */}
      {step === 1 && (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          
          {/* ROLE SELECTOR BUTTONS */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-extrabold">
            <button
              type="button"
              onClick={() => { setRoleType('student'); setErrorMsg(null); }}
              className={`py-2 px-1 rounded-lg flex items-center justify-center gap-1.5 transition-all ${roleType === 'student' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => { setRoleType('parent'); setErrorMsg(null); }}
              className={`py-2 px-1 rounded-lg flex items-center justify-center gap-1.5 transition-all ${roleType === 'parent' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Parent</span>
            </button>
            <button
              type="button"
              onClick={() => { setRoleType('staff'); setErrorMsg(null); }}
              className={`py-2 px-1 rounded-lg flex items-center justify-center gap-1.5 transition-all ${roleType === 'staff' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Staff</span>
            </button>
          </div>

          <Input
            label={roleType === 'staff' ? "Teacher ID / Employee ID *" : "Student ID *" }
            type="text"
            placeholder={roleType === 'staff' ? "E.g., TCH-001" : "E.g., CK20260021"}
            value={institutionId}
            onChange={(e) => setInstitutionId(e.target.value.toUpperCase())}
            disabled={loading}
            className="text-xs font-mono font-bold tracking-wider"
          />

          <Button
            type="submit"
            disabled={loading || !institutionId.trim()}
            className="w-full h-10 rounded-full text-xs font-extrabold bg-brand-blue-500 hover:bg-brand-blue-600 text-white flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Searching Record...</span>
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
          <div className="p-3 bg-brand-blue-50 border border-brand-blue-200 rounded-xl text-xs font-semibold text-brand-blue-700 flex items-center justify-between">
            <span>Code sent to registered email: <strong>{maskedEmail}</strong></span>
          </div>

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
                <span>Verifying OTP...</span>
              </>
            ) : (
              <span>Verify & Continue</span>
            )}
          </Button>

          <div className="flex items-center justify-between pt-2 text-xs font-semibold text-slate-500">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="hover:text-slate-800 transition-colors"
            >
              Change ID
            </button>

            {cooldown > 0 ? (
              <span className="text-slate-400 font-mono text-[11px]">Resend in {cooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={loading}
                className="text-brand-blue-600 font-bold hover:underline"
              >
                Resend Code
              </button>
            )}
          </div>
        </form>
      )}

      {/* STEP 3: CREATE PASSWORD */}
      {step === 3 && (
        <form onSubmit={handleCompleteActivation} className="space-y-4">
          <div className="relative">
            <Input
              label="Account Password *"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            label="Confirm Password *"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            className="text-xs font-semibold"
          />

          {/* PASSWORD CHECKLIST */}
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
                <span>Activating Account...</span>
              </>
            ) : (
              <span>Complete Activation</span>
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
