const AttendanceSession = require('../models/AttendanceSession')
const AttendanceRecord = require('../models/AttendanceRecord')
const AttendanceOverrideHistory = require('../models/AttendanceOverrideHistory')
const AttendanceSettings = require('../models/AttendanceSettings')
const AttendanceAuditLog = require('../models/AttendanceAuditLog')
const NotificationService = require('./NotificationService')
const Timetable = require('../models/Timetable')
const Student = require('../models/Student')
const mongoose = require('mongoose')

class AttendanceService {
  /**
   * Helper to parse dates into UTC start and end bounds
   */
  getStartAndEndOfDay(dateInput) {
    const date = new Date(dateInput)
    const start = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0))
    const end = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999))
    return { start, end }
  }

  /**
   * Helper to get Day of the week string
   */
  getDayOfWeek(dateInput) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[new Date(dateInput).getDay()]
  }

  /**
   * Helper to generate date objects between two dates
   */
  getDatesInRange(startDate, endDate) {
    const dates = []
    let curr = new Date(startDate)
    const end = new Date(endDate)
    // limit to 31 days to prevent CPU overload
    const maxDays = 31
    let count = 0
    while (curr <= end && count < maxDays) {
      dates.push(new Date(curr))
      curr.setDate(curr.getDate() + 1)
      count++
    }
    return dates
  }

  /**
   * GET attendance sessions list + dashboard stats
   * Supports pagination if filters.page is provided.
   */
  async getAttendanceSessions(filters = {}) {
    const { classId, teacherId, subjectId, date, startDate, endDate, status, search, page, limit } = filters
    
    // If paginated is requested
    if (page !== undefined) {
      const pageNum = parseInt(page) || 1
      const limitNum = parseInt(limit) || 10
      const skip = (pageNum - 1) * limitNum

      // Determine date bounds
      let start, end;
      if (startDate || endDate) {
        if (startDate) start = this.getStartAndEndOfDay(startDate).start
        if (endDate) end = this.getStartAndEndOfDay(endDate).end
      } else if (date) {
        const bounds = this.getStartAndEndOfDay(date)
        start = bounds.start
        end = bounds.end
      } else {
        // Default to past 15 days up to today if range not specified in history
        const today = new Date()
        const past = new Date()
        past.setDate(today.getDate() - 15)
        start = this.getStartAndEndOfDay(past).start
        end = this.getStartAndEndOfDay(today).end
      }

      // 1. PENDING FLOW
      if (status === 'Pending') {
        const timetableQuery = {}
        if (classId) timetableQuery.class = classId
        if (teacherId) timetableQuery.teacher = teacherId
        if (subjectId) timetableQuery.subject = subjectId

        // Load all matching timetable rules
        const scheduledSlots = await Timetable.find(timetableQuery)
          .populate('subject')
          .populate('teacher')
          .populate('period')
          .lean()

        // Find marked sessions in range
        const markedQuery = { date: { $gte: start, $lte: end } }
        if (classId) markedQuery.classId = classId
        if (teacherId) markedQuery.teacherId = teacherId
        if (subjectId) markedQuery.subjectId = subjectId

        const markedSessions = await AttendanceSession.find(markedQuery).lean()
        const markedKeys = new Set(markedSessions.map(s => `${s.timetableSlotId.toString()}:${new Date(s.date).toISOString().split('T')[0]}`))

        const pending = []
        const dates = this.getDatesInRange(start, end)
        for (const d of dates) {
          const dayName = this.getDayOfWeek(d)
          const dateStr = d.toISOString().split('T')[0]
          const daySlots = scheduledSlots.filter(s => s.day === dayName)
          for (const slot of daySlots) {
            const key = `${slot._id.toString()}:${dateStr}`
            if (!markedKeys.has(key)) {
              // Apply search filter if present
              if (search) {
                const searchLower = search.toLowerCase()
                const teacherName = `${slot.teacher?.firstName || ''} ${slot.teacher?.lastName || ''}`.toLowerCase()
                const subjectName = (slot.subject?.name || '').toLowerCase()
                const clName = (slot.class || '').toLowerCase()
                
                if (!teacherName.includes(searchLower) && 
                    !subjectName.includes(searchLower) && 
                    !clName.includes(searchLower)) {
                  continue
                }
              }

              pending.push({
                _id: `pending-${slot._id}-${dateStr}`,
                date: d,
                classId: slot.class,
                subjectId: slot.subject,
                teacherId: slot.teacher,
                periodId: slot.period,
                timetableSlotId: slot,
                status: 'Pending',
                isLocked: false,
                stats: {
                  totalStudents: 0,
                  presentCount: 0,
                  absentCount: 0,
                  lateCount: 0,
                  leaveCount: 0,
                  attendancePercentage: 0
                }
              })
            }
          }
        }

        // Sort newest first
        pending.sort((a, b) => b.date - a.date)
        const totalCount = pending.length
        const paginatedPending = pending.slice(skip, skip + limitNum)

        return {
          sessions: paginatedPending,
          pagination: {
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(totalCount / limitNum),
            totalCount
          }
        }
      }

      // 2. MARKED FLOW (COMPLETED, LOCKED, OVERRIDDEN)
      const sessionQuery = {
        date: { $gte: start, $lte: end }
      }
      if (classId) sessionQuery.classId = classId
      if (teacherId) sessionQuery.teacherId = teacherId
      if (subjectId) sessionQuery.subjectId = subjectId

      if (status === 'Locked') {
        sessionQuery.isLocked = true
      } else if (status === 'Completed') {
        sessionQuery.isLocked = false
        sessionQuery.$or = [{ status: 'Completed' }, { status: 'Submitted' }]
      } else if (status === 'Overridden') {
        sessionQuery.status = 'Overridden'
      }

      // Apply Search matching teacher name or subject name
      if (search) {
        const matchingTeachers = await mongoose.model('Teacher').find({
          $or: [
            { firstName: new RegExp(search, 'i') },
            { lastName: new RegExp(search, 'i') }
          ]
        })
        const matchingSubjects = await mongoose.model('Subject').find({
          name: new RegExp(search, 'i')
        })

        sessionQuery.$and = sessionQuery.$and || []
        sessionQuery.$and.push({
          $or: [
            { classId: new RegExp(search, 'i') },
            { teacherId: { $in: matchingTeachers.map(t => t._id) } },
            { subjectId: { $in: matchingSubjects.map(s => s._id) } }
          ]
        })
      }

      const totalCount = await AttendanceSession.countDocuments(sessionQuery)
      const sessions = await AttendanceSession.find(sessionQuery)
        .populate('timetableSlotId')
        .populate('subjectId')
        .populate({
          path: 'teacherId',
          select: 'firstName lastName email teacherId'
        })
        .populate('periodId')
        .populate({
          path: 'createdBy',
          select: 'firstName lastName email'
        })
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)

      const sessionsWithStats = await Promise.all(sessions.map(async (session) => {
        const records = await AttendanceRecord.find({ attendanceSessionId: session._id })
        const total = records.length
        const present = records.filter(r => r.status === 'Present').length
        const absent = records.filter(r => r.status === 'Absent').length
        const late = records.filter(r => r.status === 'Late').length
        const leave = records.filter(r => r.status === 'Leave').length

        const percent = total > 0 ? Math.round((present / total) * 100) : 0

        // Format Status label nicely
        let finalStatus = session.status
        if (session.isLocked) {
          finalStatus = 'Locked'
        } else if (session.status === 'Submitted') {
          finalStatus = 'Completed'
        }

        return {
          ...session.toObject(),
          status: finalStatus,
          stats: {
            totalStudents: total,
            presentCount: present,
            absentCount: absent,
            lateCount: late,
            leaveCount: leave,
            attendancePercentage: percent
          }
        }
      }))

      return {
        sessions: sessionsWithStats,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalCount
        }
      }
    }

    // Default today view non-paginated (backwards compatible)
    const targetDate = date ? new Date(date) : new Date()
    const { start, end } = this.getStartAndEndOfDay(targetDate)
    const dayName = this.getDayOfWeek(targetDate)

    const sessionQuery = {
      date: { $gte: start, $lte: end }
    }
    if (classId) sessionQuery.classId = classId
    if (teacherId) sessionQuery.teacherId = teacherId
    if (subjectId) sessionQuery.subjectId = subjectId

    const sessions = await AttendanceSession.find(sessionQuery)
      .populate('timetableSlotId')
      .populate('subjectId')
      .populate({
        path: 'teacherId',
        select: 'firstName lastName teacherId email'
      })
      .populate('periodId')
      .populate({
        path: 'createdBy',
        select: 'firstName lastName email'
      })
      .populate({
        path: 'updatedBy',
        select: 'firstName lastName email'
      })
      .sort({ createdAt: -1 })

    const sessionsWithStats = await Promise.all(sessions.map(async (session) => {
      const records = await AttendanceRecord.find({ attendanceSessionId: session._id })
      const total = records.length
      const present = records.filter(r => r.status === 'Present').length
      const absent = records.filter(r => r.status === 'Absent').length
      const late = records.filter(r => r.status === 'Late').length
      const leave = records.filter(r => r.status === 'Leave').length

      const percent = total > 0 ? Math.round((present / total) * 100) : 0

      let finalStatus = session.status
      if (session.isLocked) {
        finalStatus = 'Locked'
      } else if (session.status === 'Submitted') {
        finalStatus = 'Completed'
      }

      return {
        ...session.toObject(),
        status: finalStatus,
        stats: {
          totalStudents: total,
          presentCount: present,
          absentCount: absent,
          lateCount: late,
          leaveCount: leave,
          attendancePercentage: percent
        }
      }
    }))

    const timetableQuery = { day: dayName }
    if (classId) timetableQuery.class = classId
    if (teacherId) timetableQuery.teacher = teacherId
    if (subjectId) timetableQuery.subject = subjectId
    
    const scheduledSlots = await Timetable.find(timetableQuery)

    const totalSlotsCount = scheduledSlots.length
    const submittedSessionsCount = sessions.length
    const pendingSessionsCount = Math.max(0, totalSlotsCount - submittedSessionsCount)

    const sessionIds = sessions.map(s => s._id)
    const allRecords = await AttendanceRecord.find({ attendanceSessionId: { $in: sessionIds } })
    const allTotal = allRecords.length
    const allPresent = allRecords.filter(r => r.status === 'Present').length
    const overallPercentage = allTotal > 0 ? Math.round((allPresent / allTotal) * 100) : 0

    return {
      sessions: sessionsWithStats,
      stats: {
        totalSessions: totalSlotsCount,
        attendanceSubmitted: submittedSessionsCount,
        pendingAttendance: pendingSessionsCount,
        overallAttendancePercentage: overallPercentage
      }
    }
  }

  /**
   * Fetch single session with full records list populated
   */
  async getAttendanceSessionById(sessionId) {
    const session = await AttendanceSession.findById(sessionId)
      .populate('timetableSlotId')
      .populate('subjectId')
      .populate({
        path: 'teacherId',
        select: 'firstName lastName teacherId email'
      })
      .populate('periodId')
      .populate({
        path: 'createdBy',
        select: 'firstName lastName email'
      })
      .populate({
        path: 'updatedBy',
        select: 'firstName lastName email'
      })

    if (!session) {
      throw new Error('Attendance session not found')
    }

    const records = await AttendanceRecord.find({ attendanceSessionId: sessionId })
      .populate({
        path: 'studentId',
        select: 'firstName lastName studentId photo class'
      })
      .sort({ 'studentId.firstName': 1 })

    // Build stats
    const total = records.length
    const present = records.filter(r => r.status === 'Present').length
    const absent = records.filter(r => r.status === 'Absent').length
    const late = records.filter(r => r.status === 'Late').length
    const leave = records.filter(r => r.status === 'Leave').length
    const percent = total > 0 ? Math.round((present / total) * 100) : 0

    let finalStatus = session.status
    if (session.isLocked) {
      finalStatus = 'Locked'
    } else if (session.status === 'Submitted') {
      finalStatus = 'Completed'
    }

    const sessionObj = {
      ...session.toObject(),
      status: finalStatus,
      stats: {
        totalStudents: total,
        presentCount: present,
        absentCount: absent,
        lateCount: late,
        leaveCount: leave,
        attendancePercentage: percent
      }
    }

    return {
      session: sessionObj,
      records: records.map(r => r.toObject())
    }
  }

  /**
   * Create attendance session and individual student records
   */
  async createAttendanceSession(data, createdByUserId) {
    const { timetableSlotId, classId, subjectId, teacherId, periodId, day, date, records } = data

    const targetDate = new Date(date)
    const { start, end } = this.getStartAndEndOfDay(targetDate)

    const existing = await AttendanceSession.findOne({
      timetableSlotId,
      date: { $gte: start, $lte: end }
    })

    if (existing) {
      const err = new Error('Attendance already exists.')
      err.attendanceSessionId = existing._id
      throw err
    }

    const session = new AttendanceSession({
      timetableSlotId,
      classId,
      subjectId,
      teacherId,
      periodId,
      day,
      date: targetDate,
      createdBy: createdByUserId,
      status: 'Completed'
    })
    await session.save()

    if (records && Array.isArray(records)) {
      const recordsToInsert = records.map(r => ({
        attendanceSessionId: session._id,
        studentId: r.studentId,
        status: r.status || 'Present',
        remarks: r.remarks || ''
      }))
      await AttendanceRecord.insertMany(recordsToInsert)

      // Send notifications stub
      records.forEach(r => {
        NotificationService.sendAttendanceNotification(r.studentId, targetDate, r.status)
      })
    }

    // Save Audit log
    const audit = new AttendanceAuditLog({
      attendanceSessionId: session._id,
      action: 'Created',
      performedBy: createdByUserId,
      description: `Created attendance log for ${classId} on ${targetDate.toLocaleDateString()}`
    })
    await audit.save()

    return this.getAttendanceSessionById(session._id)
  }

  /**
   * Update existing attendance records
   * Saves override log entries for modified records.
   */
  async updateAttendanceSession(sessionId, data, updatedByUserId) {
    const session = await AttendanceSession.findById(sessionId)
    if (!session) {
      throw new Error('Attendance session not found')
    }

    session.updatedBy = updatedByUserId
    
    // Check lock/unlock action
    if (data.isLocked !== undefined && data.isLocked !== session.isLocked) {
      session.isLocked = data.isLocked
      const actionType = data.isLocked ? 'Locked' : 'Unlocked'
      const audit = new AttendanceAuditLog({
        attendanceSessionId: session._id,
        action: actionType,
        performedBy: updatedByUserId,
        description: `${actionType} attendance session for class ${session.classId}`
      })
      await audit.save()
    }
    
    const { records, overrideReason } = data
    if (records && Array.isArray(records)) {
      const existingRecords = await AttendanceRecord.find({ attendanceSessionId: sessionId })
      let hasOverride = false
      let hasEdit = false

      await Promise.all(records.map(async (r) => {
        const oldRec = existingRecords.find(x => x.studentId.toString() === r.studentId.toString())
        if (oldRec) {
          if (oldRec.status !== r.status) {
            hasOverride = true
            const overrideLog = new AttendanceOverrideHistory({
              attendanceSessionId: sessionId,
              studentId: r.studentId,
              oldStatus: oldRec.status,
              newStatus: r.status,
              modifiedBy: updatedByUserId,
              reason: overrideReason || 'Admin manual status change override'
            })
            await overrideLog.save()
          } else if (oldRec.remarks !== r.remarks) {
            hasEdit = true
          }
        }

        await AttendanceRecord.findOneAndUpdate(
          { attendanceSessionId: sessionId, studentId: r.studentId },
          { status: r.status, remarks: r.remarks || '' },
          { upsert: true, new: true }
        )
      }))

      if (hasOverride) {
        session.status = 'Overridden'
        
        // Log override audit action
        const audit = new AttendanceAuditLog({
          attendanceSessionId: session._id,
          action: 'Override',
          performedBy: updatedByUserId,
          description: `Overrode student records status logs for class ${session.classId}`
        })
        await audit.save()
      } else if (hasEdit) {
        // Log standard edit audit action
        const audit = new AttendanceAuditLog({
          attendanceSessionId: session._id,
          action: 'Edited',
          performedBy: updatedByUserId,
          description: `Edited attendance notes / remarks for class ${session.classId}`
        })
        await audit.save()
      }
    }

    await session.save()
    return this.getAttendanceSessionById(sessionId)
  }

  /**
   * Delete attendance session and corresponding records
   */
  async deleteAttendanceSession(sessionId, performedByUserId) {
    const session = await AttendanceSession.findById(sessionId)
    if (!session) {
      throw new Error('Attendance session not found')
    }

    // Save audit log
    const audit = new AttendanceAuditLog({
      action: 'Deleted',
      performedBy: performedByUserId,
      description: `Deleted attendance session for class ${session.classId} on ${new Date(session.date).toLocaleDateString()}`
    })
    await audit.save()

    // Delete records, override history, and session
    await AttendanceRecord.deleteMany({ attendanceSessionId: sessionId })
    await AttendanceOverrideHistory.deleteMany({ attendanceSessionId: sessionId })
    await AttendanceSession.findByIdAndDelete(sessionId)

    return true
  }

  /**
   * Fetch override history logs for a session
   */
  async getOverrideHistoryForSession(sessionId) {
    return await AttendanceOverrideHistory.find({ attendanceSessionId: sessionId })
      .populate({
        path: 'studentId',
        select: 'firstName lastName studentId photo'
      })
      .populate({
        path: 'modifiedBy',
        select: 'firstName lastName email'
      })
      .sort({ createdAt: -1 })
  }

  /**
   * Get scheduled timetable slots for a date and class with attendance status
   */
  async getTodayTimetableSlotsWithStatus(dateStr, classId) {
    const targetDate = dateStr ? new Date(dateStr) : new Date()
    const { start, end } = this.getStartAndEndOfDay(targetDate)
    const dayName = this.getDayOfWeek(targetDate)

    const query = { day: dayName }
    if (classId) {
      query.class = classId
    }

    const slots = await Timetable.find(query)
      .populate('subject')
      .populate({
        path: 'teacher',
        select: 'firstName lastName email teacherId'
      })
      .populate('period')
      .lean()

    const slotsWithStatus = await Promise.all(slots.map(async (slot) => {
      const session = await AttendanceSession.findOne({
        timetableSlotId: slot._id,
        date: { $gte: start, $lte: end }
      })

      return {
        ...slot,
        attendanceStatus: session ? 'Marked' : 'Pending',
        attendanceSessionId: session ? session._id : null
      }
    }))

    return slotsWithStatus
  }

  /**
   * Fetch overall aggregated statistics and breakdowns for analytical dashboards
   */
  async getAttendanceAnalytics(filters = {}) {
    const { classId, teacherId, subjectId, studentId, month, year, startDate, endDate, threshold = 75 } = filters

    // 1. Build date filter
    let dateFilter = {}
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate)
      if (endDate) dateFilter.$lte = new Date(endDate)
    } else if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1)
      const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)
      dateFilter = { $gte: start, $lte: end }
    } else if (year) {
      const start = new Date(parseInt(year), 0, 1)
      const end = new Date(parseInt(year), 11, 31, 23, 59, 59, 999)
      dateFilter = { $gte: start, $lte: end }
    } else {
      // Default to past 30 days
      const today = new Date()
      const past = new Date()
      past.setDate(today.getDate() - 30)
      dateFilter = { $gte: past, $lte: today }
    }

    // 2. Fetch all matching AttendanceSession IDs
    const sessionQuery = {}
    if (Object.keys(dateFilter).length > 0) {
      sessionQuery.date = dateFilter
    }
    if (classId) sessionQuery.classId = classId
    if (teacherId) sessionQuery.teacherId = new mongoose.Types.ObjectId(teacherId)
    if (subjectId) sessionQuery.subjectId = new mongoose.Types.ObjectId(subjectId)

    const matchingSessions = await AttendanceSession.find(sessionQuery)
      .populate('subjectId')
      .populate('teacherId')
      .lean()

    const sessionIds = matchingSessions.map(s => s._id)

    // Build Record query match
    const recordMatch = {
      attendanceSessionId: { $in: sessionIds }
    }
    if (studentId) {
      recordMatch.studentId = new mongoose.Types.ObjectId(studentId)
    }

    if (sessionIds.length === 0) {
      return {
        summary: {
          overallPercentage: 0,
          totalSessions: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          leaveCount: 0,
          averageClassAttendance: 0,
          highestClass: 'N/A',
          lowestClass: 'N/A',
          studentsBelowThreshold: 0,
          studentsAbove90: 0,
          totalLateArrivals: 0
        },
        trends: {
          daily: [],
          monthly: []
        },
        breakdowns: {
          classWise: [],
          subjectWise: [],
          teacherWise: []
        },
        studentTable: []
      }
    }

    // 3. Overall records count
    const records = await AttendanceRecord.find(recordMatch)
      .populate({
        path: 'studentId',
        select: 'firstName lastName studentId photo class'
      })
      .lean()
    
    // Group records by student
    const studentMap = {}
    records.forEach(rec => {
      const st = rec.studentId
      if (!st) return
      const stId = st._id.toString()
      if (!studentMap[stId]) {
        studentMap[stId] = {
          student: st,
          present: 0,
          absent: 0,
          late: 0,
          leave: 0,
          total: 0
        }
      }
      studentMap[stId].total++
      if (rec.status === 'Present') studentMap[stId].present++
      else if (rec.status === 'Absent') studentMap[stId].absent++
      else if (rec.status === 'Late') studentMap[stId].late++
      else if (rec.status === 'Leave') studentMap[stId].leave++
    })

    const studentList = Object.values(studentMap).map(item => {
      const rate = item.total > 0 ? Math.round(((item.present + item.late) / item.total) * 100) : 0
      let status = 'Excellent'
      if (rate >= 90) status = 'Excellent'
      else if (rate >= 80) status = 'Good'
      else if (rate >= 75) status = 'Average'
      else if (rate >= 60) status = 'Poor'
      else status = 'Critical'

      return {
        studentId: item.student._id,
        firstName: item.student.firstName,
        lastName: item.student.lastName,
        photo: item.student.photo,
        rollNo: item.student.studentId,
        class: item.student.class,
        present: item.present,
        absent: item.absent,
        late: item.late,
        leave: item.leave,
        total: item.total,
        rate,
        status
      }
    })

    // Sort student list by name
    studentList.sort((a, b) => a.firstName.localeCompare(b.firstName))

    // Calculate basic totals
    const totalRecords = records.length
    const presentCount = records.filter(r => r.status === 'Present').length
    const absentCount = records.filter(r => r.status === 'Absent').length
    const lateCount = records.filter(r => r.status === 'Late').length
    const leaveCount = records.filter(r => r.status === 'Leave').length
    
    // Overall rate: count Present + Late as attended
    const overallPercentage = totalRecords > 0 ? Math.round(((presentCount + lateCount) / totalRecords) * 100) : 0

    // Group sessions by ID
    const sessionMap = {}
    matchingSessions.forEach(s => {
      sessionMap[s._id.toString()] = s
    })

    // Class wise rate
    const classMap = {}
    records.forEach(rec => {
      const sess = sessionMap[rec.attendanceSessionId.toString()]
      if (!sess) return
      const cName = sess.classId
      if (!classMap[cName]) {
        classMap[cName] = { present: 0, total: 0 }
      }
      classMap[cName].total++
      if (rec.status === 'Present' || rec.status === 'Late') classMap[cName].present++
    })
    const classBreakdown = Object.entries(classMap).map(([name, val]) => {
      const classRecs = records.filter(r => r.studentId?.class === name)
      return {
        name,
        rate: val.total > 0 ? Math.round((val.present / val.total) * 100) : 0,
        studentsCount: studentList.filter(s => s.class === name).length,
        present: classRecs.filter(r => r.status === 'Present').length,
        absent: classRecs.filter(r => r.status === 'Absent').length,
        late: classRecs.filter(r => r.status === 'Late').length,
        leave: classRecs.filter(r => r.status === 'Leave').length
      }
    }).sort((a, b) => b.rate - a.rate)

    // Subject wise rate
    const subjectRecordsMap = {}
    records.forEach(rec => {
      const sess = sessionMap[rec.attendanceSessionId.toString()]
      if (!sess) return
      const sId = sess.subjectId?._id?.toString() || 'unknown'
      if (!subjectRecordsMap[sId]) {
        subjectRecordsMap[sId] = { name: sess.subjectId?.name || 'Subject', present: 0, total: 0, sId }
      }
      subjectRecordsMap[sId].total++
      if (rec.status === 'Present' || rec.status === 'Late') subjectRecordsMap[sId].present++
    })
    const subjectBreakdown = Object.values(subjectRecordsMap).map(item => {
      const subSessions = matchingSessions.filter(s => s.subjectId?._id?.toString() === item.sId)
      const subRecs = records.filter(r => sessionMap[r.attendanceSessionId.toString()]?.subjectId?._id?.toString() === item.sId)
      const sessionRates = subSessions.map(s => {
        const sessRecs = records.filter(r => r.attendanceSessionId.toString() === s._id.toString())
        const pres = sessRecs.filter(r => r.status === 'Present' || r.status === 'Late').length
        return sessRecs.length > 0 ? Math.round((pres / sessRecs.length) * 100) : 0
      })

      return {
        name: item.name,
        rate: item.total > 0 ? Math.round((item.present / item.total) * 100) : 0,
        totalLectures: subSessions.length,
        present: subRecs.filter(r => r.status === 'Present').length,
        absent: subRecs.filter(r => r.status === 'Absent').length,
        late: subRecs.filter(r => r.status === 'Late').length,
        leave: subRecs.filter(r => r.status === 'Leave').length,
        highest: sessionRates.length > 0 ? Math.max(...sessionRates) : 0,
        lowest: sessionRates.length > 0 ? Math.min(...sessionRates) : 0
      }
    }).sort((a, b) => b.rate - a.rate)

    // Teacher wise rate
    const teacherRecordsMap = {}
    records.forEach(rec => {
      const sess = sessionMap[rec.attendanceSessionId.toString()]
      if (!sess) return
      const tId = sess.teacherId?._id?.toString() || 'unknown'
      if (!teacherRecordsMap[tId]) {
        const name = sess.teacherId ? `${sess.teacherId.firstName || ''} ${sess.teacherId.lastName || ''}`.trim() : 'Teacher'
        teacherRecordsMap[tId] = { name, present: 0, total: 0, tId }
      }
      teacherRecordsMap[tId].total++
      if (rec.status === 'Present' || rec.status === 'Late') teacherRecordsMap[tId].present++
    })
    const teacherBreakdown = Object.values(teacherRecordsMap).map(item => {
      const teachRecs = records.filter(r => sessionMap[r.attendanceSessionId.toString()]?.teacherId?._id?.toString() === item.tId)
      return {
        name: item.name,
        rate: item.total > 0 ? Math.round((item.present / item.total) * 100) : 0,
        lecturesConducted: matchingSessions.filter(s => s.teacherId?._id?.toString() === item.tId).length,
        present: teachRecs.filter(r => r.status === 'Present').length,
        absent: teachRecs.filter(r => r.status === 'Absent').length,
        late: teachRecs.filter(r => r.status === 'Late').length,
        leave: teachRecs.filter(r => r.status === 'Leave').length
      }
    }).sort((a, b) => b.rate - a.rate)

    // Daily & Monthly Trend
    const dailyMap = {}
    const monthlyMap = {}
    records.forEach(rec => {
      const sess = sessionMap[rec.attendanceSessionId.toString()]
      if (!sess) return
      const dateVal = new Date(sess.date)
      const dayKey = dateVal.toISOString().split('T')[0]
      const monthKey = `${dateVal.getFullYear()}-${String(dateVal.getMonth() + 1).padStart(2, '0')}`

      if (!dailyMap[dayKey]) dailyMap[dayKey] = { present: 0, total: 0 }
      dailyMap[dayKey].total++
      if (rec.status === 'Present' || rec.status === 'Late') dailyMap[dayKey].present++

      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { present: 0, total: 0 }
      monthlyMap[monthKey].total++
      if (rec.status === 'Present' || rec.status === 'Late') monthlyMap[monthKey].present++
    })

    const dailyTrend = Object.entries(dailyMap).map(([date, val]) => ({
      date,
      rate: val.total > 0 ? Math.round((val.present / val.total) * 100) : 0
    })).sort((a, b) => a.date.localeCompare(b.date))

    const monthlyTrend = Object.entries(monthlyMap).map(([month, val]) => ({
      month,
      rate: val.total > 0 ? Math.round((val.present / val.total) * 100) : 0
    })).sort((a, b) => a.month.localeCompare(b.month))

    // High and Low classes
    const highestClass = classBreakdown[0]?.name || 'N/A'
    const lowestClass = classBreakdown[classBreakdown.length - 1]?.name || 'N/A'

    // Threshold counts
    const thresholdNum = parseFloat(threshold) || 75
    const studentsBelowThreshold = studentList.filter(s => s.rate < thresholdNum).length
    const studentsAbove90 = studentList.filter(s => s.rate >= 90).length

    // Average Class Attendance
    const avgClassAttendance = classBreakdown.length > 0 ? Math.round(classBreakdown.reduce((acc, c) => acc + c.rate, 0) / classBreakdown.length) : 0

    return {
      summary: {
        overallPercentage,
        totalSessions: matchingSessions.length,
        presentCount,
        absentCount,
        lateCount,
        leaveCount,
        averageClassAttendance: avgClassAttendance,
        highestClass,
        lowestClass,
        studentsBelowThreshold,
        studentsAbove90,
        totalLateArrivals: lateCount
      },
      trends: {
        daily: dailyTrend,
        monthly: monthlyTrend
      },
      breakdowns: {
        classWise: classBreakdown,
        subjectWise: subjectBreakdown,
        teacherWise: teacherBreakdown
      },
      studentTable: studentList
    }
  }

  /**
   * Fetch full student attendance details and calendar logs for dashboard profiles
   */
  async getStudentAttendanceProfile(studentId) {
    const student = await Student.findById(studentId).lean()
    if (!student) {
      throw new Error('Student not found')
    }

    // Fetch all attendance records for this student
    const records = await AttendanceRecord.find({ studentId })
      .populate({
        path: 'attendanceSessionId',
        populate: [
          { path: 'subjectId' },
          { path: 'teacherId', select: 'firstName lastName email' },
          { path: 'periodId' }
        ]
      })
      .sort({ createdAt: -1 })
      .lean()

    // Group by subject
    const subjectsMap = {}
    const calendar = []
    const monthly = {}

    records.forEach(rec => {
      const sess = rec.attendanceSessionId
      if (!sess) return

      // Subject grouping
      const sId = sess.subjectId?._id?.toString() || 'unknown'
      if (!subjectsMap[sId]) {
        subjectsMap[sId] = {
          subjectName: sess.subjectId?.name || 'Subject',
          present: 0,
          absent: 0,
          late: 0,
          leave: 0,
          total: 0,
          teacher: sess.teacherId ? `${sess.teacherId.firstName || ''} ${sess.teacherId.lastName || ''}`.trim() : 'Unassigned'
        }
      }
      subjectsMap[sId].total++
      if (rec.status === 'Present') subjectsMap[sId].present++
      else if (rec.status === 'Absent') subjectsMap[sId].absent++
      else if (rec.status === 'Late') subjectsMap[sId].late++
      else if (rec.status === 'Leave') subjectsMap[sId].leave++

      // Calendar dates mapping
      calendar.push({
        date: sess.date,
        status: rec.status,
        remarks: rec.remarks,
        subject: sess.subjectId?.name || 'Subject',
        period: sess.periodId?.name || 'Period',
        time: sess.periodId ? `${sess.periodId.startTime} - ${sess.periodId.endTime}` : ''
      })

      // Monthly rate
      const dateObj = new Date(sess.date)
      const mKey = dateObj.toLocaleString('default', { month: 'short' }) + ' ' + dateObj.getFullYear()
      if (!monthly[mKey]) {
        monthly[mKey] = { present: 0, total: 0 }
      }
      monthly[mKey].total++
      if (rec.status === 'Present' || rec.status === 'Late') {
        monthly[mKey].present++
      }
    })

    const subjectTable = Object.values(subjectsMap).map(item => ({
      ...item,
      rate: item.total > 0 ? Math.round(((item.present + item.late) / item.total) * 100) : 0
    }))

    const monthlyTrend = Object.entries(monthly).map(([name, val]) => ({
      name,
      rate: val.total > 0 ? Math.round((val.present / val.total) * 100) : 0
    }))

    // Overall rate
    const total = records.length
    const present = records.filter(r => r.status === 'Present').length
    const late = records.filter(r => r.status === 'Late').length
    const absent = records.filter(r => r.status === 'Absent').length
    const leave = records.filter(r => r.status === 'Leave').length
    const overallRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0

    // Status pill
    let status = 'Excellent'
    if (overallRate >= 90) status = 'Excellent'
    else if (overallRate >= 80) status = 'Good'
    else if (overallRate >= 75) status = 'Average'
    else if (overallRate >= 60) status = 'Poor'
    else status = 'Critical'

    // Recent logs
    const recentLogs = records.slice(0, 15).map(rec => ({
      date: rec.attendanceSessionId?.date,
      subject: rec.attendanceSessionId?.subjectId?.name || 'Subject',
      status: rec.status,
      remarks: rec.remarks
    }))

    return {
      student,
      overallRate,
      status,
      total,
      present,
      absent,
      late,
      leave,
      subjectTable,
      monthlyTrend,
      calendar,
      recentLogs
    }
  }

  /**
   * Fetch Attendance settings row (creating defaults if missing)
   */
  async getSettings() {
    let settings = await AttendanceSettings.findOne()
    if (!settings) {
      settings = new AttendanceSettings()
      await settings.save()
    }
    return settings
  }

  /**
   * Update Attendance settings
   */
  async updateSettings(data) {
    let settings = await AttendanceSettings.findOne()
    if (!settings) {
      settings = new AttendanceSettings()
    }
    
    // Update keys
    if (data.attendanceThreshold !== undefined) settings.attendanceThreshold = data.attendanceThreshold
    if (data.lateThreshold !== undefined) settings.lateThreshold = data.lateThreshold
    if (data.attendanceLockTime !== undefined) settings.attendanceLockTime = data.attendanceLockTime
    if (data.defaultStatus !== undefined) settings.defaultStatus = data.defaultStatus
    if (data.weekendAttendance !== undefined) settings.weekendAttendance = data.weekendAttendance
    if (data.autoLockAttendance !== undefined) settings.autoLockAttendance = data.autoLockAttendance
    if (data.enableRemarks !== undefined) settings.enableRemarks = data.enableRemarks
    if (data.enableLeave !== undefined) settings.enableLeave = data.enableLeave

    await settings.save()
    return settings
  }

  /**
   * Fetch recent audit timeline logs
   */
  async getTimeline() {
    return await AttendanceAuditLog.find()
      .populate({
        path: 'performedBy',
        select: 'firstName lastName email role'
      })
      .sort({ createdAt: -1 })
      .limit(30)
  }

  /**
   * Bulk lock, unlock, or delete sessions
   */
  async bulkUpdateSessions(sessionIds, action, userId) {
    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      throw new Error('No sessions specified')
    }

    if (action === 'Lock' || action === 'Unlock') {
      const isLockedVal = action === 'Lock'
      await AttendanceSession.updateMany(
        { _id: { $in: sessionIds } },
        { isLocked: isLockedVal, status: isLockedVal ? 'Locked' : 'Completed' }
      )

      // Add audit log
      const audit = new AttendanceAuditLog({
        action: isLockedVal ? 'Locked' : 'Unlocked',
        performedBy: userId,
        description: `Bulk ${action.toLowerCase()}ed ${sessionIds.length} sessions`
      })
      await audit.save()
    } else if (action === 'Delete') {
      await AttendanceRecord.deleteMany({ attendanceSessionId: { $in: sessionIds } })
      await AttendanceOverrideHistory.deleteMany({ attendanceSessionId: { $in: sessionIds } })
      await AttendanceSession.deleteMany({ _id: { $in: sessionIds } })

      // Add audit log
      const audit = new AttendanceAuditLog({
        action: 'Deleted',
        performedBy: userId,
        description: `Bulk deleted ${sessionIds.length} sessions`
      })
      await audit.save()
    }

    return true
  }

  /**
   * Fetch paginated student attendance roster with filters, sorting, and search
   */
  async getAttendanceRoster(query = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortField = 'name',
      sortDirection = 'asc',
      classId,
      teacherId,
      subjectId,
      studentId,
      month,
      year,
      startDate,
      endDate
    } = query

    const pageNum = parseInt(page) || 1
    const limitNum = parseInt(limit) || 20

    // 1. Build date filter for sessions
    let dateFilter = {}
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate)
      if (endDate) dateFilter.$lte = new Date(endDate)
    } else if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1)
      const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)
      dateFilter = { $gte: start, $lte: end }
    } else if (year) {
      const start = new Date(parseInt(year), 0, 1)
      const end = new Date(parseInt(year), 11, 31, 23, 59, 59, 999)
      dateFilter = { $gte: start, $lte: end }
    } else {
      // Default to past 30 days
      const today = new Date()
      const past = new Date()
      past.setDate(today.getDate() - 30)
      dateFilter = { $gte: past, $lte: today }
    }

    // 2. Fetch all matching AttendanceSession IDs matching Class, Teacher, Subject, Date Filters
    const sessionQuery = {}
    if (Object.keys(dateFilter).length > 0) {
      sessionQuery.date = dateFilter
    }
    if (classId) sessionQuery.classId = classId
    if (teacherId) sessionQuery.teacherId = new mongoose.Types.ObjectId(teacherId)
    if (subjectId) sessionQuery.subjectId = new mongoose.Types.ObjectId(subjectId)

    const matchingSessions = await AttendanceSession.find(sessionQuery).select('_id').lean()
    const sessionIds = matchingSessions.map(s => s._id)

    // 3. Determine matching classes under the class/teacher/subject filters
    let targetClasses = null
    if (classId) {
      targetClasses = [classId]
    } else if (subjectId) {
      const subject = await mongoose.model('Subject').findById(subjectId).lean()
      if (subject) {
        targetClasses = [subject.class]
      }
    } else if (teacherId) {
      const timetableClasses = await mongoose.model('Timetable').find({ teacher: teacherId }).distinct('class')
      const sessionClasses = await AttendanceSession.find({ teacherId }).distinct('classId')
      targetClasses = Array.from(new Set([...timetableClasses, ...sessionClasses]))
    }

    // 4. Build student query matching class filters and search query
    const studentQuery = { status: 'Active' }
    if (targetClasses !== null) {
      studentQuery.class = { $in: targetClasses }
    }
    if (studentId) {
      studentQuery._id = new mongoose.Types.ObjectId(studentId)
    }
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i')
      studentQuery.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { studentId: searchRegex }
      ]
    }

    // 5. Query matching students
    const students = await Student.find(studentQuery).lean()
    const studentIds = students.map(s => s._id)

    // Fetch records for these students and these sessions
    let records = []
    if (studentIds.length > 0 && sessionIds.length > 0) {
      records = await AttendanceRecord.find({
        studentId: { $in: studentIds },
        attendanceSessionId: { $in: sessionIds }
      }).populate('attendanceSessionId', 'date').lean()
    }

    // Group records by student ID
    const studentRecordsMap = {}
    records.forEach(rec => {
      const sId = rec.studentId.toString()
      if (!studentRecordsMap[sId]) {
        studentRecordsMap[sId] = []
      }
      studentRecordsMap[sId].push(rec)
    });

    // Construct full roster info for all matching students
    const rosterList = students.map(student => {
      const studentRecs = studentRecordsMap[student._id.toString()] || []
      const total = studentRecs.length
      const present = studentRecs.filter(r => r.status === 'Present').length
      const absent = studentRecs.filter(r => r.status === 'Absent').length
      const late = studentRecs.filter(r => r.status === 'Late').length
      const leave = studentRecs.filter(r => r.status === 'Leave').length

      const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0
      
      let status = 'Excellent'
      if (rate >= 90) status = 'Excellent'
      else if (rate >= 80) status = 'Good'
      else if (rate >= 75) status = 'Average'
      else if (rate >= 60) status = 'Poor'
      else status = 'Critical'

      // Find the last attendance date and status
      let lastAttendanceStr = '—'
      if (studentRecs.length > 0) {
        const sortedRecs = [...studentRecs].sort((a, b) => {
          const dateA = a.attendanceSessionId?.date ? new Date(a.attendanceSessionId.date) : new Date(0)
          const dateB = b.attendanceSessionId?.date ? new Date(b.attendanceSessionId.date) : new Date(0)
          return dateB - dateA
        })
        const latestRec = sortedRecs[0]
        if (latestRec && latestRec.attendanceSessionId?.date) {
          const formattedDate = new Date(latestRec.attendanceSessionId.date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
          lastAttendanceStr = `${formattedDate} (${latestRec.status})`
        }
      }

      return {
        studentId: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        photo: student.photo,
        rollNo: student.studentId,
        class: student.class,
        present,
        absent,
        late,
        leave,
        total,
        rate,
        status,
        lastAttendance: lastAttendanceStr
      }
    })

    // 6. Sort roster list
    const dir = sortDirection === 'asc' ? 1 : -1
    rosterList.sort((a, b) => {
      let valA, valB
      if (sortField === 'name') {
        valA = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase()
        valB = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase()
      } else if (sortField === 'rollNo') {
        valA = a.rollNo || ''
        valB = b.rollNo || ''
      } else if (sortField === 'class') {
        valA = a.class || ''
        valB = b.class || ''
      } else if (sortField === 'rate') {
        valA = a.rate
        valB = b.rate
      } else if (sortField === 'present') {
        valA = a.present
        valB = b.present
      } else if (sortField === 'absent') {
        valA = a.absent
        valB = b.absent
      } else if (sortField === 'late') {
        valA = a.late
        valB = b.late
      } else if (sortField === 'leave') {
        valA = a.leave
        valB = b.leave
      } else {
        valA = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase()
        valB = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase()
      }

      if (valA < valB) return -1 * dir
      if (valA > valB) return 1 * dir
      return 0
    })

    // 7. Paginate
    const totalStudents = rosterList.length
    const paginatedList = rosterList.slice((pageNum - 1) * limitNum, pageNum * limitNum)

    return {
      students: paginatedList,
      totalCount: totalStudents,
      totalPages: Math.ceil(totalStudents / limitNum),
      page: pageNum,
      limit: limitNum
    }
  }
}

module.exports = new AttendanceService()
