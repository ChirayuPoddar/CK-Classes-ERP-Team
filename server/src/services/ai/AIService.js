const User = require('../../models/User')
const Student = require('../../models/Student')
const Tenant = require('../../models/Tenant')
const Teacher = require('../../models/Teacher')
const Subject = require('../../models/Subject')
const Announcement = require('../../models/Announcement')
const Homework = require('../../models/Homework')
const Exam = require('../../models/Exam')
const StudentFee = require('../../models/StudentFee')
const Resource = require('../../models/Resource')

const AIProviderFactory = require('./AIProviderFactory')
const StudentService = require('../StudentService')
const TeacherService = require('../TeacherService')
const SubjectService = require('../SubjectService')
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
    
    let institutionName = 'C.K. Classes'
    try {
      if (user.tenantId) {
        const tenant = await Tenant.findById(user.tenantId).select('institutionName name')
        if (tenant) institutionName = tenant.institutionName || tenant.name || institutionName
      }
    } catch (e) {
      console.error('[AIService] Error fetching tenant for branding', e)
    }

    const contextLines = [
      `System Role: You are an intelligent institutional AI Assistant for ${institutionName}.`,
      `Logged-in User Identity: ${user.firstName || user.email} (${user.email}), Role: ${user.role}.`,
      `Current Date & Time: ${new Date().toISOString()}`,
      `CRITICAL INSTRUCTION: Use the provided MONGODB DATA SUMMARY below to answer questions about student counts, staff, exams, and announcements accurately. Never say data is missing when counts are listed below.`
    ]

    // 0. Fetch Real-time Institutional Statistics & Overview Metrics
    try {
      const tenantId = user.tenantId
      const tenantFilter = tenantId ? { tenantId } : {}
      const [totalStudents, activeStudents, totalTeachers, totalSubjects, totalExams, totalAnnouncements, totalParents] = await Promise.all([
        Student.countDocuments(tenantFilter),
        Student.countDocuments({ ...tenantFilter, status: { $regex: /^active$/i } }),
        Teacher.countDocuments(tenantFilter),
        Subject.countDocuments(tenantFilter),
        Exam.countDocuments(tenantFilter),
        Announcement.countDocuments(tenantFilter),
        User.countDocuments({ ...tenantFilter, role: { $regex: /^parent$/i } })
      ])

      contextLines.push('\n[PRIMARY MONGODB INSTITUTIONAL DATA SUMMARY]:')
      contextLines.push(`- TOTAL ENROLLED STUDENTS COUNT: ${totalStudents} (Active Students: ${activeStudents})`)
      contextLines.push(`- TOTAL FACULTY TEACHERS COUNT: ${totalTeachers}`)
      contextLines.push(`- TOTAL PARENTS REGISTERED: ${totalParents}`)
      contextLines.push(`- TOTAL SUBJECTS OFFERED: ${totalSubjects}`)
      contextLines.push(`- TOTAL SCHEDULED EXAMS COUNT: ${totalExams}`)
      contextLines.push(`- TOTAL SYSTEM ANNOUNCEMENTS COUNT: ${totalAnnouncements}`)

      if (['admin', 'staff', 'teacher', 'superadmin'].includes(role)) {
        try {
          if (typeof StudentService.getAllStudents === 'function') {
            const studentsRes = await StudentService.getAllStudents({ limit: 5, tenantId: user.tenantId }, user)
            const studentList = studentsRes.students || studentsRes.data || (Array.isArray(studentsRes) ? studentsRes : [])
            if (studentList.length > 0) {
              contextLines.push('\n[Enrolled Students Sample Records]:')
              studentList.forEach(st => {
                contextLines.push(`- Student: ${st.firstName} ${st.lastName} | ID: ${st.studentId} | Class/Grade: ${st.class || 'N/A'} | Status: ${st.status || 'Active'}`)
              })
            }
          }
        } catch (e) {
          // Graceful degradation
        }

        try {
          if (typeof TeacherService.getAllTeachers === 'function') {
            const teachersRes = await TeacherService.getAllTeachers({ limit: 5, tenantId: user.tenantId }, user)
            const teacherList = teachersRes.teachers || teachersRes.data || (Array.isArray(teachersRes) ? teachersRes : [])
            if (teacherList.length > 0) {
              contextLines.push('\n[Faculty Mentors Snapshot]:')
              teacherList.forEach(t => {
                const subjs = Array.isArray(t.subjects) ? t.subjects.join(', ') : (t.subjects || 'General')
                contextLines.push(`- Teacher: ${t.firstName} ${t.lastName} | ID: ${t.teacherId} | Qualification: ${t.qualification || 'N/A'} | Subjects: ${subjs}`)
              })
            }
          }
        } catch (e) {
          // Graceful degradation
        }
      }
    } catch (e) {
      // Graceful degradation
    }

    // 1. Fetch Announcements & Homework
    try {
      if (typeof AnnouncementService.getAllAnnouncements === 'function') {
        const announcementsRes = await AnnouncementService.getAllAnnouncements({ limit: 3, tenantId: user.tenantId }, user)
        const announcementsList = announcementsRes.announcements || announcementsRes.data || []
        if (announcementsList.length > 0) {
          contextLines.push('\n[Recent System Announcements]:')
          announcementsList.forEach(a => {
            const dateStr = a.publishAt ? new Date(a.publishAt).toLocaleDateString() : 'N/A'
            contextLines.push(`- Title: "${a.title}" | Date: ${dateStr} | Details: ${a.message || a.shortDescription || ''}`)
          })
        }
      }

      if (typeof HomeworkService.getAllHomeworks === 'function') {
        const hwRes = await HomeworkService.getAllHomeworks({ limit: 3, tenantId: user.tenantId }, user)
        const hwList = hwRes.homework || hwRes.data || []
        if (hwList.length > 0) {
          contextLines.push(`\n[Assigned Homework Records]:`)
          hwList.forEach(hw => {
            const dueStr = hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : 'N/A'
            contextLines.push(`- Title: "${hw.title}" | Class: ${hw.class} | Due: ${dueStr} | Status: ${hw.status}`)
          })
        }
      }
    } catch (e) {
      // Graceful degradation
    }

    // Student Role Specific Context
    if (role === 'student' && user.linkedStudent) {
      try {
        const studentProfile = await StudentService.getStudentById(user.linkedStudent, user.tenantId)
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
        const feeRes = await StudentFeeService.getAllStudentFees({ limit: 3, tenantId: user.tenantId })
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

    contextLines.push(`
[Response Rules]:
1. CRITICAL: You MUST respond in the EXACT same language and script (alphabet/characters) in which the user's question was asked.
   - If the user asks in English (e.g. "What is the student count?"), you MUST respond in English.
   - If the user asks in Hindi / Devanagari (e.g. "छात्रों की संख्या बताएं"), you MUST respond in Hindi (Devanagari script).
   - If the user asks in Hinglish (Hindi written in Latin script, e.g. "student count kitna hai"), you MUST respond in Hinglish using Latin script.
   - If the user asks in Marathi / Devanagari (e.g. "विद्यार्थी संख्या किती आहे"), you MUST respond in Marathi (Devanagari script).
   - If the user asks in Gujarati (e.g. "વિદ્યાર્થીઓની સંખ્યા કેટલી છે"), you MUST respond in Gujarati (Gujarati script).
2. Answer the user's question directly based on the ERP MONGODB DATA SUMMARY above. Keep your tone helpful, professional, and concise.
`)

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

  /**
   * Generate structured Quiz / Question Paper from ERP Resource or Topic
   * @param {Object} user User context
   * @param {Object} params { resourceId, topic, className, count, difficulty }
   */
  async generateQuizFromResource(user, params = {}) {
    let resourceTitle = 'General ERP Curriculum'
    let resourceDetails = ''

    if (params.resourceId) {
      try {
        const resDoc = await Resource.findOne({ _id: params.resourceId, ...(user.tenantId ? { tenantId: user.tenantId } : {}) }).populate('subject')
        if (resDoc) {
          resourceTitle = resDoc.title
          resourceDetails = `Title: ${resDoc.title}\nCategory: ${resDoc.category}\nClass: ${resDoc.class || 'N/A'}\nDescription: ${resDoc.description || ''}\nTags: ${(resDoc.tags || []).join(', ')}`
        }
      } catch (err) {
        // Fallback to topic
      }
    }

    const count = parseInt(params.count, 10) || 5
    const difficulty = params.difficulty || 'Medium'
    const className = params.className || 'Class 10'
    const topic = params.topic || params.subject || 'General Studies'

    let institutionName = 'C.K. Classes'
    try {
      if (user.tenantId) {
        const tenant = await Tenant.findById(user.tenantId).select('institutionName name')
        if (tenant) institutionName = tenant.institutionName || tenant.name || institutionName
      }
    } catch (e) {
      console.error('[AIService] Error fetching tenant for branding', e)
    }

    const systemPrompt = `You are an expert academic examiner for ${institutionName}. Your task is to generate a structured exam question paper based on the provided study resource / topic.

CRITICAL: Output MUST be a valid JSON object matching this exact schema and NOTHING ELSE (no markdown backticks, no markdown formatting outside JSON):
{
  "title": "${resourceTitle} - Test Paper",
  "className": "${className}",
  "topic": "${topic}",
  "totalMarks": ${count * 2},
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "marks": 2,
      "question": "Question text here",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "answer": "A) Option 1",
      "explanation": "Step-by-step solution"
    }
  ]
}`

    const userPrompt = `Generate a ${count}-question ${difficulty} test paper for ${className} on topic "${topic}".
Context Source Data:
${resourceDetails || `Topic: ${topic}\nClass: ${className}`}
`

    const provider = AIProviderFactory.getProvider()
    const rawResponse = await provider.generateResponse(userPrompt, systemPrompt, { maxTokens: 4096 })

    try {
      const firstBrace = rawResponse.indexOf('{')
      if (firstBrace !== -1) {
        let jsonSub = rawResponse.substring(firstBrace)
        const lastBrace = jsonSub.lastIndexOf('}')
        if (lastBrace !== -1) {
          jsonSub = jsonSub.substring(0, lastBrace + 1)
        }
        try {
          return JSON.parse(jsonSub)
        } catch (err) {
          // Attempt partial JSON repair for truncated arrays
          const lastObjectEnd = jsonSub.lastIndexOf('}')
          if (lastObjectEnd !== -1) {
            const repaired = jsonSub.substring(0, lastObjectEnd + 1) + '\n]}'
            try {
              return JSON.parse(repaired)
            } catch (err2) {}
          }
        }
      }
      throw new Error('No valid JSON object found in response')
    } catch (e) {
      return {
        title: `${resourceTitle} Test Paper`,
        className,
        topic,
        totalMarks: count * 2,
        difficulty,
        rawText: rawResponse,
        questions: []
      }
    }
  }
}

module.exports = new AIService()
