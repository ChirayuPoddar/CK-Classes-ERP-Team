const ApiError = require('../utils/ApiError')

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500
  let message = err.message || 'Internal Server Error'
  let code = err.code || (statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR')
  let field = err.field || null

  // 1. Handle Mongo Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    statusCode = 409
    const keyPattern = Object.keys(err.keyPattern || err.keyValue || {})[0] || ''
    if (keyPattern === 'email' || (err.errmsg && err.errmsg.includes('email'))) {
      field = 'email'
      code = 'EMAIL_ALREADY_EXISTS'
      message = 'An account with this email address already exists.'
    } else if (keyPattern === 'phone' || (err.errmsg && err.errmsg.includes('phone'))) {
      field = 'phone'
      code = 'PHONE_ALREADY_EXISTS'
      message = 'An account with this phone number already exists.'
    } else {
      field = keyPattern || 'record'
      code = 'DUPLICATE_RECORD'
      message = `A record with this ${field} already exists.`
    }
  }

  // 2. Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 422
    code = 'VALIDATION_ERROR'
    message = Object.values(err.errors).map(val => val.message).join(', ')
  }

  // 3. Handle Mongoose CastError (invalid ObjectId format)
  if (err.name === 'CastError') {
    statusCode = 400
    code = 'INVALID_ID'
    field = err.path
    message = `Invalid ID format for field '${err.path}'.`
  }

  // Log non-operational internal 500 server errors only
  if (statusCode === 500) {
    console.error(`[Internal 500 Error] ${req.method} ${req.originalUrl}:`, err)
  }

  res.status(statusCode).json({
    success: false,
    code,
    message,
    error: {
      message,
      code,
      field,
      details: err.details || null,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack
    }
  })
}

module.exports = errorHandler
