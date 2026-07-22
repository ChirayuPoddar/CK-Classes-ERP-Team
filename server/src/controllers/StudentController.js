const StudentService = require('../services/StudentService')
const User = require('../models/User')

class StudentController {
  /**
   * POST /students
   * Create a new student profile
   */
  async createStudent(req, res, next) {
    try {
      const performedByStr = req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email : 'Admin'
      const student = await StudentService.createStudent({ ...req.body, performedBy: performedByStr, tenantId: req.tenantId })
      res.status(201).json({
        success: true,
        message: 'Student profile created successfully',
        data: student
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /students/:id
   * Fetch a student by Mongo ID
   */
  async getStudentById(req, res, next) {
    try {
      const student = await StudentService.getStudentById(req.params.id, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Student retrieved successfully',
        data: student
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /students
   * Fetch paginated, sorted, and filtered students
   */
  async getAllStudents(req, res, next) {
    try {
      const result = await StudentService.getAllStudents({ ...req.query, tenantId: req.tenantId })
      res.status(200).json({
        success: true,
        message: 'Students list retrieved successfully',
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /students/:id
   * Update student profile
   */
  async updateStudent(req, res, next) {
    try {
      const performedByStr = req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email : 'Admin'
      const student = await StudentService.updateStudent(req.params.id, { ...req.body, performedBy: performedByStr }, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Student profile updated successfully',
        data: student
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /students/:id
   * Soft delete student profile
   */
  async deleteStudent(req, res, next) {
    try {
      const student = await StudentService.deleteStudent(req.params.id, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Student deleted successfully',
        data: student
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Bulk delete student profiles
   */
  async bulkDeleteStudents(req, res, next) {
    try {
      const { ids } = req.body
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid or empty IDs list' })
      }
      const deletedStudents = []
      for (const id of ids) {
        try {
          const student = await StudentService.deleteStudent(id, req.tenantId)
          deletedStudents.push(student)
        } catch (e) {
          console.warn(`Failed to delete student with ID ${id} in bulk operation:`, e)
        }
      }
      res.status(200).json({
        success: true,
        message: `Successfully deleted ${deletedStudents.length} students`,
        data: deletedStudents
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /students/:id/restore
   * Restore a soft-deleted student profile
   */
  async restoreStudent(req, res, next) {
    try {
      const student = await StudentService.restoreStudent(req.params.id, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Student profile restored successfully',
        data: student
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /students/search
   * Search students by keyword
   */
  async searchStudents(req, res, next) {
    try {
      const students = await StudentService.searchStudents(req.query.q, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Search completed successfully',
        data: students
      })
    } catch (error) {
      next(error)
    }
  }



  /**
   * GET /students/class/:className
   * Fetch students matching a class name
   */
  async getStudentsByClass(req, res, next) {
    try {
      const students = await StudentService.getStudentsByClass(req.params.className, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Students list retrieved by class successfully',
        data: students
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /students/:id/photo
   * Upload / Replace student profile image
   */
  async uploadStudentPhoto(req, res, next) {
    try {
      const student = await StudentService.uploadStudentPhoto(req.params.id, req.file, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Student profile image uploaded successfully',
        data: student
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /students/:id/photo
   * Delete student profile image
   */
  async deleteStudentPhoto(req, res, next) {
    try {
      const student = await StudentService.deleteStudentPhoto(req.params.id, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Student profile image deleted successfully',
        data: student
      })
    } catch (error) {
      next(error)
    }
  }

  async getPromotionCount(req, res, next) {
    res.status(410).json({ success: false, message: 'This endpoint is deprecated.' })
  }

  async promoteStudents(req, res, next) {
    try {
      const { studentIds, stream } = req.body
      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ success: false, message: 'No students selected for promotion' })
      }

      let adminName = 'Admin'
      if (req.user && req.user.id) {
        const adminUser = await User.findOne({ _id: req.user.id, tenantId: req.tenantId })
        if (adminUser) {
          adminName = `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim() || 'Admin'
        } else {
          adminName = req.user.email || 'Admin'
        }
      }

      const promotedCount = await StudentService.promoteStudents(studentIds, stream, adminName, req.tenantId)
      res.status(200).json({
        success: true,
        message: `${promotedCount} students promoted successfully.`,
        promotedCount
      })
    } catch (error) {
      if (error.message === 'These students have already completed the highest class and cannot be promoted.' ||
          error.message === 'Please select a valid stream for Class 10 students' ||
          error.message === 'No students selected for promotion' ||
          error.message.includes('cannot be promoted')) {
        return res.status(400).json({ success: false, message: error.message })
      }
      next(error)
    }
  }

  async bulkUpdateStatus(req, res, next) {
    try {
      const { studentIds, status } = req.body
      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ success: false, message: 'No student IDs provided' })
      }
      if (!['Active', 'Inactive', 'Graduated'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value' })
      }

      let performedBy = 'Admin'
      if (req.user) {
        performedBy = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email
      }

      const updatedCount = await StudentService.bulkUpdateStatus(studentIds, status, performedBy)
      res.status(200).json({
        success: true,
        message: `Successfully updated status to ${status} for ${updatedCount} students.`,
        updatedCount
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Toggle student user portal access
   */
  async togglePortalAccess(req, res, next) {
    try {
      const { active } = req.body
      const result = await StudentService.togglePortalAccess(req.params.id, active, req.user)
      res.status(200).json({
        success: true,
        message: `Portal access ${active ? 'enabled' : 'disabled'} successfully`,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Upload student document
   */
  async uploadDocument(req, res, next) {
    try {
      const { name, type } = req.body
      const student = await StudentService.uploadDocument(req.params.id, req.file, name, type)
      res.status(200).json({
        success: true,
        message: 'Document uploaded successfully',
        data: student
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete student document
   */
  async deleteDocument(req, res, next) {
    try {
      const student = await StudentService.deleteDocument(req.params.id, req.params.docId)
      res.status(200).json({
        success: true,
        message: 'Document deleted successfully',
        data: student
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Add internal staff note to student profile
   */
  async addInternalNote(req, res, next) {
    try {
      const { text } = req.body
      const student = await StudentService.addInternalNote(req.params.id, text, req.user)
      res.status(200).json({
        success: true,
        message: 'Internal note added successfully',
        data: student
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete internal staff note from student profile
   */
  async deleteInternalNote(req, res, next) {
    try {
      const student = await StudentService.deleteInternalNote(req.params.id, req.params.noteId)
      res.status(200).json({
        success: true,
        message: 'Internal note deleted successfully',
        data: student
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new StudentController()
