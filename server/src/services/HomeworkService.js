const Homework = require('../models/Homework')
const Student = require('../models/Student')
const Teacher = require('../models/Teacher')
const Subject = require('../models/Subject')
const ImageKitStorageService = require('./ImageKitStorageService')
const mongoose = require('mongoose')

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

class HomeworkService {
  /**
   * Helper for uploading files to ImageKit Storage
   * @param {Object} file Express Multer file object
   * @param {String} classGrade Name of the class/grade (e.g., "Class 8")
   * @returns {Promise<Object>} Formatted attachment metadata
   */
  async uploadAttachment(file, classGrade) {
    if (!file) return null

    const folderClass = (classGrade || 'Unassigned').replace(/\s+/g, '-')
    // Folder format: ck-classes/homework/{class-grade}/
    const folder = `ck-classes/homework/${folderClass}`

    const result = await ImageKitStorageService.uploadDocument(file, folder)
    return {
      fileId: result.fileId,
      fileName: result.name,
      url: result.url,
      thumbnailUrl: result.thumbnailUrl,
      filePath: result.filePath,
      mimeType: result.mimeType,
      fileSize: result.size,
      uploadedAt: new Date()
    }
  }

  /**
   * Assign a new homework assignment
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async createHomework(data) {
    const homeworkData = { ...data }

    // Verify subject exists and fetch assigned teacher
    const subject = await Subject.findById(homeworkData.subject).populate('assignedTeacher')
    if (!subject) {
      throw new Error('Selected Subject not found')
    }

    if (!subject.assignedTeacher) {
      throw new Error('Selected subject does not have an assigned teacher. Please assign a teacher to this subject first.')
    }

    homeworkData.teacher = subject.assignedTeacher._id || subject.assignedTeacher

    const homework = new Homework(homeworkData)
    await homework.save()

    return this.getHomeworkById(homework._id)
  }

  /**
   * Fetch single homework details
   * @param {String} id 
   * @returns {Promise<Object>}
   */
  async getHomeworkById(id) {
    const homework = await Homework.findById(id)
      .populate('subject')
      .populate('teacher')
    
    if (!homework) {
      throw new Error('Homework assignment not found')
    }
    return homework.toObject()
  }

  /**
   * Fetch paginated list of homework assignments
   * @param {Object} queryParams 
   * @param {Object} userContext 
   * @returns {Promise<Object>}
   */
  async getAllHomeworks(queryParams, userContext) {
    const page = parseInt(queryParams.page, 10) || 1
    const limit = parseInt(queryParams.limit, 10) || 10
    const skip = (page - 1) * limit

    const filter = {}

    // Apply role-based visibility constraints
    if (userContext.role === 'student' || userContext.role === 'parent') {
      const student = await Student.findOne({ email: userContext.email })
      if (student) {
        filter.class = student.class
      } else {
        if (queryParams.class) {
          filter.class = queryParams.class
        }
      }
    } else {
      if (queryParams.class) {
        filter.class = queryParams.class
      }
    }

    if (queryParams.subject) {
      filter.subject = queryParams.subject
    }

    if (queryParams.status) {
      filter.status = queryParams.status
    }

    if (queryParams.search) {
      const regex = new RegExp(queryParams.search.trim(), 'i')
      const matchingSubjects = await Subject.find({ name: regex }).select('_id')
      
      filter.$or = [
        { title: regex },
        { description: regex },
        { class: regex },
        { subject: { $in: matchingSubjects.map(s => s._id) } }
      ]
    }

    const now = new Date()
    await Homework.updateMany(
      { 
        dueDate: { $lt: now }, 
        status: { $ne: 'Completed' } 
      },
      { status: 'Overdue' }
    )

    const homeworks = await Homework.find(filter)
      .populate('subject')
      .populate('teacher')
      .lean()

    // Dynamic custom sorting on complete dataset before pagination
    if (queryParams.sortBy) {
      let sortField = queryParams.sortBy
      let sortOrder = 1
      if (sortField.startsWith('-')) {
        sortField = sortField.slice(1)
        sortOrder = -1
      }

      if (sortField === 'title') {
        homeworks.sort((a, b) => {
          const valA = String(a.title || '')
          const valB = String(b.title || '')
          return valA.localeCompare(valB) * sortOrder
        })
      } else if (sortField === 'class') {
        homeworks.sort((a, b) => {
          const cmp = getClassSortIndex(a.class) - getClassSortIndex(b.class)
          if (cmp !== 0) return cmp * sortOrder
          return String(a.title || '').localeCompare(String(b.title || ''))
        })
      } else if (sortField === 'subject') {
        homeworks.sort((a, b) => {
          const nameA = String(a.subject?.name || '')
          const nameB = String(b.subject?.name || '')
          const cmp = nameA.localeCompare(nameB)
          if (cmp !== 0) return cmp * sortOrder
          return String(a.title || '').localeCompare(String(b.title || ''))
        })
      } else if (sortField === 'dueDate') {
        homeworks.sort((a, b) => {
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0
          const cmp = dateA - dateB
          if (cmp !== 0) return cmp * sortOrder
          return String(a.title || '').localeCompare(String(b.title || ''))
        })
      } else if (sortField === 'status') {
        homeworks.sort((a, b) => {
          const cmp = String(a.status || '').localeCompare(String(b.status || ''))
          if (cmp !== 0) return cmp * sortOrder
          return String(a.title || '').localeCompare(String(b.title || ''))
        })
      } else if (sortField === 'createdAt') {
        homeworks.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return (timeA - timeB) * sortOrder
        })
      }
    } else {
      // Default: newest created first
      homeworks.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return timeB - timeA
      })
    }

    const total = homeworks.length
    const paginatedHomeworks = homeworks.slice(skip, skip + limit)

    return {
      homeworks: paginatedHomeworks,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Fetch dynamic dashboard stats for homework assignments
   * @param {Object} userContext 
   * @returns {Promise<Object>}
   */
  async getDashboardStats(userContext) {
    const filter = {}

    if (userContext.role === 'student' || userContext.role === 'parent') {
      const student = await Student.findOne({ email: userContext.email })
      if (student) {
        filter.class = student.class
      }
    }

    const now = new Date()
    await Homework.updateMany(
      { 
        ...filter,
        dueDate: { $lt: now }, 
        status: { $ne: 'Completed' } 
      },
      { status: 'Overdue' }
    )

    const totalHomework = await Homework.countDocuments(filter)
    const pending = await Homework.countDocuments({ ...filter, status: 'Pending' })
    const completed = await Homework.countDocuments({ ...filter, status: 'Completed' })
    const overdue = await Homework.countDocuments({ ...filter, status: 'Overdue' })

    return {
      totalHomework,
      pending,
      completed,
      overdue
    }
  }

  /**
   * Update existing homework details
   * @param {String} id 
   * @param {Object} updateData 
   * @returns {Promise<Object>}
   */
  async updateHomework(id, updateData) {
    const homework = await Homework.findById(id)
    if (!homework) {
      throw new Error('Homework assignment not found')
    }

    // If new attachment replaces old one, delete old file from ImageKit
    if (updateData.attachment && homework.attachment && homework.attachment.fileId && updateData.attachment.fileId !== homework.attachment.fileId) {
      try {
        await ImageKitStorageService.deleteDocument(homework.attachment.fileId)
      } catch (err) {
        console.error('[Error] Failed to delete old attachment from ImageKit:', err)
      }
    }

    if (updateData.subject) {
      const subject = await Subject.findById(updateData.subject).populate('assignedTeacher')
      if (!subject) {
        throw new Error('Selected Subject not found')
      }
      if (!subject.assignedTeacher) {
        throw new Error('Selected subject does not have an assigned teacher. Please assign a teacher to this subject first.')
      }
      updateData.teacher = subject.assignedTeacher._id || subject.assignedTeacher
    }

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        homework[key] = updateData[key]
      }
    })

    await homework.save()

    return this.getHomeworkById(homework._id)
  }

  /**
   * Delete homework assignment
   * @param {String} id 
   * @returns {Promise<Object>}
   */
  async deleteHomework(id) {
    const homework = await Homework.findById(id)
    if (!homework) {
      throw new Error('Homework assignment not found')
    }

    // Delete attachment from ImageKit Storage first
    if (homework.attachment && homework.attachment.fileId) {
      try {
        await ImageKitStorageService.deleteDocument(homework.attachment.fileId)
      } catch (err) {
        console.error('[Error] Failed to delete attachment from ImageKit:', err)
      }
    }

    await Homework.findByIdAndDelete(id)
    return homework.toObject()
  }
}

module.exports = new HomeworkService()
