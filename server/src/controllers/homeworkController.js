const HomeworkService = require('../services/HomeworkService')

class HomeworkController {
  /**
   * Assign a new homework
   */
  async createHomework(req, res, next) {

    try {
      if (req.file) {
        req.body.attachment = await HomeworkService.uploadAttachment(req.file, req.body.class)
      } else if (req.body.attachment && typeof req.body.attachment === 'string') {
        try {
          req.body.attachment = JSON.parse(req.body.attachment)
        } catch (e) {}
      }

      const homework = await HomeworkService.createHomework({ ...req.body, tenantId: req.tenantId })
      
      const responsePayload = {
        success: true,
        message: 'Homework assigned successfully',
        data: homework
      }
      return res.status(201).json(responsePayload)
    } catch (error) {
      console.error('[Error] Create homework failed:', error)
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to create homework assignment',
        error: error.message
      })
    }
  }

  /**
   * Fetch single homework details by ID
   */
  async getHomeworkById(req, res, next) {
    try {
      const homework = await HomeworkService.getHomeworkById(req.params.id, req.tenantId)
      res.status(200).json({
        success: true,
        data: homework
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Fetch paginated list of homework assignments matching parameters
   */
  async getAllHomeworks(req, res, next) {
    try {
      const result = await HomeworkService.getAllHomeworks({ ...req.query, tenantId: req.tenantId }, req.user)
      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Fetch dynamic dashboard summary statistics
   */
  async getDashboardStats(req, res, next) {
    try {
      const stats = await HomeworkService.getDashboardStats(req.user, req.tenantId)
      res.status(200).json({
        success: true,
        data: stats
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update existing homework details
   */
  async updateHomework(req, res, next) {

    try {
      if (req.file) {
        const existingHomework = await HomeworkService.getHomeworkById(req.params.id, req.tenantId)
        const classGrade = req.body.class || existingHomework.class
        req.body.attachment = await HomeworkService.uploadAttachment(req.file, classGrade)
      } else if (req.body.attachment && typeof req.body.attachment === 'string') {
        try {
          req.body.attachment = JSON.parse(req.body.attachment)
        } catch (e) {}
      }

      const homework = await HomeworkService.updateHomework(req.params.id, req.body, req.tenantId)
      
      const responsePayload = {
        success: true,
        message: 'Homework updated successfully',
        data: homework
      }
      return res.status(200).json(responsePayload)
    } catch (error) {
      console.error('[Error] Update homework failed:', error)
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to update homework assignment',
        error: error.message
      })
    }
  }

  /**
   * Delete homework assignment
   */
  async deleteHomework(req, res, next) {
    try {
      await HomeworkService.deleteHomework(req.params.id, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Homework assignment deleted successfully'
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new HomeworkController()
