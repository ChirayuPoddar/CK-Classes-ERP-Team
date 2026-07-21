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
   * Helper: Resolves Student record safely by Student ID or ObjectId
   */
  async findStudentByIdentifier(identifierStr) {
    if (!identifierStr || typeof identifierStr !== 'string') return null
    const cleanStr = identifierStr.trim()

    // 1. Try finding by unique studentId (e.g. CK20260001, STU-101)
    let student = await Student.findOne({ studentId: cleanStr })
    if (student) return student

    // 2. Try case-insensitive regex for studentId
    student = await Student.findOne({ studentId: new RegExp(`^${cleanStr}$`, 'i') })
    if (student) return student

    // 3. Fallback to ObjectId if valid
    if (mongoose.Types.ObjectId.isValid(cleanStr)) {
      student = await Student.findById(cleanStr)
      if (student) return student
    }

    return null
  }

  /**
   * Helper: Resolves Teacher record safely by Teacher ID or ObjectId
   */
  async findTeacherByIdentifier(identifierStr) {
    if (!identifierStr || typeof identifierStr !== 'string') return null
    const cleanStr = identifierStr.trim()

    let teacher = await Teacher.findOne({ teacherId: cleanStr })
    if (teacher) return teacher

    teacher = await Teacher.findOne({ teacherId: new RegExp(`^${cleanStr}$`, 'i') })
    if (teacher) return teacher

    if (mongoose.Types.ObjectId.isValid(cleanStr)) {
      teacher = await Teacher.findById(cleanStr)
      if (teacher) return teacher
    }

    return null
  }

  /**
   * Step 1: Request Activation OTP by Institution ID (Student ID / Teacher ID)
   */
  async requestActivationOtp({ role, studentId, teacherId }) {
    if (!role || !['student', 'parent', 'teacher'].includes(role)) {
      throw new ApiError('Invalid role specified for activation.', 400, 'VALIDATION_ERROR')
    }

    // 1. STUDENT ACTIVATION
    if (role === 'student') {
      const targetId = studentId
      const student = await this.findStudentByIdentifier(targetId)

      // Account enumeration protection: Generic error if not found
      if (!student) {
        throw new ApiError('Invalid or unavailable activation credentials.', 400, 'ACTIVATION_INVALID')
      }

      // Check if student is already activated
      const existingUser = await User.findOne({ linkedStudent: student._id })
      if (existingUser) {
        throw new ApiError('This account is already activated. Please sign in.', 409, 'STUDENT_ACCOUNT_ALREADY_EXISTS')
      }

      const regEmail = (student.email || student.parentEmail || '').toLowerCase().trim()
      if (!regEmail) {
        throw new ApiError('No registered institutional email found for this student. Please contact administration.', 400, 'ACTIVATION_EMAIL_MISSING')
      }

      // Dispatch 6-digit OTP using centralized OTP infrastructure
      await otpService.requestOtp({
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
      const teacher = await this.findTeacherByIdentifier(targetId)

      if (!teacher) {
        throw new ApiError('Invalid or unavailable activation credentials.', 400, 'ACTIVATION_INVALID')
      }

      const existingUser = await User.findOne({ linkedTeacher: teacher._id })
      if (existingUser) {
        throw new ApiError('This staff account is already activated. Please sign in.', 409, 'STAFF_ACCOUNT_ALREADY_EXISTS')
      }

      const regEmail = (teacher.email || '').toLowerCase().trim()
      if (!regEmail) {
        throw new ApiError('No registered email found for this teacher. Please contact administration.', 400, 'ACTIVATION_EMAIL_MISSING')
      }

      await otpService.requestOtp({
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
      const student = await this.findStudentByIdentifier(targetId)

      if (!student) {
        throw new ApiError('Invalid or unavailable activation credentials.', 400, 'ACTIVATION_INVALID')
      }

      const parentEmail = (student.parentEmail || student.email || '').toLowerCase().trim()
      if (!parentEmail) {
        throw new ApiError('No registered parent contact found for this student. Please contact administration.', 400, 'ACTIVATION_EMAIL_MISSING')
      }

      await otpService.requestOtp({
        identifier: parentEmail,
        channel: 'email',
        purpose: 'parent_activation'
      })

      const parentUser = await User.findOne({ email: parentEmail, role: 'parent' })

      return {
        success: true,
        role: 'parent',
        maskedEmail: this.maskEmail(parentEmail),
        identifier: parentEmail,
        studentId: student.studentId,
        studentName: student.firstName,
        existingParentUser: !!parentUser
      }
    }

    throw new ApiError('Invalid activation parameters.', 400, 'ACTIVATION_INVALID')
  }

  /**
   * Step 2: Verify Activation OTP & Issue Short-lived Activation Token
   */
  async verifyActivationOtp({ role, studentId, teacherId, identifier, otp }) {
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
      identifier: cleanIdentifier,
      purpose: otpPurpose,
      otp
    })

    // Consume OTP
    await otpService.consumeOtp({
      identifier: cleanIdentifier,
      purpose: otpPurpose,
      otp
    })

    // Resolve student/teacher target
    let targetStudent = null
    let targetTeacher = null

    if (role === 'student' || role === 'parent') {
      targetStudent = await this.findStudentByIdentifier(studentId)
      if (!targetStudent) {
        throw new ApiError('Invalid or unavailable student record.', 400, 'ACTIVATION_INVALID')
      }
    } else if (role === 'teacher') {
      targetTeacher = await this.findTeacherByIdentifier(teacherId || studentId)
      if (!targetTeacher) {
        throw new ApiError('Invalid or unavailable teacher record.', 400, 'ACTIVATION_INVALID')
      }
    }

    // SPECIAL PARENT HANDLING: If Parent User already exists for verified email, link child immediately without password overwrite!
    if (role === 'parent') {
      const parentUser = await User.findOne({ email: cleanIdentifier, role: 'parent' })
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
  async completeActivation({ activationToken, role, studentId, teacherId, password, confirmPassword }) {
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
    const resetTokenRecord = await PasswordResetToken.findOne({
      tokenHash,
      usedAt: null,
      expiresAt: { $gt: new Date() }
    })

    if (!resetTokenRecord) {
      throw new ApiError('Invalid or expired activation authorization token.', 400, 'ACTIVATION_EXPIRED')
    }

    // 1. STUDENT ACTIVATION
    if (role === 'student') {
      const student = await this.findStudentByIdentifier(studentId)
      if (!student) {
        throw new ApiError('Student record not found.', 404, 'STUDENT_NOT_FOUND')
      }

      const existingUser = await User.findOne({ linkedStudent: student._id })
      if (existingUser) {
        throw new ApiError('Student account is already activated.', 409, 'STUDENT_ACCOUNT_ALREADY_EXISTS')
      }

      const regEmail = (student.email || student.parentEmail).toLowerCase().trim()
      const salt = await bcrypt.genSalt(10)
      const passwordHash = await bcrypt.hash(password, salt)

      await User.create({
        email: regEmail,
        passwordHash,
        role: 'student',
        firstName: student.firstName,
        lastName: student.lastName,
        phone: student.phone,
        linkedStudent: student._id,
        maxSessions: 1,
        isActive: true
      })

      resetTokenRecord.usedAt = new Date()
      await resetTokenRecord.save()

      return {
        success: true,
        message: 'Student account activated successfully. Please sign in with your credentials.'
      }
    }

    // 2. TEACHER ACTIVATION
    if (role === 'teacher') {
      const teacher = await this.findTeacherByIdentifier(teacherId || studentId)
      if (!teacher) {
        throw new ApiError('Teacher record not found.', 404, 'TEACHER_NOT_FOUND')
      }

      const existingUser = await User.findOne({ linkedTeacher: teacher._id })
      if (existingUser) {
        throw new ApiError('Teacher account is already activated.', 409, 'STAFF_ACCOUNT_ALREADY_EXISTS')
      }

      const regEmail = (teacher.email).toLowerCase().trim()
      const salt = await bcrypt.genSalt(10)
      const passwordHash = await bcrypt.hash(password, salt)

      await User.create({
        email: regEmail,
        passwordHash,
        role: 'teacher',
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        phone: teacher.phone,
        linkedTeacher: teacher._id,
        maxSessions: 2,
        isActive: true
      })

      resetTokenRecord.usedAt = new Date()
      await resetTokenRecord.save()

      return {
        success: true,
        message: 'Teacher account activated successfully. Please sign in with your credentials.'
      }
    }

    // 3. NEW PARENT ACCOUNT ACTIVATION
    if (role === 'parent') {
      const student = await this.findStudentByIdentifier(studentId)
      if (!student) {
        throw new ApiError('Student record not found.', 404, 'STUDENT_NOT_FOUND')
      }

      const parentEmail = (student.parentEmail || student.email).toLowerCase().trim()
      const existingParentUser = await User.findOne({ email: parentEmail, role: 'parent' })

      if (existingParentUser) {
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
      }

      const salt = await bcrypt.genSalt(10)
      const passwordHash = await bcrypt.hash(password, salt)

      await User.create({
        email: parentEmail,
        passwordHash,
        role: 'parent',
        firstName: 'Parent of',
        lastName: student.lastName || 'Student',
        linkedChildren: [student._id],
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
  async getAccountActivationStatus(targetId) {
    if (!targetId) {
      return { status: 'Not Activated' }
    }

    let targetStudent = await this.findStudentByIdentifier(targetId)
    let targetTeacher = await this.findTeacherByIdentifier(targetId)

    const searchId = targetStudent ? targetStudent._id : targetTeacher ? targetTeacher._id : targetId

    const existingUser = await User.findOne({
      $or: [{ linkedStudent: searchId }, { linkedTeacher: searchId }]
    })

    if (existingUser) {
      return {
        status: 'Activated',
        userId: existingUser._id,
        email: existingUser.email,
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
