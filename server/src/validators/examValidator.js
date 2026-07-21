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

// Convert helper to safely strip leading zeros and cast to positive integer
const cleanPositiveInteger = (value) => {
  if (value === undefined || value === null) return 0
  const cleanStr = String(value).trim().replace(/^0+/, '')
  if (cleanStr === '') return 0
  const parsed = parseInt(cleanStr, 10)
  return isNaN(parsed) || parsed < 0 ? 0 : parsed
}

const validateCreateExam = [
  body('examName')
    .trim()
    .notEmpty()
    .withMessage('Exam name is required'),
  body('academicYear')
    .trim()
    .notEmpty()
    .withMessage('Academic year is required'),
  body('class')
    .trim()
    .notEmpty()
    .withMessage('Class selection is required'),
  body('subjectId')
    .isMongoId()
    .withMessage('A valid Subject is required'),
  body('examDate')
    .isISO8601()
    .withMessage('Exam date must be a valid date'),
  body('startTime')
    .trim()
    .notEmpty()
    .withMessage('Start time is required'),
  body('endTime')
    .trim()
    .notEmpty()
    .withMessage('End time is required'),
  body('maxMarks')
    .customSanitizer(cleanPositiveInteger)
    .custom((value) => {
      if (value <= 0) {
        throw new Error('Maximum marks must be a positive integer greater than 0')
      }
      return true
    }),
  body('passingMarks')
    .customSanitizer(cleanPositiveInteger)
    .custom((value, { req }) => {
      const maxMarks = req.body.maxMarks || 0
      if (value < 0) {
        throw new Error('Passing marks cannot be negative')
      }
      if (value > maxMarks) {
        throw new Error('Passing marks cannot exceed maximum marks')
      }
      return true
    }),
  body('instructions')
    .optional()
    .trim(),
  body('status')
    .optional()
    .isIn(['Scheduled'])
    .withMessage('Initial status must be Scheduled'),
  handleValidationErrors
]

const validateUpdateExam = [
  body('examName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Exam name cannot be empty'),
  body('academicYear')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Academic year cannot be empty'),
  body('class')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Class selection cannot be empty'),
  body('subjectId')
    .optional()
    .isMongoId()
    .withMessage('A valid Subject is required'),
  body('examDate')
    .optional()
    .isISO8601()
    .withMessage('Exam date must be a valid date'),
  body('startTime')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Start time is required'),
  body('endTime')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('End time is required'),
  body('maxMarks')
    .optional()
    .customSanitizer(cleanPositiveInteger)
    .custom((value) => {
      if (value <= 0) {
        throw new Error('Maximum marks must be a positive integer greater than 0')
      }
      return true
    }),
  body('passingMarks')
    .optional()
    .customSanitizer(cleanPositiveInteger)
    .custom((value, { req }) => {
      const maxMarks = req.body.maxMarks
      if (value < 0) {
        throw new Error('Passing marks cannot be negative')
      }
      if (maxMarks !== undefined && value > maxMarks) {
        throw new Error('Passing marks cannot exceed maximum marks')
      }
      return true
    }),
  body('instructions')
    .optional()
    .trim(),
  body('status')
    .optional()
    .isIn(['Scheduled', 'Active', 'Completed', 'Published'])
    .withMessage('Invalid status selected'),
  handleValidationErrors
]

module.exports = {
  validateCreateExam,
  validateUpdateExam
}
