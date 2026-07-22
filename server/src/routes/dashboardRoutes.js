const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middlewares/authMiddleware')
const mongoose = require('mongoose')

// Models required for dashboard aggregations
const Student = require('../models/Student')
const Teacher = require('../models/Teacher')
const User = require('../models/User')
const Subject = require('../models/Subject')
const StudentFee = require('../models/StudentFee')
const AttendanceRecord = require('../models/AttendanceRecord')
const Homework = require('../models/Homework')

/**
 * @route   GET /api/v1/dashboard/kpis
 * @desc    Get aggregated KPI metrics for the admin dashboard
 * @access  Private (Admin)
 */
router.get('/kpis', verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenantId

    // Run all aggregations concurrently
    const [
      totalStudents,
      totalTeachers,
      totalParents,
      activeBatches,
      revenueData,
      attendanceData,
      homeworkCount,
      feeStatusData
    ] = await Promise.all([
      Student.countDocuments({ tenantId }),
      Teacher.countDocuments({ tenantId, status: 'Active' }),
      User.countDocuments({ tenantId, role: 'parent' }),
      Subject.countDocuments({ tenantId, status: 'Active' }),
      
      // Calculate total collected revenue (paidAmount sum)
      StudentFee.aggregate([
        { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
        { $group: { _id: null, totalRevenue: { $sum: '$paidAmount' } } }
      ]),

      // Calculate attendance percentage (Present / Total)
      AttendanceRecord.aggregate([
        { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
        { $group: { 
            _id: null, 
            totalRecords: { $sum: 1 }, 
            presentRecords: { 
              $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } 
            } 
          } 
        }
      ]),

      Homework.countDocuments({ tenantId }), // can filter by status if needed

      // Calculate fee status (Fully Paid / Total)
      StudentFee.aggregate([
        { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
        { $group: {
            _id: null,
            totalInvoices: { $sum: 1 },
            paidInvoices: {
              $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, 1, 0] }
            }
          }
        }
      ])
    ])

    // Format metrics
    const revenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0
    let attendancePercentage = 0
    if (attendanceData.length > 0 && attendanceData[0].totalRecords > 0) {
      attendancePercentage = (attendanceData[0].presentRecords / attendanceData[0].totalRecords) * 100
    }
    
    let feePaidPercentage = 0
    if (feeStatusData.length > 0 && feeStatusData[0].totalInvoices > 0) {
      feePaidPercentage = (feeStatusData[0].paidInvoices / feeStatusData[0].totalInvoices) * 100
    }

    // Format revenue beautifully for Indian Rupees (e.g., ₹1.2L)
    const formatRevenue = (amount) => {
      if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`
      if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`
      if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}k`
      return `₹${amount}`
    }

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalParents,
        activeBatches,
        revenueFormatted: formatRevenue(revenue),
        attendanceFormatted: `${attendancePercentage.toFixed(1)}%`,
        homework: homeworkCount,
        feeStatusFormatted: `${feePaidPercentage.toFixed(1)}%`
      }
    })
  } catch (error) {
    console.error('Dashboard KPIs Error:', error)
    res.status(500).json({ success: false, message: 'Server error retrieving dashboard metrics', error: error.message })
  }
})

module.exports = router
