const StudentFee = require('../models/StudentFee')
const Student = require('../models/Student')
const FeeStructure = require('../models/FeeStructure')
const mongoose = require('mongoose')

class StudentFeeService {
  /**
   * Assign a new fee to a student
   * @param {Object} studentFeeData 
   * @returns {Promise<Object>}
   */
  async createStudentFee(studentFeeData) {
    const studentId = studentFeeData.student
    const fsId = studentFeeData.feeStructure

    // 1. Fetch fee structure to verify existence and extract details
    const fs = await FeeStructure.findById(fsId)
    if (!fs) {
      throw new Error('Selected fee structure configuration not found')
    }

    // 2. Verify duplicates
    if (studentId) {
      // Check if student already has this specific structure assigned
      const exists = await StudentFee.findOne({ student: studentId, feeStructure: fsId })
      if (exists) {
        throw new Error('This fee configuration is already assigned to this student.')
      }

      // Check if student already has an assignment for the same academic year
      const studentAssignments = await StudentFee.find({ student: studentId }).populate('feeStructure')
      const duplicateYear = studentAssignments.some(sa => sa.feeStructure && sa.feeStructure.academicYear === fs.academicYear)
      if (duplicateYear) {
        throw new Error(`This student already has a fee structure assigned for the academic year ${fs.academicYear}.`)
      }
    }

    const studentFee = new StudentFee({
      student: studentId,
      feeStructure: fsId,
      tuitionFee: parseFloat(studentFeeData.tuitionFee) || fs.tuitionFee || 0,
      transportFee: parseFloat(studentFeeData.transportFee) || fs.transportFee || 0,
      totalFee: parseFloat(studentFeeData.totalFee) || ((parseFloat(studentFeeData.tuitionFee) || fs.tuitionFee || 0) + (parseFloat(studentFeeData.transportFee) || fs.transportFee || 0)),
      dueDate: studentFeeData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
      paidAmount: 0 // Always initialized to 0
    })

    await studentFee.save()
    return studentFee.toObject()
  }

  /**
   * Fetch single student fee assignment details
   * @param {String} id 
   * @returns {Promise<Object>}
   */
  async getStudentFeeById(id) {
    const studentFee = await StudentFee.findById(id)
      .populate('student')
      .populate('feeStructure')
    
    if (!studentFee) {
      throw new Error('Student fee assignment not found')
    }
    return studentFee.toObject()
  }

  /**
   * Fetch all student fee assignments with pagination, search, and filtering
   * @param {Object} queryParams 
   * @returns {Promise<Object>}
   */
  async getAllStudentFees(queryParams) {
    const page = parseInt(queryParams.page, 10) || 1
    const limit = parseInt(queryParams.limit, 10) || 10
    const skip = (page - 1) * limit

    const filter = {}

    // 1. Resolve keyword search (matches student name or studentId/admission number)
    if (queryParams.search) {
      const searchRegex = new RegExp(queryParams.search.trim(), 'i')
      const matchedStudents = await Student.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { studentId: searchRegex }
        ]
      }).select('_id')

      if (matchedStudents && matchedStudents.length > 0) {
        filter.student = { $in: matchedStudents.map(s => s._id) }
      } else {
        // Search didn't match any students, return empty result
        filter.student = new mongoose.Types.ObjectId()
      }
    }

    // 2. Resolve filters by querying FeeStructure collection first (Course and Academic Year relationships)
    if (queryParams.course || queryParams.academicYear) {
      const fsQuery = {}
      if (queryParams.course) {
        fsQuery.course = queryParams.course
      }
      if (queryParams.academicYear) {
        fsQuery.academicYear = queryParams.academicYear
      }

      const matchedFs = await FeeStructure.find(fsQuery).select('_id')
      if (matchedFs && matchedFs.length > 0) {
        filter.feeStructure = { $in: matchedFs.map(f => f._id) }
      } else {
        filter.feeStructure = new mongoose.Types.ObjectId() // no match
      }
    }

    if (queryParams.status) {
      filter.status = queryParams.status
    }

    // Sorting setup
    let sortOptions = { createdAt: -1 }
    if (queryParams.sort) {
      let rawSort = queryParams.sort
      if (typeof rawSort === 'string') {
        try {
          rawSort = JSON.parse(rawSort)
        } catch (e) {
          sortOptions = { [queryParams.sort]: queryParams.order === 'desc' ? -1 : 1 }
        }
      }
      if (typeof rawSort === 'object' && rawSort !== null) {
        sortOptions = {}
        for (const [key, val] of Object.entries(rawSort)) {
          sortOptions[key] = (val === '-1' || val === -1) ? -1 : 1
        }
      }
    }

    const studentFees = await StudentFee.find(filter)
      .populate('student')
      .populate('feeStructure')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)

    const total = await StudentFee.countDocuments(filter)

    return {
      studentFees: studentFees.map(sf => sf.toObject()),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Fetch unified dashboard stats across Fee Management modules
   * @returns {Promise<Object>}
   */
  async getDashboardStats() {
    const totalFeeStructures = await FeeStructure.countDocuments()
    const activeFeeStructures = await FeeStructure.countDocuments({ status: 'Active' })
    const totalStudentFeeRecords = await StudentFee.countDocuments()
    const paidStudents = await StudentFee.countDocuments({ status: 'Paid' })
    const partialStudents = await StudentFee.countDocuments({ status: 'Partial' })
    const unpaidStudents = await StudentFee.countDocuments({ status: 'Unpaid' })
    const overdueStudents = await StudentFee.countDocuments({ status: 'Overdue' })

    const totalsResult = await StudentFee.aggregate([
      {
        $group: {
          _id: null,
          totalCollected: { $sum: '$paidAmount' },
          totalPending: { $sum: { $subtract: ['$totalFee', '$paidAmount'] } }
        }
      }
    ])

    const totalFeeCollected = totalsResult[0]?.totalCollected || 0
    const totalPendingAmount = totalsResult[0]?.totalPending || 0

    // Group collections by month aggregation
    const monthlyAggregation = await StudentFee.aggregate([
      { $unwind: '$payments' },
      {
        $group: {
          _id: {
            year: { $year: '$payments.paidAt' },
            month: { $month: '$payments.paidAt' }
          },
          total: { $sum: '$payments.amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const monthlyCollections = monthlyAggregation.map(item => {
      const mName = monthNames[(item._id.month - 1)] || ''
      return {
        month: `${mName} ${item._id.year}`,
        amount: item.total
      }
    })

    // Fetch top 5 recent payment transactions
    const recentFees = await StudentFee.find({ 'payments.0': { $exists: true } })
      .populate('student')
      .populate('feeStructure')

    let recentPayments = []
    for (const sf of recentFees) {
      for (const p of sf.payments) {
        recentPayments.push({
          _id: p._id,
          receiptNo: p.receiptNo || `REC-${p._id.toString().substring(18).toUpperCase()}`,
          studentName: sf.student ? `${sf.student.firstName} ${sf.student.lastName}` : 'Unknown Student',
          admissionNo: sf.student?.studentId || 'N/A',
          amount: p.amount,
          paymentMethod: p.paymentMethod,
          paidAt: p.paidAt,
          notes: p.notes
        })
      }
    }
    recentPayments.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))
    recentPayments = recentPayments.slice(0, 5)

    // Fetch top 5 students with highest pending fees
    const pendingFees = await StudentFee.find({})
      .populate('student')
      .populate('feeStructure')

    let highestPendingStudents = pendingFees.map(sf => {
      const pending = sf.totalFee - sf.paidAmount
      return {
        _id: sf._id,
        studentName: sf.student ? `${sf.student.firstName} ${sf.student.lastName}` : 'Unknown Student',
        admissionNo: sf.student?.studentId || 'N/A',
        course: sf.feeStructure?.course || sf.course || 'N/A',
        totalFee: sf.totalFee,
        paidAmount: sf.paidAmount,
        pendingAmount: pending
      }
    })
    highestPendingStudents = highestPendingStudents
      .filter(s => s.pendingAmount > 0)
      .sort((a, b) => b.pendingAmount - a.pendingAmount)
      .slice(0, 5)

    // Fetch top 5 upcoming due payments with pending balance
    const now = new Date()
    const upcomingFees = await StudentFee.find({
      status: { $ne: 'Paid' },
      dueDate: { $gte: now }
    })
      .populate('student')
      .populate('feeStructure')
      .sort({ dueDate: 1 })
      .limit(5)

    const upcomingDuePayments = upcomingFees.map(sf => {
      return {
        _id: sf._id,
        studentName: sf.student ? `${sf.student.firstName} ${sf.student.lastName}` : 'Unknown Student',
        admissionNo: sf.student?.studentId || 'N/A',
        dueDate: sf.dueDate,
        pendingAmount: sf.totalFee - sf.paidAmount
      }
    })

    return {
      totalFeeStructures,
      activeFeeStructures,
      totalStudentFeeRecords,
      paidStudents,
      partialStudents,
      unpaidStudents,
      overdueStudents,
      totalFeeCollected,
      totalPendingAmount,
      monthlyCollections,
      recentPayments,
      highestPendingStudents,
      upcomingDuePayments
    }
  }

  /**
   * Fetch paginated list of all payment receipts
   * @param {Object} queryParams 
   * @returns {Promise<Object>}
   */
  async getReceipts(queryParams) {
    const page = parseInt(queryParams.page, 10) || 1
    const limit = parseInt(queryParams.limit, 10) || 10
    const skip = (page - 1) * limit

    const studentFees = await StudentFee.find({ 'payments.0': { $exists: true } })
      .populate('student')
      .populate('feeStructure')

    let allReceipts = []
    for (const sf of studentFees) {
      for (const p of sf.payments) {
        allReceipts.push({
          _id: p._id,
          receiptNo: p.receiptNo || `REC-${p._id.toString().substring(18).toUpperCase()}`,
          studentId: sf.student?._id,
          studentName: sf.student ? `${sf.student.firstName} ${sf.student.lastName}` : 'Unknown Student',
          admissionNo: sf.student?.studentId || 'N/A',
          course: sf.feeStructure?.course || sf.course || 'N/A',
          academicYear: sf.feeStructure?.academicYear || sf.academicYear || 'N/A',
          amount: p.amount,
          paymentMethod: p.paymentMethod,
          paidAt: p.paidAt,
          notes: p.notes,
          collectedBy: p.collectedBy || 'Admin'
        })
      }
    }

    if (queryParams.search) {
      const regex = new RegExp(queryParams.search.trim(), 'i')
      allReceipts = allReceipts.filter(r => 
        regex.test(r.receiptNo) || 
        regex.test(r.studentName) || 
        regex.test(r.admissionNo)
      )
    }

    allReceipts.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))

    const total = allReceipts.length
    const paginated = allReceipts.slice(skip, skip + limit)

    return {
      receipts: paginated,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Update student fee details (ignores direct edits to paidAmount or payments)
   * @param {String} id 
   * @param {Object} updateData 
   * @returns {Promise<Object>}
   */
  async updateStudentFee(id, updateData) {
    const studentFee = await StudentFee.findById(id)
    if (!studentFee) {
      throw new Error('Student fee assignment not found')
    }

    // Apply fields (paidAmount and payments are excluded to ensure workflow safety)
    Object.keys(updateData).forEach(key => {
      if (
        key !== 'payments' && 
        key !== 'paidAmount' && 
        key !== 'student' && 
        key !== 'feeStructure' && 
        updateData[key] !== undefined
      ) {
        studentFee[key] = updateData[key]
      }
    })

    if (updateData.dueDate !== undefined) {
      studentFee.dueDate = updateData.dueDate
    }

    await studentFee.save()
    return studentFee.toObject()
  }

  /**
   * Record a payment transaction on a student's assigned fee
   * @param {String} id 
   * @param {Object} paymentData 
   * @returns {Promise<Object>}
   */
  async addPayment(id, paymentData) {
    const studentFee = await StudentFee.findById(id)
    if (!studentFee) {
      throw new Error('Student fee assignment not found')
    }

    const amount = parseFloat(paymentData.amount)
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Payment amount must be greater than 0')
    }

    const pending = studentFee.totalFee - studentFee.paidAmount
    if (amount > pending) {
      throw new Error(`Payment amount of ₹${amount.toLocaleString('en-IN')} exceeds the remaining pending balance of ₹${pending.toLocaleString('en-IN')}`)
    }

    // 1. Append payment log record
    studentFee.payments.push({
      amount,
      paymentMethod: paymentData.paymentMethod,
      notes: paymentData.remarks || 'Payment recorded successfully.',
      paidAt: new Date(),
      collectedBy: 'Admin'
    })

    // 2. Automatically increase paidAmount
    studentFee.paidAmount = (studentFee.paidAmount || 0) + amount

    // 3. Save (pre-save hook will automatically recalculate pendingAmount/status)
    await studentFee.save()

    return studentFee.toObject()
  }

  /**
   * Hard delete fee assignment
   * @param {String} id 
   * @returns {Promise<Object>}
   */
  async deleteStudentFee(id) {
    const studentFee = await StudentFee.findById(id)
    if (!studentFee) {
      throw new Error('Student fee assignment not found')
    }
    await StudentFee.findByIdAndDelete(id)
    return studentFee.toObject()
  }
}

module.exports = new StudentFeeService()
