require('dotenv').config({ path: __dirname + '/.env' })
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('./src/models/User')

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ck_classes'

async function seedAdmin() {
  try {
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB')

    const adminEmail = 'admin@ckclasses.com'
    let user = await User.findOne({ email: adminEmail })

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash('Admin123!', salt)

    if (user) {
      user.passwordHash = passwordHash
      user.isActive = true
      await user.save()
      console.log('Updated existing Admin user: admin@ckclasses.com / Admin123!')
    } else {
      user = await User.create({
        email: adminEmail,
        passwordHash,
        role: 'admin',
        firstName: 'System',
        lastName: 'Admin',
        phone: '9876543210',
        isActive: true
      })
      console.log('Created new Admin user: admin@ckclasses.com / Admin123!')
    }

    await mongoose.disconnect()
    console.log('Database seeding complete.')
  } catch (err) {
    console.error('Error seeding admin user:', err)
    process.exit(1)
  }
}

seedAdmin()
