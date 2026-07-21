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

const validateCreateSubject = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Subject name is required')
    .isString()
    .withMessage('Subject name must be a valid string'),

  body('code')
    .trim()
    .notEmpty()
    .withMessage('Subject code is required')
    .isString()
    .withMessage('Subject code must be a valid string'),

  body('class')
    .trim()
    .notEmpty()
    .withMessage('Class selection is required')
    .isString()
    .withMessage('Class must be a valid string'),

  body('assignedTeacher')
    .trim()
    .notEmpty()
    .withMessage('Assigned teacher is required')
    .isMongoId()
    .withMessage('Assigned teacher must be a valid Mongo ID'),

  body('periodsPerWeek')
    .notEmpty()
    .withMessage('Weekly periods is required')
    .isInt({ min: 1 })
    .withMessage('Weekly periods must be a positive integer'),

  body('color')
    .optional({ checkFalsy: true })
    .trim()
    .isHexColor()
    .withMessage('Color must be a valid Hex color code'),

  body('description')
    .optional({ checkFalsy: true })
    .trim(),

  body('status')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be either Active or Inactive'),

  handleValidationErrors
]

const validateUpdateSubject = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Subject name cannot be empty')
    .isString()
    .withMessage('Subject name must be a valid string'),

  body('code')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Subject code cannot be empty')
    .isString()
    .withMessage('Subject code must be a valid string'),

  body('class')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Class cannot be empty')
    .isString()
    .withMessage('Class must be a valid string'),

  body('assignedTeacher')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Assigned teacher cannot be empty')
    .isMongoId()
    .withMessage('Assigned teacher must be a valid Mongo ID'),

  body('periodsPerWeek')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Weekly periods must be a positive integer'),

  body('color')
    .optional()
    .trim()
    .isHexColor()
    .withMessage('Color must be a valid Hex color code'),

  body('description')
    .optional()
    .trim(),

  body('status')
    .optional()
    .trim()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be either Active or Inactive'),

  handleValidationErrors
]

module.exports = {
  validateCreateSubject,
  validateUpdateSubject
}
