const SubjectService = require('../services/SubjectService')

class SubjectController {
  /**
   * Create a new subject
   */
  async createSubject(req, res, next) {
    try {
      const subject = await SubjectService.createSubject(req.body)
      res.status(201).json({
        success: true,
        message: 'Subject created successfully',
        data: subject
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Fetch single subject details
   */
  async getSubjectById(req, res, next) {
    try {
      const subject = await SubjectService.getSubjectById(req.params.id)
      res.status(200).json({
        success: true,
        data: subject
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Fetch all subjects with search, filtering and pagination
   */
  async getAllSubjects(req, res, next) {
    try {
      const result = await SubjectService.getAllSubjects(req.query)
      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update subject details
   */
  async updateSubject(req, res, next) {
    try {
      const subject = await SubjectService.updateSubject(req.params.id, req.body)
      res.status(200).json({
        success: true,
        message: 'Subject updated successfully',
        data: subject
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete a subject from database
   */
  async deleteSubject(req, res, next) {
    try {
      await SubjectService.deleteSubject(req.params.id)
      res.status(200).json({
        success: true,
        message: 'Subject deleted successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Bulk delete subject profiles
   */
  async bulkDeleteSubjects(req, res, next) {
    try {
      const { ids } = req.body
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid or empty IDs list' })
      }
      const deletedSubjects = []
      for (const id of ids) {
        try {
          const subject = await SubjectService.deleteSubject(id)
          deletedSubjects.push(subject)
        } catch (e) {
          console.warn(`Failed to delete subject with ID ${id} in bulk operation:`, e)
        }
      }
      res.status(200).json({
        success: true,
        message: `Successfully deleted ${deletedSubjects.length} subjects`,
        data: deletedSubjects
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new SubjectController()
