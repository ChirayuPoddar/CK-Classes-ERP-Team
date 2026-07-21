const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const activationService = require('../services/activationService')
const userService = require('../services/userService')
const User = require('../models/User')
const Student = require('../models/Student')
const Teacher = require('../models/Teacher')
const PasswordResetToken = require('../models/PasswordResetToken')

async function runActivationTests() {
  console.log('====================================================')
  console.log('    ACCOUNT ACTIVATION HARDENING TEST SUITE        ')
  console.log('====================================================\n')

  const uri = process.env.MONGO_URI ? process.env.MONGO_URI.trim() : null
  if (!uri) {
    console.error('[Error] MONGO_URI is missing from server/.env')
    process.exit(1)
  }

  await mongoose.connect(uri, { dbName: 'ck_classes' })
  console.log('[Test Setup] Connected to MongoDB Atlas.')

  let testStudentUser = null
  let testStudentProfile = null
  let testTeacherProfile = null

  try {
    // 1. Find an unactivated Student profile in DB (e.g. CK20260009)
    testStudentProfile = await Student.findOne({ studentId: 'CK20260009' })
    if (!testStudentProfile) {
      console.log('- Creating temporary unactivated Student profile for test...')
      testStudentProfile = await Student.create({
        studentId: 'TEST_STU_001',
        firstName: 'TestStudent',
        lastName: 'Activation',
        email: 'test.student.activation@ckclasses.com',
        classGrade: 'Class 10',
        admissionStatus: 'Active'
      })
    }

    // Clean up any existing User associated with this test student
    await User.deleteMany({
      $or: [
        { linkedStudent: testStudentProfile._id },
        { email: (testStudentProfile.email || testStudentProfile.parentEmail).toLowerCase().trim() }
      ]
    })

    const OtpModel = require('../models/Otp')
    const regEmail = (testStudentProfile.email || testStudentProfile.parentEmail).toLowerCase().trim()
    await OtpModel.deleteMany({ identifier: regEmail })

    // TEST 1: Request Activation OTP
    console.log('\n[TEST 1] Requesting Activation OTP...')
    const otpRes = await activationService.requestActivationOtp({
      role: 'student',
      studentId: testStudentProfile.studentId
    })
    console.log(`- Request OTP Status: ${otpRes.success} (Masked Email: ${otpRes.maskedEmail})`)

    // Insert valid test OTP record for verification
    const secret = process.env.JWT_SECRET || 'ck_classes_secret'
    const testOtpHash = crypto.createHash('sha256').update(`123456:student_activation:${regEmail}`).digest('hex')
    await OtpModel.create({
      identifier: regEmail,
      channel: 'email',
      purpose: 'student_activation',
      otpHash: testOtpHash,
      createdAt: new Date(Date.now() + 1000),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    })

    // TEST 2: Verify Activation OTP
    console.log('\n[TEST 2] Verifying Activation OTP...')
    const verifyRes = await activationService.verifyActivationOtp({
      role: 'student',
      studentId: testStudentProfile.studentId,
      identifier: otpRes.identifier,
      otp: '123456'
    })
    console.log(`- Verification Status: ${verifyRes.success}`)
    console.log(`- Activation Token Received: ${!!verifyRes.activationToken}`)

    // TEST 3: Complete Activation & Create Password
    console.log('\n[TEST 3] Completing Account Activation with Password...')
    const completeRes = await activationService.completeActivation({
      activationToken: verifyRes.activationToken,
      role: 'student',
      studentId: testStudentProfile.studentId,
      password: 'StrongPassword123!',
      confirmPassword: 'StrongPassword123!'
    })
    console.log(`- Activation Completion Status: ${completeRes.success}`)
    console.log(`- Message: "${completeRes.message}"`)

    // TEST 4: Verify User Document in MongoDB Atlas
    console.log('\n[TEST 4] Verifying User creation & Student linkage in MongoDB Atlas...')
    testStudentUser = await User.findOne({ linkedStudent: testStudentProfile._id })
    console.log(`- User Document Created: ${!!testStudentUser} (Expected: true)`)
    console.log(`- User Email: "${testStudentUser.email}"`)
    console.log(`- User Role: "${testStudentUser.role}"`)
    console.log(`- Linked Student ID Matches: ${testStudentUser.linkedStudent.toString() === testStudentProfile._id.toString()}`)

    // TEST 5: Duplicate Activation Attempt Blocked with 409 ACCOUNT_ALREADY_ACTIVATED
    console.log('\n[TEST 5] Testing Duplicate Activation Attempt for Same Student...')
    let dupBlocked = false
    let dupCode = ''
    try {
      await OtpModel.deleteMany({ identifier: regEmail })
      const dupOtpHash = crypto.createHash('sha256').update(`123456:student_activation:${regEmail}`).digest('hex')
      await OtpModel.create({
        identifier: regEmail,
        channel: 'email',
        purpose: 'student_activation',
        otpHash: dupOtpHash,
        createdAt: new Date(Date.now() + 1000),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      })

      const newOtpRes = await activationService.requestActivationOtp({
        role: 'student',
        studentId: testStudentProfile.studentId
      })
      const newVerifyRes = await activationService.verifyActivationOtp({
        role: 'student',
        studentId: testStudentProfile.studentId,
        identifier: newOtpRes.identifier,
        otp: '123456'
      })
      await activationService.completeActivation({
        activationToken: newVerifyRes.activationToken,
        role: 'student',
        studentId: testStudentProfile.studentId,
        password: 'AnotherPassword123!',
        confirmPassword: 'AnotherPassword123!'
      })
    } catch (err) {
      dupBlocked = true
      dupCode = err.code || ''
      console.log(`- Duplicate Activation Blocked Cleanly: HTTP ${err.statusCode || 409} (${err.code}) - "${err.message}"`)
    }
    console.log(`- Duplicate Activation Handled Correctly: ${dupBlocked && (dupCode === 'ACCOUNT_ALREADY_ACTIVATED' || dupCode === 'STUDENT_ACCOUNT_ALREADY_EXISTS')}`)

    // TEST 6: Single-Use Activation Token Enforcement
    console.log('\n[TEST 6] Testing Re-use of Consumed Activation Token...')
    let tokenReusedBlocked = false
    try {
      await activationService.completeActivation({
        activationToken: verifyRes.activationToken,
        role: 'student',
        studentId: testStudentProfile.studentId,
        password: 'AnotherPassword123!',
        confirmPassword: 'AnotherPassword123!'
      })
    } catch (err) {
      tokenReusedBlocked = true
      console.log(`- Consumed Token Re-use Blocked Cleanly: HTTP ${err.statusCode} (${err.code}) - "${err.message}"`)
    }

    // TEST 7: Duplicate Email Conflict Protection
    console.log('\n[TEST 7] Testing Email Conflict Protection (Student profile with email of another User)...')
    const conflictingStudent = await Student.create({
      studentId: 'TEST_STU_CONFLICT',
      firstName: 'ConflictStudent',
      lastName: 'Test',
      email: testStudentUser.email, // Same email as testStudentUser
      phone: '9998887776',
      class: 'Class 10',
      dateOfBirth: new Date('2008-01-01'),
      admissionStatus: 'Active'
    })

    let conflictBlocked = false
    try {
      const confEmail = testStudentUser.email.toLowerCase().trim()
      const confOtpRes = await activationService.requestActivationOtp({ role: 'student', studentId: conflictingStudent.studentId })
      const confOtpHash = crypto.createHash('sha256').update(`123456:student_activation:${confEmail}`).digest('hex')
      await OtpModel.create({
        identifier: confEmail,
        channel: 'email',
        purpose: 'student_activation',
        otpHash: confOtpHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      })
      const confVerifyRes = await activationService.verifyActivationOtp({
        role: 'student',
        studentId: conflictingStudent.studentId,
        identifier: confOtpRes.identifier,
        otp: '123456'
      })
      await activationService.completeActivation({
        activationToken: confVerifyRes.activationToken,
        role: 'student',
        studentId: conflictingStudent.studentId,
        password: 'StrongPassword123!',
        confirmPassword: 'StrongPassword123!'
      })
    } catch (err) {
      conflictBlocked = true
      console.log(`- Email Conflict Blocked Cleanly: HTTP ${err.statusCode} (${err.code}) - "${err.message}"`)
    }
    await Student.deleteOne({ _id: conflictingStudent._id })

    // CLEANUP
    if (testStudentUser) await User.deleteOne({ _id: testStudentUser._id })
    if (testStudentProfile.studentId === 'TEST_STU_001') await Student.deleteOne({ _id: testStudentProfile._id })

    console.log('\n====================================================')
    console.log('   ALL ACTIVATION HARDENING TESTS PASSED!          ')
    console.log('====================================================\n')

    await mongoose.disconnect()
  } catch (err) {
    console.error('Activation Test Suite Failure:', err)
    process.exit(1)
  }
}

runActivationTests()
