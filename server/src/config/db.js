const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const mongoose = require('mongoose')

const connectDB = async () => {
  const uri = process.env.MONGO_URI ? process.env.MONGO_URI.trim() : null

  if (!uri) {
    console.error('[Database Error] MongoDB configuration missing: MONGO_URI is not defined.')
    process.exit(1)
  }

  try {
    const conn = await mongoose.connect(uri, { dbName: 'ck_classes' })
    const isAtlas = conn.connection.host.includes('mongodb.net') || conn.connection.host.includes('atlas') || uri.startsWith('mongodb+srv://')
    const connType = isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'

    console.log('[Database] MongoDB connected successfully')
    console.log(`[Database] Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`[Database] Host: ${conn.connection.host}`)
    console.log(`[Database] Database: ${conn.connection.name}`)
    console.log(`[Database] Connection type: ${connType}`)
  } catch (error) {
    console.error(`[Database Error] MongoDB Connection Error: ${error.message}`)
    process.exit(1)
  }
}

module.exports = connectDB
