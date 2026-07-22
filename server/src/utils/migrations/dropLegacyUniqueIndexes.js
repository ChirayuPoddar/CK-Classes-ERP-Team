/**
 * Migration Script: Drop Legacy Global Unique Indexes
 * 
 * Purpose:
 * Prior to Phase 1.5, `students` and `teachers` collections had global unique indexes on fields
 * like `studentId_1`, `teacherId_1`, `email_1`, and `phone_1`.
 * In Phase 1.5 / Phase 3 multi-tenant migration, these identifiers were converted to compound
 * unique indexes scoped by `tenantId` (`{ tenantId: 1, studentId: 1 }`, etc.).
 * Mongoose `syncIndexes()` does not automatically drop old legacy unique indexes from MongoDB collections.
 * This script idempotently inspects existing indexes and drops the legacy global unique indexes so that
 * different institutions can use colliding student IDs / teacher IDs without hitting E11000 duplicate key errors.
 */

const mongoose = require('mongoose')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') })

const dropLegacyUniqueIndexes = async () => {
  const uri = process.env.MONGO_URI ? process.env.MONGO_URI.trim() : null
  if (!uri) {
    console.error('[-] MONGO_URI is not set.')
    process.exit(1)
  }

  await mongoose.connect(uri, { dbName: 'ck_classes' })
  console.log('[+] Connected to MongoDB Atlas cluster:', uri.split('@')[1] || 'Cluster')

  const collectionsToClean = [
    {
      collectionName: 'students',
      indexesToDrop: ['studentId_1', 'email_1', 'phone_1']
    },
    {
      collectionName: 'teachers',
      indexesToDrop: ['teacherId_1', 'email_1', 'phone_1']
    }
  ]

  for (const item of collectionsToClean) {
    const coll = mongoose.connection.collection(item.collectionName)
    let existingIndexes = []
    try {
      existingIndexes = await coll.indexes()
    } catch (err) {
      console.warn(`[!] Could not fetch indexes for collection "${item.collectionName}":`, err.message)
      continue
    }

    const existingIndexNames = existingIndexes.map(idx => idx.name)
    console.log(`\n[*] Inspecting indexes on "${item.collectionName}":`, existingIndexNames)

    for (const indexName of item.indexesToDrop) {
      if (existingIndexNames.includes(indexName)) {
        console.log(`    -> Dropping legacy index "${indexName}" on "${item.collectionName}"...`)
        try {
          await coll.dropIndex(indexName)
          console.log(`    ✔ Successfully dropped "${indexName}"`)
        } catch (err) {
          console.error(`    ✖ Failed to drop index "${indexName}":`, err.message)
        }
      } else {
        console.log(`    ✔ Index "${indexName}" on "${item.collectionName}" is already absent (no action required)`)
      }
    }
  }

  await mongoose.disconnect()
  console.log('\n[+] Legacy global unique index cleanup check complete.')
}

if (require.main === module) {
  dropLegacyUniqueIndexes().catch(err => {
    console.error('Fatal error during index cleanup:', err)
    process.exit(1)
  })
}

module.exports = dropLegacyUniqueIndexes
