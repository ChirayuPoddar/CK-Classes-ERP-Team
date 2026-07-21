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
      `CRITICAL INSTRUCTION: Base your response ONLY on the provided live ERP MongoDB data below. Do NOT fabricate fake dates, cities, or events. If no records exist in the provided context, state that clearly.`
    ]

    // 1. Fetch Announcements from MongoDB
    try {
      if (typeof AnnouncementService.getAllAnnouncements === 'function') {
        const announcementsRes = await AnnouncementService.getAllAnnouncements({ limit: 10 }, user)
        const announcements = announcementsRes.announcements || announcementsRes.data || (Array.isArray(announcementsRes) ? announcementsRes : [])
        if (announcements.length > 0) {
          contextLines.push('\n[Real System Announcements from MongoDB]:')
          announcements.forEach(a => {
            const dateStr = a.publishAt ? new Date(a.publishAt).toLocaleDateString() : 'N/A'
            const audienceStr = Array.isArray(a.audience) ? a.audience.join(', ') : (a.audience || 'All')
            contextLines.push(`- Title: "${a.title}" | Audience: ${audienceStr} | Published: ${dateStr} | Details: ${a.message || a.shortDescription || ''}`)
          })
        } else {
          contextLines.push('\n[Announcements]: No published announcements in database.')
        }
      }
    } catch (e) {
      // Graceful degradation
    }

    // 2. Fetch Enrolled Students from MongoDB (Admin / General view)
    try {
      if (typeof StudentService.getAllStudents === 'function') {
        const studentsRes = await StudentService.getAllStudents({ limit: 10 })
        const studentsList = studentsRes.students || (Array.isArray(studentsRes) ? studentsRes : [])
        const totalCount = studentsRes.total !== undefined ? studentsRes.total : (studentsRes.stats?.totalStudents || studentsList.length)
        
        contextLines.push(`\n[Institutional Metrics]:`)
        contextLines.push(`- Total Enrolled Students in ERP: ${totalCount}`)
        
        if (studentsList.length > 0) {
          contextLines.push(`\n[Sample Enrolled Students Records in MongoDB]:`)
          studentsList.forEach(s => {
            contextLines.push(`- Student ID: ${s.studentId} | Name: ${s.firstName} ${s.lastName} | Class: ${s.class} | Status: ${s.status}`)
          })
        }
      }
    } catch (e) {
      // Graceful degradation
    }

    // 3. Student Specific Role Context
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

    // 4. Fetch Homework Assignments from MongoDB
    try {
      if (typeof HomeworkService.getAllHomeworks === 'function') {
        const hwRes = await HomeworkService.getAllHomeworks({ limit: 10 }, user)
        const hwList = hwRes.homework || hwRes.data || (Array.isArray(hwRes) ? hwRes : [])
        if (hwList.length > 0) {
          contextLines.push(`\n[Homework Assignments in MongoDB]:`)
          hwList.forEach(hw => {
            const dueStr = hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : 'N/A'
            contextLines.push(`- Title: "${hw.title}" | Class: ${hw.class} | Due: ${dueStr} | Status: ${hw.status} | Details: ${hw.description || ''}`)
          })
        }
      }
    } catch (e) {
      // Graceful degradation
    }

    // 5. Fetch Exams from MongoDB
    try {
      if (typeof ExamService.getAllExams === 'function') {
        const examsRes = await ExamService.getAllExams({ limit: 10 })
        const examsList = examsRes.exams || examsRes.data || (Array.isArray(examsRes) ? examsRes : [])
        if (examsList.length > 0) {
          contextLines.push(`\n[Scheduled Exams in MongoDB]:`)
          examsList.forEach(ex => {
            const dateStr = ex.examDate ? new Date(ex.examDate).toLocaleDateString() : 'N/A'
            contextLines.push(`- Exam: "${ex.examName}" | Class: ${ex.class} | Date: ${dateStr} | Status: ${ex.status}`)
          })
        }
      }
    } catch (e) {
      // Graceful degradation
    }

    // 6. Fetch Student Fee Records from MongoDB
    try {
      if (typeof StudentFeeService.getAllStudentFees === 'function') {
        const feeRes = await StudentFeeService.getAllStudentFees({ limit: 10 })
        const feeList = feeRes.fees || feeRes.studentFees || (Array.isArray(feeRes) ? feeRes : [])
        if (feeList.length > 0) {
          contextLines.push(`\n[Student Fee Summaries in MongoDB]:`)
          feeList.forEach(f => {
            const studentName = f.student ? `${f.student.firstName || ''} ${f.student.lastName || ''}`.trim() : 'Student'
            const dueStr = f.dueDate ? new Date(f.dueDate).toLocaleDateString() : 'N/A'
            contextLines.push(`- Student: ${studentName} | Total Fee: ₹${f.totalFee} | Paid: ₹${f.paidAmount} | Due: ${dueStr} | Status: ${f.status}`)
          })
        }
      }
    } catch (e) {
      // Graceful degradation
    }

    contextLines.push(`\n[Response Rules]: Answer the user's question directly based on the ERP MongoDB data above. Keep your tone helpful, professional, and concise. Automatically detect the user's input language (English, Hindi/हिंदी, Hinglish, Marathi/मराठी, Gujarati/ગુજરાતી, etc.) and respond fluently in that exact language or script.`)

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
