/**
 * Data Scope & Ownership Middleware to prevent IDOR vulnerabilities
 */

const enforceStudentScope = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      error: { message: 'Authentication required.' }
    })
  }

  const role = req.user.role ? req.user.role.toLowerCase() : ''
  const targetId = req.params.id || req.params.studentId || req.query.studentId

  // Admin, Staff, Teacher, Receptionist, Accountant bypass individual ownership checks
  if (['admin', 'teacher', 'receptionist', 'accountant'].includes(role)) {
    return next()
  }

  // Student Role Ownership Verification
  if (role === 'student') {
    if (!targetId) return next()
    
    const isOwnStudent = req.user.linkedStudent && req.user.linkedStudent.toString() === targetId.toString()
    const isOwnUser = req.user.id.toString() === targetId.toString()

    if (!isOwnStudent && !isOwnUser) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You can access only your own student profile and records.',
        error: { message: 'You can access only your own student profile and records.' }
      })
    }
  }

  // Parent Role Ownership Verification
  if (role === 'parent') {
    if (!targetId) return next()

    const linkedChildren = req.user.linkedChildren || []
    const isLinkedChild = linkedChildren.includes(targetId.toString())

    if (!isLinkedChild) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You can access only records belonging to your linked children.',
        error: { message: 'You can access only records belonging to your linked children.' }
      })
    }
  }

  next()
}

module.exports = {
  enforceStudentScope
}
