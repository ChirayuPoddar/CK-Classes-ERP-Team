const TimetableService = require('../services/TimetableService')

class TimetableController {
  /**
   * GET /timetable
   * Fetch all slots for class / academicYear (returns { slots, stats })
   */
  async getTimetableForClass(req, res, next) {
    try {
      const result = await TimetableService.getTimetableForClass(req.query)
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
      const slot = await TimetableService.getTimetableById(req.params.id)
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
      const slot = await TimetableService.createTimetableSlot(req.body)
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
      const slot = await TimetableService.updateTimetableSlot(req.params.id, req.body)
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
      const slot = await TimetableService.deleteTimetableSlot(req.params.id)
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
   * POST /timetable/check-conflict
   * Preview conflicts before saving
   */
  async checkConflict(req, res, next) {
    try {
      const { class: className, day, period, teacher, excludeId, academicYear } = req.body
      if (!className || !day || !period || !teacher) {
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
        academicYear: academicYear || '2026-2027'
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
