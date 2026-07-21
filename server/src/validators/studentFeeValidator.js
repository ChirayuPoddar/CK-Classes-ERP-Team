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

const validateCreateStudentFee = [
  body('student')
    .trim()
    .notEmpty()
    .withMessage('Student ID is required')
    .isMongoId()
    .withMessage('Student ID must be a valid MongoDB ObjectId'),

  body('feeStructure')
    .trim()
    .notEmpty()
    .withMessage('Fee structure ID is required')
    .isMongoId()
    .withMessage('Fee structure ID must be a valid MongoDB ObjectId'),

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

  body('totalFee')
    .notEmpty()
    .withMessage('Total fee is required')
    .isFloat({ min: 0 })
    .withMessage('Total fee must be a number greater than or equal to 0'),

  body('dueDate')
    .notEmpty()
    .withMessage('Due date is required')
    .isISO8601()
    .withMessage('Due date must be a valid date string'),

  body('paidAmount')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Paid amount must be a number greater than or equal to 0'),

  handleValidationErrors
]

const validateUpdateStudentFee = [
  body('student')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Student ID must be a valid MongoDB ObjectId'),

  body('feeStructure')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Fee structure ID must be a valid MongoDB ObjectId'),

  body('tuitionFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tuition fee must be a number greater than or equal to 0'),

  body('transportFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Transport fee must be a number greater than or equal to 0'),

  body('totalFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total fee must be a number greater than or equal to 0'),

  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date string'),

  body('paidAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Paid amount must be a number greater than or equal to 0'),

  handleValidationErrors
]

const validateRecordPayment = [
  body('amount')
    .notEmpty()
    .withMessage('Payment amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Payment amount must be a positive number greater than 0'),

  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['Cash', 'UPI', 'Cheque', 'Bank Transfer'])
    .withMessage('Payment method must be one of Cash, UPI, Cheque, or Bank Transfer'),

  body('remarks')
    .optional({ checkFalsy: true })
    .trim()
    .isString()
    .withMessage('Remarks must be a valid string'),

  handleValidationErrors
]

module.exports = {
  validateCreateStudentFee,
  validateUpdateStudentFee,
  validateRecordPayment
}
