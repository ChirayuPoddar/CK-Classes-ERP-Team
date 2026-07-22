const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const Tenant = require('../models/Tenant')
const User = require('../models/User')

// POST /api/v1/tenants/register
router.post('/register', async (req, res, next) => {
  try {
    // 1. Security Check: Require internal secret
    const secret = req.headers['x-superadmin-secret']
    if (!secret || secret !== process.env.SUPERADMIN_SECRET) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized access to internal onboarding endpoint.' }
      })
    }

    // 2. Input Validation
    const { institutionName, slug, email, firstName, lastName, password } = req.body
    
    if (!institutionName || !slug || !email || !firstName || !lastName || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields: institutionName, slug, email, firstName, lastName, password are required.' }
      })
    }

    const cleanSlug = slug.toLowerCase().trim()
    const cleanEmail = email.toLowerCase().trim()

    // 3. Uniqueness Checks
    const existingTenant = await Tenant.findOne({ slug: cleanSlug })
    if (existingTenant) {
      return res.status(400).json({
        success: false,
        error: { message: `A tenant with slug '${cleanSlug}' already exists.` }
      })
    }

    const existingUser = await User.findOne({ email: cleanEmail })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { message: `A user with email '${cleanEmail}' already exists.` }
      })
    }

    // 4. Create Tenant
    const newTenant = await Tenant.create({
      name: institutionName,
      institutionName: institutionName,
      slug: cleanSlug,
      contactEmail: cleanEmail,
      isActive: true,
      subscriptionStatus: 'trial'
    })

    // 5. Password Hashing (identical to activation flow)
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // 6. Create Admin User
    const adminUser = await User.create({
      tenantId: newTenant._id,
      firstName,
      lastName,
      email: cleanEmail,
      passwordHash,
      role: 'admin',
      isActive: true,
      lastLogin: null
    })

    // 7. Return success
    return res.status(201).json({
      success: true,
      message: 'Tenant and admin user provisioned successfully.',
      data: {
        tenantId: newTenant._id,
        slug: newTenant.slug,
        adminId: adminUser._id,
        adminEmail: adminUser.email
      }
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: { message: error.message }
      })
    }
    next(error)
  }
})

module.exports = router
