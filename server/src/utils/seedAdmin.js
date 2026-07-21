require('dotenv').config({ path: '../../.env' })
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('../models/User')

const seedAdmin = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ck_classes'
  
  try {
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB for seeding...')

    const email = 'admin@ckclasses.com'
    const existing = await User.findOne({ email })

    if (existing) {
      console.log(`Admin user ${email} already exists.`)
      process.exit(0)
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash('password123', salt)

    const admin = new User({
      email,
      passwordHash,
      role: 'admin',
      firstName: 'Chirayu',
      lastName: 'Poddar',
      isActive: true
    })

    await admin.save()
    console.log('Admin user successfully seeded:')
    console.log(`Email: ${email}`)
    console.log('Password: password123')
    process.exit(0)
  } catch (error) {
    console.error('Error seeding admin user:', error)
    process.exit(1)
  }
}

seedAdmin()
