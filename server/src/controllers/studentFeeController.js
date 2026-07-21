const StudentFeeService = require('../services/StudentFeeService')

class StudentFeeController {
  /**
   * Assign a new fee structure to a student
   */
  async createStudentFee(req, res, next) {
    try {
      const studentFee = await StudentFeeService.createStudentFee(req.body)
      res.status(201).json({
        success: true,
        message: 'Fee assigned to student successfully',
        data: studentFee
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Fetch single student fee assignment details
   */
  async getStudentFeeById(req, res, next) {
    try {
      const studentFee = await StudentFeeService.getStudentFeeById(req.params.id)
      res.status(200).json({
        success: true,
        data: studentFee
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Fetch all student fee assignments with pagination, search, and filtering
   */
  async getAllStudentFees(req, res, next) {
    try {
      const result = await StudentFeeService.getAllStudentFees(req.query)
      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Fetch dashboard statistics aggregates
   */
  async getDashboardStats(req, res, next) {
    try {
      const stats = await StudentFeeService.getDashboardStats()
      res.status(200).json({
        success: true,
        data: stats
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Fetch paginated list of all payment receipts
   */
  async getReceipts(req, res, next) {
    try {
      const result = await StudentFeeService.getReceipts(req.query)
      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update student fee details
   */
  async updateStudentFee(req, res, next) {
    try {
      const studentFee = await StudentFeeService.updateStudentFee(req.params.id, req.body)
      res.status(200).json({
        success: true,
        message: 'Student fee updated successfully',
        data: studentFee
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Record a payment against an assigned student fee
   */
  async addPayment(req, res, next) {
    try {
      const studentFee = await StudentFeeService.addPayment(req.params.id, req.body)
      res.status(200).json({
        success: true,
        message: 'Payment recorded successfully',
        data: studentFee
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete student fee assignment
   */
  async deleteStudentFee(req, res, next) {
    try {
      await StudentFeeService.deleteStudentFee(req.params.id)
      res.status(200).json({
        success: true,
        message: 'Student fee assignment deleted successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Bulk delete student fee assignments
   */
  async bulkDeleteStudentFees(req, res, next) {
    try {
      const { ids } = req.body
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid or empty IDs list' })
      }
      
      const deletedList = []
      for (const id of ids) {
        try {
          const item = await StudentFeeService.deleteStudentFee(id)
          deletedList.push(item)
        } catch (e) {
          console.warn(`Failed to delete student fee with ID ${id} in bulk:`, e)
        }
      }

      res.status(200).json({
        success: true,
        message: `Successfully deleted ${deletedList.length} student fee assignments`,
        data: deletedList
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new StudentFeeController()
