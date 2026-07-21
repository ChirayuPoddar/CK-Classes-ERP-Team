const { body, validationResult } = require('express-validator')

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

const validateCreateFeeStructure = [
  body('course')
    .trim()
    .notEmpty()
    .withMessage('Course is required')
    .isString()
    .withMessage('Course must be a valid string'),

  body('academicYear')
    .trim()
    .notEmpty()
    .withMessage('Academic year is required')
    .isString()
    .withMessage('Academic year must be a valid string'),

  body('tuitionFee')
    .notEmpty()
    .withMessage('Tuition fee is required')
    .isFloat({ min: 0 })
    .withMessage('Tuition fee must be a number greater than or equal to 0'),

  body('transportFee')
    .notEmpty()
    .withMessage('Transport fee is required')
    .isFloat({ min: 0 })
    .withMessage('Transport fee must be a number greater than or equal to 0'),

  body('status')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be either Active or Inactive'),

  handleValidationErrors
]

const validateUpdateFeeStructure = [
  body('course')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Course cannot be empty')
    .isString()
    .withMessage('Course must be a valid string'),

  body('academicYear')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Academic year cannot be empty')
    .isString()
    .withMessage('Academic year must be a valid string'),

  body('tuitionFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tuition fee must be a number greater than or equal to 0'),

  body('transportFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Transport fee must be a number greater than or equal to 0'),

  body('status')
    .optional()
    .trim()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be either Active or Inactive'),

  handleValidationErrors
]

module.exports = {
  validateCreateFeeStructure,
  validateUpdateFeeStructure
}
