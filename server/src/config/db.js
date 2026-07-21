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

    try {
      const bcrypt = require('bcryptjs')
      const User = require('../models/User')

      // Auto-seed Keerthi Admin
      const keerthiEmail = 'keerthi@ckclasses.com'
      const keerthiExists = await User.findOne({ email: keerthiEmail })
      if (!keerthiExists) {
        const salt = await bcrypt.genSalt(10)
        const passwordHash = await bcrypt.hash('kk123', salt)
        await User.create({
          email: keerthiEmail,
          passwordHash,
          role: 'admin',
          firstName: 'Keerthi',
          lastName: 'Kumar',
          isActive: true
        })
        console.log(`[Auto-Seed] Created admin account: ${keerthiEmail}`)
      } else {
        const salt = await bcrypt.genSalt(10)
        keerthiExists.passwordHash = await bcrypt.hash('kk123', salt)
        keerthiExists.role = 'admin'
        keerthiExists.isActive = true
        await keerthiExists.save()
        console.log(`[Auto-Seed] Synchronized admin credentials for: ${keerthiEmail}`)
      }

      // Also ensure default admin@ckclasses.com exists with password123
      const defaultEmail = 'admin@ckclasses.com'
      const defaultExists = await User.findOne({ email: defaultEmail })
      if (!defaultExists) {
        const salt = await bcrypt.genSalt(10)
        const passwordHash = await bcrypt.hash('password123', salt)
        await User.create({
          email: defaultEmail,
          passwordHash,
          role: 'admin',
          firstName: 'Chirayu',
          lastName: 'Poddar',
          isActive: true
        })
        console.log(`[Auto-Seed] Created default admin account: ${defaultEmail}`)
      }
    } catch (seedErr) {
      console.error(`[Auto-Seed Warning] Could not seed admin users: ${seedErr.message}`)
    }
  } catch (error) {
    console.error(`[Database Error] MongoDB Connection Error: ${error.message}`)
    process.exit(1)
  }
}

module.exports = connectDB
