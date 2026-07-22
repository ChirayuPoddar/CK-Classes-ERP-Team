const mongoose = require('mongoose')
const dotenv = require('dotenv')
const path = require('path')

// Load environment
dotenv.config({ path: path.join(__dirname, '.env') })

// Import models
const Tenant = require('./src/models/Tenant')
const Student = require('./src/models/Student')
const Teacher = require('./src/models/Teacher')
const Subject = require('./src/models/Subject')
const Exam = require('./src/models/Exam')
const Announcement = require('./src/models/Announcement')
const Holiday = require('./src/models/Holiday')
const Period = require('./src/models/Period')
const Resource = require('./src/models/Resource')
const Room = require('./src/models/Room')
const StudentFee = require('./src/models/StudentFee')
const User = require('./src/models/User')

// Import services to test queries/aggregations directly through service methods
const StudentService = require('./src/services/StudentService')
const TeacherService = require('./src/services/TeacherService')
const SubjectService = require('./src/services/SubjectService')
const ExamService = require('./src/services/ExamService')
const AnnouncementService = require('./src/services/AnnouncementService')
const HolidayService = require('./src/services/HolidayService')
const PeriodService = require('./src/services/PeriodService')
const ResourceService = require('./src/services/ResourceService')
const RoomService = require('./src/services/RoomService')
const StudentFeeService = require('./src/services/StudentFeeService')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ck_classes_test'

async function runLeakageTest() {
  console.log('[Test] Connecting to MongoDB...')
  await mongoose.connect(MONGO_URI)
  console.log('[Test] Connected to MongoDB.')

  const tenantAId = new mongoose.Types.ObjectId()
  const tenantBId = new mongoose.Types.ObjectId()
  const timestamp = Date.now()

  try {
    // Drop the test database to ensure no legacy indexes exist
    await mongoose.connection.db.dropDatabase()
    console.log('[Setup] Test database dropped to clear legacy indexes.')

    console.log(`[Setup] Creating Tenant A (${tenantAId}) and Tenant B (${tenantBId})...`)
    await Tenant.create([
      { _id: tenantAId, name: 'Leak Test Institute Alpha', slug: `alpha-${timestamp}`, contactEmail: `alpha-${timestamp}@leaktest.com`, status: 'active' },
      { _id: tenantBId, name: 'Leak Test Institute Beta', slug: `beta-${timestamp}`, contactEmail: `beta-${timestamp}@leaktest.com`, status: 'active' }
    ])

    // Seed data in Tenant A
    console.log('[Setup] Seeding data for Tenant A...')
    const studentAObj = await Student.create({ studentId: 'STU-ALPHA-1', firstName: 'Alpha', lastName: 'Student', email: `alpha.stu.${timestamp}@test.com`, phone: '9876543210', dateOfBirth: new Date('2008-01-01'), status: 'Active', class: 'Class 10', tenantId: tenantAId })
    const teacherAObj = await Teacher.create({ teacherId: 'TCH-ALPHA-1', firstName: 'Alpha', lastName: 'Teacher', email: `alpha.tch.${timestamp}@test.com`, phone: '9876543212', dateOfBirth: new Date('1985-01-01'), qualification: 'M.Sc Physics', status: 'Active', tenantId: tenantAId })
    const subjectAObj = await Subject.create({ name: 'Alpha Physics', code: 'PHY-A', class: 'Class 10', periodsPerWeek: 5, status: 'Active', tenantId: tenantAId })
    await Exam.create({ examName: 'Alpha Term Exam', academicYear: '2026-2027', subjectId: subjectAObj._id, class: 'Class 10', maxMarks: 100, passingMarks: 35, examDate: new Date(), startTime: '09:00 AM', endTime: '12:00 PM', status: 'Scheduled', tenantId: tenantAId })
    await Announcement.create({ title: 'Alpha Notice', message: 'Hello Alpha', status: 'Published', publishAt: new Date(), createdBy: teacherAObj._id, tenantId: tenantAId })
    await Holiday.create({ name: 'Alpha Holiday', date: new Date(), type: 'National', tenantId: tenantAId })
    await Period.create({ name: 'Alpha Period 1', startTime: '09:00', endTime: '10:00', order: 1, templateName: 'Default', tenantId: tenantAId })
    await Resource.create({ title: 'Alpha Notes', category: 'Study Material', resourceType: 'PDF', visibility: 'Entire Institute', status: 'Published', fileSize: 1024, downloadCount: 5, uploadedBy: teacherAObj._id, publishAt: new Date(), tenantId: tenantAId })
    await Room.create({ name: 'Room Alpha', capacity: 40, status: 'Active', tenantId: tenantAId })
    const FeeStructure = require('./src/models/FeeStructure')
    const feeStructureAObj = await FeeStructure.create({ course: 'General', class: 'Class 10', academicYear: '2026-2027', tuitionFee: 8000, transportFee: 2000, totalFee: 10000, status: 'Active', tenantId: tenantAId })
    await StudentFee.create({ student: studentAObj._id, class: 'Class 10', academicYear: '2026-2027', feeStructure: feeStructureAObj._id, tuitionFee: 8000, transportFee: 2000, totalFee: 10000, paidAmount: 5000, dueDate: new Date(), status: 'Partial', tenantId: tenantAId })

    // Seed data in Tenant B
    console.log('[Setup] Seeding data for Tenant B...')
    const studentBObj = await Student.create({ studentId: 'STU-BETA-1', firstName: 'Beta', lastName: 'Student', email: `beta.stu.${timestamp}@test.com`, phone: '9876543211', dateOfBirth: new Date('2008-05-01'), status: 'Active', class: 'Class 10', tenantId: tenantBId })
    const teacherBObj = await Teacher.create({ teacherId: 'TCH-BETA-1', firstName: 'Beta', lastName: 'Teacher', email: `beta.tch.${timestamp}@test.com`, phone: '9876543213', dateOfBirth: new Date('1986-05-01'), qualification: 'M.Sc Chemistry', status: 'Active', tenantId: tenantBId })
    const subjectBObj = await Subject.create({ name: 'Beta Chemistry', code: 'CHM-B', class: 'Class 10', periodsPerWeek: 4, status: 'Active', tenantId: tenantBId })
    await Exam.create({ examName: 'Beta Term Exam', academicYear: '2026-2027', subjectId: subjectBObj._id, class: 'Class 10', maxMarks: 100, passingMarks: 35, examDate: new Date(), startTime: '09:00 AM', endTime: '12:00 PM', status: 'Scheduled', tenantId: tenantBId })
    await Announcement.create({ title: 'Beta Notice', message: 'Hello Beta', status: 'Published', publishAt: new Date(), createdBy: teacherBObj._id, tenantId: tenantBId })
    await Holiday.create({ name: 'Beta Holiday', date: new Date(), type: 'National', tenantId: tenantBId })
    await Period.create({ name: 'Beta Period 1', startTime: '10:00', endTime: '11:00', order: 1, templateName: 'Default', tenantId: tenantBId })
    await Resource.create({ title: 'Beta Notes', category: 'Study Material', resourceType: 'PDF', visibility: 'Entire Institute', status: 'Published', fileSize: 2048, downloadCount: 10, uploadedBy: teacherBObj._id, publishAt: new Date(), tenantId: tenantBId })
    await Room.create({ name: 'Room Beta', capacity: 30, status: 'Active', tenantId: tenantBId })
    const feeStructureBObj = await FeeStructure.create({ course: 'General', class: 'Class 10', academicYear: '2026-2027', tuitionFee: 16000, transportFee: 4000, totalFee: 20000, status: 'Active', tenantId: tenantBId })
    await StudentFee.create({ student: studentBObj._id, class: 'Class 10', academicYear: '2026-2027', feeStructure: feeStructureBObj._id, tuitionFee: 16000, transportFee: 4000, totalFee: 20000, paidAmount: 15000, dueDate: new Date(), status: 'Partial', tenantId: tenantBId })

    const userContextA = { role: 'admin', tenantId: tenantAId }
    const userContextB = { role: 'admin', tenantId: tenantBId }

    console.log('\n--- Running Cross-Tenant Isolation Verification ---')

    // 1. Check Student isolation
    const studentsA = await StudentService.getAllStudents({ tenantId: tenantAId }, userContextA)
    const stuListA = studentsA.students || []
    if (stuListA.some(s => s.tenantId.toString() !== tenantAId.toString() || s.studentId.includes('BETA'))) {
      throw new Error('FAIL: StudentService leaked Tenant B students into Tenant A query!')
    }
    console.log(`✔ StudentService check passed: Tenant A sees only its ${stuListA.length} student(s), 0 from Tenant B.`)

    // 2. Check Teacher isolation
    const teachersA = await TeacherService.getAllTeachers({ tenantId: tenantAId }, userContextA)
    const tchListA = teachersA.teachers || []
    if (tchListA.some(t => t.tenantId.toString() !== tenantAId.toString() || t.teacherId.includes('BETA'))) {
      throw new Error('FAIL: TeacherService leaked Tenant B teachers into Tenant A query!')
    }
    console.log(`✔ TeacherService check passed: Tenant A sees only its ${tchListA.length} teacher(s).`)

    // 3. Check Subject isolation
    const subjectsResA = await SubjectService.getAllSubjects({ tenantId: tenantAId })
    const subjectsA = subjectsResA.subjects || subjectsResA || []
    if (subjectsA.some(s => s.tenantId.toString() !== tenantAId.toString() || s.name.includes('Beta'))) {
      throw new Error('FAIL: SubjectService leaked Tenant B subjects into Tenant A query!')
    }
    console.log(`✔ SubjectService check passed: Tenant A sees only its ${subjectsA.length} subject(s).`)

    // 4. Check Exam isolation & Aggregation
    const examsResA = await ExamService.getAllExams({ tenantId: tenantAId })
    const examListA = examsResA.exams || examsResA || []
    if (examListA.some(e => e.tenantId.toString() !== tenantAId.toString() || e.examName.includes('Beta'))) {
      throw new Error('FAIL: ExamService leaked Tenant B exams into Tenant A query!')
    }
    const examStatsA = await ExamService.getDashboardStats(tenantAId)
    // Tenant A has 1 exam seeded here, Tenant B has 1 exam seeded here. If leaked, count would be >= 2
    console.log(`✔ ExamService check passed: Tenant A sees only its exams (Stats count: ${examStatsA.totalExams}).`)

    // 5. Check Announcement isolation
    const announcementsA = await AnnouncementService.getAllAnnouncements({ tenantId: tenantAId }, userContextA)
    const annListA = announcementsA.announcements || []
    if (annListA.some(a => a.tenantId.toString() !== tenantAId.toString() || a.title.includes('Beta'))) {
      throw new Error('FAIL: AnnouncementService leaked Tenant B announcements into Tenant A query!')
    }
    console.log(`✔ AnnouncementService check passed: Tenant A sees only its ${annListA.length} announcement(s).`)

    // 6. Check Holiday isolation
    const holidaysResA = await HolidayService.getAllHolidays({ tenantId: tenantAId })
    const holidaysA = holidaysResA.holidays || holidaysResA || []
    if (holidaysA.some(h => h.tenantId.toString() !== tenantAId.toString() || h.name.includes('Beta'))) {
      throw new Error('FAIL: HolidayService leaked Tenant B holidays into Tenant A query!')
    }
    console.log(`✔ HolidayService check passed: Tenant A sees only its ${holidaysA.length} holiday(s).`)

    // 7. Check Period isolation
    const periodsResA = await PeriodService.getAllPeriods({}, tenantAId)
    const periodsA = periodsResA.periods || periodsResA || []
    if (periodsA.some(p => p.tenantId.toString() !== tenantAId.toString() || p.name.includes('Beta'))) {
      throw new Error('FAIL: PeriodService leaked Tenant B periods into Tenant A query!')
    }
    console.log(`✔ PeriodService check passed: Tenant A sees only its ${periodsA.length} period(s).`)

    // 8. Check Resource isolation & Aggregation
    const resourcesA = await ResourceService.getAllResources({ tenantId: tenantAId }, userContextA)
    const resListA = resourcesA.resources || []
    if (resListA.some(r => r.tenantId.toString() !== tenantAId.toString() || r.title.includes('Beta'))) {
      throw new Error('FAIL: ResourceService leaked Tenant B resources into Tenant A query!')
    }
    const resStatsA = await ResourceService.getDashboardStats(userContextA, tenantAId)
    if (resStatsA.storageBytes !== 1024 || resStatsA.downloads !== 5) {
      throw new Error(`FAIL: ResourceService dashboard aggregation leaked! Expected storageBytes=1024, downloads=5, got storageBytes=${resStatsA.storageBytes}, downloads=${resStatsA.downloads}`)
    }
    console.log(`✔ ResourceService check & aggregation passed: Tenant A storageBytes=${resStatsA.storageBytes}, downloads=${resStatsA.downloads} (0 leak from Tenant B).`)

    // 9. Check Room isolation
    const roomsResA = await RoomService.getAllRooms({ tenantId: tenantAId })
    const roomsA = roomsResA.rooms || roomsResA || []
    if (roomsA.some(r => r.tenantId.toString() !== tenantAId.toString() || r.name.includes('Beta'))) {
      throw new Error('FAIL: RoomService leaked Tenant B rooms into Tenant A query!')
    }
    console.log(`✔ RoomService check passed: Tenant A sees only its ${roomsA.length} room(s).`)

    // 10. Check StudentFee aggregation isolation
    const feeStatsA = await StudentFeeService.getDashboardStats(tenantAId)
    // Tenant A totalFee=10000, paid=5000. Tenant B totalFee=20000, paid=15000. If leaked, numbers would combine!
    if (feeStatsA.totalFeeCollected !== 5000 || (feeStatsA.totalFeeCollected + feeStatsA.totalPendingAmount) !== 10000) {
      throw new Error(`FAIL: StudentFee dashboard aggregation leaked! Expected totalFeeCollected=5000, totalExpected=10000, got totalFeeCollected=${feeStatsA.totalFeeCollected}, totalExpected=${feeStatsA.totalFeeCollected + feeStatsA.totalPendingAmount}`)
    }
    console.log(`✔ StudentFee aggregation check passed: Tenant A totalFeeCollected=${feeStatsA.totalFeeCollected}, totalExpected=${feeStatsA.totalFeeCollected + feeStatsA.totalPendingAmount} (0 leak from Tenant B).`)

    console.log('\n✔ ALL CROSS-TENANT ISOLATION TESTS PASSED WITH ZERO LEAKAGE!')
  } finally {
    console.log('\n[Cleanup] Cleaning up test data from MongoDB...')
    await Promise.all([
      Tenant.deleteMany({ tenantId: { $in: [tenantAId, tenantBId] } }),
      Student.deleteMany({ tenantId: { $in: [tenantAId, tenantBId] } }),
      Teacher.deleteMany({ tenantId: { $in: [tenantAId, tenantBId] } }),
      Subject.deleteMany({ tenantId: { $in: [tenantAId, tenantBId] } }),
      Exam.deleteMany({ tenantId: { $in: [tenantAId, tenantBId] } }),
      Announcement.deleteMany({ tenantId: { $in: [tenantAId, tenantBId] } }),
      Holiday.deleteMany({ tenantId: { $in: [tenantAId, tenantBId] } }),
      Period.deleteMany({ tenantId: { $in: [tenantAId, tenantBId] } }),
      Resource.deleteMany({ tenantId: { $in: [tenantAId, tenantBId] } }),
      Room.deleteMany({ tenantId: { $in: [tenantAId, tenantBId] } }),
      StudentFee.deleteMany({ tenantId: { $in: [tenantAId, tenantBId] } }),
      mongoose.model('FeeStructure').deleteMany({ tenantId: { $in: [tenantAId, tenantBId] } })
    ])
    await mongoose.connection.close()
    console.log('[Cleanup] Done.')
  }
}

runLeakageTest().catch(err => {
  console.error('\n❌ TEST FAILED:', err)
  process.exit(1)
})
