const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const User = require('../models/User')
const Student = require('../models/Student')
const Teacher = require('../models/Teacher')
const PasswordResetToken = require('../models/PasswordResetToken')
const otpService = require('./otpService')
const { validatePasswordFormat } = require('../validators/userValidator')
const ApiError = require('../utils/ApiError')

class ActivationService {
  /**
   * Helper: Masks email address for display (e.g. c*****@gmail.com)
   */
  maskEmail(email) {
    if (!email || !email.includes('@')) return 'e*****@domain.com'
    const [local, domain] = email.split('@')
    if (local.length <= 2) {
      return `${local.charAt(0)}*@${domain}`
    }
    return `${local.charAt(0)}${'*'.repeat(local.length - 2)}${local.slice(-1)}@${domain}`
  }

  /**
   * Helper: Resolves Student record safely by Student ID or ObjectId scoped to tenant
   */
  async findStudentByIdentifier(identifierStr, tenantId) {
    if (!identifierStr || typeof identifierStr !== 'string') return null
    const cleanStr = identifierStr.trim()
    const scope = tenantId ? { tenantId } : {}

    // 1. Try finding by unique studentId (e.g. CK20260001, STU-101)
    let student = await Student.findOne({ ...scope, studentId: cleanStr })
    if (student) return student

    // 2. Try case-insensitive regex for studentId
    student = await Student.findOne({ ...scope, studentId: new RegExp(`^${cleanStr}$`, 'i') })
    if (student) return student

    // 3. Fallback to ObjectId if valid
    if (mongoose.Types.ObjectId.isValid(cleanStr)) {
      student = await Student.findOne({ ...scope, _id: cleanStr })
      if (student) return student
    }

    return null
  }

  /**
   * Helper: Resolves Teacher record safely by Teacher ID or ObjectId scoped to tenant
   */
  async findTeacherByIdentifier(identifierStr, tenantId) {
    if (!identifierStr || typeof identifierStr !== 'string') return null
    const cleanStr = identifierStr.trim()
    const scope = tenantId ? { tenantId } : {}

    let teacher = await Teacher.findOne({ ...scope, teacherId: cleanStr })
    if (teacher) return teacher

    teacher = await Teacher.findOne({ ...scope, teacherId: new RegExp(`^${cleanStr}$`, 'i') })
    if (teacher) return teacher

    if (mongoose.Types.ObjectId.isValid(cleanStr)) {
      teacher = await Teacher.findOne({ ...scope, _id: cleanStr })
      if (teacher) return teacher
    }

    return null
  }

  /**
   * Step 1: Request Activation OTP by Institution ID (Student ID or Teacher ID)
   */
  async requestActivationOtp({ tenantId, role, studentId, teacherId }) {
    if (!role || (!studentId && !teacherId)) {
      throw new ApiError('Role and institution ID (Student ID or Teacher ID) are required.', 400, 'VALIDATION_ERROR')
    }

    // 1. STUDENT ACTIVATION
    if (role === 'student') {
      const targetId = studentId
      const student = await this.findStudentByIdentifier(targetId, tenantId)

      // Account enumeration protection: Generic error if not found
      if (!student) {
        throw new ApiError('Invalid or unavailable activation credentials.', 400, 'ACTIVATION_INVALID')
      }

      // Check if student is already activated
      const existingUser = await User.findOne({ tenantId, linkedStudent: student._id })
      if (existingUser) {
        throw new ApiError('Your account is already activated. Please sign in or use Forgot Password.', 409, 'ACCOUNT_ALREADY_ACTIVATED')
      }

      const regEmail = (student.email || student.parentEmail || '').toLowerCase().trim()
      if (!regEmail) {
        throw new ApiError('No registered institutional email found for this student. Please contact administration.', 400, 'ACTIVATION_EMAIL_MISSING')
      }

      // Check if email belongs to another User account within this institution
      const existingEmailUser = await User.findOne({ tenantId, email: regEmail })
      if (existingEmailUser) {
        if (existingEmailUser.linkedStudent && existingEmailUser.linkedStudent.toString() === student._id.toString()) {
          throw new ApiError('Your account is already activated. Please sign in or use Forgot Password.', 409, 'ACCOUNT_ALREADY_ACTIVATED')
        } else {
          throw new ApiError('This email address is already connected to another user account. Please contact administration.', 409, 'EMAIL_ALREADY_IN_USE')
        }
      }

      // Dispatch 6-digit OTP using centralized OTP infrastructure
      await otpService.requestOtp({
        tenantId,
        identifier: regEmail,
        channel: 'email',
        purpose: 'student_activation'
      })

      return {
        success: true,
        role: 'student',
        maskedEmail: this.maskEmail(regEmail),
        identifier: regEmail,
        studentId: student.studentId,
        studentName: `${student.firstName} ${student.lastName}`.trim()
      }
    }

    // 2. TEACHER ACTIVATION
    if (role === 'teacher') {
      const targetId = teacherId || studentId
      const teacher = await this.findTeacherByIdentifier(targetId, tenantId)

      if (!teacher) {
        throw new ApiError('Invalid or unavailable activation credentials.', 400, 'ACTIVATION_INVALID')
      }

      const existingUser = await User.findOne({ tenantId, linkedTeacher: teacher._id })
      if (existingUser) {
        throw new ApiError('Your account is already activated. Please sign in or use Forgot Password.', 409, 'ACCOUNT_ALREADY_ACTIVATED')
      }

      const regEmail = (teacher.email || '').toLowerCase().trim()
      if (!regEmail) {
        throw new ApiError('No registered email found for this teacher. Please contact administration.', 400, 'ACTIVATION_EMAIL_MISSING')
      }

      const existingEmailUser = await User.findOne({ tenantId, email: regEmail })
      if (existingEmailUser) {
        if (existingEmailUser.linkedTeacher && existingEmailUser.linkedTeacher.toString() === teacher._id.toString()) {
          throw new ApiError('Your account is already activated. Please sign in or use Forgot Password.', 409, 'ACCOUNT_ALREADY_ACTIVATED')
        } else {
          throw new ApiError('This email address is already connected to another user account. Please contact administration.', 409, 'EMAIL_ALREADY_IN_USE')
        }
      }

      await otpService.requestOtp({
        tenantId,
        identifier: regEmail,
        channel: 'email',
        purpose: 'staff_activation'
      })

      return {
        success: true,
        role: 'teacher',
        maskedEmail: this.maskEmail(regEmail),
        identifier: regEmail,
        teacherId: teacher.teacherId,
        teacherName: `${teacher.firstName} ${teacher.lastName}`.trim()
      }
    }

    // 3. PARENT ACTIVATION
    if (role === 'parent') {
      const targetId = studentId
      const student = await this.findStudentByIdentifier(targetId, tenantId)

      if (!student) {
        throw new ApiError('Invalid or unavailable activation credentials.', 400, 'ACTIVATION_INVALID')
      }

      const parentEmail = (student.parentEmail || student.email || '').toLowerCase().trim()
      if (!parentEmail) {
        throw new ApiError('No registered parent contact found for this student. Please contact administration.', 400, 'ACTIVATION_EMAIL_MISSING')
      }

      const parentUser = await User.findOne({ tenantId, email: parentEmail })
      if (parentUser && parentUser.role !== 'parent') {
        throw new ApiError('This email address is already connected to a non-parent user account. Please contact administration.', 409, 'EMAIL_ALREADY_IN_USE')
      }

      await otpService.requestOtp({
        tenantId,
        identifier: parentEmail,
        channel: 'email',
        purpose: 'parent_activation'
      })

      return {
        success: true,
        role: 'parent',
        maskedEmail: this.maskEmail(parentEmail),
        identifier: parentEmail,
        studentId: student.studentId,
        studentName: student.firstName,
        accountExists: parentUser && parentUser.role === 'parent'
      }
    }

    throw new ApiError('Invalid activation parameters.', 400, 'ACTIVATION_INVALID')
  }

  /**
   * Step 2: Verify Activation OTP & Issue Short-lived Activation Token
   */
  async verifyActivationOtp({ tenantId, role, studentId, teacherId, identifier, otp }) {
    if (!role || !identifier || !otp) {
      throw new ApiError('Missing required parameters for OTP verification.', 400, 'VALIDATION_ERROR')
    }

    const cleanIdentifier = identifier.toLowerCase().trim()
    const purposeMap = {
      student: 'student_activation',
      teacher: 'staff_activation',
      parent: 'parent_activation'
    }
    const otpPurpose = purposeMap[role] || 'student_activation'

    // Verify OTP using existing OTP service
    await otpService.verifyOtp({
      tenantId,
      identifier: cleanIdentifier,
      purpose: otpPurpose,
      otp
    })

    // Consume OTP
    await otpService.consumeOtp({
      tenantId,
      identifier: cleanIdentifier,
      purpose: otpPurpose,
      otp
    })

    // Resolve student/teacher target
    let targetStudent = null
    let targetTeacher = null

    if (role === 'student' || role === 'parent') {
      targetStudent = await this.findStudentByIdentifier(studentId, tenantId)
      if (!targetStudent) {
        throw new ApiError('Invalid or unavailable student record.', 400, 'ACTIVATION_INVALID')
      }
    } else if (role === 'teacher') {
      targetTeacher = await this.findTeacherByIdentifier(teacherId || studentId, tenantId)
      if (!targetTeacher) {
        throw new ApiError('Invalid or unavailable teacher record.', 400, 'ACTIVATION_INVALID')
      }
    }

    // SPECIAL PARENT HANDLING: If Parent User already exists for verified email, link child immediately without password overwrite!
    if (role === 'parent') {
      const parentUser = await User.findOne({ tenantId, email: cleanIdentifier, role: 'parent' })
      if (parentUser) {
        const currentChildren = (parentUser.linkedChildren || []).map(id => id.toString())
        if (!currentChildren.includes(targetStudent._id.toString())) {
          parentUser.linkedChildren.push(targetStudent._id)
          await parentUser.save()
        }

        return {
          success: true,
          accountExists: true,
          message: `Student ${targetStudent.firstName} successfully linked to your existing parent account. Please sign in.`
        }
      }
    }

    // Issue short-lived, single-use activation authorization token
    const rawActivationToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawActivationToken).digest('hex')

    await PasswordResetToken.create({
      userId: targetStudent ? targetStudent._id : targetTeacher ? targetTeacher._id : new mongoose.Types.ObjectId(),
      tokenHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 Minute Expiration
    })

    return {
      success: true,
      activationToken: rawActivationToken,
      accountExists: false,
      message: 'OTP verified successfully.'
    }
  }

  /**
   * Step 3: Complete Activation & Create Password
   */
  async completeActivation({ tenantId, activationToken, role, studentId, teacherId, password, confirmPassword }) {
    if (!activationToken || !password) {
      throw new ApiError('Activation token and password are required.', 400, 'VALIDATION_ERROR')
    }

    if (confirmPassword && password !== confirmPassword) {
      throw new ApiError('Passwords do not match.', 400, 'VALIDATION_ERROR')
    }

    if (!validatePasswordFormat(password)) {
      throw new ApiError('Password must be min 8 chars with 1 uppercase, 1 lowercase, 1 number & 1 special character.', 400, 'VALIDATION_ERROR')
    }

    // Verify token hash
    const tokenHash = crypto.createHash('sha256').update(activationToken).digest('hex')
    const resetTokenRecord = await PasswordResetToken.findOne({ tokenHash })

    if (!resetTokenRecord) {
      throw new ApiError('Invalid activation authorization token.', 400, 'INVALID_ACTIVATION_TOKEN')
    }

    if (resetTokenRecord.usedAt) {
      throw new ApiError('This activation session has already been completed. Please sign in.', 400, 'ACTIVATION_TOKEN_USED')
    }

    if (new Date(resetTokenRecord.expiresAt) <= new Date()) {
      throw new ApiError('Your activation session has expired. Please restart account activation.', 400, 'ACTIVATION_TOKEN_EXPIRED')
    }

    // 1. STUDENT ACTIVATION
    if (role === 'student') {
      const student = await this.findStudentByIdentifier(studentId, tenantId)
      if (!student) {
        throw new ApiError('Student record not found.', 404, 'STUDENT_NOT_FOUND')
      }

      // Check if student profile is already linked to a User account
      const existingLinkedUser = await User.findOne({ tenantId, linkedStudent: student._id })
      if (existingLinkedUser) {
        throw new ApiError('An account has already been activated for this student. Please sign in or use Forgot Password.', 409, 'ACCOUNT_ALREADY_ACTIVATED')
      }

      const regEmail = (student.email || student.parentEmail || '').toLowerCase().trim()
      if (!regEmail) {
        throw new ApiError('No registered email found for this student profile.', 400, 'MISSING_EMAIL')
      }

      // Check if email already belongs to another User within this institution
      const existingEmailUser = await User.findOne({ tenantId, email: regEmail })
      if (existingEmailUser) {
        if (existingEmailUser.linkedStudent && existingEmailUser.linkedStudent.toString() === student._id.toString()) {
          throw new ApiError('An account has already been activated for this student. Please sign in or use Forgot Password.', 409, 'ACCOUNT_ALREADY_ACTIVATED')
        } else {
          throw new ApiError('This email address is already connected to another user account. Please contact administration.', 409, 'EMAIL_ALREADY_IN_USE')
        }
      }

      // Check if phone already belongs to another User within this institution
      if (student.phone && student.phone.trim()) {
        const cleanPhone = student.phone.trim()
        const existingPhoneUser = await User.findOne({ tenantId, phone: cleanPhone })
        if (existingPhoneUser) {
          throw new ApiError('This phone number is already connected to another user account.', 409, 'PHONE_ALREADY_IN_USE')
        }
      }

      const salt = await bcrypt.genSalt(10)
      const passwordHash = await bcrypt.hash(password, salt)

      const newUser = await User.create({
        email: regEmail,
        passwordHash,
        role: 'student',
        firstName: student.firstName,
        lastName: student.lastName,
        phone: student.phone || '',
        linkedStudent: student._id,
        tenantId: student.tenantId,
        maxSessions: 1,
        isActive: true
      })

      resetTokenRecord.usedAt = new Date()
      await resetTokenRecord.save()

      return {
        success: true,
        message: 'Student account activated successfully. Please sign in with your credentials.',
        user: { id: newUser._id, email: newUser.email }
      }
    }

    // 2. TEACHER ACTIVATION
    if (role === 'teacher') {
      const teacher = await this.findTeacherByIdentifier(teacherId || studentId, tenantId)
      if (!teacher) {
        throw new ApiError('Teacher record not found.', 404, 'TEACHER_NOT_FOUND')
      }

      const existingLinkedUser = await User.findOne({ tenantId, linkedTeacher: teacher._id })
      if (existingLinkedUser) {
        throw new ApiError('An account has already been activated for this teacher. Please sign in or use Forgot Password.', 409, 'ACCOUNT_ALREADY_ACTIVATED')
      }

      const regEmail = (teacher.email || '').toLowerCase().trim()
      if (!regEmail) {
        throw new ApiError('No registered email found for this teacher profile.', 400, 'MISSING_EMAIL')
      }

      const existingEmailUser = await User.findOne({ tenantId, email: regEmail })
      if (existingEmailUser) {
        throw new ApiError('This email address is already connected to another user account. Please contact administration.', 409, 'EMAIL_ALREADY_IN_USE')
      }

      const salt = await bcrypt.genSalt(10)
      const passwordHash = await bcrypt.hash(password, salt)

      const newUser = await User.create({
        email: regEmail,
        passwordHash,
        role: 'teacher',
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        phone: teacher.phone || '',
        linkedTeacher: teacher._id,
        tenantId: teacher.tenantId,
        maxSessions: 2,
        isActive: true
      })

      resetTokenRecord.usedAt = new Date()
      await resetTokenRecord.save()

      return {
        success: true,
        message: 'Teacher account activated successfully. Please sign in with your credentials.',
        user: { id: newUser._id, email: newUser.email }
      }
    }

    // 3. PARENT ACTIVATION
    if (role === 'parent') {
      const student = await this.findStudentByIdentifier(studentId, tenantId)
      if (!student) {
        throw new ApiError('Student record not found.', 404, 'STUDENT_NOT_FOUND')
      }

      const parentEmail = (student.parentEmail || student.email || '').toLowerCase().trim()
      if (!parentEmail) {
        throw new ApiError('No registered parent email found.', 400, 'MISSING_EMAIL')
      }

      const existingParentUser = await User.findOne({ tenantId, email: parentEmail })
      if (existingParentUser) {
        if (existingParentUser.role === 'parent') {
          const currentChildren = (existingParentUser.linkedChildren || []).map(id => id.toString())
          if (!currentChildren.includes(student._id.toString())) {
            existingParentUser.linkedChildren.push(student._id)
            await existingParentUser.save()
          }
          resetTokenRecord.usedAt = new Date()
          await resetTokenRecord.save()
          return {
            success: true,
            accountExists: true,
            message: `Student ${student.firstName} successfully linked to your existing parent account. Please sign in.`
          }
        } else {
          throw new ApiError('This email address is already connected to a non-parent user account.', 409, 'EMAIL_ALREADY_IN_USE')
        }
      }

      const salt = await bcrypt.genSalt(10)
      const passwordHash = await bcrypt.hash(password, salt)

      const newUser = await User.create({
        email: parentEmail,
        passwordHash,
        role: 'parent',
        firstName: 'Parent of',
        lastName: student.lastName || 'Student',
        linkedChildren: [student._id],
        tenantId: student.tenantId,
        maxSessions: 2,
        isActive: true
      })

      resetTokenRecord.usedAt = new Date()
      await resetTokenRecord.save()

      return {
        success: true,
        accountExists: false,
        message: 'Parent account activated successfully. Please sign in.'
      }
    }

    throw new ApiError('Invalid activation parameters.', 400, 'ACTIVATION_INVALID')
  }

  /**
   * Admin: Get Account Activation Status for Student / Teacher Profile
   */
  async getAccountActivationStatus(targetId, tenantId) {
    if (!targetId) {
      return { status: 'Not Activated' }
    }

    let targetStudent = await this.findStudentByIdentifier(targetId, tenantId)
    let targetTeacher = await this.findTeacherByIdentifier(targetId, tenantId)

    const searchId = targetStudent ? targetStudent._id : targetTeacher ? targetTeacher._id : targetId
    const scope = tenantId ? { tenantId } : {}

    const existingUser = await User.findOne({
      ...scope,
      $or: [{ linkedStudent: searchId }, { linkedTeacher: searchId }]
    })

    if (existingUser) {
      return {
        status: 'Activated',
        userId: existingUser._id,
        email: existingUser.email,
        maskedEmail: existingUser.email,
        role: existingUser.role,
        activatedAt: existingUser.createdAt
      }
    }

    const emailToMask = targetStudent
      ? (targetStudent.email || targetStudent.parentEmail)
      : targetTeacher
        ? targetTeacher.email
        : null

    return {
      status: 'Not Activated',
      studentId: targetStudent ? targetStudent.studentId : null,
      teacherId: targetTeacher ? targetTeacher.teacherId : null,
      maskedEmail: emailToMask ? this.maskEmail(emailToMask) : 'N/A'
    }
  }
}

module.exports = new ActivationService()
