const mongoose = require('mongoose')
require('dotenv').config()

// Import models
const Tenant = require('./src/models/Tenant')
const Student = require('./src/models/Student')

// Import services
const StudentService = require('./src/services/StudentService')

const MONGO_URI = process.env.MONGO_URI

async function runLeakageTest() {
  console.log('[Test] Connecting to MongoDB...')
  
  const parsedUri = new URL(MONGO_URI);
  const targetHost = parsedUri.host;
  let targetDbName = 'ck_classes'; // Explicitly set as in db.js

  console.log(`[Target] Connection: ${parsedUri.protocol}//${targetHost}/${targetDbName}`);

  await mongoose.connect(MONGO_URI, { dbName: targetDbName })
  console.log('[Test] Connected to MongoDB.')

  try {
    console.log(`[Setup] Fetching real tenants from the live database...`)
    const tenantA = await Tenant.findOne({ slug: 'ck-classes-main' })
    const tenantB = await Tenant.findOne({ slug: 'modern-school' })

    if (!tenantA || !tenantB) {
      throw new Error('Could not find both ck-classes-main and modern-school tenants in the database. Ensure they exist.')
    }

    const tenantAId = tenantA._id
    const tenantBId = tenantB._id

    const userContextA = { role: 'admin', tenantId: tenantAId }
    const userContextB = { role: 'admin', tenantId: tenantBId }

    console.log('\n--- Running Live Cross-Tenant Isolation Verification ---')

    // 1. Check Student isolation for Tenant A
    const studentsA = await StudentService.getAllStudents({ tenantId: tenantAId }, userContextA)
    const stuListA = studentsA.students || []
    if (stuListA.some(s => s.tenantId.toString() !== tenantAId.toString())) {
      throw new Error('FAIL: StudentService leaked Tenant B students into Tenant A query!')
    }
    console.log(`✔ StudentService check passed: Tenant A (${tenantA.slug}) sees only its ${stuListA.length} student(s), 0 from Tenant B.`)

    // 2. Check Student isolation for Tenant B
    const studentsB = await StudentService.getAllStudents({ tenantId: tenantBId }, userContextB)
    const stuListB = studentsB.students || []
    if (stuListB.some(s => s.tenantId.toString() !== tenantBId.toString())) {
      throw new Error('FAIL: StudentService leaked Tenant A students into Tenant B query!')
    }
    console.log(`✔ StudentService check passed: Tenant B (${tenantB.slug}) sees only its ${stuListB.length} student(s), 0 from Tenant A.`)

    console.log('\n======================================================')
    console.log('✅ ALL LIVE ISOLATION TESTS PASSED.')
    console.log('Zero cross-tenant data leakage detected between real tenants.')
    console.log('======================================================\n')
  } catch (error) {
    console.error('\n❌ ISOLATION TEST FAILED:')
    console.error(error.message)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    console.log('[Test] MongoDB connection closed.')
  }
}

runLeakageTest()
