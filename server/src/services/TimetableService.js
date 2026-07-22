const mongoose = require('mongoose')
const Timetable = require('../models/Timetable')
const Teacher = require('../models/Teacher')
const Subject = require('../models/Subject')
const Period = require('../models/Period')
const Room = require('../models/Room')
const Holiday = require('../models/Holiday')
const TimetableVersion = require('../models/TimetableVersion')

class TimetableService {
  /**
   * Record snapshot for version history
   */
  async recordVersion(slotId, action, userId = null, description = '') {
    try {
      const slot = await Timetable.findById(slotId).lean()
      if (!slot) return
      const lastVer = await TimetableVersion.findOne({ timetableSlotId: slotId }).sort({ version: -1 })
      const nextVer = lastVer ? lastVer.version + 1 : 1
      await TimetableVersion.create({
        timetableSlotId: slotId,
        version: nextVer,
        snapshot: slot,
        action,
        changedBy: userId,
        academicYear: slot.academicYear,
        class: slot.class,
        description
      })
    } catch (err) {
      console.error('Failed to record timetable version:', err)
    }
  }

  /**
   * Helper to perform conflict validations
   * @param {Object} data 
   * @param {String} excludeId 
   */
  async checkConflicts(data, excludeId = null) {
    const rawPeriod = data.period?._id || data.period
    const rawTeacher = data.teacher?._id || data.teacher

    const periodId = mongoose.Types.ObjectId.isValid(rawPeriod) ? new mongoose.Types.ObjectId(rawPeriod) : rawPeriod
    const teacherId = rawTeacher && mongoose.Types.ObjectId.isValid(rawTeacher) ? new mongoose.Types.ObjectId(rawTeacher) : rawTeacher
    const excludeObjId = excludeId && mongoose.Types.ObjectId.isValid(excludeId) ? new mongoose.Types.ObjectId(excludeId) : excludeId

    const query = {
      day: data.day,
      period: periodId,
      academicYear: data.academicYear || '2026-2027',
      tenantId: data.tenantId
    }

    if (excludeObjId) {
      query._id = { $ne: excludeObjId }
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
    if (teacherId) {
      const teacherConflict = await Timetable.findOne({
        ...query,
        teacher: teacherId
      }).populate('teacher')

      if (teacherConflict) {
        const teacherName = teacherConflict.teacher 
          ? `${teacherConflict.teacher.firstName || ''} ${teacherConflict.teacher.lastName || ''}`.trim()
          : 'Teacher'
        throw new Error(`Conflict: ${teacherName} is already teaching class ${teacherConflict.class} on ${data.day}.`)
      }
    }

    // 3. Room conflict check
    if (data.room && data.room.trim()) {
      const roomConflict = await Timetable.findOne({
        ...query,
        room: data.room.trim()
      })
      if (roomConflict) {
        throw new Error(`Conflict: Room "${data.room}" is already occupied by Class ${roomConflict.class} on ${data.day}.`)
      }
    }
  }

  /**
   * Create a new timetable slot
   * @param {Object} data 
   * @param {String} userId
   * @returns {Promise<Object>}
   */
  async createTimetableSlot(data, userId = null) {
    await this.checkConflicts(data)

    const slot = new Timetable(data)
    await slot.save()

    await this.recordVersion(slot._id, 'create', userId, 'Created new lecture slot')

    const populated = await Timetable.findOne({ _id: slot._id, tenantId: data.tenantId })
      .populate('subject')
      .populate('teacher')
      .populate('period')
      .populate('assistantTeacher')
      .populate('substituteTeacher')
    return populated.toObject()
  }

  /**
   * Update an existing timetable slot
   * @param {String} id 
   * @param {Object} data 
   * @param {String} userId
   * @param {String} tenantId
   * @returns {Promise<Object>}
   */
  async updateTimetableSlot(id, data, userId = null, tenantId = null) {
    const slot = await Timetable.findOne({ _id: id, tenantId: tenantId || data.tenantId })
    if (!slot) {
      throw new Error('Timetable slot not found')
    }

    const checkData = {
      class: data.class !== undefined ? data.class : slot.class,
      day: data.day !== undefined ? data.day : slot.day,
      period: data.period !== undefined ? data.period : slot.period,
      academicYear: data.academicYear !== undefined ? data.academicYear : slot.academicYear,
      teacher: data.teacher !== undefined ? data.teacher : slot.teacher,
      subject: data.subject !== undefined ? data.subject : slot.subject,
      room: data.room !== undefined ? data.room : slot.room,
      tenantId: tenantId || data.tenantId || slot.tenantId
    }

    await this.checkConflicts(checkData, id)

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        slot[key] = data[key]
      }
    })

    slot.version = (slot.version || 1) + 1
    await slot.save()

    await this.recordVersion(slot._id, 'update', userId, 'Updated lecture slot')

    const populated = await Timetable.findOne({ _id: id, tenantId: tenantId || data.tenantId || slot.tenantId })
      .populate('subject')
      .populate('teacher')
      .populate('period')
      .populate('assistantTeacher')
      .populate('substituteTeacher')
    return populated.toObject()
  }

  /**
   * Delete a timetable slot
   * @param {String} id 
   * @param {String} userId
   * @param {String} tenantId
   * @returns {Promise<Object>}
   */
  async deleteTimetableSlot(id, userId = null, tenantId = null) {
    const slot = await Timetable.findOne({ _id: id, tenantId })
    if (!slot) {
      throw new Error('Timetable slot not found')
    }
    await this.recordVersion(id, 'delete', userId, 'Deleted lecture slot')
    await Timetable.findOneAndDelete({ _id: id, tenantId })
    return slot.toObject()
  }

  /**
   * Swap two timetable slots atomically
   */
  async swapSlots(slotId1, slotId2, userId = null) {
    const s1 = await Timetable.findById(slotId1)
    const s2 = await Timetable.findById(slotId2)
    if (!s1 || !s2) throw new Error('One or both timetable slots not found')

    const temp = {
      day: s1.day,
      period: s1.period
    }

    s1.day = s2.day
    s1.period = s2.period
    s2.day = temp.day
    s2.period = temp.period

    await s1.save()
    await s2.save()

    await this.recordVersion(s1._id, 'swap', userId, `Swapped with slot ${s2._id}`)
    await this.recordVersion(s2._id, 'swap', userId, `Swapped with slot ${s1._id}`)

    return { slot1: s1.toObject(), slot2: s2.toObject() }
  }

  /**
   * Bulk operations (bulk delete, replace teacher, replace room, etc.)
   */
  async bulkOperation(payload, userId = null) {
    const { action, slotIds = [], data = {} } = payload
    if (!Array.isArray(slotIds) || slotIds.length === 0) {
      throw new Error('No slots selected for bulk operation')
    }

    if (action === 'delete') {
      for (const id of slotIds) {
        await this.recordVersion(id, 'bulk', userId, 'Bulk deleted slot')
      }
      await Timetable.deleteMany({ _id: { $in: slotIds } })
      return { modifiedCount: slotIds.length }
    }

    if (action === 'replace_teacher') {
      if (!data.teacher) throw new Error('Target teacher is required')
      const res = await Timetable.updateMany({ _id: { $in: slotIds } }, { $set: { teacher: data.teacher } })
      for (const id of slotIds) {
        await this.recordVersion(id, 'bulk', userId, `Bulk replaced teacher to ${data.teacher}`)
      }
      return res
    }

    if (action === 'replace_room') {
      if (!data.room) throw new Error('Target room is required')
      const res = await Timetable.updateMany({ _id: { $in: slotIds } }, { $set: { room: data.room.trim() } })
      for (const id of slotIds) {
        await this.recordVersion(id, 'bulk', userId, `Bulk replaced room to ${data.room}`)
      }
      return res
    }

    if (action === 'replace_subject') {
      if (!data.subject) throw new Error('Target subject is required')
      const res = await Timetable.updateMany({ _id: { $in: slotIds } }, { $set: { subject: data.subject } })
      for (const id of slotIds) {
        await this.recordVersion(id, 'bulk', userId, `Bulk replaced subject to ${data.subject}`)
      }
      return res
    }

    throw new Error(`Unsupported bulk action: ${action}`)
  }

  /**
   * Copy timetable entries from one scope to another (day, week, class)
   */
  async copyTimetable(payload, userId = null) {
    const { sourceClass, targetClass, sourceDay, targetDay, academicYear = '2026-2027' } = payload

    const query = { academicYear }
    if (sourceClass) query.class = sourceClass
    if (sourceDay) query.day = sourceDay

    const sourceSlots = await Timetable.find(query).lean()
    if (sourceSlots.length === 0) throw new Error('No source slots found to copy')

    const created = []
    for (const slot of sourceSlots) {
      delete slot._id
      delete slot.createdAt
      delete slot.updatedAt
      delete slot.__v

      if (targetClass) slot.class = targetClass
      if (targetDay) slot.day = targetDay

      try {
        await this.checkConflicts(slot)
        const newSlot = new Timetable(slot)
        await newSlot.save()
        await this.recordVersion(newSlot._id, 'create', userId, 'Copied from template/slot')
        created.push(newSlot.toObject())
      } catch (err) {
        // Skip conflicting slots gracefully during copy
        console.warn(`Skipping copy slot due to conflict: ${err.message}`)
      }
    }

    return { copiedCount: created.length, slots: created }
  }

  /**
   * Analytics summary for dashboard
   */
  async getAnalytics(academicYear = '2026-2027') {
    const slots = await Timetable.find({ academicYear })
      .populate('subject')
      .populate('teacher')
      .populate('period')
      .lean()

    const totalLectures = slots.length

    // Teacher workload
    const teacherMap = {}
    slots.forEach(s => {
      if (s.teacher) {
        const tId = s.teacher._id.toString()
        const tName = `${s.teacher.firstName || ''} ${s.teacher.lastName || ''}`.trim()
        if (!teacherMap[tId]) teacherMap[tId] = { name: tName, count: 0 }
        teacherMap[tId].count++
      }
    })

    // Room utilization
    const roomMap = {}
    slots.forEach(s => {
      if (s.room) {
        const rName = s.room.trim()
        if (!roomMap[rName]) roomMap[rName] = 0
        roomMap[rName]++
      }
    })

    // Day distribution
    const dayMap = { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 }
    slots.forEach(s => {
      if (dayMap[s.day] !== undefined) dayMap[s.day]++
    })

    // Subject distribution
    const subjectMap = {}
    slots.forEach(s => {
      if (s.subject) {
        const subName = s.subject.name
        if (!subjectMap[subName]) subjectMap[subName] = 0
        subjectMap[subName]++
      }
    })

    return {
      totalLectures,
      teacherWorkload: Object.values(teacherMap),
      roomUtilization: Object.entries(roomMap).map(([name, count]) => ({ name, count })),
      dayDistribution: dayMap,
      subjectDistribution: Object.entries(subjectMap).map(([name, count]) => ({ name, count }))
    }
  }

  /**
   * Auto timetable generator (constraint solver)
   */
  async autoGenerate(payload, userId = null) {
    const { targetClass, academicYear = '2026-2027', overwrite = false } = payload
    if (!targetClass) throw new Error('Target class is required')

    if (overwrite) {
      await Timetable.deleteMany({ class: targetClass, academicYear })
    }

    const periods = await Period.find({ type: 'period' }).sort({ order: 1 }).lean()
    const subjects = await Subject.find({ class: targetClass, status: 'Active' }).populate('assignedTeacher').lean()

    if (periods.length === 0) throw new Error('No teaching periods configured')
    if (subjects.length === 0) throw new Error(`No active subjects found for ${targetClass}`)

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    const generated = []

    // Map out subject pool based on required periods per week
    let pool = []
    subjects.forEach(sub => {
      const count = sub.periodsPerWeek || 4
      for (let i = 0; i < count; i++) {
        pool.push(sub)
      }
    })

    // Shuffle pool for fair distribution
    pool = pool.sort(() => Math.random() - 0.5)

    let poolIdx = 0
    for (const day of days) {
      for (const period of periods) {
        if (poolIdx >= pool.length) break
        const sub = pool[poolIdx]
        const teacherId = sub.assignedTeacher ? sub.assignedTeacher._id : null

        const slotData = {
          class: targetClass,
          day,
          period: period._id,
          subject: sub._id,
          teacher: teacherId,
          room: `Room ${targetClass.replace(/\D/g, '') || '101'}`,
          academicYear
        }

        try {
          await this.checkConflicts(slotData)
          const newSlot = new Timetable(slotData)
          await newSlot.save()
          await this.recordVersion(newSlot._id, 'auto_generate', userId, 'Auto generated')
          generated.push(newSlot)
          poolIdx++
        } catch (err) {
          // If conflict occurs, continue trying next slots
        }
      }
    }

    return { generatedCount: generated.length, targetClass }
  }

  /**
   * Get all timetable slots matching options
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async getTimetableForClass(options = {}) {
    const query = { tenantId: options.tenantId }
    if (options.class) {
      query.class = options.class
    }
    if (options.teacher) {
      query.teacher = options.teacher
    }
    if (options.room) {
      query.room = options.room
    }
    if (options.subject) {
      query.subject = options.subject
    }
    if (options.day) {
      query.day = options.day
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
      .populate('assistantTeacher')
      .populate('substituteTeacher')

    const activeSlots = slots.filter(s => s.period)

    // Calculate statistics
    const totalPeriodsCount = await Period.countDocuments({ type: 'period', tenantId: options.tenantId })
    const maxWeeklySlots = totalPeriodsCount * 7

    const totalLectures = activeSlots.length
    const freeSlots = Math.max(0, maxWeeklySlots - totalLectures)

    const teacherConflictsGroup = await Timetable.aggregate([
      {
        $match: { tenantId: options.tenantId }
      },
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
        $match: { tenantId: options.tenantId }
      },
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
   * @param {String} tenantId
   * @returns {Promise<Object>}
   */
  async getTimetableById(id, tenantId) {
    const slot = await Timetable.findOne({ _id: id, tenantId })
      .populate('subject')
      .populate('teacher')
      .populate('period')
      .populate('assistantTeacher')
      .populate('substituteTeacher')
    if (!slot) {
      throw new Error('Timetable slot not found')
    }
    return slot.toObject()
  }
}

module.exports = new TimetableService()
