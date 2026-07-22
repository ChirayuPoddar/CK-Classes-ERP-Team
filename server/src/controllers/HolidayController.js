const HolidayService = require('../services/HolidayService')

class HolidayController {
  async getAllHolidays(req, res, next) {
    try {
      const holidays = await HolidayService.getAllHolidays({ ...req.query, tenantId: req.tenantId })
      res.status(200).json({
        success: true,
        message: 'Holidays retrieved successfully',
        data: holidays
      })
    } catch (error) {
      next(error)
    }
  }

  async getHolidayById(req, res, next) {
    try {
      const holiday = await HolidayService.getHolidayById(req.params.id, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Holiday details retrieved successfully',
        data: holiday
      })
    } catch (error) {
      next(error)
    }
  }

  async createHoliday(req, res, next) {
    try {
      const holiday = await HolidayService.createHoliday({ ...req.body, tenantId: req.tenantId })
      res.status(201).json({
        success: true,
        message: 'Holiday created successfully',
        data: holiday
      })
    } catch (error) {
      next(error)
    }
  }

  async updateHoliday(req, res, next) {
    try {
      const holiday = await HolidayService.updateHoliday(req.params.id, req.body, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Holiday updated successfully',
        data: holiday
      })
    } catch (error) {
      next(error)
    }
  }

  async deleteHoliday(req, res, next) {
    try {
      const holiday = await HolidayService.deleteHoliday(req.params.id, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Holiday deleted successfully',
        data: holiday
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new HolidayController()
