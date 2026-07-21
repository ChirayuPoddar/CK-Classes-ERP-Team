const mongoose = require('mongoose')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../.env') })

const Announcement = require('../models/Announcement')
const Subject = require('../models/Subject')
const User = require('../models/User')

const dummyAnnouncements = [
  {
    title: 'Annual Sports Meet 2026',
    shortDescription: 'Announcing the annual sports day schedule and registrations.',
    message: 'We are excited to announce that the C.K. Classes Annual Sports Meet 2026 is scheduled for next month. Events will include Track & Field, Chess, Badminton, and Table Tennis.\n\nAll students are invited to register. Registrations open on Monday. Please contact the front desk for forms.',
    audience: ['Entire Institute'],
    publishAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    isPinned: true
  },
  {
    title: 'Class 10 Mathematics Revision Class',
    shortDescription: 'Extra algebra revision classes for board exam students.',
    message: 'Dear Class 10 Students,\n\nWe will be holding an extra Mathematics revision session this Sunday focusing on Quadratic Equations and Arithmetic Progressions.\n\nTime: 10:00 AM - 12:30 PM\nAttendance is highly recommended.',
    audience: ['Specific Class'],
    class: 'Class 10',
    publishAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    isPinned: false
  },
  {
    title: 'Upcoming Science Unit Test Schedule',
    shortDescription: 'Unit Test dates for Class 9 Physics.',
    message: 'Physics Unit Test 2 will be held next Friday.\n\nSyllabus: Kinematics and Laws of Motion.\nTotal Marks: 50. Please prepare well.',
    audience: ['Specific Subject'],
    class: 'Class 9',
    publishAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days in future (Scheduled)
    isPinned: false
  },
  {
    title: 'Staff Meeting: Syllabus Review',
    shortDescription: 'Monthly staff meeting for all teachers.',
    message: 'All faculty members are requested to attend the monthly syllabus review meeting this Saturday at 4:00 PM in the Conference Hall.\n\nPlease bring your class progression logs and lesson plans.',
    audience: ['Teachers Only'],
    publishAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    isPinned: false
  },
  {
    title: 'New Student Portal Guidelines',
    shortDescription: 'Instructions on how to access and download materials.',
    message: 'Dear Students,\n\nA new update has been pushed to the C.K. Classes student portal. You can now download study notes, mock tests, and assignments directly from your dashboard.\n\nPlease watch the tutorial video attached or contact support for help.',
    audience: ['Students Only'],
    publishAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    isPinned: true,
    attachments: [
      {
        fileId: 'dummy_tut_001',
        fileName: 'Student_Portal_Guide.pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileSize: 102450,
        uploadedAt: new Date()
      }
    ]
  },
  {
    title: 'Parent-Teacher Interaction Meet',
    shortDescription: 'Monthly meeting to review students progress.',
    message: 'Dear Parents,\n\nWe cordially invite you to the parent-teacher interaction meeting to discuss the mid-term test results. Academic feedback logs will be shared.\n\nDate: This Saturday\nSlots: 9:00 AM - 1:00 PM',
    audience: ['Parents Only'],
    publishAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    isPinned: false
  },
  {
    title: 'System Maintenance Window',
    shortDescription: 'ERP system will be offline for maintenance.',
    message: 'The ERP portals will undergo routine database maintenance this Sunday from 2:00 AM to 5:00 AM. Portals may be temporarily unreachable during this period.',
    audience: ['Entire Institute'],
    publishAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days in future (Scheduled)
    isPinned: false
  }
]

const seed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ck_classes'
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB successfully.')

    // Get admin user
    const admin = await User.findOne({ role: 'admin' })
    const createdBy = admin ? admin._id : new mongoose.Types.ObjectId()

    // Clean current announcements
    await Announcement.deleteMany({})
    console.log('Cleared existing announcements.')

    // Retrieve active subjects to link Specific Subject dummy
    const subjects = await Subject.find({ status: 'Active' })
    const class9ScienceSub = subjects.find(s => s.class === 'Class 9')

    for (const rawData of dummyAnnouncements) {
      const data = { ...rawData, createdBy }
      
      if (data.audience.includes('Specific Subject') && class9ScienceSub) {
        data.subject = class9ScienceSub._id
        data.targetSubjects = [class9ScienceSub._id]
      }

      // Sync targetClasses arrays
      if (data.class) {
        data.targetClasses = [data.class]
      }

      const announcement = new Announcement(data)
      await announcement.save()
    }

    console.log('Dummy announcements seeded successfully!')
    process.exit(0)
  } catch (err) {
    console.error('Failed to seed announcements data:', err)
    process.exit(1)
  }
}

seed()
