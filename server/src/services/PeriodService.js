const Period = require('../models/Period')
const Timetable = require('../models/Timetable')

class PeriodService {
  /**
   * Fetch all periods and breaks ordered
   * @returns {Promise<Array>}
   */
  /**
   * Fetch all periods filtered by template, class, or day
   * @param {Object} options
   * @returns {Promise<Array>}
   */
  async getAllPeriods(options = {}) {
    const query = {}
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

  /**
   * Create a single period
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async createPeriod(data) {
    const count = await Period.countDocuments()
    const period = new Period({
      ...data,
      order: data.order || count + 1
    })
    await period.save()
    return period
  }

  /**
   * Update a single period
   * @param {String} id 
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async updatePeriod(id, data) {
    const period = await Period.findById(id)
    if (!period) throw new Error('Period not found')
    Object.assign(period, data)
    await period.save()
    return period
  }

  /**
   * Delete a single period and clean up linked timetable slots
   * @param {String} id 
   * @returns {Promise<Object>}
   */
  async deletePeriod(id) {
    const period = await Period.findById(id)
    if (!period) throw new Error('Period not found')
    await Period.findByIdAndDelete(id)
    await Timetable.deleteMany({ period: id })
    return period
  }

  /**
   * Reorder periods by updating their order field according to array of IDs
   * @param {Array<String>} orderedIds 
   * @returns {Promise<Array>}
   */
  async reorderPeriods(orderedIds) {
    if (!Array.isArray(orderedIds)) throw new Error('orderedIds array is required')
    for (let i = 0; i < orderedIds.length; i++) {
      await Period.findByIdAndUpdate(orderedIds[i], { order: i + 1 })
    }
    return await Period.find({}).sort({ order: 1 })
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
  async bulkReplacePeriods(periodsList) {
    if (!Array.isArray(periodsList)) {
      throw new Error('Invalid periods configuration data')
    }

    const updatedIds = []
    const docsToInsert = []

    for (let i = 0; i < periodsList.length; i++) {
      const p = periodsList[i]
      if (p._id && p._id.match(/^[0-9a-fA-F]{24}$/)) {
        // Update existing period
        await Period.findByIdAndUpdate(p._id, {
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
          applicableDays: p.applicableDays || []
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
    const allExisting = await Period.find({})
    const removedPeriods = allExisting.filter(p => !keptIds.includes(p._id.toString()))
    const removedIds = removedPeriods.map(p => p._id.toString())

    if (removedIds.length > 0) {
      // Delete the periods
      await Period.deleteMany({ _id: { $in: removedIds } })
      // Delete referencing timetable entries
      await Timetable.deleteMany({ period: { $in: removedIds } })
    }

    return await Period.find({}).sort({ order: 1 })
  }

  /**
   * Helper to seed default periods if DB is empty
   */
  async seedDefaultPeriodsIfEmpty() {
    const count = await Period.countDocuments()
    if (count > 0) return

    const defaults = [
      { name: 'Period 1', type: 'period', startTime: '09:00 AM', endTime: '10:00 AM', order: 1, templateName: 'Default' },
      { name: 'Period 2', type: 'period', startTime: '10:00 AM', endTime: '11:00 AM', order: 2, templateName: 'Default' },
      { name: 'Short Break', type: 'short_break', startTime: '11:00 AM', endTime: '11:15 AM', order: 3, templateName: 'Default' },
      { name: 'Period 3', type: 'period', startTime: '11:15 AM', endTime: '12:15 PM', order: 4, templateName: 'Default' },
      { name: 'Period 4', type: 'period', startTime: '12:15 PM', endTime: '01:15 PM', order: 5, templateName: 'Default' },
      { name: 'Lunch Break', type: 'lunch', startTime: '01:15 PM', endTime: '02:00 PM', order: 6, templateName: 'Default' },
      { name: 'Period 5', type: 'period', startTime: '02:00 PM', endTime: '03:00 PM', order: 7, templateName: 'Default' },
      { name: 'Period 6', type: 'period', startTime: '03:00 PM', endTime: '04:00 PM', order: 8, templateName: 'Default' },
      { name: 'Period 7', type: 'period', startTime: '04:15 PM', endTime: '05:15 PM', order: 9, templateName: 'Default' }
    ]

    await Period.insertMany(defaults)
  }
}

module.exports = new PeriodService()
