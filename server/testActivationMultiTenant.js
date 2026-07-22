const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })
const http = require('http')
const mongoose = require('mongoose')
const express = require('express')
const cookieParser = require('cookie-parser')

const Tenant = require('./src/models/Tenant')
const Student = require('./src/models/Student')
const User = require('./src/models/User')
const PasswordResetToken = require('./src/models/PasswordResetToken')
const activationRoutes = require('./src/routes/activationRoutes')

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use('/api/v1/activation', activationRoutes)

// Error handler for clean JSON responses
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500
  res.status(statusCode).json({
    success: false,
    code: err.code || err.errorCode || 'INTERNAL_ERROR',
    error: { message: err.message || 'Server Error' }
  })
})

const runTests = async () => {
  const uri = process.env.MONGO_URI ? process.env.MONGO_URI.trim() : null
  await mongoose.connect(uri, { dbName: 'ck_classes' })
  console.log('[Test] Connected to MongoDB')

  const collisionStudentId = `COLLISION-STU-${Date.now()}`
  const alphaSlug = `test-alpha-${Date.now()}`
  const betaSlug = `test-beta-${Date.now()}`

  let tenantA, tenantB, studentA, studentB

  try {
    // 1. Create two independent tenants
    tenantA = await Tenant.create({
      name: 'Alpha Tuition Center',
      slug: alphaSlug,
      contactEmail: 'alpha.contact@ckclasses.com',
      isActive: true
    })
    tenantB = await Tenant.create({
      name: 'Beta Coaching Academy',
      slug: betaSlug,
      contactEmail: 'beta.contact@ckclasses.com',
      isActive: true
    })
    console.log(`[Setup] Created Tenant A (${tenantA.slug}) and Tenant B (${tenantB.slug})`)

    // 2. Seed TWO students with the exact SAME studentId across the two tenants
    studentA = await Student.create({
      tenantId: tenantA._id,
      studentId: collisionStudentId,
      firstName: 'AlphaStudent',
      lastName: 'One',
      email: 'alpha.student.one@ckclasses.com',
      class: '10th Grade',
      phone: '9876543210',
      dateOfBirth: new Date('2008-01-15'),
      isActive: true
    })

    studentB = await Student.create({
      tenantId: tenantB._id,
      studentId: collisionStudentId,
      firstName: 'BetaStudent',
      lastName: 'Two',
      email: 'beta.student.two@ckclasses.com',
      class: '12th Grade',
      phone: '9876543211',
      dateOfBirth: new Date('2006-05-20'),
      isActive: true
    })
    console.log(`[Setup] Seeded Student A under Tenant A and Student B under Tenant B with identical studentId: "${collisionStudentId}"`)

    // Start ephemeral HTTP server
    const server = http.createServer(app)
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    const port = server.address().port
    const baseUrl = `http://127.0.0.1:${port}`
    console.log(`[Test] Test server listening on port ${port}\n`)

    // TEST 1: Request OTP targeting Tenant A with collision studentId
    console.log('--- TEST 1: Activation request for Tenant A (Alpha) with collision studentId ---')
    const resAlpha = await fetch(`${baseUrl}/api/v1/activation/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        institutionSlug: alphaSlug,
        role: 'student',
        studentId: collisionStudentId
      })
    })
    const bodyAlpha = await resAlpha.json()
    console.log(`Status: ${resAlpha.status}`)
    console.log('Response:', bodyAlpha)
    if (bodyAlpha.studentName === 'AlphaStudent One') {
      console.log('✔ PASSED: Correctly resolved AlphaStudent One under Tenant A')
    } else {
      throw new Error(`Test 1 Failed: Expected AlphaStudent One, got ${bodyAlpha.studentName}`)
    }

    // TEST 2: Request OTP targeting Tenant B with identical collision studentId
    console.log('\n--- TEST 2: Activation request for Tenant B (Beta) with identical collision studentId ---')
    const resBeta = await fetch(`${baseUrl}/api/v1/activation/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        institutionSlug: betaSlug,
        role: 'student',
        studentId: collisionStudentId
      })
    })
    const bodyBeta = await resBeta.json()
    console.log(`Status: ${resBeta.status}`)
    console.log('Response:', bodyBeta)
    if (bodyBeta.studentName === 'BetaStudent Two') {
      console.log('✔ PASSED: Correctly resolved BetaStudent Two under Tenant B without collision')
    } else {
      throw new Error(`Test 2 Failed: Expected BetaStudent Two, got ${bodyBeta.studentName}`)
    }

    // TEST 3: Request OTP without institutionSlug -> should fail cleanly
    console.log('\n--- TEST 3: Activation request with NO institutionSlug ---')
    const resNoSlug = await fetch(`${baseUrl}/api/v1/activation/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'student',
        studentId: collisionStudentId
      })
    })
    const bodyNoSlug = await resNoSlug.json()
    console.log(`Status: ${resNoSlug.status}`)
    console.log('Response:', bodyNoSlug)
    if (resNoSlug.status === 400 && bodyNoSlug.code === 'ACTIVATION_INVALID') {
      console.log('✔ PASSED: Correctly blocked request missing institutionSlug with generic error')
    } else {
      throw new Error(`Test 3 Failed: Unexpected response status ${resNoSlug.status}`)
    }

    // TEST 4: Request OTP with FAKE institutionSlug -> generic error (enumeration resistance)
    console.log('\n--- TEST 4: Activation request with FAKE institutionSlug ---')
    const resFakeSlug = await fetch(`${baseUrl}/api/v1/activation/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        institutionSlug: 'fake-nonexistent-slug-888',
        role: 'student',
        studentId: collisionStudentId
      })
    })
    const bodyFakeSlug = await resFakeSlug.json()
    console.log(`Status: ${resFakeSlug.status}`)
    console.log('Response:', bodyFakeSlug)
    if (resFakeSlug.status === 400 && bodyFakeSlug.code === 'ACTIVATION_INVALID') {
      console.log('✔ PASSED: Correctly returned generic error for nonexistent institutionSlug without revealing existence')
    } else {
      throw new Error(`Test 4 Failed: Unexpected response status ${resFakeSlug.status}`)
    }

    server.close()
  } finally {
    // Cleanup seeded data
    console.log('\n[Cleanup] Removing seeded test tenants and students...')
    if (studentA) await Student.deleteOne({ _id: studentA._id })
    if (studentB) await Student.deleteOne({ _id: studentB._id })
    if (tenantA) await Tenant.deleteOne({ _id: tenantA._id })
    if (tenantB) await Tenant.deleteOne({ _id: tenantB._id })
    await mongoose.disconnect()
    console.log('[Cleanup] Done.')
  }

  console.log('\n✔ All multi-tenant activation isolation tests passed successfully!')
  process.exit(0)
}

runTests().catch(err => {
  console.error('Test execution error:', err)
  process.exit(1)
})
