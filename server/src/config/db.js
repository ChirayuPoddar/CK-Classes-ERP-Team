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
      const Tenant = require('../models/Tenant')

      // Ensure primary default tenant exists (one-time bootstrap)
      let defaultTenant = await Tenant.findOne({ slug: 'ck-classes-main' })
      if (!defaultTenant) {
        defaultTenant = await Tenant.create({
          name: 'C.K. Classes Primary',
          slug: 'ck-classes-main',
          contactEmail: 'admin@ckclasses.com',
          isActive: true,
          subscriptionStatus: 'active'
        })
        console.log(`[Auto-Seed] Created primary default tenant: C.K. Classes Primary (${defaultTenant._id})`)
      }
    } catch (seedErr) {
      console.error(`[Auto-Seed Warning] Could not check or create bootstrap tenant: ${seedErr.message}`)
    }
  } catch (error) {
    console.error(`[Database Error] MongoDB Connection Error: ${error.message}`)
    process.exit(1)
  }
}

module.exports = connectDB
