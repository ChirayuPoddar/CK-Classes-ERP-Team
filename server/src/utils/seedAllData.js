const mongoose = require('mongoose')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../.env') })

const User = require('../models/User')
const Subject = require('../models/Subject')
const Student = require('../models/Student')
const Teacher = require('../models/Teacher')
const Announcement = require('../models/Announcement')
const Homework = require('../models/Homework')
const Exam = require('../models/Exam')
const StudentFee = require('../models/StudentFee')

const seedAll = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ck_classes'
    console.log(`Connecting to MongoDB Atlas: ${mongoUri.replace(/:[^:@]+@/, ':****@')}`)
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB successfully.')

    // 1. Seed Admin User
    const bcrypt = require('bcryptjs')
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash('password123', salt)

    let admin = await User.findOne({ email: 'admin@ckclasses.com' })
    if (!admin) {
      admin = new User({
        firstName: 'Chirayu',
        lastName: 'Poddar',
        email: 'admin@ckclasses.com',
        passwordHash,
        role: 'admin',
        isActive: true
      })
      await admin.save()
      console.log('Created Admin User: admin@ckclasses.com')
    } else {
      admin.passwordHash = passwordHash
      admin.isActive = true
      await admin.save()
      console.log('Updated Admin User passwordHash: admin@ckclasses.com')
    }

    // 2. Seed Subjects
    await Subject.deleteMany({})
    const subjectsData = [
      { subjectId: 'SUB20260001', name: 'Mathematics', code: 'MATH10', class: 'Class 10', periodsPerWeek: 6, status: 'Active' },
      { subjectId: 'SUB20260002', name: 'Physics', code: 'PHY09', class: 'Class 9', periodsPerWeek: 5, status: 'Active' },
      { subjectId: 'SUB20260003', name: 'Chemistry', code: 'CHEM11', class: 'Class 11 Science', stream: 'Science', periodsPerWeek: 6, status: 'Active' },
      { subjectId: 'SUB20260004', name: 'Biology', code: 'BIO12', class: 'Class 12 Science', stream: 'Science', periodsPerWeek: 5, status: 'Active' }
    ]
    const createdSubjects = await Subject.insertMany(subjectsData)
    console.log(`Seeded ${createdSubjects.length} Subjects.`)

    // 3. Seed Teachers
    await Teacher.deleteMany({})
    const teachersData = [
      { teacherId: 'TCH20260001', firstName: 'Vikram', lastName: 'Singh', email: 'vikram.singh@example.com', phone: '9811122233', gender: 'Male', dateOfBirth: new Date('1985-03-12'), qualification: 'M.Sc Mathematics', joiningDate: new Date('2020-06-01'), status: 'Active' },
      { teacherId: 'TCH20260002', firstName: 'Priya', lastName: 'Nair', email: 'priya.nair@example.com', phone: '9811122234', gender: 'Female', dateOfBirth: new Date('1988-07-25'), qualification: 'Ph.D Physics', joiningDate: new Date('2021-08-15'), status: 'Active' }
    ]
    const createdTeachers = await Teacher.insertMany(teachersData)
    console.log(`Seeded ${createdTeachers.length} Teachers.`)

    // 4. Seed Students
    await Student.deleteMany({})
    const studentsData = [
      { studentId: 'STU20260001', firstName: 'Aarav', lastName: 'Sharma', gender: 'Male', dateOfBirth: new Date('2008-05-15'), email: 'aarav.sharma@example.com', phone: '9876543210', class: 'Class 10', category: 'General', academicYear: '2025-2026', admissionDate: new Date('2025-04-01'), status: 'Active' },
      { studentId: 'STU20260002', firstName: 'Ananya', lastName: 'Verma', gender: 'Female', dateOfBirth: new Date('2009-08-20'), email: 'ananya.verma@example.com', phone: '9876543211', class: 'Class 9', category: 'General', academicYear: '2025-2026', admissionDate: new Date('2025-04-01'), status: 'Active' },
      { studentId: 'STU20260003', firstName: 'Rohan', lastName: 'Gupta', gender: 'Male', dateOfBirth: new Date('2007-11-10'), email: 'rohan.gupta@example.com', phone: '9876543212', class: 'Class 11 Science', category: 'OBC', academicYear: '2025-2026', admissionDate: new Date('2025-04-01'), status: 'Active' }
    ]
    const createdStudents = await Student.insertMany(studentsData)
    console.log(`Seeded ${createdStudents.length} Students.`)

    // 5. Seed Homework
    await Homework.deleteMany({})
    const mathSub = createdSubjects.find(s => s.code === 'MATH10')
    const homeworkData = [
      { title: 'Algebra Chapter 3 Exercises', description: 'Solve questions 1 to 15 from Quadratic Equations chapter.', class: 'Class 10', subject: mathSub._id, teacher: createdTeachers[0]._id, dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), status: 'Pending', createdBy: admin._id },
      { title: 'Physics Laws of Motion Numerical Problems', description: 'Complete problem set on Force and Acceleration.', class: 'Class 9', subject: createdSubjects[1]._id, teacher: createdTeachers[1]._id, dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), status: 'Pending', createdBy: admin._id }
    ]
    await Homework.insertMany(homeworkData)
    console.log('Seeded Homework assignments.')

    // 6. Seed Announcements
    await Announcement.deleteMany({})
    const announcementsData = [
      { title: 'Annual Sports Meet 2026', shortDescription: 'Annual sports day schedule and registrations.', message: 'Events include Track & Field, Chess, Badminton, and Table Tennis.', audience: ['Entire Institute'], publishAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), isPinned: true, status: 'Published', createdBy: admin._id },
      { title: 'Class 10 Mathematics Revision Class', shortDescription: 'Extra algebra revision classes for board exam students.', message: 'Extra Mathematics revision session this Sunday focusing on Quadratic Equations.', audience: ['Specific Class'], class: 'Class 10', publishAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), isPinned: false, status: 'Published', createdBy: admin._id },
      { title: 'Parent-Teacher Interaction Meet', shortDescription: 'Monthly meeting to review student progress.', message: 'Discuss mid-term test results. Academic feedback logs will be shared.', audience: ['Parents Only'], publishAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), isPinned: false, status: 'Published', createdBy: admin._id }
    ]
    await Announcement.insertMany(announcementsData)
    console.log('Seeded Announcements.')

    // 7. Seed Exams
    await Exam.deleteMany({})
    const examsData = [
      { examName: 'Class 10 Mathematics Mid-Term Exam', class: 'Class 10', subject: mathSub._id, examDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), startTime: '09:00', endTime: '12:00', totalMarks: 100, passingMarks: 35, status: 'Scheduled', createdBy: admin._id },
      { examName: 'Class 9 Physics Unit Test 1', class: 'Class 9', subject: createdSubjects[1]._id, examDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), startTime: '10:00', endTime: '11:30', totalMarks: 50, passingMarks: 18, status: 'Completed', createdBy: admin._id }
    ]
    await Exam.insertMany(examsData)
    console.log('Seeded Exams.')

    // 8. Seed Student Fees
    await StudentFee.deleteMany({})
    const feesData = [
      { student: createdStudents[0]._id, totalFee: 25000, paidAmount: 15000, discount: 0, status: 'Partial', dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), remarks: 'First installment paid' },
      { student: createdStudents[1]._id, totalFee: 22000, paidAmount: 22000, discount: 0, status: 'Paid', dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), remarks: 'Fully paid' }
    ]
    await StudentFee.insertMany(feesData)
    console.log('Seeded Student Fees.')

    console.log('🎉 ALL MONGODB DATA SEEDED SUCCESSFULLY!')
    process.exit(0)
  } catch (err) {
    console.error('Seeding error:', err)
    process.exit(1)
  }
}

seedAll()
