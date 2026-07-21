const FeeStructureService = require('../services/FeeStructureService')

class FeeStructureController {
  /**
   * Create a new fee structure
   */
  async createFeeStructure(req, res, next) {
    try {
      const feeStructure = await FeeStructureService.createFeeStructure(req.body)
      res.status(201).json({
        success: true,
        message: 'Fee structure created successfully',
        data: feeStructure
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Fetch single fee structure
   */
  async getFeeStructureById(req, res, next) {
    try {
      const feeStructure = await FeeStructureService.getFeeStructureById(req.params.id)
      res.status(200).json({
        success: true,
        data: feeStructure
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Fetch paginated list of fee structures with search & filters
   */
  async getAllFeeStructures(req, res, next) {
    try {
      const result = await FeeStructureService.getAllFeeStructures(req.query)
      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update fee structure details
   */
  async updateFeeStructure(req, res, next) {
    try {
      const feeStructure = await FeeStructureService.updateFeeStructure(req.params.id, req.body)
      res.status(200).json({
        success: true,
        message: 'Fee structure updated successfully',
        data: feeStructure
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete fee structure record
   */
  async deleteFeeStructure(req, res, next) {
    try {
      await FeeStructureService.deleteFeeStructure(req.params.id)
      res.status(200).json({
        success: true,
        message: 'Fee structure deleted successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Bulk delete fee structure records
   */
  async bulkDeleteFeeStructures(req, res, next) {
    try {
      const { ids } = req.body
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid or empty IDs list' })
      }
      
      const deletedList = []
      for (const id of ids) {
        try {
          const item = await FeeStructureService.deleteFeeStructure(id)
          deletedList.push(item)
        } catch (e) {
          console.warn(`Failed to delete fee structure with ID ${id} in bulk:`, e)
        }
      }

      res.status(200).json({
        success: true,
        message: `Successfully deleted ${deletedList.length} fee structures`,
        data: deletedList
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new FeeStructureController()
