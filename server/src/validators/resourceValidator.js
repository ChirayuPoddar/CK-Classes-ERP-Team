const { body, validationResult } = require('express-validator')

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const errorMap = {}
    errors.array().forEach(err => {
      errorMap[err.path || err.param] = err.msg
    })
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMap
    })
  }
  next()
}

const categories = [
  'Notes', 'Assignments', 'Question Papers', 'Sample Papers', 'Books',
  'Reference Books', 'Practice Sheets', 'Worksheets', 'Lab Manuals',
  'Presentations', 'Videos', 'Recorded Lectures', 'Important Documents',
  'Circulars', 'Others'
]

const visibilities = [
  'Entire Institute', 'Specific Class', 'Specific Subject', 'Teachers Only'
]

const validateCreateResource = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),

  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .trim()
    .isIn(categories)
    .withMessage('Invalid category option'),

  body('visibility')
    .notEmpty()
    .withMessage('Visibility target is required')
    .isIn(visibilities)
    .withMessage('Invalid visibility target'),

  body('class')
    .custom((value, { req }) => {
      const vis = req.body.visibility
      if ((vis === 'Specific Class' || vis === 'Specific Subject') && !value) {
        throw new Error('Class grade selection is required')
      }
      return true
    })
    .trim(),

  body('subject')
    .custom((value, { req }) => {
      const vis = req.body.visibility
      if (vis === 'Specific Subject') {
        if (!value) {
          throw new Error('Subject is required')
        }
        const mongoose = require('mongoose')
        if (value !== 'null' && value !== '' && !mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Subject must be a valid ObjectId')
        }
      }
      return true
    })
    .trim(),

  body('publishMode')
    .notEmpty()
    .withMessage('Publishing mode is required')
    .isIn(['instant', 'scheduled'])
    .withMessage('Publishing mode must be instant or scheduled'),

  body('publishAt')
    .custom((value, { req }) => {
      if (req.body.publishMode === 'scheduled') {
        if (!value) {
          throw new Error('Publish date is required for scheduled resources')
        }
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) && isNaN(Date.parse(value))) {
          throw new Error('Publish date must be a valid date string')
        }
        if (new Date(value) < new Date(Date.now() - 60000)) {
          throw new Error('Publish date cannot be in the past')
        }
      }
      return true
    }),

  body('externalUrl')
    .optional({ checkFalsy: true })
    .trim(),

  handleValidationErrors
]

const validateUpdateResource = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),

  body('category')
    .optional()
    .trim()
    .isIn(categories)
    .withMessage('Invalid category option'),

  body('visibility')
    .optional()
    .isIn(visibilities)
    .withMessage('Invalid visibility target'),

  body('class')
    .custom((value, { req }) => {
      const vis = req.body.visibility
      if ((vis === 'Specific Class' || vis === 'Specific Subject') && !value) {
        throw new Error('Class grade selection is required')
      }
      return true
    })
    .trim(),

  body('subject')
    .custom((value, { req }) => {
      const vis = req.body.visibility
      if (vis === 'Specific Subject') {
        if (!value) {
          throw new Error('Subject is required')
        }
        const mongoose = require('mongoose')
        if (value !== 'null' && value !== '' && !mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Subject must be a valid ObjectId')
        }
      }
      return true
    })
    .trim(),

  body('publishMode')
    .optional()
    .isIn(['instant', 'scheduled'])
    .withMessage('Publishing mode must be instant or scheduled'),

  body('publishAt')
    .custom(async (value, { req }) => {
      const Resource = require('../models/Resource')
      const existing = await Resource.findById(req.params.id)
      if (existing) {
        if (existing.status === 'Published') {
          if (req.body.publishMode && req.body.publishMode !== 'instant') {
            throw new Error('Published resources cannot be rescheduled')
          }
          if (value) {
            const oldTime = new Date(existing.publishAt).getTime()
            const newTime = new Date(value).getTime()
            if (oldTime !== newTime) {
              throw new Error('Published resources cannot be rescheduled')
            }
          }
        } else {
          if (req.body.publishMode === 'scheduled') {
            if (!value) {
              throw new Error('Publish date is required for scheduled resources')
            }
            if (new Date(value) < new Date(Date.now() - 60000)) {
              throw new Error('Publish date cannot be in the past')
            }
          }
        }
      }
      return true
    }),

  body('externalUrl')
    .optional({ checkFalsy: true })
    .trim(),

  handleValidationErrors
]

module.exports = {
  validateCreateResource,
  validateUpdateResource
}
