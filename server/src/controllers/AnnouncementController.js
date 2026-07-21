const AnnouncementService = require('../services/AnnouncementService')

class AnnouncementController {
  /**
   * Create new announcement
   */
  async createAnnouncement(req, res, next) {
    try {
      if (req.files && req.files.length > 0) {
        const attachmentPromises = req.files.map(file => 
          AnnouncementService.uploadAttachment(file, req.body.class)
        )
        const uploaded = await Promise.all(attachmentPromises)
        req.body.attachments = uploaded.filter(Boolean)
      } else if (req.body.attachments && typeof req.body.attachments === 'string') {
        try {
          req.body.attachments = JSON.parse(req.body.attachments)
        } catch (e) {}
      }

      if (req.body.audience && typeof req.body.audience === 'string') {
        try {
          req.body.audience = JSON.parse(req.body.audience)
        } catch (e) {}
      }

      const announcement = await AnnouncementService.createAnnouncement(req.body, req.user._id || req.user.id)
      
      return res.status(201).json({
        success: true,
        message: 'Announcement created successfully',
        data: announcement
      })
    } catch (error) {
      console.error('[Error] Create announcement failed:', error)
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to create announcement',
        error: error.message
      })
    }
  }

  /**
   * Fetch single announcement details
   */
  async getAnnouncementById(req, res, next) {
    try {
      const announcement = await AnnouncementService.getAnnouncementById(req.params.id)
      res.status(200).json({
        success: true,
        data: announcement
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Fetch paginated list of announcements matching filters
   */
  async getAllAnnouncements(req, res, next) {
    try {
      const result = await AnnouncementService.getAllAnnouncements(req.query, req.user)
      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Fetch dynamic dashboard stats summary
   */
  async getDashboardStats(req, res, next) {
    try {
      const stats = await AnnouncementService.getDashboardStats(req.user)
      res.status(200).json({
        success: true,
        data: stats
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update existing announcement details
   */
  async updateAnnouncement(req, res, next) {
    try {
      if (req.files && req.files.length > 0) {
        const existing = await AnnouncementService.getAnnouncementById(req.params.id)
        const classGrade = req.body.class || existing.class
        
        const attachmentPromises = req.files.map(file => 
          AnnouncementService.uploadAttachment(file, classGrade)
        )
        const uploaded = await Promise.all(attachmentPromises)
        
        let existingAttachments = []
        if (req.body.attachments && typeof req.body.attachments === 'string') {
          try {
            existingAttachments = JSON.parse(req.body.attachments)
          } catch (e) {}
        }
        
        req.body.attachments = [...existingAttachments, ...uploaded.filter(Boolean)]
      } else if (req.body.attachments && typeof req.body.attachments === 'string') {
        try {
          req.body.attachments = JSON.parse(req.body.attachments)
        } catch (e) {}
      }

      if (req.body.audience && typeof req.body.audience === 'string') {
        try {
          req.body.audience = JSON.parse(req.body.audience)
        } catch (e) {}
      }

      const announcement = await AnnouncementService.updateAnnouncement(req.params.id, req.body)
      
      return res.status(200).json({
        success: true,
        message: 'Announcement updated successfully',
        data: announcement
      })
    } catch (error) {
      console.error('[Error] Update announcement failed:', error)
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to update announcement',
        error: error.message
      })
    }
  }

  /**
   * Delete an announcement
   */
  async deleteAnnouncement(req, res, next) {
    try {
      await AnnouncementService.deleteAnnouncement(req.params.id)
      res.status(200).json({
        success: true,
        message: 'Announcement deleted successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Toggle pin state
   */
  async togglePinStatus(req, res, next) {
    try {
      const announcement = await AnnouncementService.togglePinStatus(req.params.id)
      res.status(200).json({
        success: true,
        message: `Announcement ${announcement.isPinned ? 'pinned' : 'unpinned'} successfully`,
        data: announcement
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Publish scheduled/draft announcement immediately
   */
  async publishNow(req, res, next) {
    try {
      const announcement = await AnnouncementService.publishNow(req.params.id)
      res.status(200).json({
        success: true,
        message: 'Announcement published successfully',
        data: announcement
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Log view increment
   */
  async incrementView(req, res, next) {
    try {
      const announcement = await AnnouncementService.incrementView(req.params.id)
      res.status(200).json({
        success: true,
        data: announcement
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Log acknowledgment increment
   */
  async incrementAcknowledgment(req, res, next) {
    try {
      const announcement = await AnnouncementService.incrementAcknowledgment(req.params.id)
      res.status(200).json({
        success: true,
        data: announcement
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new AnnouncementController()
