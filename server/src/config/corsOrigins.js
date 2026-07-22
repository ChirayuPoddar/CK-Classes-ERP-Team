/**
 * Single source of truth for CORS allowed origins (used by Express & Socket.IO)
 */
const getAllowedOrigins = () => {
  if (process.env.CLIENT_URL) {
    return process.env.CLIENT_URL.split(',').map((o) => o.trim()).filter(Boolean)
  }
  if (process.env.NODE_ENV === 'production') {
    return [] // strictly require CLIENT_URL in production
  }
  return [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://localhost:5050'
  ]
}

module.exports = { getAllowedOrigins }
