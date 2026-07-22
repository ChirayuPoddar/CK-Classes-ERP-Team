const Holiday = require('../models/Holiday')

class HolidayService {
  async getAllHolidays(options = {}) {
    const query = { ...(options.tenantId ? { tenantId: options.tenantId } : {}) }
    if (options.academicYear) query.academicYear = options.academicYear
    if (options.type) query.type = options.type
    return await Holiday.find(query).sort({ date: 1 })
  }

  async getHolidayById(id, tenantId) {
    const holiday = await Holiday.findOne({ _id: id, ...(tenantId ? { tenantId } : {}) })
    if (!holiday) throw new Error('Holiday not found')
    return holiday
  }

  async createHoliday(data) {
    const holiday = new Holiday(data)
    await holiday.save()
    return holiday
  }

  async updateHoliday(id, data, tenantId) {
    const holiday = await Holiday.findOne({ _id: id, ...(tenantId ? { tenantId } : {}) })
    if (!holiday) throw new Error('Holiday not found')
    Object.assign(holiday, data)
    await holiday.save()
    return holiday
  }

  async deleteHoliday(id, tenantId) {
    const holiday = await Holiday.findOne({ _id: id, ...(tenantId ? { tenantId } : {}) })
    if (!holiday) throw new Error('Holiday not found')
    await Holiday.findOneAndDelete({ _id: id, ...(tenantId ? { tenantId } : {}) })
    return holiday
  }

  async checkHolidayConflict(dateStr, className = '', tenantId = null) {
    const targetDate = new Date(dateStr)
    const holidays = await Holiday.find({
      ...(tenantId ? { tenantId } : {}),
      $or: [
        { date: { $lte: targetDate }, endDate: { $gte: targetDate } },
        { date: targetDate }
      ]
    })

    const matching = holidays.filter(h => {
      if (!h.affectedClasses || h.affectedClasses.length === 0) return true
      return h.affectedClasses.includes(className)
    })

    return matching
  }
}

module.exports = new HolidayService()
