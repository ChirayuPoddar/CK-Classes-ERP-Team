const { body, validationResult } = require('express-validator')

// Helper middleware to handle and format express-validator validation results
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

// Validation rules for creating a student
const validateCreateStudent = [
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

  body('state')
    .optional({ checkFalsy: true })
    .trim()
    .isString()
    .withMessage('State must be a string'),

  body('country')
    .optional({ checkFalsy: true })
    .trim()
    .isString()
    .withMessage('Country must be a string'),

  body('pincode')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9]{6}$/)
    .withMessage('Pincode must be exactly 6 digits'),

  body('bloodGroup')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Blood group must be a valid option (A+, A-, B+, B-, AB+, AB-, O+, O-)'),

  body('emergencyContact.name')
    .optional({ checkFalsy: true })
    .trim()
    .isString()
    .withMessage('Emergency contact name must be a string'),

  body('emergencyContact.phone')
    .optional({ checkFalsy: true })
    .trim()
    .isString()
    .withMessage('Emergency contact phone must be a string'),

  body('emergencyContact.relation')
    .optional({ checkFalsy: true })
    .trim()
    .isString()
    .withMessage('Emergency contact relation must be a string'),

  body('class')
    .trim()
    .notEmpty()
    .withMessage('Class is required')
    .isIn([
      'Nursery', 'LKG', 'UKG',
      'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
      'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
      'Class 11 Science', 'Class 11 Commerce',
      'Class 12 Science', 'Class 12 Commerce'
    ])
    .withMessage('Invalid class selection'),

  body('admissionDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Admission date must be a valid ISO8601 date'),

  body('status')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['Active', 'Inactive', 'Graduated'])
    .withMessage('Status must be either Active, Inactive, or Graduated'),

  body('middleName').optional({ checkFalsy: true }).trim(),
  body('parentPhone').optional({ checkFalsy: true }).trim(),
  body('category').optional({ checkFalsy: true }).trim(),
  body('religion').optional({ checkFalsy: true }).trim(),
  body('fatherName').optional({ checkFalsy: true }).trim(),
  body('motherName').optional({ checkFalsy: true }).trim(),
  body('occupation').optional({ checkFalsy: true }).trim(),

  handleValidationErrors
]

// Validation rules for updating a student
const validateUpdateStudent = [
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
    .optional()
    .trim()
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be either Male, Female, or Other'),

  body('dateOfBirth')
    .optional()
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

  body('address')
    .optional()
    .trim()
    .isString()
    .withMessage('Address must be a string'),

  body('city')
    .optional()
    .trim()
    .isString()
    .withMessage('City must be a string'),

  body('state')
    .optional()
    .trim()
    .isString()
    .withMessage('State must be a string'),

  body('country')
    .optional()
    .trim()
    .isString()
    .withMessage('Country must be a string'),

  body('pincode')
    .optional()
    .trim()
    .matches(/^[0-9]{6}$/)
    .withMessage('Pincode must be exactly 6 digits'),

  body('bloodGroup')
    .optional()
    .trim()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Blood group must be a valid option (A+, A-, B+, B-, AB+, AB-, O+, O-)'),

  body('emergencyContact.name')
    .optional()
    .trim()
    .isString()
    .withMessage('Emergency contact name must be a string'),

  body('emergencyContact.phone')
    .optional()
    .trim()
    .isString()
    .withMessage('Emergency contact phone must be a string'),

  body('emergencyContact.relation')
    .optional()
    .trim()
    .isString()
    .withMessage('Emergency contact relation must be a string'),

  body('class')
    .optional()
    .trim()
    .isIn([
      'Nursery', 'LKG', 'UKG',
      'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
      'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
      'Class 11 Science', 'Class 11 Commerce',
      'Class 12 Science', 'Class 12 Commerce'
    ])
    .withMessage('Invalid class selection'),

  body('admissionDate')
    .optional()
    .isISO8601()
    .withMessage('Admission date must be a valid ISO8601 date'),

  body('status')
    .optional()
    .trim()
    .isIn(['Active', 'Inactive', 'Graduated'])
    .withMessage('Status must be either Active, Inactive, or Graduated'),

  body('middleName').optional({ checkFalsy: true }).trim(),
  body('parentPhone').optional({ checkFalsy: true }).trim(),
  body('category').optional({ checkFalsy: true }).trim(),
  body('religion').optional({ checkFalsy: true }).trim(),
  body('fatherName').optional({ checkFalsy: true }).trim(),
  body('motherName').optional({ checkFalsy: true }).trim(),
  body('occupation').optional({ checkFalsy: true }).trim(),

  handleValidationErrors
]

module.exports = {
  validateCreateStudent,
  validateUpdateStudent
}
