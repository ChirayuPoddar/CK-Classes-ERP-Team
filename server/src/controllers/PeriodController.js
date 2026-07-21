const PeriodService = require('../services/PeriodService')

class PeriodController {
  /**
   * GET /periods
   * Fetch all periods ordered by order
   */
  async getAllPeriods(req, res, next) {
    try {
      const periods = await PeriodService.getAllPeriods()
      res.status(200).json({
        success: true,
        message: 'Periods configuration retrieved successfully',
        data: periods
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /periods/bulk
   * Replace periods configuration bulk-wise
   */
  async bulkReplacePeriods(req, res, next) {
    try {
      const periods = await PeriodService.bulkReplacePeriods(req.body.periods)
      res.status(200).json({
        success: true,
        message: 'Periods configuration updated successfully',
        data: periods
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new PeriodController()
