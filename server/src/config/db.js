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
      const Tenant = require('../models/Tenant')

      // Ensure primary default tenant exists
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
      const defaultTenantId = defaultTenant._id

      // Self-healing auto-migration for pre-migration records lacking tenantId across all core models
      const modelsToMigrate = [
        '../models/User',
        '../models/Student',
        '../models/Teacher',
        '../models/Subject',
        '../models/Resource',
        '../models/Period',
        '../models/Timetable',
        '../models/Room',
        '../models/Holiday',
        '../models/Announcement',
        '../models/Exam',
        '../models/Homework',
        '../models/FeeStructure',
        '../models/StudentFee',
        '../models/AttendanceSession',
        '../models/AttendanceRecord',
        '../models/AttendanceAuditLog',
        '../models/AttendanceSettings'
      ]
      for (const modelPath of modelsToMigrate) {
        try {
          const Model = require(modelPath)
          const res = await Model.updateMany(
            { $or: [{ tenantId: { $exists: false } }, { tenantId: null }] },
            { $set: { tenantId: defaultTenantId } }
          )
          if (res && (res.modifiedCount > 0 || res.nModified > 0)) {
            console.log(`[Auto-Migrate] Migrated ${res.modifiedCount || res.nModified} records in ${Model.modelName} to primary tenant.`)
          }
        } catch (err) {
          // Silently skip if model not yet initialized
        }
      }

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
          isActive: true,
          tenantId: defaultTenantId
        })
        console.log(`[Auto-Seed] Created admin account: ${keerthiEmail}`)
      } else {
        const salt = await bcrypt.genSalt(10)
        keerthiExists.passwordHash = await bcrypt.hash('kk123', salt)
        keerthiExists.role = 'admin'
        keerthiExists.isActive = true
        keerthiExists.tenantId = defaultTenantId
        await keerthiExists.save()
        console.log(`[Auto-Seed] Synchronized admin credentials for: ${keerthiEmail}`)
      }

      // Also ensure default admin@ckclasses.com exists with password123
      const defaultEmail = 'admin@ckclasses.com'
      const defaultExists = await User.findOne({ email: defaultEmail })
      const defaultSalt = await bcrypt.genSalt(10)
      const defaultHash = await bcrypt.hash('password123', defaultSalt)
      if (!defaultExists) {
        await User.create({
          email: defaultEmail,
          passwordHash: defaultHash,
          role: 'admin',
          firstName: 'Chirayu',
          lastName: 'Poddar',
          isActive: true,
          tenantId: defaultTenantId
        })
        console.log(`[Auto-Seed] Created default admin account: ${defaultEmail}`)
      } else {
        defaultExists.passwordHash = defaultHash
        defaultExists.isActive = true
        defaultExists.role = 'admin'
        defaultExists.tenantId = defaultTenantId
        await defaultExists.save()
        console.log(`[Auto-Seed] Synchronized default admin credentials for: ${defaultEmail}`)
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
