const Period = require('../models/Period')
const Timetable = require('../models/Timetable')

class PeriodService {
  /**
   * Fetch all periods and breaks ordered
   * @returns {Promise<Array>}
   */
  /**
   * Fetch all periods filtered by template, class, or day and scoped by tenant
   * @param {Object} options
   * @param {String} tenantId
   * @returns {Promise<Array>}
   */
  async getAllPeriods(options = {}, tenantId = null) {
    const query = {}
    if (tenantId) {
      query.tenantId = tenantId
    }
    if (options.templateName) {
      query.templateName = options.templateName
    }
    if (options.class) {
      query.$or = [
        { applicableClasses: { $size: 0 } },
        { applicableClasses: options.class }
      ]
    }
    if (options.day) {
      query.$and = query.$and || []
      query.$and.push({
        $or: [
          { applicableDays: { $size: 0 } },
          { applicableDays: options.day }
        ]
      })
    }
    return await Period.find(query).sort({ order: 1 })
  }
  }

  /**
   * Get distinct template names
   * @returns {Promise<Array<String>>}
   */
  async getTemplates() {
    return await Period.distinct('templateName')
  }

  /**
   * Bulk replace periods configurations
   * @param {Array} periodsList 
   * @returns {Promise<Array>}
   */
  async bulkReplacePeriods(periodsList, tenantId) {
    if (!Array.isArray(periodsList)) {
      throw new Error('Invalid periods configuration data')
    }

    const updatedIds = []
    const docsToInsert = []

    for (let i = 0; i < periodsList.length; i++) {
      const p = periodsList[i]
      if (p._id && p._id.match(/^[0-9a-fA-F]{24}$/)) {
        // Update existing period
        await Period.findOneAndUpdate({ _id: p._id, tenantId }, {
          name: p.name.trim(),
          type: p.type || 'period',
          startTime: p.startTime.trim(),
          endTime: p.endTime.trim(),
          order: i + 1,
          templateName: p.templateName || 'Default',
          applicableClasses: p.applicableClasses || [],
          applicableDays: p.applicableDays || []
        })
        updatedIds.push(p._id.toString())
      } else {
        // Create new period
        docsToInsert.push({
          name: p.name.trim(),
          type: p.type || 'period',
          startTime: p.startTime.trim(),
          endTime: p.endTime.trim(),
          order: i + 1,
          templateName: p.templateName || 'Default',
          applicableClasses: p.applicableClasses || [],
          applicableDays: p.applicableDays || [],
          tenantId
        })
      }
    }

    let newIds = []
    if (docsToInsert.length > 0) {
      const inserted = await Period.insertMany(docsToInsert)
      newIds = inserted.map(d => d._id.toString())
    }

    const keptIds = [...updatedIds, ...newIds]

    // Find all existing periods before delete
    const allExisting = await Period.find({ tenantId })
    const removedPeriods = allExisting.filter(p => !keptIds.includes(p._id.toString()))
    const removedIds = removedPeriods.map(p => p._id.toString())

    if (removedIds.length > 0) {
      // Delete the periods
      await Period.deleteMany({ _id: { $in: removedIds }, tenantId })
      // Delete referencing timetable entries
      await Timetable.deleteMany({ period: { $in: removedIds }, tenantId })
    }

    return await Period.find({ tenantId }).sort({ order: 1 })
  }

  /**
   * Helper to seed default periods if DB is empty
   */
  async seedDefaultPeriodsIfEmpty(tenantId) {
    if (!tenantId) return
    const count = await Period.countDocuments({ tenantId })
    if (count > 0) return

    const defaults = [
      { name: 'Period 1', type: 'period', startTime: '09:00 AM', endTime: '10:00 AM', order: 1, templateName: 'Default', tenantId },
      { name: 'Period 2', type: 'period', startTime: '10:00 AM', endTime: '11:00 AM', order: 2, templateName: 'Default', tenantId },
      { name: 'Short Break', type: 'short_break', startTime: '11:00 AM', endTime: '11:15 AM', order: 3, templateName: 'Default', tenantId },
      { name: 'Period 3', type: 'period', startTime: '11:15 AM', endTime: '12:15 PM', order: 4, templateName: 'Default', tenantId },
      { name: 'Period 4', type: 'period', startTime: '12:15 PM', endTime: '01:15 PM', order: 5, templateName: 'Default', tenantId },
      { name: 'Lunch Break', type: 'lunch', startTime: '01:15 PM', endTime: '02:00 PM', order: 6, templateName: 'Default', tenantId },
      { name: 'Period 5', type: 'period', startTime: '02:00 PM', endTime: '03:00 PM', order: 7, templateName: 'Default', tenantId },
      { name: 'Period 6', type: 'period', startTime: '03:00 PM', endTime: '04:00 PM', order: 8, templateName: 'Default', tenantId },
      { name: 'Period 7', type: 'period', startTime: '04:15 PM', endTime: '05:15 PM', order: 9, templateName: 'Default', tenantId }
    ]

    await Period.insertMany(defaults)
  }
}

module.exports = new PeriodService()
