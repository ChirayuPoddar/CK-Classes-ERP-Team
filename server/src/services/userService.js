const User = require('../models/User')
const Teacher = require('../models/Teacher')
const Student = require('../models/Student')
const bcrypt = require('bcryptjs')
const ApiError = require('../utils/ApiError')
const mongoose = require('mongoose')

class UserService {
  /**
   * Helper: Normalize Indian 10-digit mobile number
   */
  normalizePhone(phone) {
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return ''
    }
    const digits = phone.replace(/\D/g, '')
    if (digits.length === 12 && digits.startsWith('91')) {
      return digits.slice(2)
    }
    if (digits.length === 11 && digits.startsWith('0')) {
      return digits.slice(1)
    }
    if (digits.length === 10) {
      return digits
    }
    return digits
  }

  /**
   * Helper: Validate Indian phone number format
   */
  validatePhone(normalizedPhone) {
    if (!normalizedPhone) return true
    const phoneRegex = /^[6-9]\d{9}$/
    return phoneRegex.test(normalizedPhone)
  }

  /**
   * Helper: Validate standard email format
   */
  validateEmail(email) {
    if (!email || typeof email !== 'string') return false
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim().toLowerCase())
  }

  /**
   * Helper: Check if target user is the last active admin
   */
  async isLastActiveAdmin(userId, tenantId) {
    const user = await User.findOne({ _id: userId, tenantId })
    if (!user || user.role !== 'admin' || !user.isActive) {
      return false
    }
    const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true, tenantId })
    return activeAdminCount <= 1
  }

  /**
   * Get paginated users with search & filters
   */
  async getUsers({ page = 1, limit = 10, search = '', role = '', status = '', tenantId }) {
    const query = { tenantId }

    // Status filter
    if (status === 'Active') {
      query.isActive = true
    } else if (status === 'Blocked') {
      query.isActive = false
    }

    // Role filter
    if (role && ['admin', 'teacher', 'student', 'parent', 'receptionist', 'accountant'].includes(role.toLowerCase())) {
      query.role = role.toLowerCase()
    }

    // Search filter (name, email, phone)
    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i')
      query.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex }
      ]
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1)
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1)
    const skip = (pageNum - 1) * limitNum

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash')
        .populate('linkedTeacher', 'firstName lastName email phone photo')
        .populate('linkedStudent', 'firstName lastName studentId class email phone photo')
        .populate('linkedChildren', 'firstName lastName studentId class email phone photo')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query)
    ])

    const now = new Date()
    const processedUsers = users.map(u => {
      const activeSessionsCount = (u.sessions || []).filter(s => new Date(s.expiresAt) > now).length
      return {
        ...u,
        activeSessionsCount
      }
    })

    return {
      users: processedUsers,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      page: pageNum
    }
  }

  /**
   * Get dashboard user statistics
   */
  async getUserStats(tenantId) {
    const now = new Date()
    const [totalUsers, activeUsers, blockedUsers, usersWithSessions] = await Promise.all([
      User.countDocuments({ tenantId }),
      User.countDocuments({ isActive: true, tenantId }),
      User.countDocuments({ isActive: false, tenantId }),
      User.find({ 'sessions.expiresAt': { $gt: now }, tenantId }).select('sessions')
    ])

    let activeSessionsCount = 0
    usersWithSessions.forEach(u => {
      activeSessionsCount += (u.sessions || []).filter(s => new Date(s.expiresAt) > now).length
    })

    return {
      totalUsers,
      activeUsers,
      blockedUsers,
      activeSessionsCount
    }
  }

  /**
   * Fetch unlinked profiles (Teachers & Students) available for account creation
   */
  async getUnlinkedProfiles(tenantId) {
    // Get existing linked Teacher IDs
    const linkedTeacherUsers = await User.find({ linkedTeacher: { $ne: null }, tenantId }).select('linkedTeacher')
    const linkedTeacherIds = linkedTeacherUsers.map(u => u.linkedTeacher).filter(Boolean)

    // Get existing linked Student IDs
    const linkedStudentUsers = await User.find({ linkedStudent: { $ne: null }, tenantId }).select('linkedStudent')
    const linkedStudentIds = linkedStudentUsers.map(u => u.linkedStudent).filter(Boolean)

    const [unlinkedTeachers, unlinkedStudents, allStudents] = await Promise.all([
      Teacher.find({ _id: { $nin: linkedTeacherIds }, status: 'Active', tenantId })
        .select('firstName lastName email phone teacherId subjects')
        .sort({ firstName: 1 })
        .lean(),
      Student.find({ _id: { $nin: linkedStudentIds }, status: 'Active', tenantId })
        .select('firstName lastName email phone studentId class')
        .sort({ firstName: 1 })
        .lean(),
      Student.find({ status: 'Active', tenantId })
        .select('firstName lastName studentId class email phone parent')
        .sort({ firstName: 1 })
        .lean()
    ])

    return {
      unlinkedTeachers,
      unlinkedStudents,
      allStudents
    }
  }

  /**
   * Fetch single user details with populated linked profiles
   */
  async getUserById(id, tenantId) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid user ID format.', 400, 'INVALID_ID')
    }

    const user = await User.findOne({ _id: id, tenantId })
      .select('-passwordHash')
      .populate('linkedTeacher', 'firstName lastName email phone qualification subjects photo')
      .populate('linkedStudent', 'firstName lastName studentId class email phone fatherName motherName photo')
      .populate('linkedChildren', 'firstName lastName studentId class email phone photo')

    if (!user) {
      throw new ApiError('User account not found.', 404, 'USER_NOT_FOUND')
    }

    const userObj = user.toObject()
    const now = new Date()
    userObj.activeSessions = (userObj.sessions || []).filter(s => new Date(s.expiresAt) > now)
    userObj.activeSessionsCount = userObj.activeSessions.length
    return userObj
  }

  /**
   * Create new user account
   */
  async createUser(data) {
    const { email, password, role, firstName, lastName, phone, linkedTeacher, linkedStudent, linkedChildren, tenantId } = data

    // 1. Email validation
    if (!email || !this.validateEmail(email)) {
      throw new ApiError('Please enter a valid email address.', 400, 'INVALID_EMAIL')
    }
    const cleanEmail = email.toLowerCase().trim()

    // Duplicate email check
    const existingEmail = await User.findOne({ email: cleanEmail, tenantId })
    if (existingEmail) {
      throw new ApiError('An account with this email address already exists.', 409, 'EMAIL_ALREADY_EXISTS')
    }

    // 2. Name validation
    if (!firstName || !firstName.trim() || !lastName || !lastName.trim()) {
      throw new ApiError('First name and last name are required.', 400, 'VALIDATION_ERROR')
    }

    // 3. Password validation with centralized policy
    const { validatePasswordFormat } = require('../validators/userValidator')
    if (!password || !validatePasswordFormat(password)) {
      throw new ApiError('Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.', 400, 'VALIDATION_ERROR')
    }

    // 4. Role validation
    if (!role || !['admin', 'teacher', 'student', 'parent', 'receptionist', 'accountant'].includes(role.toLowerCase().trim())) {
      throw new ApiError('Invalid account role selected.', 400, 'INVALID_ROLE')
    }
    const normalizedRole = role.toLowerCase().trim()

    // 5. Phone normalization & validation
    const normalizedPhone = this.normalizePhone(phone)
    if (phone && !normalizedPhone) {
      throw new ApiError('Please enter a valid 10-digit Indian mobile number.', 400, 'INVALID_PHONE')
    }
    if (normalizedPhone) {
      const existingPhone = await User.findOne({ phone: normalizedPhone, tenantId })
      if (existingPhone) {
        throw new ApiError('An account with this phone number already exists.', 409, 'PHONE_ALREADY_EXISTS')
      }
    }

    // Role default max sessions rule
    const { getMaxSessionsForRole } = require('../config/permissions')
    const maxSessions = data.maxSessions || getMaxSessionsForRole(normalizedRole)

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    const userData = {
      email: cleanEmail,
      passwordHash,
      role: normalizedRole,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: normalizedPhone,
      maxSessions,
      isActive: true,
      tenantId
    }

    // 6. Profile link verification & duplication checks
    if (normalizedRole === 'teacher' && linkedTeacher && linkedTeacher.trim()) {
      if (!mongoose.Types.ObjectId.isValid(linkedTeacher)) {
        throw new ApiError('Invalid teacher profile reference.', 400, 'INVALID_PROFILE_LINK')
      }
      const teacherObj = await Teacher.findOne({ _id: linkedTeacher, tenantId })
      if (!teacherObj) {
        throw new ApiError('Selected teacher profile does not exist.', 400, 'INVALID_PROFILE_LINK')
      }
      const alreadyLinked = await User.findOne({ linkedTeacher, tenantId })
      if (alreadyLinked) {
        throw new ApiError('This teacher profile is already linked to another account.', 409, 'PROFILE_ALREADY_LINKED')
      }
      userData.linkedTeacher = linkedTeacher
    } else if (normalizedRole === 'student' && linkedStudent && linkedStudent.trim()) {
      if (!mongoose.Types.ObjectId.isValid(linkedStudent)) {
        throw new ApiError('Invalid student profile reference.', 400, 'INVALID_PROFILE_LINK')
      }
      const studentObj = await Student.findOne({ _id: linkedStudent, tenantId })
      if (!studentObj) {
        throw new ApiError('Selected student profile does not exist.', 400, 'INVALID_PROFILE_LINK')
      }
      const alreadyLinked = await User.findOne({ linkedStudent, tenantId })
      if (alreadyLinked) {
        throw new ApiError('This student profile is already linked to another account.', 409, 'PROFILE_ALREADY_LINKED')
      }
      userData.linkedStudent = linkedStudent
    } else if (normalizedRole === 'parent' && linkedChildren) {
      const childrenArr = Array.isArray(linkedChildren) ? linkedChildren : [linkedChildren]
      const validChildren = childrenArr.filter(id => id && mongoose.Types.ObjectId.isValid(id))
      userData.linkedChildren = validChildren
    }

    const newUser = new User(userData)
    await newUser.save()
    return this.getUserById(newUser._id, tenantId)
  }

  /**
   * Update existing user account
   */
  async updateUser(id, data, currentUserId, tenantId) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid user ID format.', 400, 'INVALID_ID')
    }

    const user = await User.findOne({ _id: id, tenantId })
    if (!user) {
      throw new ApiError('User account not found.', 404, 'USER_NOT_FOUND')
    }

    const { firstName, lastName, email, phone, role, linkedTeacher, linkedStudent, linkedChildren } = data

    // Admin self-protection: Role downgrade
    if (user.role === 'admin' && role && role.toLowerCase().trim() !== 'admin') {
      const isLastAdmin = await this.isLastActiveAdmin(id, tenantId)
      if (isLastAdmin) {
        throw new ApiError('At least one active administrator is required. Create or activate another administrator before changing this account.', 400, 'LAST_ADMIN_PROTECTION')
      }
    }

    // Email validation & duplicate check
    if (email && email.toLowerCase().trim() !== user.email) {
      if (!this.validateEmail(email)) {
        throw new ApiError('Please enter a valid email address.', 400, 'INVALID_EMAIL')
      }
      const cleanEmail = email.toLowerCase().trim()
      const existingEmail = await User.findOne({ email: cleanEmail, _id: { $ne: id }, tenantId })
      if (existingEmail) {
        throw new ApiError('An account with this email address already exists.', 409, 'EMAIL_ALREADY_EXISTS')
      }
      user.email = cleanEmail
    }

    // Phone validation & duplicate check
    if (phone !== undefined) {
      const normalizedPhone = this.normalizePhone(phone)
      if (phone && !normalizedPhone) {
        throw new ApiError('Please enter a valid 10-digit Indian mobile number.', 400, 'INVALID_PHONE')
      }
      if (normalizedPhone && normalizedPhone !== user.phone) {
        const existingPhone = await User.findOne({ phone: normalizedPhone, _id: { $ne: id }, tenantId })
        if (existingPhone) {
          throw new ApiError('An account with this phone number already exists.', 409, 'PHONE_ALREADY_EXISTS')
        }
      }
      user.phone = normalizedPhone
    }

    if (firstName && firstName.trim()) user.firstName = firstName.trim()
    if (lastName && lastName.trim()) user.lastName = lastName.trim()

    if (role && ['admin', 'teacher', 'student', 'parent', 'receptionist', 'accountant'].includes(role.toLowerCase().trim())) {
      user.role = role.toLowerCase().trim()
      user.maxSessions = user.role === 'student' ? 1 : 2
    }

    // Profile linking checks
    if (user.role === 'teacher') {
      if (linkedTeacher && linkedTeacher.trim()) {
        if (!mongoose.Types.ObjectId.isValid(linkedTeacher)) {
          throw new ApiError('Invalid teacher profile reference.', 400, 'INVALID_PROFILE_LINK')
        }
        const alreadyLinked = await User.findOne({ linkedTeacher, _id: { $ne: id }, tenantId })
        if (alreadyLinked) {
          throw new ApiError('This teacher profile is already linked to another account.', 409, 'PROFILE_ALREADY_LINKED')
        }
        user.linkedTeacher = linkedTeacher
      } else {
        user.linkedTeacher = null
      }
      user.linkedStudent = null
      user.linkedChildren = []
    } else if (user.role === 'student') {
      if (linkedStudent && linkedStudent.trim()) {
        if (!mongoose.Types.ObjectId.isValid(linkedStudent)) {
          throw new ApiError('Invalid student profile reference.', 400, 'INVALID_PROFILE_LINK')
        }
        const alreadyLinked = await User.findOne({ linkedStudent, _id: { $ne: id }, tenantId })
        if (alreadyLinked) {
          throw new ApiError('This student profile is already linked to another account.', 409, 'PROFILE_ALREADY_LINKED')
        }
        user.linkedStudent = linkedStudent
      } else {
        user.linkedStudent = null
      }
      user.linkedTeacher = null
      user.linkedChildren = []
    } else if (user.role === 'parent') {
      const childrenArr = Array.isArray(linkedChildren) ? linkedChildren : (linkedChildren ? [linkedChildren] : [])
      user.linkedChildren = childrenArr.filter(cid => cid && mongoose.Types.ObjectId.isValid(cid))
      user.linkedTeacher = null
      user.linkedStudent = null
    } else {
      user.linkedTeacher = null
      user.linkedStudent = null
      user.linkedChildren = []
    }

    await user.save()
    return this.getUserById(user._id, tenantId)
  }

  /**
   * Block user account & invalidate active sessions
   */
  async blockUser(id, currentUserId, tenantId) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid user ID format.', 400, 'INVALID_ID')
    }

    const user = await User.findOne({ _id: id, tenantId })
    if (!user) {
      throw new ApiError('User account not found.', 404, 'USER_NOT_FOUND')
    }

    // Admin self-protection rule
    if (user.role === 'admin') {
      const isLastAdmin = await this.isLastActiveAdmin(id, tenantId)
      if (isLastAdmin) {
        throw new ApiError('At least one active administrator is required. Create or activate another administrator before changing this account.', 400, 'LAST_ADMIN_PROTECTION')
      }
    }

    user.isActive = false
    user.sessions = []
    await user.save()

    return this.getUserById(user._id, tenantId)
  }

  /**
   * Unblock user account
   */
  async unblockUser(id, tenantId) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid user ID format.', 400, 'INVALID_ID')
    }

    const user = await User.findOne({ _id: id, tenantId })
    if (!user) {
      throw new ApiError('User account not found.', 404, 'USER_NOT_FOUND')
    }

    user.isActive = true
    await user.save()
    return this.getUserById(user._id, tenantId)
  }

  /**
   * Reset user password & invalidate active sessions
   */
  async resetPassword(id, newPassword, tenantId) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid user ID format.', 400, 'INVALID_ID')
    }

    const user = await User.findOne({ _id: id, tenantId })
    if (!user) {
      throw new ApiError('User account not found.', 404, 'USER_NOT_FOUND')
    }

    if (!newPassword || newPassword.length < 6) {
      throw new ApiError('Password must be at least 6 characters long.', 400, 'VALIDATION_ERROR')
    }

    const salt = await bcrypt.genSalt(10)
    user.passwordHash = await bcrypt.hash(newPassword, salt)
    user.resetPasswordToken = null
    user.resetPasswordExpires = null
    user.sessions = []

    await user.save()
    return true
  }

  /**
   * Revoke single active session
   */
  async revokeSession(userId, sessionId, tenantId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError('Invalid user ID format.', 400, 'INVALID_ID')
    }

    const user = await User.findOne({ _id: userId, tenantId })
    if (!user) throw new ApiError('User account not found.', 404, 'USER_NOT_FOUND')

    user.sessions = (user.sessions || []).filter(s => s.sessionId !== sessionId)
    await user.save()
    return this.getUserById(userId, tenantId)
  }

  /**
   * Revoke all active sessions for a user
   */
  async revokeAllSessions(userId, tenantId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError('Invalid user ID format.', 400, 'INVALID_ID')
    }

    const user = await User.findOne({ _id: userId, tenantId })
    if (!user) throw new ApiError('User account not found.', 404, 'USER_NOT_FOUND')

    user.sessions = []
    await user.save()
    return this.getUserById(userId, tenantId)
  }

  /**
   * Delete user account (Removes login account ONLY; preserves Student/Teacher institutional profile)
   */
  async deleteUser(id, currentUserId, tenantId) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid user ID format.', 400, 'INVALID_ID')
    }

    if (id === currentUserId.toString()) {
      throw new ApiError('You cannot remove your own currently logged-in account from the Users dashboard.', 400, 'CANNOT_MODIFY_PROTECTED_ADMIN')
    }

    const user = await User.findOne({ _id: id, tenantId })
    if (!user) {
      throw new ApiError('User account not found.', 404, 'USER_NOT_FOUND')
    }

    // Admin self-protection rule
    if (user.role === 'admin') {
      const isLastAdmin = await this.isLastActiveAdmin(id, tenantId)
      if (isLastAdmin) {
        throw new ApiError('At least one active administrator is required. Create or activate another administrator before changing this account.', 400, 'LAST_ADMIN_PROTECTION')
      }
    }

    await User.findOneAndDelete({ _id: id, tenantId })
    return true
  }
}

module.exports = new UserService()
