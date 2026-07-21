const { body, validationResult } = require('express-validator')

// Helper function to validate password format against centralized policy
const validatePasswordFormat = (password) => {
  if (!password || typeof password !== 'string') return false
  if (password.length < 8) return false
  if (!/[A-Z]/.test(password)) return false
  if (!/[a-z]/.test(password)) return false
  if (!/[0-9]/.test(password)) return false
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false
  return true
}

// Helper middleware to handle and format express-validator validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const firstErr = errors.array()[0]
    return res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: firstErr.msg,
      error: {
        message: firstErr.msg,
        code: 'VALIDATION_ERROR',
        field: firstErr.path || firstErr.param,
        details: errors.array().map(err => ({
          field: err.path || err.param,
          message: err.msg
        }))
      }
    })
  }
  next()
}

// Validation rules for user creation
const validateCreateUser = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      if (!value) return true
      const digitsOnly = value.replace(/\D/g, '')
      const clean10 = digitsOnly.length === 12 && digitsOnly.startsWith('91') ? digitsOnly.slice(2) : digitsOnly
      if (!/^[6-9]\d{9}$/.test(clean10)) {
        throw new Error('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9')
      }
      return true
    }),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .custom((value) => {
      if (!validatePasswordFormat(value)) {
        throw new Error('Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character')
      }
      return true
    }),

  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['admin', 'teacher', 'student', 'parent', 'receptionist', 'accountant'])
    .withMessage('Invalid user role selected'),

  body('maxSessions')
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 5 })
    .withMessage('Maximum concurrent sessions must be an integer between 1 and 5'),

  handleValidationErrors
]

// Validation rules for user update
const validateUpdateUser = [
  body('firstName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),

  body('lastName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),

  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      if (!value) return true
      const digitsOnly = value.replace(/\D/g, '')
      const clean10 = digitsOnly.length === 12 && digitsOnly.startsWith('91') ? digitsOnly.slice(2) : digitsOnly
      if (!/^[6-9]\d{9}$/.test(clean10)) {
        throw new Error('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9')
      }
      return true
    }),

  body('role')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['admin', 'teacher', 'student', 'parent', 'receptionist', 'accountant'])
    .withMessage('Invalid user role selected'),

  body('maxSessions')
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 5 })
    .withMessage('Maximum concurrent sessions must be an integer between 1 and 5'),

  handleValidationErrors
]

module.exports = {
  validatePasswordFormat,
  validateCreateUser,
  validateUpdateUser
}
