const mongoose = require('mongoose')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../.env') })

const Exam = require('../models/Exam')
const ExamMark = require('../models/ExamMark')
const Student = require('../models/Student')
const Subject = require('../models/Subject')
const User = require('../models/User')

const seed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ck_classes'
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB database successfully.')

    // Find admin user for audit fields
    const admin = await User.findOne({ role: 'admin' })
    const createdBy = admin ? admin._id : new mongoose.Types.ObjectId()

    // Retrieve active subjects
    const subjects = await Subject.find({ status: 'Active' })
    if (subjects.length === 0) {
      console.log('No active subjects found. Please seed subjects first.')
      process.exit(0)
    }

    // Group subjects by class name
    const subjectsByClass = {}
    subjects.forEach(sub => {
      if (!subjectsByClass[sub.class]) {
        subjectsByClass[sub.class] = []
      }
      subjectsByClass[sub.class].push(sub)
    })

    const targetClasses = Object.keys(subjectsByClass)
    if (targetClasses.length === 0) {
      console.log('No classes with active subjects found.')
      process.exit(0)
    }

    // Clean current collections to prevent unique conflict constraints
    await Exam.deleteMany({})
    await ExamMark.deleteMany({})
    console.log('Cleared existing Exams and ExamMarks collections.')

    for (const className of targetClasses) {
      const classSubjects = subjectsByClass[className]
      const students = await Student.find({ class: className, status: 'Active' })

      if (students.length === 0) {
        console.log(`No active student roster in class ${className}. Skipping...`)
        continue
      }

      // Pick up to 3 subjects for this class to create distinct exams
      const limitSubjects = classSubjects.slice(0, 3)

      // 1. Create a Published Exam (Mid-Term Assessment)
      const sub1 = limitSubjects[0]
      if (sub1) {
        const exam1 = new Exam({
          examName: `${sub1.name} Mid-Term Assessment`,
          academicYear: '2026',
          class: className,
          subjectId: sub1._id,
          examDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago (Passed -> Completed status)
          startTime: '09:00',
          endTime: '12:00',
          maxMarks: 100,
          passingMarks: 40,
          instructions: 'Attempt all questions. Calculators and digital watches are strictly prohibited.',
          status: 'Published',
          createdBy
        })
        await exam1.save()

        // Seed marks for published exam
        const marksEntries = []
        students.forEach(student => {
          const marksObtained = Math.floor(Math.random() * (98 - 35 + 1)) + 35
          const percentage = parseFloat(((marksObtained / 100) * 100).toFixed(2))
          
          let grade = 'F'
          if (percentage >= 90) grade = 'A+'
          else if (percentage >= 80) grade = 'A'
          else if (percentage >= 70) grade = 'B+'
          else if (percentage >= 65) grade = 'B'
          else if (percentage >= 50) grade = 'C'
          else if (percentage >= 40) grade = 'D'

          const result = marksObtained >= 40 ? 'PASS' : 'FAIL'

          marksEntries.push({
            examId: exam1._id,
            studentId: student._id,
            subjectId: sub1._id,
            marksObtained,
            maxMarks: 100,
            percentage,
            grade,
            result,
            remarks: result === 'PASS' ? 'Passed with good score.' : 'Needs guidance and revision sessions.',
            enteredBy: createdBy
          })
        })
        if (marksEntries.length > 0) {
          await ExamMark.insertMany(marksEntries)
        }
      }

      // 2. Create a Scheduled Exam (Final Term Exam)
      const sub2 = limitSubjects[1] || sub1
      if (sub2) {
        const exam2 = new Exam({
          examName: `${sub2.name} Final Term Exam`,
          academicYear: '2026',
          class: className,
          subjectId: sub2._id,
          examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days later
          startTime: '10:00',
          endTime: '13:00',
          maxMarks: 100,
          passingMarks: 40,
          instructions: 'Covers the full yearly curriculum. Carry your physical entry card.',
          status: 'Scheduled',
          createdBy
        })
        await exam2.save()
      }

      // 3. Create another Scheduled Exam (Class Test)
      const sub3 = limitSubjects[2] || sub1
      if (sub3) {
        const exam3 = new Exam({
          examName: `${sub3.name} Class Test`,
          academicYear: '2026',
          class: className,
          subjectId: sub3._id,
          examDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days later
          startTime: '14:00',
          endTime: '15:30',
          maxMarks: 50,
          passingMarks: 20,
          instructions: 'Short revision test for assessment.',
          status: 'Scheduled',
          createdBy
        })
        await exam3.save()
      }

      console.log(`Created 3 exams for class grade: ${className}`)
    }

    console.log('MongoDB database seeding completed successfully!')
    mongoose.connection.close()
  } catch (err) {
    console.error('Seeding process failed:', err)
    process.exit(1)
  }
}

seed()
