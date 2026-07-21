const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../.env') })
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('../models/User')

const seedAdmin = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ck_classes'
  
  try {
    console.log(`Connecting to MongoDB: ${mongoUri.replace(/:[^:@]+@/, ':****@')}`)
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB for admin setup...')

    const email = 'admin@ckclasses.com'
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash('password123', salt)

    let admin = await User.findOne({ email })

    if (admin) {
      admin.passwordHash = passwordHash
      admin.firstName = 'Chirayu'
      admin.lastName = 'Poddar'
      admin.role = 'admin'
      admin.isActive = true
      await admin.save()
      console.log(`Updated admin passwordHash for ${email} to 'password123'.`)
    } else {
      admin = new User({
        email,
        passwordHash,
        role: 'admin',
        firstName: 'Chirayu',
        lastName: 'Poddar',
        isActive: true
      })
      await admin.save()
      console.log(`Created admin user ${email} with password 'password123'.`)
    }

    process.exit(0)
  } catch (error) {
    console.error('Error seeding admin user:', error)
    process.exit(1)
  }
}

seedAdmin()
