const mongoose = require('mongoose')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../.env') })

const Resource = require('../models/Resource')
const Subject = require('../models/Subject')
const User = require('../models/User')

const dummyResources = [
  {
    title: 'Class 10 Trigonometry Formula Book',
    description: 'All trigonometric formulas, identity proofs, and unit circle summaries in one handbook.',
    category: 'Notes',
    resourceType: 'PDF',
    resourceUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileSize: 452104,
    fileType: 'application/pdf',
    publishAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    visibility: 'Specific Class',
    class: 'Class 10',
    tags: ['trigonometry', 'formulas', 'math', 'handbook'],
    downloadCount: 42,
    viewCount: 156
  },
  {
    title: 'Class 12 Wave Optics Lecture Video',
    description: 'Comprehensive session covering Young\'s Double Slit Experiment and diffraction patterns.',
    category: 'Recorded Lectures',
    resourceType: 'YouTube Video',
    resourceUrl: 'https://www.youtube.com/watch?v=h1D8G0wM9Fw',
    youtubeId: 'h1D8G0wM9Fw',
    thumbnailUrl: 'https://img.youtube.com/vi/h1D8G0wM9Fw/0.jpg',
    publishAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    visibility: 'Specific Class',
    class: 'Class 12 Science',
    tags: ['optics', 'physics', 'board-prep', 'video'],
    downloadCount: 0,
    viewCount: 280
  },
  {
    title: 'Grade 9 Chemistry Lab Manual',
    description: 'Detailed guidelines and templates for science laboratory experiments and chemical reactions.',
    category: 'Lab Manuals',
    resourceType: 'Document',
    resourceUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // fallback link
    fileSize: 104520,
    fileType: 'application/pdf',
    publishAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    visibility: 'Specific Class',
    class: 'Class 9',
    tags: ['chemistry', 'lab', 'manual'],
    downloadCount: 15,
    viewCount: 40
  },
  {
    title: 'Physics Board Sample Papers 2026',
    description: 'Set of 5 model revision papers following the latest board examination layout guidelines.',
    category: 'Sample Papers',
    resourceType: 'ZIP',
    resourceUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // fallback link
    fileSize: 3145728, // 3MB
    fileType: 'application/zip',
    publishAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    visibility: 'Entire Institute',
    tags: ['physics', 'sample-papers', 'board-prep'],
    downloadCount: 88,
    viewCount: 195
  },
  {
    title: 'Staff Only: Grade 12 Math Syllabus Progression Tracker',
    description: 'Internal teacher checklist to log chapter progress against target curriculum timelines.',
    category: 'Important Documents',
    resourceType: 'Spreadsheet',
    resourceUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileSize: 85400,
    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    publishAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    visibility: 'Teachers Only',
    tags: ['math', 'curriculum', 'admin'],
    downloadCount: 4,
    viewCount: 12
  },
  {
    title: 'Scheduled Class 10 Geometry Worksheet',
    description: 'Practice questions on Circles and Tangents theorems. Scheduled for next week.',
    category: 'Worksheets',
    resourceType: 'PDF',
    resourceUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileSize: 220500,
    fileType: 'application/pdf',
    publishAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days in future (Scheduled)
    visibility: 'Specific Class',
    class: 'Class 10',
    tags: ['geometry', 'circles', 'worksheet'],
    downloadCount: 0,
    viewCount: 0
  }
]

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ck_classes'
    console.log('Connecting to database:', mongoUri)
    await mongoose.connect(mongoUri)

    // 1. Find or create an admin user for uploadedBy reference
    let adminUser = await User.findOne({ role: 'admin' })
    if (!adminUser) {
      adminUser = await User.create({
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@ckclasses.com',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuv', // placeholder
        role: 'admin',
        isActive: true
      })
      console.log('Created dummy admin user:', adminUser.email)
    }

    // 2. Fetch some existing subjects to associate if visibility permits
    const mathSubject = await Subject.findOne({ name: /Math/i })
    const physicsSubject = await Subject.findOne({ name: /Physics/i })
    const chemistrySubject = await Subject.findOne({ name: /Chemistry/i })

    // Clean previous records
    await Resource.deleteMany({})
    console.log('Deleted existing resources')

    // Attach dependencies
    const processedResources = dummyResources.map((res, index) => {
      let subjId = null
      if (res.title.includes('Trigonometry') || res.title.includes('Geometry')) {
        subjId = mathSubject ? mathSubject._id : null
      } else if (res.title.includes('Physics')) {
        subjId = physicsSubject ? physicsSubject._id : null
      } else if (res.title.includes('Chemistry')) {
        subjId = chemistrySubject ? chemistrySubject._id : null
      }

      return {
        ...res,
        uploadedBy: adminUser._id,
        subject: subjId
      }
    })

    const created = await Resource.insertMany(processedResources)
    console.log(`Successfully seeded ${created.length} resources.`)

  } catch (error) {
    console.error('Error seeding resources:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from database')
  }
}

seed()
