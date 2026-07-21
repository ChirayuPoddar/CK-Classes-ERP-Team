const Subject = require('../models/Subject')
const Teacher = require('../models/Teacher')

class SubjectService {
  /**
   * Create a new subject
   * @param {Object} subjectData 
   * @returns {Promise<Object>}
   */
  async createSubject(subjectData) {
    // 1. Validate duplicate code
    if (subjectData.code) {
      const codeExists = await Subject.findOne({ code: subjectData.code.trim().toUpperCase() })
      if (codeExists) {
        throw new Error('Subject code is already registered')
      }
    }

    // 2. Validate duplicate name for the same class
    if (subjectData.name && subjectData.class) {
      const nameExists = await Subject.findOne({
        name: { $regex: new RegExp(`^${subjectData.name.trim()}$`, 'i') },
        class: subjectData.class.trim()
      })
      if (nameExists) {
        throw new Error(`A subject with the name "${subjectData.name}" already exists for class ${subjectData.class}`)
      }
    }

    const subject = new Subject(subjectData)
    await subject.save()
    
    // Populate teacher info before returning
    const populated = await Subject.findById(subject._id).populate('assignedTeacher')
    return populated.toObject()
  }

  /**
   * Fetch a single subject by ID
   * @param {String} id 
   * @returns {Promise<Object>}
   */
  async getSubjectById(id) {
    const subject = await Subject.findById(id).populate('assignedTeacher')
    if (!subject) {
      throw new Error('Subject not found')
    }
    return subject.toObject()
  }

  /**
   * Get all subjects with pagination, searching, and filtering
   * @param {Object} queryParams 
   * @returns {Promise<Object>}
   */
  async getAllSubjects(queryParams) {
    const page = parseInt(queryParams.page, 10) || 1
    const limit = parseInt(queryParams.limit, 10) || 10
    const skip = (page - 1) * limit

    const filter = {}

    // Search by name, code, class, or assigned teacher name
    if (queryParams.search) {
      const searchRegex = new RegExp(queryParams.search.trim(), 'i')
      
      // Find teachers matching search query
      const matchingTeachers = await Teacher.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex }
        ]
      }).select('_id')
      const teacherIds = matchingTeachers.map(t => t._id)

      filter.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { class: searchRegex },
        { assignedTeacher: { $in: teacherIds } }
      ]
    }

    // Filters
    if (queryParams.class) {
      filter.class = queryParams.class
    }
    if (queryParams.assignedTeacher) {
      if (queryParams.assignedTeacher === 'assigned') {
        const activeTeachers = await Teacher.find({}).select('_id')
        const activeTeacherIds = activeTeachers.map(t => t._id)
        filter.assignedTeacher = { $in: activeTeacherIds }
      } else if (queryParams.assignedTeacher === 'unassigned') {
        const activeTeachers = await Teacher.find({}).select('_id')
        const activeTeacherIds = activeTeachers.map(t => t._id)
        filter.$or = [
          { assignedTeacher: null },
          { assignedTeacher: { $exists: false } },
          { assignedTeacher: { $nin: activeTeacherIds } }
        ]
      } else {
        filter.assignedTeacher = queryParams.assignedTeacher
      }
    }
    if (queryParams.status) {
      filter.status = queryParams.status
    }

    // Sort setup
    let sortOptions = { createdAt: -1 }
    if (queryParams.sort) {
      let rawSort = queryParams.sort
      if (typeof rawSort === 'string') {
        try {
          rawSort = JSON.parse(rawSort)
        } catch (e) {
          // Fallback
        }
      }
      if (typeof rawSort === 'object' && rawSort !== null) {
        sortOptions = {}
        for (const [key, val] of Object.entries(rawSort)) {
          sortOptions[key] = (val === '-1' || val === -1) ? -1 : 1
        }
      }
    }

    const subjects = await Subject.find(filter)
      .populate('assignedTeacher')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)

    const total = await Subject.countDocuments(filter)

    const totalSubjects = await Subject.countDocuments();
    const activeTeachers = await Teacher.find({}).select('_id')
    const activeTeacherIds = activeTeachers.map(t => t._id)
    const unassignedSubjects = await Subject.countDocuments({
      $or: [
        { assignedTeacher: null },
        { assignedTeacher: { $exists: false } },
        { assignedTeacher: { $nin: activeTeacherIds } }
      ]
    });

    return {
      subjects: subjects.map(s => s.toObject()),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      stats: {
        total: totalSubjects,
        unassigned: unassignedSubjects
      }
    }
  }

  /**
   * Update subject details
   * @param {String} id 
   * @param {Object} updateData 
   * @returns {Promise<Object>}
   */
  async updateSubject(id, updateData) {
    const subject = await Subject.findById(id)
    if (!subject) {
      throw new Error('Subject not found')
    }

    // Duplicate code check
    if (updateData.code && updateData.code.trim().toUpperCase() !== subject.code) {
      const codeExists = await Subject.findOne({ code: updateData.code.trim().toUpperCase() })
      if (codeExists) {
        throw new Error('Subject code is already registered by another subject')
      }
    }

    // Duplicate name for class check
    const checkName = updateData.name ? updateData.name.trim() : subject.name
    const checkClass = updateData.class ? updateData.class.trim() : subject.class
    if (updateData.name || updateData.class) {
      const nameExists = await Subject.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${checkName}$`, 'i') },
        class: checkClass
      })
      if (nameExists) {
        throw new Error(`A subject with the name "${checkName}" already exists for class ${checkClass}`)
      }
    }

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        subject[key] = updateData[key]
      }
    })

    await subject.save()
    const populated = await Subject.findById(id).populate('assignedTeacher')
    return populated.toObject()
  }

  /**
   * Delete subject from database
   * @param {String} id 
   * @returns {Promise<Object>}
   */
  async deleteSubject(id) {
    const subject = await Subject.findById(id)
    if (!subject) {
      throw new Error('Subject not found')
    }
    await Subject.findByIdAndDelete(id)
    return subject.toObject()
  }
}

module.exports = new SubjectService()
