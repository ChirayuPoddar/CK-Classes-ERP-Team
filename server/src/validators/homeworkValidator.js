const { body, validationResult } = require('express-validator')

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    const errorMap = {}
    errors.array().forEach(err => {
      const fieldName = err.path || err.param
      errorMap[fieldName] = err.msg
    })
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: errorMap
    })
  }
  
  next()
}

const validateCreateHomework = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),

  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject ID is required')
    .isMongoId()
    .withMessage('Subject ID must be a valid MongoDB ObjectId'),

  body('class')
    .trim()
    .notEmpty()
    .withMessage('Class selection is required'),

  body('dueDate')
    .notEmpty()
    .withMessage('Due date is required')
    .isISO8601()
    .withMessage('Due date must be a valid date string')
    .custom((value) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const inputDate = new Date(value)
      if (inputDate < today) {
        throw new Error('Due date cannot be in the past')
      }
      return true
    }),

  body('status')
    .optional()
    .isIn(['Pending', 'Completed', 'Overdue'])
    .withMessage('Status must be one of Pending, Completed, or Overdue'),

  body('teacher')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Teacher ID must be a valid MongoDB ObjectId'),

  body('attachment')
    .optional(),

  handleValidationErrors
]

const validateUpdateHomework = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty'),

  body('subject')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Subject ID must be a valid MongoDB ObjectId'),

  body('class')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Class selection cannot be empty'),

  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date string')
    .custom((value) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const inputDate = new Date(value)
      if (inputDate < today) {
        throw new Error('Due date cannot be in the past')
      }
      return true
    }),

  body('status')
    .optional()
    .isIn(['Pending', 'Completed', 'Overdue'])
    .withMessage('Status must be one of Pending, Completed, or Overdue'),

  body('teacher')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Teacher ID must be a valid MongoDB ObjectId'),

  body('attachment')
    .optional(),

  handleValidationErrors
]

module.exports = {
  validateCreateHomework,
  validateUpdateHomework
}
