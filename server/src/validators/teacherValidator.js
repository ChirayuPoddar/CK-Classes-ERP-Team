const { body, validationResult } = require('express-validator')

// Helper middleware to handle validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }))
    })
  }
  next()
}

// Rules for creating a teacher
const validateCreateTeacher = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isString()
    .withMessage('First name must be a valid string'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isString()
    .withMessage('Last name must be a valid string'),

  body('gender')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be either Male, Female, or Other'),

  body('dateOfBirth')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Date of birth must be a valid ISO8601 date (YYYY-MM-DD)'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Email address must be a valid format')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone number must be exactly 10 digits'),

  body('qualification')
    .trim()
    .notEmpty()
    .withMessage('Qualification is required')
    .isString()
    .withMessage('Qualification must be a valid string'),

  body('experience')
    .notEmpty()
    .withMessage('Experience is required')
    .isNumeric()
    .withMessage('Experience must be a valid number of years'),

  body('subjects')
    .notEmpty()
    .withMessage('Subjects is required')
    .isArray()
    .withMessage('Subjects must be an array of strings')
    .custom((value) => {
      if (!Array.isArray(value) || value.length === 0 || value.every(s => !s.trim())) {
        throw new Error('At least one subject is required')
      }
      return true
    }),

  body('salary')
    .notEmpty()
    .withMessage('Salary is required')
    .isNumeric()
    .withMessage('Salary must be a valid number'),

  body('joiningDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Joining date must be a valid ISO8601 date (YYYY-MM-DD)'),

  body('address')
    .optional({ checkFalsy: true })
    .trim()
    .isString()
    .withMessage('Address must be a string'),

  body('city')
    .optional({ checkFalsy: true })
    .trim()
    .isString()
    .withMessage('City must be a string'),

  body('pincode')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9]{6}$/)
    .withMessage('Pincode must be exactly 6 digits'),

  body('bloodGroup')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Blood group must be a valid type (A+, A-, etc.)'),

  body('emergencyPhone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Emergency contact number must be exactly 10 digits'),

  body('status')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be Active or Inactive'),

  handleValidationErrors
]

// Rules for updating a teacher
const validateUpdateTeacher = [
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isString()
    .withMessage('First name must be a valid string'),

  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isString()
    .withMessage('Last name must be a valid string'),

  body('gender')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be either Male, Female, or Other'),

  body('dateOfBirth')
    .optional()
    .notEmpty()
    .withMessage('Date of birth cannot be empty')
    .isISO8601()
    .withMessage('Date of birth must be a valid ISO8601 date (YYYY-MM-DD)'),

  body('email')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Email address cannot be empty')
    .isEmail()
    .withMessage('Email address must be a valid format')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Phone number cannot be empty')
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone number must be exactly 10 digits'),

  body('qualification')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Qualification cannot be empty'),

  body('experience')
    .optional()
    .isNumeric()
    .withMessage('Experience must be a valid number of years'),

  body('subjects')
    .optional()
    .isArray()
    .withMessage('Subjects must be an array of strings'),

  body('salary')
    .optional()
    .isNumeric()
    .withMessage('Salary must be a valid number'),

  body('joiningDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Joining date must be a valid ISO8601 date (YYYY-MM-DD)'),

  body('address')
    .optional({ checkFalsy: true })
    .trim(),

  body('city')
    .optional({ checkFalsy: true })
    .trim(),

  body('pincode')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9]{6}$/)
    .withMessage('Pincode must be exactly 6 digits'),

  body('bloodGroup')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Blood group must be a valid type (A+, A-, etc.)'),

  body('emergencyPhone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Emergency contact number must be exactly 10 digits'),

  body('status')
    .optional()
    .trim()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be Active or Inactive'),

  handleValidationErrors
]

module.exports = {
  validateCreateTeacher,
  validateUpdateTeacher
}
