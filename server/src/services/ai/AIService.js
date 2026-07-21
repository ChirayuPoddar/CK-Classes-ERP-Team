// Ensure Mongoose models are registered for population
require('../../models/User')
require('../../models/Student')
require('../../models/Teacher')
require('../../models/Subject')
require('../../models/Announcement')
require('../../models/Homework')
require('../../models/Exam')
require('../../models/StudentFee')

const AIProviderFactory = require('./AIProviderFactory')
const StudentService = require('../StudentService')
const TeacherService = require('../TeacherService')
const HomeworkService = require('../HomeworkService')
const ExamService = require('../ExamService')
const StudentFeeService = require('../StudentFeeService')
const TimetableService = require('../TimetableService')
const AnnouncementService = require('../AnnouncementService')
const AttendanceService = require('../AttendanceService')
const ApiError = require('../../utils/ApiError')

class AIService {
  /**
   * Builds context summary from domain services based on user role and scope
   * @param {Object} user req.user context
   * @returns {Promise<String>} Formatted system context string
   */
  async buildContextForUser(user) {
    const role = (user.role || '').toLowerCase()
    const contextLines = [
      `System Role: You are C.K. ERP AI Assistant, an intelligent institutional AI for C.K. Classes.`,
      `Logged-in User Identity: ${user.firstName || user.email} (${user.email}), Role: ${user.role}.`,
      `Current Date & Time: ${new Date().toISOString()}`,
      `CRITICAL INSTRUCTION: Use the provided MONGODB DATA SUMMARY below to answer questions about student counts, staff, exams, and announcements accurately. Never say data is missing when counts are listed below.`
    ]

    // Primary Summary Metrics
    try {
      const [studentsRes, teachersRes, examsRes, announcementsRes, hwRes] = await Promise.all([
        typeof StudentService.getAllStudents === 'function' ? StudentService.getAllStudents({ limit: 10 }) : { total: 0, students: [] },
        typeof TeacherService.getAllTeachers === 'function' ? TeacherService.getAllTeachers({ limit: 10 }) : { total: 0, data: [] },
        typeof ExamService.getAllExams === 'function' ? ExamService.getAllExams({ limit: 10 }) : { total: 0, exams: [] },
        typeof AnnouncementService.getAllAnnouncements === 'function' ? AnnouncementService.getAllAnnouncements({ limit: 10 }, user) : { total: 0, announcements: [] },
        typeof HomeworkService.getAllHomeworks === 'function' ? HomeworkService.getAllHomeworks({ limit: 10 }, user) : { total: 0, homework: [] }
      ])

      const totalStudentsCount = studentsRes.total !== undefined ? studentsRes.total : (studentsRes.students ? studentsRes.students.length : 0)
      const totalTeachersCount = teachersRes.total !== undefined ? teachersRes.total : (teachersRes.data ? teachersRes.data.length : 0)
      const totalExamsCount = examsRes.total !== undefined ? examsRes.total : (examsRes.exams ? examsRes.exams.length : 0)
      const totalAnnouncementsCount = announcementsRes.total !== undefined ? announcementsRes.total : (announcementsRes.announcements ? announcementsRes.announcements.length : 0)
      const totalHwCount = hwRes.total !== undefined ? hwRes.total : (hwRes.homework ? hwRes.homework.length : 0)

      contextLines.push(`\n[PRIMARY MONGODB INSTITUTIONAL DATA SUMMARY]:`)
      contextLines.push(`- TOTAL ENROLLED STUDENTS COUNT: ${totalStudentsCount}`)
      contextLines.push(`- TOTAL FACULTY TEACHERS COUNT: ${totalTeachersCount}`)
      contextLines.push(`- TOTAL SCHEDULED EXAMS COUNT: ${totalExamsCount}`)
      contextLines.push(`- TOTAL SYSTEM ANNOUNCEMENTS COUNT: ${totalAnnouncementsCount}`)
      contextLines.push(`- TOTAL HOMEWORK ASSIGNMENTS COUNT: ${totalHwCount}`)

      // Detail Lists
      const announcementsList = announcementsRes.announcements || announcementsRes.data || []
      if (announcementsList.length > 0) {
        contextLines.push('\n[Recent System Announcements]:')
        announcementsList.forEach(a => {
          const dateStr = a.publishAt ? new Date(a.publishAt).toLocaleDateString() : 'N/A'
          contextLines.push(`- Title: "${a.title}" | Date: ${dateStr} | Details: ${a.message || a.shortDescription || ''}`)
        })
      }

      const studentsList = studentsRes.students || []
      if (studentsList.length > 0) {
        contextLines.push(`\n[Enrolled Students Sample Records]:`)
        studentsList.forEach(s => {
          contextLines.push(`- Student ID: ${s.studentId} | Name: ${s.firstName} ${s.lastName} | Class: ${s.class} | Status: ${s.status}`)
        })
      }

      const examsList = examsRes.exams || examsRes.data || []
      if (examsList.length > 0) {
        contextLines.push(`\n[Scheduled Exams Records]:`)
        examsList.forEach(ex => {
          const dateStr = ex.examDate ? new Date(ex.examDate).toLocaleDateString() : 'N/A'
          contextLines.push(`- Exam: "${ex.examName}" | Class: ${ex.class} | Date: ${dateStr} | Status: ${ex.status}`)
        })
      }

      const hwList = hwRes.homework || hwRes.data || []
      if (hwList.length > 0) {
        contextLines.push(`\n[Assigned Homework Records]:`)
        hwList.forEach(hw => {
          const dueStr = hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : 'N/A'
          contextLines.push(`- Title: "${hw.title}" | Class: ${hw.class} | Due: ${dueStr} | Status: ${hw.status}`)
        })
      }

    } catch (e) {
      // Graceful degradation
    }

    // Student Role Specific Context
    if (role === 'student' && user.linkedStudent) {
      try {
        const studentProfile = await StudentService.getStudentById(user.linkedStudent)
        if (studentProfile) {
          contextLines.push(`\n[Active Student Profile]:`)
          contextLines.push(`- ID: ${studentProfile.studentId}, Name: ${studentProfile.firstName} ${studentProfile.lastName}, Class: ${studentProfile.class}, Status: ${studentProfile.status}`)
        }
      } catch (e) {
        // Graceful degradation
      }
    }

    // Student Fee Records
    try {
      if (typeof StudentFeeService.getAllStudentFees === 'function') {
        const feeRes = await StudentFeeService.getAllStudentFees({ limit: 10 })
        const feeList = feeRes.fees || feeRes.studentFees || (Array.isArray(feeRes) ? feeRes : [])
        if (feeList.length > 0) {
          contextLines.push(`\n[Student Fee Summaries]:`)
          feeList.forEach(f => {
            const studentName = f.student ? `${f.student.firstName || ''} ${f.student.lastName || ''}`.trim() : 'Student'
            const dueStr = f.dueDate ? new Date(f.dueDate).toLocaleDateString() : 'N/A'
            contextLines.push(`- Student: ${studentName} | Total Fee: ₹${f.totalFee} | Paid: ₹${f.paidAmount} | Status: ${f.status}`)
          })
        }
      }
    } catch (e) {
      // Graceful degradation
    }

    contextLines.push(`\n[Response Rules]: Answer the user's question directly based on the ERP MONGODB DATA SUMMARY above. Keep your tone helpful, professional, and concise. Automatically detect the user's input language (English, Hindi/हिंदी, Hinglish, Marathi/मराठी, Gujarati/ગુજરાતી, etc.) and respond fluently in that exact language or script.`)

    return contextLines.join('\n')
  }

  /**
   * Process AI Query from authenticated user
   * @param {Object} user req.user context
   * @param {String} prompt User's question or prompt
   * @returns {Promise<Object>} Response text and metadata
   */
  async processQuery(user, prompt) {
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      throw new ApiError('AI query prompt cannot be empty.', 400, 'VALIDATION_ERROR')
    }

    // 1. Build context using Domain Services
    const systemContext = await this.buildContextForUser(user)

    // 2. Obtain provider from Factory
    const provider = AIProviderFactory.getProvider()

    // 3. Execute prompt generation
    const responseText = await provider.generateResponse(prompt.trim(), systemContext)

    return {
      success: true,
      query: prompt.trim(),
      response: responseText,
      provider: process.env.AI_PROVIDER || 'groq',
      timestamp: new Date()
    }
  }
}

module.exports = new AIService()
