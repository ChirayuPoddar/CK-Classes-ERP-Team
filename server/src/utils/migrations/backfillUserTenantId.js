const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') })
const mongoose = require('mongoose')
const User = require('../../models/User')
const Tenant = require('../../models/Tenant')

const backfillUserTenantId = async () => {
  const uri = process.env.MONGO_URI ? process.env.MONGO_URI.trim() : null

  if (!uri) {
    console.error('[Migration Error] MONGO_URI is not defined.')
    process.exit(1)
  }

  try {
    await mongoose.connect(uri, { dbName: 'ck_classes' })
    console.log('[Migration] Connected to MongoDB')

    // Find the primary bootstrap tenant (slug: 'ck-classes-main') created by db.js
    const bootstrapTenant = await Tenant.findOne({ slug: 'ck-classes-main' })
    if (!bootstrapTenant) {
      console.error('[Migration Error] Primary bootstrap tenant (ck-classes-main) not found. Please start server or create bootstrap tenant first.')
      process.exit(1)
    }

    const tenantId = bootstrapTenant._id
    console.log(`[Migration] Found bootstrap tenant: ${bootstrapTenant.name} (${tenantId})`)

    // Backfill all User documents missing tenantId
    const res = await User.updateMany(
      { $or: [{ tenantId: { $exists: false } }, { tenantId: null }] },
      { $set: { tenantId } }
    )

    const count = res.modifiedCount !== undefined ? res.modifiedCount : (res.nModified || 0)
    console.log(`[Migration Result] Updated ${count} User document(s) with tenantId ${tenantId}.`)

    await mongoose.disconnect()
    console.log('[Migration] Disconnected from MongoDB')
    process.exit(0)
  } catch (error) {
    console.error(`[Migration Error] ${error.message}`)
    process.exit(1)
  }
}

if (require.main === module) {
  backfillUserTenantId()
}

module.exports = backfillUserTenantId
