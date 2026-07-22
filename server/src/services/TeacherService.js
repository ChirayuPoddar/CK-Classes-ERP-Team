const Teacher = require('../models/Teacher')
const cloudinary = require('../config/cloudinary')

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'ck-classes/teachers',
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

class TeacherService {
  /**
   * Create a new teacher profile
   * @param {Object} teacherData 
   * @returns {Promise<Object>}
   */
  async createTeacher(teacherData) {
    if (teacherData.email) {
      const emailExists = await Teacher.findOne({ email: teacherData.email, tenantId: teacherData.tenantId })
      if (emailExists) {
        throw new Error('Email is already registered')
      }
    }

    if (teacherData.phone) {
      const phoneExists = await Teacher.findOne({ phone: teacherData.phone, tenantId: teacherData.tenantId })
      if (phoneExists) {
        throw new Error('Phone number is already registered')
      }
    }

    if (teacherData.teacherId) {
      const idExists = await Teacher.findOne({ teacherId: teacherData.teacherId, tenantId: teacherData.tenantId })
      if (idExists) {
        throw new Error('Teacher ID already exists')
      }
    }

    const teacher = new Teacher(teacherData)
    await teacher.save()
    return teacher.toObject()
  }

  /**
   * Fetch a single teacher by ID
   * @param {String} id 
   * @param {String} tenantId
   * @returns {Promise<Object>}
   */
  async getTeacherById(id, tenantId) {
    const teacher = await Teacher.findOne({ _id: id, tenantId })
    if (!teacher) {
      throw new Error('Teacher not found')
    }
    return teacher.toObject()
  }

  /**
   * Get all teachers with pagination, searching, and status filters
   * @param {Object} queryParams 
   * @returns {Promise<Object>}
   */
  async getAllTeachers(queryParams) {
    const page = parseInt(queryParams.page, 10) || 1
    const limit = parseInt(queryParams.limit, 10) || 10
    const skip = (page - 1) * limit

    const filter = { tenantId: queryParams.tenantId }

    // Search by name, email, phone
    if (queryParams.search) {
      const searchRegex = new RegExp(queryParams.search, 'i')
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ]
    }

    // Status filter
    if (queryParams.status) {
      filter.status = queryParams.status
    }

    // Gender filter
    if (queryParams.gender) {
      filter.gender = queryParams.gender
    }

    // Subject taught regex filter
    if (queryParams.subject) {
      filter.subjects = { $regex: new RegExp(queryParams.subject, 'i') }
    }

    // Minimum experience filter
    if (queryParams.minExperience !== undefined && queryParams.minExperience !== '') {
      filter.experience = { $gte: Number(queryParams.minExperience) }
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

    const teachers = await Teacher.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)

    const total = await Teacher.countDocuments(filter)

    const allTeachers = await Teacher.find({ tenantId: queryParams.tenantId });
    const totalT = allTeachers.length;
    const activeT = allTeachers.filter(t => t.status === 'Active').length;
    const inactiveT = allTeachers.filter(t => t.status === 'Inactive').length;
    const totalExp = allTeachers.reduce((acc, curr) => acc + (curr.experience || 0), 0);
    const avgExperience = totalT > 0 ? parseFloat((totalExp / totalT).toFixed(1)) : 0;

    return {
      teachers: teachers.map(t => t.toObject()),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      stats: {
        total: totalT,
        active: activeT,
        inactive: inactiveT,
        avgExperience
      }
    }
  }

  /**
   * Update teacher details
   * @param {String} id 
   * @param {Object} updateData 
   * @returns {Promise<Object>}
   */
  async updateTeacher(id, updateData, tenantId) {
    const teacher = await Teacher.findOne({ _id: id, tenantId })
    if (!teacher) {
      throw new Error('Teacher not found')
    }

    // Duplicate email check
    if (updateData.email && updateData.email !== teacher.email) {
      const emailExists = await Teacher.findOne({ email: updateData.email, tenantId, _id: { $ne: id } })
      if (emailExists) {
        throw new Error('Email is already registered by another teacher')
      }
    }

    // Duplicate phone check
    if (updateData.phone && updateData.phone !== teacher.phone) {
      const phoneExists = await Teacher.findOne({ phone: updateData.phone, tenantId, _id: { $ne: id } })
      if (phoneExists) {
        throw new Error('Phone number is already registered by another teacher')
      }
    }

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        teacher[key] = updateData[key]
      }
    })

    await teacher.save()
    return teacher.toObject()
  }

  /**
   * Delete teacher profile from database and clean up photo
   * @param {String} id 
   * @param {String} tenantId
   * @returns {Promise<Object>}
   */
  async deleteTeacher(id, tenantId) {
    const teacher = await Teacher.findOne({ _id: id, tenantId })
    if (!teacher) {
      throw new Error('Teacher not found')
    }

    if (teacher.photo && teacher.photo.public_id) {
      try {
        await cloudinary.uploader.destroy(teacher.photo.public_id)
      } catch (err) {
        console.error('Failed to destroy teacher photo from Cloudinary during delete:', err)
      }
    }

    const Subject = require('../models/Subject')
    await Subject.updateMany({ assignedTeacher: id, tenantId }, { $set: { assignedTeacher: null } })

    await Teacher.findOneAndDelete({ _id: id, tenantId })
    return teacher.toObject()
  }

  /**
   * Upload / Replace profile image
   * @param {String} teacherId 
   * @param {Object} file 
   * @param {String} tenantId
   * @returns {Promise<Object>}
   */
  async uploadTeacherPhoto(teacherId, file, tenantId) {
    if (!file) {
      throw new Error('No image file provided')
    }

    const teacher = await Teacher.findOne({ _id: teacherId, tenantId })
    if (!teacher) {
      throw new Error('Teacher not found')
    }

    if (teacher.photo && teacher.photo.public_id) {
      try {
        await cloudinary.uploader.destroy(teacher.photo.public_id)
      } catch (err) {
        console.error('Failed to delete old image from Cloudinary:', err)
      }
    }

    const result = await uploadToCloudinary(file.buffer)

    teacher.photo = {
      public_id: result.public_id,
      secure_url: result.secure_url
    }

    await teacher.save()
    return teacher.toObject()
  }

  /**
   * Delete profile photo
   * @param {String} teacherId 
   * @param {String} tenantId
   * @returns {Promise<Object>}
   */
  async deleteTeacherPhoto(teacherId, tenantId) {
    const teacher = await Teacher.findOne({ _id: teacherId, tenantId })
    if (!teacher) {
      throw new Error('Teacher not found')
    }

    if (teacher.photo && teacher.photo.public_id) {
      await cloudinary.uploader.destroy(teacher.photo.public_id)
    }

    teacher.photo = {
      public_id: '',
      secure_url: ''
    }

    await teacher.save()
    return teacher.toObject()
  }
}

module.exports = new TeacherService()
