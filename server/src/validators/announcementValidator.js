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

const validateCreateAnnouncement = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),

  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required'),

  body('shortDescription')
    .optional()
    .trim()
    .isLength({ max: 250 })
    .withMessage('Short description cannot exceed 250 characters'),

  body('audience')
    .isArray({ min: 1 })
    .withMessage('At least one target audience is required')
    .custom((value, { req }) => {
      const validAudiences = [
        'Entire Institute', 
        'Specific Class', 
        'Specific Subject', 
        'Teachers Only', 
        'Students Only', 
        'Parents Only', 
        'Admin Only'
      ]
      const hasInvalid = value.some(aud => !validAudiences.includes(aud))
      if (hasInvalid) {
        throw new Error('Invalid audience option specified')
      }

      const hasClass = value.includes('Specific Class')
      const hasSubject = value.includes('Specific Subject')

      // Specific Class rule: class required
      if (hasClass && !req.body.class) {
        throw new Error('Class grade selection is required for Specific Class target')
      }

      // Specific Subject rule: class required, subject required
      if (hasSubject) {
        if (!req.body.class) {
          throw new Error('Class grade selection is required for Specific Subject target')
        }
        if (!req.body.subject) {
          throw new Error('Subject is required for Specific Subject target')
        }
      }

      // Automatically clear class/subject if not targeted
      if (!hasClass && !hasSubject) {
        req.body.class = ''
        req.body.subject = null
      } else if (hasClass && !hasSubject) {
        req.body.subject = null
      }

      return true
    }),

  body('class')
    .optional()
    .trim(),

  body('subject')
    .optional()
    .trim()
    .custom((value) => {
      if (value && value !== 'null' && value !== '') {
        const mongoose = require('mongoose')
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Subject must be a valid ObjectId')
        }
      }
      return true
    }),

  body('publishMode')
    .notEmpty()
    .withMessage('Publishing mode is required')
    .isIn(['instant', 'scheduled'])
    .withMessage('Publishing mode must be instant or scheduled'),

  body('publishAt')
    .custom((value, { req }) => {
      if (req.body.publishMode === 'scheduled') {
        if (!value) {
          throw new Error('Publish date is required for scheduled announcements')
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

  handleValidationErrors
]

const validateUpdateAnnouncement = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),

  body('message')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Message cannot be empty'),

  body('shortDescription')
    .optional()
    .trim()
    .isLength({ max: 250 })
    .withMessage('Short description cannot exceed 250 characters'),

  body('audience')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one target audience is required')
    .custom((value, { req }) => {
      const validAudiences = [
        'Entire Institute', 
        'Specific Class', 
        'Specific Subject', 
        'Teachers Only', 
        'Students Only', 
        'Parents Only', 
        'Admin Only'
      ]
      const hasInvalid = value.some(aud => !validAudiences.includes(aud))
      if (hasInvalid) {
        throw new Error('Invalid audience option specified')
      }

      const hasClass = value.includes('Specific Class')
      const hasSubject = value.includes('Specific Subject')

      // Specific Class rule: class required
      if (hasClass && !req.body.class) {
        throw new Error('Class grade selection is required for Specific Class target')
      }

      // Specific Subject rule: class required, subject required
      if (hasSubject) {
        if (!req.body.class) {
          throw new Error('Class grade selection is required for Specific Subject target')
        }
        if (!req.body.subject) {
          throw new Error('Subject is required for Specific Subject target')
        }
      }

      // Automatically clear class/subject if not targeted
      if (!hasClass && !hasSubject) {
        req.body.class = ''
        req.body.subject = null
      } else if (hasClass && !hasSubject) {
        req.body.subject = null
      }

      return true
    }),

  body('class')
    .optional()
    .trim(),

  body('subject')
    .optional()
    .trim()
    .custom((value) => {
      if (value && value !== 'null' && value !== '') {
        const mongoose = require('mongoose')
        if (!mongoose.Types.ObjectId.isValid(value)) {
          throw new Error('Subject must be a valid ObjectId')
        }
      }
      return true
    }),

  body('publishMode')
    .optional()
    .isIn(['instant', 'scheduled'])
    .withMessage('Publishing mode must be instant or scheduled'),

  body('publishAt')
    .custom(async (value, { req }) => {
      const Announcement = require('../models/Announcement')
      const existing = await Announcement.findById(req.params.id)
      if (existing) {
        if (existing.status === 'Published') {
          if (req.body.publishMode && req.body.publishMode !== 'instant') {
            throw new Error('Published announcements cannot be rescheduled')
          }
          if (value) {
            const oldTime = new Date(existing.publishAt).getTime()
            const newTime = new Date(value).getTime()
            if (oldTime !== newTime) {
              throw new Error('Published announcements cannot be rescheduled')
            }
          }
        } else {
          if (req.body.publishMode === 'scheduled') {
            if (!value) {
              throw new Error('Publish date is required for scheduled announcements')
            }
            if (new Date(value) < new Date(Date.now() - 60000)) {
              throw new Error('Publish date cannot be in the past')
            }
          }
        }
      }
      return true
    }),

  handleValidationErrors
]

module.exports = {
  validateCreateAnnouncement,
  validateUpdateAnnouncement
}
