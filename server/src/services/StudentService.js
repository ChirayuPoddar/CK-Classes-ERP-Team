const Student = require('../models/Student')
const PromotionHistory = require('../models/PromotionHistory')
const cloudinary = require('../config/cloudinary')

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'ck-classes/students',
        resource_type: 'image'
      },
      (error, result) => {
        if (error) return reject(error)
        resolve(result)
      }
    )
    stream.end(fileBuffer)
  })
}

class StudentService {
  /**
   * Create a new student profile
   * @param {Object} studentData 
   * @returns {Promise<Object>}
   */
  async createStudent(studentData) {
    // 1. Check for duplicate email
    if (studentData.email) {
      const emailExists = await Student.findOne({ email: studentData.email })
      if (emailExists) {
        throw new Error('Email is already registered')
      }
    }

    // 2. Check for duplicate phone number
    if (studentData.phone) {
      const phoneExists = await Student.findOne({ phone: studentData.phone })
      if (phoneExists) {
        throw new Error('Phone number is already registered')
      }
    }

    // 3. Check for duplicate studentId if custom one provided
    if (studentData.studentId) {
      const idExists = await Student.findOne({ studentId: studentData.studentId })
      if (idExists) {
        throw new Error('Student ID already exists')
      }
    }

    const student = new Student(studentData)
    const performedByStr = studentData.performedBy || 'Admin'
    student.history = [{
      action: 'Student created',
      timestamp: new Date(),
      performedBy: performedByStr,
      details: 'Student profile created.'
    }]
    await student.save()
    return student.toObject()
  }

  /**
   * Fetch a single student by MongoDB ID
   * @param {String} id 
   * @returns {Promise<Object>}
   */
  async getStudentById(id) {
    const student = await Student.findById(id)
    if (!student) {
      throw new Error('Student not found')
    }
    const studentObj = student.toObject()

    // Fetch portal account safely (no passwords/secrets)
    const User = require('../models/User')
    const user = await User.findOne({ linkedStudent: student._id }).select('email isActive lastLogin createdAt').lean()
    studentObj.portalAccount = user || null

    // Fetch class history (PromotionHistory)
    const PromotionHistory = require('../models/PromotionHistory')
    const classHistory = await PromotionHistory.find({ studentId: student.studentId }).sort({ promotionDate: -1 }).lean()
    studentObj.classHistory = classHistory || []

    return studentObj
  }

  /**
   * Fetch paginated, sorted, and filtered students list
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async getAllStudents(options = {}) {
    const page = parseInt(options.page, 10) || 1
    const limit = parseInt(options.limit, 10) || 10
    const skip = (page - 1) * limit

    const query = {}

    // Filters support
    if (options.class) {
      query.class = options.class
    }
    if (options.status) {
      query.status = options.status
    }

    // Keyword search support
    if (options.search) {
      const regex = new RegExp(options.search, 'i')
      query.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex },
        { studentId: regex }
      ]
    }

    // Sorting support
    let sortOption = { createdAt: -1 }
    let inMemoryClassSort = false
    let classSortDirection = 1
    if (options.sort) {
      if (typeof options.sort === 'object' && options.sort !== null) {
        sortOption = {}
        for (const [key, val] of Object.entries(options.sort)) {
          if (key === 'class') {
            inMemoryClassSort = true
            classSortDirection = (val === '-1' || val === -1) ? -1 : 1
          } else {
            sortOption[key] = (val === '-1' || val === -1) ? -1 : 1
          }
        }
      } else {
        sortOption = options.sort
      }
    }

    const total = await Student.countDocuments(query)
    let students
    if (inMemoryClassSort) {
      const allMatching = await Student.find(query).sort(sortOption)
      const CLASS_ORDER = {
        "Play Group": 1,
        "Nursery": 2,
        "LKG": 3,
        "UKG": 4,
        "Class 1": 5,
        "Class 2": 6,
        "Class 3": 7,
        "Class 4": 8,
        "Class 5": 9,
        "Class 6": 10,
        "Class 7": 11,
        "Class 8": 12,
        "Class 9": 13,
        "Class 10": 14,
        "Class 11 Science": 15,
        "Class 11 Commerce": 16,
        "Class 12 Science": 17,
        "Class 12 Commerce": 18
      }
      allMatching.sort((a, b) => {
        const rankA = CLASS_ORDER[a.class] || 999
        const rankB = CLASS_ORDER[b.class] || 999
        return (rankA - rankB) * classSortDirection
      })
      students = allMatching.slice(skip, skip + limit)
    } else {
      students = await Student.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
    }

    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ status: 'Active' });
    const inactiveStudents = await Student.countDocuments({ status: 'Inactive' });
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayAdmissions = await Student.countDocuments({ admissionDate: { $gte: startOfToday } });

    return {
      students: students.map(s => s.toObject()),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      stats: {
        total: totalStudents,
        active: activeStudents,
        inactive: inactiveStudents,
        todayAdmissions
      }
    }
  }

  /**
   * Update a student by ID
   * @param {String} id 
   * @param {Object} updateData 
   * @returns {Promise<Object>}
   */
  async updateStudent(id, updateData) {
    const student = await Student.findById(id)
    if (!student) {
      throw new Error('Student not found')
    }

    // 1. Check for duplicate email
    if (updateData.email && updateData.email !== student.email) {
      const emailExists = await Student.findOne({ email: updateData.email })
      if (emailExists) {
        throw new Error('Email is already registered')
      }
    }

    // 2. Check for duplicate phone
    if (updateData.phone && updateData.phone !== student.phone) {
      const phoneExists = await Student.findOne({ phone: updateData.phone })
      if (phoneExists) {
        throw new Error('Phone number is already registered')
      }
    }

    // Detect class, status and generic profile updates for history
    const performedByStr = updateData.performedBy || 'Admin'
    student.history = student.history || []

    if (updateData.class && updateData.class !== student.class) {
      student.history.push({
        action: 'Class changed',
        timestamp: new Date(),
        performedBy: performedByStr,
        details: `Class changed from "${student.class}" to "${updateData.class}".`
      })
    }

    if (updateData.status && updateData.status !== student.status) {
      student.history.push({
        action: 'Status changed',
        timestamp: new Date(),
        performedBy: performedByStr,
        details: `Status changed from "${student.status}" to "${updateData.status}".`
      })
    }

    student.history.push({
      action: 'Profile updated',
      timestamp: new Date(),
      performedBy: performedByStr,
      details: 'Student profile details updated.'
    })

    // Apply updates
    Object.assign(student, updateData)
    await student.save()
    return student.toObject()
  }

  /**
   * Soft delete a student (status: 'Inactive')
   * @param {String} id 
   * @returns {Promise<Object>}
   */
  async deleteStudent(id) {
    const student = await Student.findById(id)
    if (!student) {
      throw new Error('Student not found')
    }

    // Delete photo from Cloudinary if it exists
    if (student.photo && student.photo.public_id) {
      try {
        await cloudinary.uploader.destroy(student.photo.public_id)
      } catch (err) {
        console.error('Failed to destroy student photo from Cloudinary during delete:', err)
      }
    }

    // Hard delete from database
    await Student.findByIdAndDelete(id)
    return student.toObject()
  }

  /**
   * Restore a soft-deleted student (status: 'Active')
   * @param {String} id 
   * @returns {Promise<Object>}
   */
  async restoreStudent(id) {
    const student = await Student.findById(id)
    if (!student) {
      throw new Error('Student not found')
    }

    student.status = 'Active'
    await student.save()
    return student.toObject()
  }

  /**
   * Helper: Search students by keyword
   * @param {String} keyword 
   * @returns {Promise<Array>}
   */
  async searchStudents(keyword) {
    if (!keyword) return []
    const regex = new RegExp(keyword, 'i')
    const students = await Student.find({
      $or: [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex },
        { studentId: regex }
      ]
    })
    return students.map(s => s.toObject())
  }

  /**
   * Helper: Get students by batch
   * @param {String} batchName 
   * @returns {Promise<Array>}
   */
  async getStudentsByBatch(batchName) {
    const students = await Student.find({ batch: batchName })
    return students.map(s => s.toObject())
  }

  /**
   * Helper: Get students by class
   * @param {String} className 
   * @returns {Promise<Array>}
   */
  async getStudentsByClass(className) {
    const students = await Student.find({ class: className })
    return students.map(s => s.toObject())
  }

  /**
   * Upload / Replace student profile photo
   * @param {String} studentId 
   * @param {Object} file Multer file object
   * @returns {Promise<Object>}
   */
  async uploadStudentPhoto(studentId, file) {
    if (!file) {
      throw new Error('No image file provided')
    }

    const student = await Student.findById(studentId)
    if (!student) {
      throw new Error('Student not found')
    }

    // Delete old image from Cloudinary if exists
    if (student.photo && student.photo.public_id) {
      try {
        await cloudinary.uploader.destroy(student.photo.public_id)
      } catch (err) {
        console.error('Failed to delete old image from Cloudinary:', err)
      }
    }

    // Upload new image
    const result = await uploadToCloudinary(file.buffer)

    student.photo = {
      public_id: result.public_id,
      secure_url: result.secure_url
    }

    await student.save()
    return student.toObject()
  }

  /**
   * Delete student profile photo
   * @param {String} studentId 
   * @returns {Promise<Object>}
   */
  async deleteStudentPhoto(studentId) {
    const student = await Student.findById(studentId)
    if (!student) {
      throw new Error('Student not found')
    }

    if (student.photo && student.photo.public_id) {
      await cloudinary.uploader.destroy(student.photo.public_id)
    }

    student.photo = {
      public_id: '',
      secure_url: ''
    }

    await student.save()
    return student.toObject()
  }

  /**
   * Promote selected students based on standard mapping and optional Class 10 stream option
   * @param {Array<String>} studentIds
   * @param {String} stream (e.g. 'Class 11 Science' or 'Class 11 Commerce')
   * @param {String} adminName
   * @returns {Promise<Number>} promotedCount
   */
  async promoteStudents(studentIds, stream, adminName) {
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      throw new Error('No students selected for promotion')
    }

    const students = await Student.find({ _id: { $in: studentIds } })
    if (students.length === 0) {
      throw new Error('No students found matching selection')
    }

    // Check Class 12 block
    const hasClass12 = students.some(s => s.class === 'Class 12 Science' || s.class === 'Class 12 Commerce')
    if (hasClass12) {
      throw new Error('These students have already completed the highest class and cannot be promoted.')
    }

    const promotionMap = {
      'Nursery': 'LKG',
      'UKG': 'LKG',
      'LKG': 'Class 1',
      'Class 1': 'Class 2',
      'Class 2': 'Class 3',
      'Class 3': 'Class 4',
      'Class 4': 'Class 5',
      'Class 5': 'Class 6',
      'Class 6': 'Class 7',
      'Class 7': 'Class 8',
      'Class 8': 'Class 9',
      'Class 9': 'Class 10',
      'Class 11 Science': 'Class 12 Science',
      'Class 11 Commerce': 'Class 12 Commerce'
    }

    let promotedCount = 0

    for (const student of students) {
      let oldClass = student.class
      let newClass = ''

      if (oldClass === 'Class 10') {
        if (!stream || !['Class 11 Science', 'Class 11 Commerce'].includes(stream)) {
          throw new Error('Please select a valid stream for Class 10 students')
        }
        newClass = stream
      } else {
        newClass = promotionMap[oldClass]
      }

      if (!newClass) {
        throw new Error(`Promotion path for class "${oldClass}" is not defined`)
      }

      // Record logs
      await PromotionHistory.create({
        studentId: student.studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        oldClass,
        newClass,
        promotionDate: new Date(),
        promotedBy: adminName
      })

      // Update student class
      student.class = newClass
      await student.save()
      promotedCount++
    }

    return promotedCount
  }

  /**
   * Toggle student user portal access
   */
  async togglePortalAccess(studentId, active, adminUser) {
    const student = await Student.findById(studentId)
    if (!student) {
      throw new Error('Student not found')
    }
    const User = require('../models/User')
    const user = await User.findOne({ linkedStudent: student._id })
    if (!user) {
      throw new Error('Student does not have an active portal account yet.')
    }
    user.isActive = active
    if (!active) {
      user.sessions = []
    }
    await user.save()

    const performedByStr = adminUser ? `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim() || adminUser.email : 'Admin'
    student.history = student.history || []
    student.history.push({
      action: active ? 'Portal account enabled' : 'Portal account disabled',
      timestamp: new Date(),
      performedBy: performedByStr,
      details: `Portal account status changed to ${active ? 'Enabled' : 'Disabled'}.`
    })
    await student.save()
    return { success: true }
  }

  /**
   * Upload student profile document
   */
  async uploadDocument(studentId, file, docName, docType) {
    if (!file) throw new Error('No document file provided')
    const student = await Student.findById(studentId)
    if (!student) throw new Error('Student not found')

    const ImageKitStorageService = require('./ImageKitStorageService')
    const uploadRes = await ImageKitStorageService.uploadDocument(file, `ck-classes/students/${student.studentId}/documents`)

    student.documents = student.documents || []
    student.documents.push({
      name: docName || file.originalname,
      type: docType || 'Other',
      url: uploadRes.url,
      fileId: uploadRes.fileId,
      fileSize: file.size,
      uploadDate: new Date()
    })

    student.history = student.history || []
    student.history.push({
      action: 'Document uploaded',
      timestamp: new Date(),
      performedBy: 'Admin',
      details: `Document "${docName || file.originalname}" (${docType}) uploaded.`
    })

    await student.save()
    return student.toObject()
  }

  /**
   * Delete student profile document
   */
  async deleteDocument(studentId, docId) {
    const student = await Student.findById(studentId)
    if (!student) throw new Error('Student not found')

    student.documents = student.documents || []
    const docIndex = student.documents.findIndex(d => d._id.toString() === docId)
    if (docIndex === -1) throw new Error('Document not found')

    const doc = student.documents[docIndex]
    if (doc.fileId) {
      const ImageKitStorageService = require('./ImageKitStorageService')
      try {
        await ImageKitStorageService.deleteDocument(doc.fileId)
      } catch (err) {
        console.error('Failed to delete document from storage:', err)
      }
    }

    student.documents.splice(docIndex, 1)

    student.history = student.history || []
    student.history.push({
      action: 'Document deleted',
      timestamp: new Date(),
      performedBy: 'Admin',
      details: `Document "${doc.name}" deleted.`
    })

    await student.save()
    return student.toObject()
  }

  /**
   * Add internal staff note to student profile
   */
  async addInternalNote(studentId, text, adminUser) {
    if (!text) throw new Error('Note text is required')
    const student = await Student.findById(studentId)
    if (!student) throw new Error('Student not found')

    const performedByStr = adminUser ? `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim() || adminUser.email : 'Admin'
    student.internalNotes = student.internalNotes || []
    student.internalNotes.push({
      text,
      createdAt: new Date(),
      createdBy: performedByStr
    })

    await student.save()
    return student.toObject()
  }

  /**
   * Delete internal staff note from student profile
   */
  async deleteInternalNote(studentId, noteId) {
    const student = await Student.findById(studentId)
    if (!student) throw new Error('Student not found')

    student.internalNotes = student.internalNotes || []
    const noteIndex = student.internalNotes.findIndex(n => n._id.toString() === noteId)
    if (noteIndex === -1) throw new Error('Note not found')

    student.internalNotes.splice(noteIndex, 1)
    await student.save()
    return student.toObject()
  }

  /**
   * Bulk update status for multiple students
   */
  async bulkUpdateStatus(studentIds, status, performedBy) {
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      throw new Error('No students selected')
    }

    const students = await Student.find({ _id: { $in: studentIds } })
    if (students.length === 0) {
      throw new Error('No students found matching selection')
    }

    let updatedCount = 0
    for (const student of students) {
      const oldStatus = student.status
      student.status = status
      student.history = student.history || []
      student.history.push({
        action: 'Status Updated',
        performedBy,
        timestamp: new Date(),
        details: `Status bulk changed from ${oldStatus} to ${status}`
      })
      await student.save()
      updatedCount++
    }

    return updatedCount
  }
}

module.exports = new StudentService()
