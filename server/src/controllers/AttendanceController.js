const AttendanceService = require('../services/AttendanceService')

class AttendanceController {
  /**
   * GET /attendance
   * Fetch all attendance sessions + stats
   */
  async getSessions(req, res, next) {
    try {
      const result = await AttendanceService.getAttendanceSessions({ ...req.query, tenantId: req.tenantId })
      res.status(200).json({
        success: true,
        message: 'Attendance sessions retrieved successfully',
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /attendance/:id
   * Fetch single session with full records list
   */
  async getSessionById(req, res, next) {
    try {
      const session = await AttendanceService.getAttendanceSessionById(req.params.id, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Attendance session retrieved successfully',
        data: session
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /attendance
   * Record new attendance session
   */
  async createSession(req, res, next) {
    try {
      const session = await AttendanceService.createAttendanceSession({ ...req.body, tenantId: req.tenantId }, req.user.id)
      res.status(201).json({
        success: true,
        message: 'Attendance recorded successfully',
        data: session
      })
    } catch (error) {
      if (error.message === 'Attendance already exists.') {
        return res.status(400).json({
          success: false,
          message: error.message,
          attendanceSessionId: error.attendanceSessionId
        })
      }
      next(error)
    }
  }

  /**
   * PUT /attendance/:id
   * Update existing attendance records
   */
  async updateSession(req, res, next) {
    try {
      const session = await AttendanceService.updateAttendanceSession(req.params.id, req.body, req.user.id, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Attendance updated successfully',
        data: session
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /attendance/:id
   * Remove attendance session
   */
  async deleteSession(req, res, next) {
    try {
      await AttendanceService.deleteAttendanceSession(req.params.id, req.user.id, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Attendance session deleted successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /attendance/timetable-status
   * Fetch timetable slots with marked/pending status
   */
  async getTimetableSlotsStatus(req, res, next) {
    try {
      const slots = await AttendanceService.getTodayTimetableSlotsWithStatus(req.query.date, req.query.classId, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Timetable slots with attendance status retrieved successfully',
        data: slots
      })
    } catch (error) {
      next(error)
    }
  }
  /**
   * GET /attendance/:id/override-history
   * Fetch override history logs for a session
   */
  async getOverrideHistory(req, res, next) {
    try {
      const logs = await AttendanceService.getOverrideHistoryForSession(req.params.id, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Attendance override history logs retrieved successfully',
        data: logs
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /attendance/analytics
   * Fetch aggregated analytics and trends
   */
  async getAnalytics(req, res, next) {
    try {
      const stats = await AttendanceService.getAttendanceAnalytics({ ...req.query, tenantId: req.tenantId })
      res.status(200).json({
        success: true,
        message: 'Attendance analytics calculated successfully',
        data: stats
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /attendance/student/:id
   * Fetch comprehensive student profile analytics
   */
  async getStudentProfile(req, res, next) {
    try {
      const profile = await AttendanceService.getStudentAttendanceProfile(req.params.id, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Student attendance profile retrieved successfully',
        data: profile
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /attendance/settings
   * Fetch current attendance parameters
   */
  async getSettings(req, res, next) {
    try {
      const settings = await AttendanceService.getSettings(req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Attendance settings loaded successfully',
        data: settings
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /attendance/settings
   * Update system parameters
   */
  async updateSettings(req, res, next) {
    try {
      const settings = await AttendanceService.updateSettings(req.body, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Attendance settings updated successfully',
        data: settings
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /attendance/timeline
   * Fetch recent audit logs
   */
  async getTimeline(req, res, next) {
    try {
      const timeline = await AttendanceService.getTimeline(req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Attendance audit timeline retrieved successfully',
        data: timeline
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /attendance/bulk
   * Bulk lock, unlock, or delete sessions
   */
  async bulkUpdate(req, res, next) {
    try {
      const { ids, action } = req.body
      await AttendanceService.bulkUpdateSessions(ids, action, req.user.id, req.tenantId)
      res.status(200).json({
        success: true,
        message: `Bulk ${action.toLowerCase()} completed successfully`
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /attendance/analytics/roster
   * Fetch paginated and filtered student roster with sorting
   */
  async getRoster(req, res, next) {
    try {
      const rosterData = await AttendanceService.getAttendanceRoster({ ...req.query, tenantId: req.tenantId })
      res.status(200).json({
        success: true,
        message: 'Attendance roster retrieved successfully',
        data: rosterData
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new AttendanceController()
