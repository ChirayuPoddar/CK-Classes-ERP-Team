const mongoose = require('mongoose')
const Exam = require('../models/Exam')
const ExamMark = require('../models/ExamMark')
const Student = require('../models/Student')
const Subject = require('../models/Subject')

const classHierarchy = [
  'Play Group', 'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11 Science', 'Class 11 Commerce',
  'Class 12 Science', 'Class 12 Commerce'
]

const getClassSortIndex = (className) => {
  if (!className) return 99900
  const str = String(className).trim()
  for (let i = 0; i < classHierarchy.length; i++) {
    const hClass = classHierarchy[i]
    if (str === hClass) {
      return i * 100
    }
    if (str.startsWith(hClass + ' ')) {
      const sectionPart = str.slice(hClass.length).trim()
      const code = sectionPart.charCodeAt(0) || 0
      return i * 100 + code
    }
  }
  return 99900
}
class ExamService {
  /**
   * Helper to calculate letter grades according to ERP grading rules
   */
  calculateGrade(percentage) {
    if (percentage >= 90) return 'A+'
    if (percentage >= 80) return 'A'
    if (percentage >= 70) return 'B+'
    if (percentage >= 65) return 'B'
    if (percentage >= 50) return 'C'
    if (percentage >= 40) return 'D'
    return 'F'
  }

  /**
   * Helper to calculate dynamic status based on current local system time
   */
  deriveStatus(examDate, startTime, endTime) {
    const now = new Date()
    const examDateOnly = new Date(examDate)

    const parseTime = (timeStr, baseDate) => {
      const d = new Date(baseDate)
      const match = String(timeStr).trim().match(/^(\d+):(\d+)\s*(AM|PM)?$/i)
      let hours = 0
      let minutes = 0
      if (match) {
        hours = parseInt(match[1], 10)
        minutes = parseInt(match[2], 10)
        const ampm = match[3]
        if (ampm) {
          if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12
          if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0
        }
      } else {
        const parts = String(timeStr).split(':')
        hours = parseInt(parts[0], 10) || 0
        minutes = parseInt(parts[1], 10) || 0
      }
      d.setHours(hours, minutes, 0, 0)
      return d
    }

    const startDateTime = parseTime(startTime, examDateOnly)
    const endDateTime = parseTime(endTime, examDateOnly)

    if (now < startDateTime) {
      return 'Scheduled'
    } else if (now >= startDateTime && now <= endDateTime) {
      return 'Active'
    } else {
      return 'Completed'
    }
  }

  /**
   * Helper to automatically transition status on retrieval if not Published
   */
  async autoTransitionStatus(exam) {
    if (!exam || exam.isDeleted) return exam
    if (exam.status === 'Published') return exam

    const calculated = this.deriveStatus(exam.examDate, exam.startTime, exam.endTime)
    if (exam.status !== calculated) {
      exam.status = calculated
      await Exam.updateOne({ _id: exam._id }, { status: calculated })
    }
    return exam
  }

  /**
   * Create a new Exam configuration
   */
  async createExam(data, userId) {
    // 1. Verify subject exists and belongs to class
    const subject = await Subject.findOne({
      _id: data.subjectId,
      class: data.class,
      status: 'Active',
      tenantId: data.tenantId
    }).lean()
    
    if (!subject) {
      throw new Error('Selected subject is invalid or does not belong to the selected class grade')
    }

    // 2. Check uniqueness: Exam Name must be unique within same academic year, class and subject
    const existing = await Exam.findOne({
      examName: data.examName.trim(),
      academicYear: data.academicYear.trim(),
      class: data.class.trim(),
      subjectId: data.subjectId,
      isDeleted: { $ne: true },
      tenantId: data.tenantId
    }).lean()
    
    if (existing) {
      throw new Error('An exam with this name and subject already exists for this class and academic year')
    }

    // Always create as Scheduled initially
    const calculatedStatus = this.deriveStatus(data.examDate, data.startTime, data.endTime)

    const exam = new Exam({
      ...data,
      status: calculatedStatus,
      createdBy: userId,
      tenantId: data.tenantId
    })
    await exam.save()
    return this.getExamById(exam._id, data.tenantId)
  }

  /**
   * Fetch single exam details
   */
  async getExamById(id, tenantId) {
    let exam = await Exam.findOne({ _id: id, isDeleted: { $ne: true }, tenantId })
      .populate('subjectId')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('publishedBy', 'firstName lastName email')
    
    if (!exam) {
      throw new Error('Exam not found')
    }
    exam = await this.autoTransitionStatus(exam)
    return exam.toObject()
  }

  /**
   * Fetch paginated and filtered exams list
   */
  async getAllExams(queryParams) {
    const page = parseInt(queryParams.page, 10) || 1
    const limit = parseInt(queryParams.limit, 10) || 10
    const skip = (page - 1) * limit

    const filter = { isDeleted: { $ne: true }, tenantId: queryParams.tenantId }

    if (queryParams.class) {
      filter.class = queryParams.class
    }
    if (queryParams.status) {
      filter.status = queryParams.status
    }
    if (queryParams.academicYear) {
      filter.academicYear = queryParams.academicYear
    }
    if (queryParams.subjectId) {
      filter.subjectId = queryParams.subjectId
    }
    if (queryParams.examDate) {
      const startOfDay = new Date(queryParams.examDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(queryParams.examDate)
      endOfDay.setHours(23, 59, 59, 999)
      filter.examDate = { $gte: startOfDay, $lte: endOfDay }
    }

    if (queryParams.search) {
      const regex = new RegExp(queryParams.search.trim(), 'i')
      const matchSubjects = await Subject.find({ name: regex, status: 'Active', tenantId: queryParams.tenantId }).select('_id').lean()
      const subjectIds = matchSubjects.map(s => s._id)
      
      filter.$or = [
        { examName: regex },
        { class: regex },
        { subjectId: { $in: subjectIds } }
      ]
    }

    // Run auto transitions on all matching exams in database first
    const exams = await Exam.find(filter)
      .populate('subjectId')
      .lean()

    for (let exam of exams) {
      await this.autoTransitionStatus(exam)
    }

    // Dynamic custom sorting on complete dataset before pagination
    if (queryParams.sortBy) {
      let sortField = queryParams.sortBy
      let sortOrder = 1
      if (sortField.startsWith('-')) {
        sortField = sortField.slice(1)
        sortOrder = -1
      }

      if (sortField === 'academicYear') {
        exams.sort((a, b) => {
          const valA = String(a.academicYear || '')
          const valB = String(b.academicYear || '')
          const cmp = valA.localeCompare(valB)
          if (cmp !== 0) return cmp * sortOrder
          return String(a.examName || '').localeCompare(String(b.examName || ''))
        })
      } else if (sortField === 'class') {
        exams.sort((a, b) => {
          const cmp = getClassSortIndex(a.class) - getClassSortIndex(b.class)
          if (cmp !== 0) return cmp * sortOrder
          return String(a.examName || '').localeCompare(String(b.examName || ''))
        })
      } else if (sortField === 'subjectId') {
        exams.sort((a, b) => {
          const nameA = String(a.subjectId?.name || '')
          const nameB = String(b.subjectId?.name || '')
          const cmp = nameA.localeCompare(nameB)
          if (cmp !== 0) return cmp * sortOrder
          return String(a.examName || '').localeCompare(String(b.examName || ''))
        })
      } else if (sortField === 'examDate') {
        exams.sort((a, b) => {
          const dateA = a.examDate ? new Date(a.examDate).getTime() : 0
          const dateB = b.examDate ? new Date(b.examDate).getTime() : 0
          const cmp = dateA - dateB
          if (cmp !== 0) return cmp * sortOrder
          return String(a.examName || '').localeCompare(String(b.examName || ''))
        })
      } else if (sortField === 'examName') {
        exams.sort((a, b) => {
          return String(a.examName || '').localeCompare(String(b.examName || '')) * sortOrder
        })
      } else if (sortField === 'status') {
        exams.sort((a, b) => {
          const cmp = String(a.status || '').localeCompare(String(b.status || ''))
          if (cmp !== 0) return cmp * sortOrder
          return String(a.examName || '').localeCompare(String(b.examName || ''))
        })
      } else if (sortField === 'createdAt') {
        exams.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return (timeA - timeB) * sortOrder
        })
      }
    } else {
      // Default sort: newest created first
      exams.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return timeB - timeA
      })
    }

    const total = exams.length
    const paginatedExams = exams.slice(skip, skip + limit)

    return {
      exams: paginatedExams,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Update existing Exam configurations
   */
  async updateExam(id, updateData, userId, tenantId) {
    const exam = await Exam.findOne({ _id: id, isDeleted: { $ne: true }, tenantId })
    if (!exam) {
      throw new Error('Exam not found')
    }

    // Subject Validation
    if (updateData.subjectId) {
      const targetClass = updateData.class || exam.class
      const subject = await Subject.findOne({
        _id: updateData.subjectId,
        class: targetClass,
        status: 'Active',
        tenantId
      }).lean()
      
      if (!subject) {
        throw new Error('Selected subject is invalid or does not belong to the selected class grade')
      }
    }

    // Check unique constraints
    if (updateData.examName || updateData.academicYear || updateData.class || updateData.subjectId) {
      const checkName = (updateData.examName || exam.examName).trim()
      const checkYear = (updateData.academicYear || exam.academicYear).trim()
      const checkClass = (updateData.class || exam.class).trim()
      const checkSub = updateData.subjectId || exam.subjectId
      
      const existing = await Exam.findOne({
        examName: checkName,
        academicYear: checkYear,
        class: checkClass,
        subjectId: checkSub,
        _id: { $ne: id },
        isDeleted: { $ne: true },
        tenantId
      }).lean()
      if (existing) {
        throw new Error('An exam with this name and subject already exists for this class and academic year')
      }
    }

    // Update payload fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        exam[key] = updateData[key]
      }
    })

    exam.updatedBy = userId

    // Handle Publish status explicitly
    if (updateData.status === 'Published') {
      exam.status = 'Published'
      exam.publishedBy = userId
      exam.publishedAt = new Date()
    } else {
      // Derive status dynamically
      exam.status = this.deriveStatus(exam.examDate, exam.startTime, exam.endTime)
    }

    await exam.save()
    return this.getExamById(exam._id, tenantId)
  }

  /**
   * Soft delete Exam configurations and cascade soft-delete marks
   */
  async deleteExam(id, tenantId) {
    const exam = await Exam.findOne({ _id: id, isDeleted: { $ne: true }, tenantId })
    if (!exam) {
      throw new Error('Exam not found')
    }

    exam.isDeleted = true
    await exam.save()

    // Soft delete associated marks
    await ExamMark.updateMany({ examId: id, tenantId }, { isDeleted: true })

    return exam.toObject()
  }

  /**
   * Fetch Exam Dashboard KPI metrics
   */
  async getDashboardStats(tenantId) {
    const activeFilter = { isDeleted: { $ne: true }, tenantId }

    const totalExams = await Exam.countDocuments(activeFilter)
    
    const exams = await Exam.find(activeFilter)
    for (let exam of exams) {
      await this.autoTransitionStatus(exam)
    }

    const upcomingExams = await Exam.countDocuments({ ...activeFilter, status: 'Scheduled' })
    const completedExams = await Exam.countDocuments({ ...activeFilter, status: 'Completed' })
    const resultsPublished = await Exam.countDocuments({ ...activeFilter, status: 'Published' })

    return {
      totalExams,
      upcomingExams,
      completedExams,
      resultsPublished
    }
  }

  /**
   * Fetch list of students for marks entry
   */
  async getStudentsForMarksEntry(examId, tenantId) {
    const exam = await Exam.findOne({ _id: examId, isDeleted: { $ne: true }, tenantId }).lean()
    if (!exam) {
      throw new Error('Exam not found')
    }

    const students = await Student.find({ class: exam.class, status: 'Active', tenantId })
      .sort({ rollNumber: 1, firstName: 1 })
      .lean()

    const studentIds = students.map(s => s._id)
    const existingMarksList = await ExamMark.find({
      examId,
      studentId: { $in: studentIds },
      isDeleted: { $ne: true },
      tenantId
    }).lean()

    const marksMap = {}
    existingMarksList.forEach(m => {
      marksMap[m.studentId.toString()] = m
    })

    return students.map(student => {
      const existing = marksMap[student._id.toString()]
      return {
        student: {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          rollNumber: student.rollNumber,
          studentId: student.studentId,
          photo: student.photo
        },
        maxMarks: exam.maxMarks,
        passingMarks: exam.passingMarks,
        marksObtained: existing ? existing.marksObtained : '',
        percentage: existing ? existing.percentage : null,
        grade: existing ? existing.grade : '',
        result: existing ? existing.result : '',
        remarks: existing ? existing.remarks : '',
        isSaved: !!existing,
        isLocked: false // Lock feature removed, marks are always editable
      }
    })
  }

  /**
   * Save / overwrite bulk marks for an exam
   */
  async saveMarks(examId, marksDataList, userId, tenantId) {
    const exam = await Exam.findOne({ _id: examId, isDeleted: { $ne: true }, tenantId })
    if (!exam) {
      throw new Error('Exam not found')
    }

    const uniqueStudentIds = [...new Set(marksDataList.map(m => m.studentId))]
    const enrolledStudentsCount = await Student.countDocuments({
      _id: { $in: uniqueStudentIds },
      class: exam.class,
      status: 'Active',
      tenantId
    })
    
    if (enrolledStudentsCount !== uniqueStudentIds.length) {
      throw new Error('One or more students do not belong to the active roster of this class grade')
    }

    const maxMarks = exam.maxMarks
    const passingMarks = exam.passingMarks

    const bulkOps = marksDataList.map(({ studentId, marksObtained, remarks = '' }) => {
      const marksVal = parseFloat(marksObtained)
      if (isNaN(marksVal) || marksVal < 0 || marksVal > maxMarks) {
        throw new Error(`Invalid marks value ${marksObtained} for student. Must be between 0 and ${maxMarks}`)
      }

      const percentage = parseFloat(((marksVal / maxMarks) * 100).toFixed(2))
      const grade = this.calculateGrade(percentage)
      const result = marksVal >= passingMarks ? 'PASS' : 'FAIL'

      return {
        updateOne: {
          filter: { examId, studentId, tenantId },
          update: {
            marksObtained: marksVal,
            maxMarks,
            percentage,
            grade,
            result,
            remarks: remarks.trim(),
            subjectId: exam.subjectId,
            enteredBy: userId,
            isDeleted: false,
            tenantId
          },
          upsert: true
        }
      }
    })

    if (bulkOps.length > 0) {
      await ExamMark.bulkWrite(bulkOps)
    }

    // Do NOT transition status or freeze editing - keep status dynamic or Published.
    return { success: true, count: bulkOps.length }
  }

  /**
   * Fetch results for a student dynamically
   */
  async getStudentResults(studentId, tenantId) {
    const student = await Student.findOne({ _id: studentId, tenantId }).select('firstName lastName rollNumber studentId class photo').lean()
    if (!student) {
      throw new Error('Student not found')
    }

    const marks = await ExamMark.find({ studentId, isDeleted: { $ne: true }, tenantId })
      .populate({
        path: 'examId',
        match: { isDeleted: { $ne: true }, status: 'Published' }
      })
      .populate('subjectId')
      .lean()

    const validMarks = marks.filter(m => m.examId !== null && m.examId !== undefined)

    const examResults = {}
    validMarks.forEach(m => {
      const examObjId = m.examId._id.toString()
      if (!examResults[examObjId]) {
        examResults[examObjId] = {
          exam: {
            _id: m.examId._id,
            examName: m.examId.examName,
            examDate: m.examId.examDate,
            startTime: m.examId.startTime,
            endTime: m.examId.endTime,
            academicYear: m.examId.academicYear,
            status: m.examId.status
          },
          subjects: [],
          totalObtained: 0,
          totalMax: 0,
          isPassedOverall: true
        }
      }

      examResults[examObjId].subjects.push({
        subjectName: m.subjectId.name,
        code: m.subjectId.code,
        marksObtained: m.marksObtained,
        maxMarks: m.maxMarks,
        percentage: m.percentage,
        grade: m.grade,
        result: m.result,
        remarks: m.remarks
      })

      examResults[examObjId].totalObtained += m.marksObtained
      examResults[examObjId].totalMax += m.maxMarks
      if (m.result !== 'PASS') {
        examResults[examObjId].isPassedOverall = false
      }
    })

    const resultsArray = Object.values(examResults).map(res => {
      const overallPercentage = parseFloat(((res.totalObtained / res.totalMax) * 100).toFixed(2))
      return {
        ...res,
        percentage: overallPercentage,
        grade: this.calculateGrade(overallPercentage),
        overallResult: res.isPassedOverall ? 'PASS' : 'FAIL'
      }
    })

    return {
      student,
      results: resultsArray
    }
  }

  /**
   * Fetch results by student email context
   */
  async getStudentResultsByEmail(email, tenantId) {
    const student = await Student.findOne({ email, tenantId }).lean()
    if (!student) {
      throw new Error('Student profile not found for this account')
    }
    return this.getStudentResults(student._id, tenantId)
  }

  /**
   * Combinable Search & Grouped Aggregation Results Query (Avoids N+1 requests!)
   */
  async queryGroupedResults(queryParams) {
    const page = parseInt(queryParams.page, 10) || 1
    const limit = parseInt(queryParams.limit, 10) || 10
    const skip = (page - 1) * limit

    const match = { isDeleted: { $ne: true }, tenantId: queryParams.tenantId }

    let examFilter = { isDeleted: { $ne: true }, tenantId: queryParams.tenantId }
    let hasExamFilter = false
    
    if (queryParams.class) {
      examFilter.class = queryParams.class
      hasExamFilter = true
    }
    if (queryParams.status) {
      examFilter.status = queryParams.status
      hasExamFilter = true
    }
    if (queryParams.academicYear) {
      examFilter.academicYear = queryParams.academicYear
      hasExamFilter = true
    }
    if (queryParams.examId) {
      examFilter._id = new mongoose.Types.ObjectId(queryParams.examId)
      hasExamFilter = true
    }

    if (hasExamFilter) {
      const exams = await Exam.find(examFilter).select('_id').lean()
      const examIds = exams.map(e => e._id)
      match.examId = { $in: examIds }
    }

    let studentFilter = { tenantId: queryParams.tenantId }
    let hasStudentFilter = false
    
    if (queryParams.class) {
      studentFilter.class = queryParams.class
      hasStudentFilter = true
    }
    if (queryParams.studentId) {
      studentFilter._id = new mongoose.Types.ObjectId(queryParams.studentId)
      hasStudentFilter = true
    }
    if (queryParams.search) {
      const reg = new RegExp(queryParams.search.trim(), 'i')
      studentFilter.$or = [
        { firstName: reg },
        { lastName: reg },
        { studentId: reg },
        { rollNumber: reg }
      ]
      hasStudentFilter = true
    }

    if (hasStudentFilter) {
      const students = await Student.find(studentFilter).select('_id').lean()
      const studentIds = students.map(s => s._id)
      match.studentId = { $in: studentIds }
    }

    if (queryParams.subjectId) {
      match.subjectId = new mongoose.Types.ObjectId(queryParams.subjectId)
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: { studentId: '$studentId', examId: '$examId' },
          marks: { $push: '$$ROOT' },
          totalObtained: { $sum: '$marksObtained' },
          totalMax: { $sum: '$maxMarks' }
        }
      }
    ]

    const totalResults = await ExamMark.aggregate([...pipeline, { $count: 'count' }])
    const total = totalResults[0] ? totalResults[0].count : 0

    let sortStage = { $sort: { '_id.examId': -1 } }
    if (queryParams.sortBy) {
      switch (queryParams.sortBy) {
        case 'Exam Name':
          sortStage = { $sort: { 'exam.examName': 1 } }
          break
        case 'Alphabetical':
          sortStage = { $sort: { 'student.firstName': 1, 'student.lastName': 1 } }
          break
        case 'Percentage':
          sortStage = { $sort: { 'percentage': -1 } }
          break
      }
    }

    const results = await ExamMark.aggregate([
      ...pipeline,
      {
        $lookup: {
          from: 'students',
          localField: '_id.studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $lookup: {
          from: 'exams',
          localField: '_id.examId',
          foreignField: '_id',
          as: 'exam'
        }
      },
      { $unwind: '$exam' },
      {
        $match: { 'exam.isDeleted': { $ne: true } }
      },
      sortStage,
      { $skip: skip },
      { $limit: limit }
    ])

    const formatted = results.map(res => {
      const overallPct = res.totalMax > 0 ? parseFloat(((res.totalObtained / res.totalMax) * 100).toFixed(2)) : 0
      const overallPassed = res.marks.every(m => m.result === 'PASS')
      
      const subjects = res.marks.map(m => ({
        subjectId: m.subjectId,
        marksObtained: m.marksObtained,
        maxMarks: m.maxMarks,
        percentage: m.percentage,
        grade: m.grade,
        result: m.result,
        remarks: m.remarks
      }))

      return {
        student: {
          _id: res.student._id,
          firstName: res.student.firstName,
          lastName: res.student.lastName,
          rollNumber: res.student.rollNumber,
          studentId: res.student.studentId,
          photo: res.student.photo,
          class: res.student.class
        },
        exam: {
          _id: res.exam._id,
          examName: res.exam.examName,
          examDate: res.exam.examDate,
          startTime: res.exam.startTime,
          endTime: res.exam.endTime,
          academicYear: res.exam.academicYear,
          status: res.exam.status
        },
        subjects,
        totalObtained: res.totalObtained,
        totalMax: res.totalMax,
        percentage: overallPct,
        grade: this.calculateGrade(overallPct),
        overallResult: overallPassed ? 'PASS' : 'FAIL'
      }
    })

    const allSubjectIds = [...new Set(formatted.flatMap(f => f.subjects.map(s => s.subjectId)))]
    const subjectsMap = {}
    if (allSubjectIds.length > 0) {
      const subjectsList = await Subject.find({ _id: { $in: allSubjectIds }, tenantId: queryParams.tenantId }).select('name code').lean()
      subjectsList.forEach(s => {
        subjectsMap[s._id.toString()] = s
      })
    }

    formatted.forEach(f => {
      f.subjects.forEach(sub => {
        const subMeta = subjectsMap[sub.subjectId.toString()]
        sub.subjectName = subMeta ? subMeta.name : 'Unknown'
        sub.code = subMeta ? subMeta.code : ''
      })
    })

    return {
      results: formatted,
      pagination: {
        total,
        page,
        pageLimit: limit,
        pages: Math.ceil(total / limit)
      }
    }
  }
}

module.exports = new ExamService()
