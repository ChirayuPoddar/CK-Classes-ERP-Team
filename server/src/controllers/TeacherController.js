const TeacherService = require('../services/TeacherService')

class TeacherController {
  /**
   * Create a new teacher profile
   */
  async createTeacher(req, res, next) {
    try {
      const teacher = await TeacherService.createTeacher(req.body)
      res.status(201).json({
        success: true,
        message: 'Teacher profile created successfully',
        data: teacher
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Fetch single teacher profile details
   */
  async getTeacherById(req, res, next) {
    try {
      const teacher = await TeacherService.getTeacherById(req.params.id)
      res.status(200).json({
        success: true,
        data: teacher
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Fetch all teachers with search and pagination filters
   */
  async getAllTeachers(req, res, next) {
    try {
      const result = await TeacherService.getAllTeachers(req.query)
      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update teacher details
   */
  async updateTeacher(req, res, next) {
    try {
      const teacher = await TeacherService.updateTeacher(req.params.id, req.body)
      res.status(200).json({
        success: true,
        message: 'Teacher profile updated successfully',
        data: teacher
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete teacher profile from database
   */
  async deleteTeacher(req, res, next) {
    try {
      await TeacherService.deleteTeacher(req.params.id)
      res.status(200).json({
        success: true,
        message: 'Teacher deleted successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Bulk delete teacher profiles
   */
  async bulkDeleteTeachers(req, res, next) {
    try {
      const { ids } = req.body
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid or empty IDs list' })
      }
      const deletedTeachers = []
      for (const id of ids) {
        try {
          const teacher = await TeacherService.deleteTeacher(id)
          deletedTeachers.push(teacher)
        } catch (e) {
          console.warn(`Failed to delete teacher with ID ${id} in bulk operation:`, e)
        }
      }
      res.status(200).json({
        success: true,
        message: `Successfully deleted ${deletedTeachers.length} teachers`,
        data: deletedTeachers
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Upload / Replace profile image
   */
  async uploadTeacherPhoto(req, res, next) {
    try {
      const teacher = await TeacherService.uploadTeacherPhoto(req.params.id, req.file)
      res.status(200).json({
        success: true,
        message: 'Teacher profile image uploaded successfully',
        data: teacher
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete profile image
   */
  async deleteTeacherPhoto(req, res, next) {
    try {
      const teacher = await TeacherService.deleteTeacherPhoto(req.params.id)
      res.status(200).json({
        success: true,
        message: 'Teacher profile image deleted successfully',
        data: teacher
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new TeacherController()
