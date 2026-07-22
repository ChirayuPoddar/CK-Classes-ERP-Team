const TimetableService = require('../services/TimetableService')

class TimetableController {
  /**
   * GET /timetable
   * Fetch all slots for class / academicYear (returns { slots, stats })
   */
  async getTimetableForClass(req, res, next) {
    try {
      const result = await TimetableService.getTimetableForClass({ ...req.query, tenantId: req.tenantId })
      res.status(200).json({
        success: true,
        message: 'Timetable slots retrieved successfully',
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /timetable/:id
   * Fetch a single slot
   */
  async getTimetableById(req, res, next) {
    try {
      const slot = await TimetableService.getTimetableById(req.params.id, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Timetable slot retrieved successfully',
        data: slot
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /timetable
   * Create a new slot
   */
  async createTimetableSlot(req, res, next) {
    try {
<<<<<<< Updated upstream
      const userId = req.user ? req.user.id : null
      const slot = await TimetableService.createTimetableSlot(req.body, userId)
=======
      const slot = await TimetableService.createTimetableSlot({ ...req.body, tenantId: req.tenantId })
>>>>>>> Stashed changes
      res.status(201).json({
        success: true,
        message: 'Timetable slot created successfully',
        data: slot
      })
    } catch (error) {
      if (error.message.includes('Conflict:')) {
        return res.status(400).json({
          success: false,
          message: error.message
        })
      }
      next(error)
    }
  }

  /**
   * PUT /timetable/:id
   * Update an existing slot
   */
  async updateTimetableSlot(req, res, next) {
    try {
<<<<<<< Updated upstream
      const userId = req.user ? req.user.id : null
      const slot = await TimetableService.updateTimetableSlot(req.params.id, req.body, userId)
=======
      const slot = await TimetableService.updateTimetableSlot(req.params.id, req.body, req.tenantId)
>>>>>>> Stashed changes
      res.status(200).json({
        success: true,
        message: 'Timetable slot updated successfully',
        data: slot
      })
    } catch (error) {
      if (error.message.includes('Conflict:')) {
        return res.status(400).json({
          success: false,
          message: error.message
        })
      }
      next(error)
    }
  }

  /**
   * DELETE /timetable/:id
   * Remove a slot
   */
  async deleteTimetableSlot(req, res, next) {
    try {
<<<<<<< Updated upstream
      const userId = req.user ? req.user.id : null
      const slot = await TimetableService.deleteTimetableSlot(req.params.id, userId)
=======
      const slot = await TimetableService.deleteTimetableSlot(req.params.id, req.tenantId)
>>>>>>> Stashed changes
      res.status(200).json({
        success: true,
        message: 'Timetable slot deleted successfully',
        data: slot
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /timetable/swap
   * Swap two timetable slots
   */
  async swapSlots(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null
      const slot1Id = req.body.slot1Id || req.body.slotId1
      const slot2Id = req.body.slot2Id || req.body.slotId2
      const result = await TimetableService.swapSlots(slot1Id, slot2Id, userId)
      res.status(200).json({
        success: true,
        message: 'Slots swapped successfully',
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /timetable/bulk
   * Bulk operations (delete, replace teacher/room/subject)
   */
  async bulkOperation(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null
      const result = await TimetableService.bulkOperation(req.body, userId)
      res.status(200).json({
        success: true,
        message: 'Bulk operation completed successfully',
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /timetable/copy
   * Copy timetable entries across day, week, or class
   */
  async copyTimetable(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null
      const result = await TimetableService.copyTimetable(req.body, userId)
      res.status(200).json({
        success: true,
        message: 'Timetable copied successfully',
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /timetable/analytics
   * Get analytics dashboard stats
   */
  async getAnalytics(req, res, next) {
    try {
      const result = await TimetableService.getAnalytics(req.query.academicYear)
      res.status(200).json({
        success: true,
        message: 'Analytics retrieved successfully',
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /timetable/auto-generate
   * Generate optimal timetable with constraint solver
   */
  async autoGenerate(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null
      const result = await TimetableService.autoGenerate(req.body, userId)
      res.status(200).json({
        success: true,
        message: 'Timetable generated successfully',
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /timetable/check-conflict
   * Preview conflicts before saving
   */
  async checkConflict(req, res, next) {
    try {
      const { class: className, day, period, teacher, room, excludeId, academicYear } = req.body
      if (!className || !day || !period) {
        return res.status(200).json({
          success: true,
          message: 'No Conflict'
        })
      }
      
      await TimetableService.checkConflicts({
        class: className,
        day,
        period,
        teacher,
<<<<<<< Updated upstream
        room,
        academicYear: academicYear || '2026-2027'
=======
        academicYear: academicYear || '2026-2027',
        tenantId: req.tenantId
>>>>>>> Stashed changes
      }, excludeId)

      res.status(200).json({
        success: true,
        message: 'No Conflict'
      })
    } catch (error) {
      res.status(200).json({
        success: false,
        message: error.message.replace('Conflict: ', '')
      })
    }
  }
}

module.exports = new TimetableController()
