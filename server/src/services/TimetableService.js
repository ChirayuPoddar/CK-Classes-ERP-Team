const Timetable = require('../models/Timetable')
const Teacher = require('../models/Teacher')
const Subject = require('../models/Subject')
const Period = require('../models/Period')

class TimetableService {
  /**
   * Helper to perform conflict validations
   * @param {Object} data 
   * @param {String} excludeId 
   */
  async checkConflicts(data, excludeId = null) {
    const query = {
      day: data.day,
      period: data.period, // Mongoose ObjectId reference
      academicYear: data.academicYear || '2026-2027'
    }

    if (excludeId) {
      query._id = { $ne: excludeId }
    }

    // 1. Prevent assigning two subjects to the same class in the same period
    const classConflict = await Timetable.findOne({
      ...query,
      class: data.class
    }).populate('subject')

    if (classConflict) {
      throw new Error(`Conflict: Class ${data.class} already has subject "${classConflict.subject?.name || 'Unknown'}" scheduled on ${data.day}.`)
    }

    // 2. Prevent assigning the same teacher to two classes at the same time
    const teacherConflict = await Timetable.findOne({
      ...query,
      teacher: data.teacher
    }).populate('teacher')

    if (teacherConflict) {
      const teacherName = teacherConflict.teacher 
        ? `${teacherConflict.teacher.firstName || ''} ${teacherConflict.teacher.lastName || ''}`.trim()
        : 'Teacher'
      throw new Error(`Conflict: ${teacherName} is already teaching class ${teacherConflict.class} on ${data.day}.`)
    }
  }

  /**
   * Create a new timetable slot
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async createTimetableSlot(data) {
    // Perform validations
    await this.checkConflicts(data)

    const slot = new Timetable(data)
    await slot.save()

    const populated = await Timetable.findById(slot._id)
      .populate('subject')
      .populate('teacher')
      .populate('period')
    return populated.toObject()
  }

  /**
   * Update an existing timetable slot
   * @param {String} id 
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async updateTimetableSlot(id, data) {
    const slot = await Timetable.findById(id)
    if (!slot) {
      throw new Error('Timetable slot not found')
    }

    // Merge check data to perform validation
    const checkData = {
      class: data.class !== undefined ? data.class : slot.class,
      day: data.day !== undefined ? data.day : slot.day,
      period: data.period !== undefined ? data.period : slot.period,
      academicYear: data.academicYear !== undefined ? data.academicYear : slot.academicYear,
      teacher: data.teacher !== undefined ? data.teacher : slot.teacher,
      subject: data.subject !== undefined ? data.subject : slot.subject
    }

    // Perform validation
    await this.checkConflicts(checkData, id)

    // Save updates
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        slot[key] = data[key]
      }
    })

    await slot.save()

    const populated = await Timetable.findById(id)
      .populate('subject')
      .populate('teacher')
      .populate('period')
    return populated.toObject()
  }

  /**
   * Delete a timetable slot
   * @param {String} id 
   * @returns {Promise<Object>}
   */
  async deleteTimetableSlot(id) {
    const slot = await Timetable.findById(id)
    if (!slot) {
      throw new Error('Timetable slot not found')
    }
    await Timetable.findByIdAndDelete(id)
    return slot.toObject()
  }

  /**
   * Get all timetable slots matching options
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async getTimetableForClass(options = {}) {
    const query = {}
    if (options.class) {
      query.class = options.class
    }
    if (options.academicYear) {
      query.academicYear = options.academicYear
    } else {
      query.academicYear = '2026-2027'
    }

    const slots = await Timetable.find(query)
      .populate('subject')
      .populate('teacher')
      .populate('period')

    // Filter out slots that have missing/deleted period configuration
    const activeSlots = slots.filter(s => s.period)

    // Calculate statistics
    const totalPeriodsCount = await Period.countDocuments({ type: 'period' })
    const maxWeeklySlots = totalPeriodsCount * 7

    const totalLectures = activeSlots.length
    const freeSlots = Math.max(0, maxWeeklySlots - totalLectures)

    // Calculate global overlaps/conflicts in DB
    const teacherConflictsGroup = await Timetable.aggregate([
      {
        $group: {
          _id: {
            day: '$day',
            period: '$period',
            teacher: '$teacher',
            academicYear: '$academicYear'
          },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);
    const teacherConflictsCount = teacherConflictsGroup.length;

    const classConflictsGroup = await Timetable.aggregate([
      {
        $group: {
          _id: {
            day: '$day',
            period: '$period',
            class: '$class',
            academicYear: '$academicYear'
          },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);
    const classConflictsCount = classConflictsGroup.length;

    return {
      slots: activeSlots.map(s => s.toObject()),
      stats: {
        totalLectures,
        freeSlots,
        teacherConflicts: teacherConflictsCount,
        classConflicts: classConflictsCount
      }
    }
  }

  /**
   * Get a single slot details
   * @param {String} id 
   * @returns {Promise<Object>}
   */
  async getTimetableById(id) {
    const slot = await Timetable.findById(id)
      .populate('subject')
      .populate('teacher')
      .populate('period')
    if (!slot) {
      throw new Error('Timetable slot not found')
    }
    return slot.toObject()
  }
}

module.exports = new TimetableService()
