const PeriodService = require('../services/PeriodService')

class PeriodController {
  /**
   * GET /periods
   * Fetch all periods ordered by order
   */
  async getAllPeriods(req, res, next) {
    try {
      const periods = await PeriodService.getAllPeriods(req.query, req.tenantId)
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
   * POST /periods
   * Create a single period
   */
  async createPeriod(req, res, next) {
    try {
      const period = await PeriodService.createPeriod({ ...req.body, tenantId: req.tenantId })
      res.status(201).json({
        success: true,
        message: 'Period created successfully',
        data: period
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /periods/:id
   * Update a single period
   */
  async updatePeriod(req, res, next) {
    try {
      const period = await PeriodService.updatePeriod(req.params.id, req.body, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Period updated successfully',
        data: period
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /periods/:id
   * Delete a single period
   */
  async deletePeriod(req, res, next) {
    try {
      const period = await PeriodService.deletePeriod(req.params.id, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Period deleted successfully',
        data: period
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /periods/reorder
   * Reorder periods by list of IDs
   */
  async reorderPeriods(req, res, next) {
    try {
      const periods = await PeriodService.reorderPeriods(req.body.orderedIds, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Periods reordered successfully',
        data: periods
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /periods/templates
   * List all period templates
   */
  async getTemplates(req, res, next) {
    try {
      const templates = await PeriodService.getTemplates(req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Period templates retrieved successfully',
        data: templates
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
      const periods = await PeriodService.bulkReplacePeriods(req.body.periods, req.tenantId)
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
