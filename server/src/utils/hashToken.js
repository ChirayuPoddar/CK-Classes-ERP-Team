const crypto = require('crypto')

/**
 * Creates a deterministic SHA-256 hash of a raw token string
 */
const hashToken = (token) => {
  if (!token || typeof token !== 'string') return ''
  return crypto.createHash('sha256').update(token).digest('hex')
}

module.exports = { hashToken }
