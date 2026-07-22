const FeeStructure = require('../models/FeeStructure')

class FeeStructureService {
  /**
   * Create a new fee structure
   * @param {Object} feeStructureData 
   * @returns {Promise<Object>}
   */
  async createFeeStructure(feeStructureData) {
    // Validate duplicate course + academicYear
    if (feeStructureData.course && feeStructureData.academicYear) {
      const exists = await FeeStructure.findOne({
        course: { $regex: new RegExp(`^${feeStructureData.course.trim()}$`, 'i') },
        academicYear: feeStructureData.academicYear.trim(),
        tenantId: feeStructureData.tenantId
      })
      if (exists) {
        throw new Error(`A fee structure for course "${feeStructureData.course}" and academic year "${feeStructureData.academicYear}" already exists`)
      }
    }

    const feeStructure = new FeeStructure(feeStructureData)
    await feeStructure.save()
    return feeStructure.toObject()
  }

  /**
   * Fetch single fee structure details
   * @param {String} id 
   * @returns {Promise<Object>}
   */
  async getFeeStructureById(id, tenantId) {
    const feeStructure = await FeeStructure.findOne({ _id: id, tenantId })
    if (!feeStructure) {
      throw new Error('Fee structure not found')
    }
    return feeStructure.toObject()
  }

  /**
   * Fetch all fee structures with search, filtering, and pagination
   * @param {Object} queryParams 
   * @returns {Promise<Object>}
   */
  async getAllFeeStructures(queryParams) {
    const page = parseInt(queryParams.page, 10) || 1
    const limit = parseInt(queryParams.limit, 10) || 10
    const skip = (page - 1) * limit

    const filter = { tenantId: queryParams.tenantId }

    // Search by course or academicYear
    if (queryParams.search) {
      const searchRegex = new RegExp(queryParams.search.trim(), 'i')
      filter.$or = [
        { course: searchRegex },
        { academicYear: searchRegex }
      ]
    }

    // Additional filters
    if (queryParams.course) {
      filter.course = queryParams.course
    }
    if (queryParams.academicYear) {
      filter.academicYear = queryParams.academicYear
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
          // Fallback to queryParam key-value format if simple string passed
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

    const feeStructures = await FeeStructure.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)

    const total = await FeeStructure.countDocuments(filter)

    // Calculate quick stats
    const totalCount = await FeeStructure.countDocuments({ tenantId: queryParams.tenantId })
    const activeCount = await FeeStructure.countDocuments({ status: 'Active', tenantId: queryParams.tenantId })
    const inactiveCount = await FeeStructure.countDocuments({ status: 'Inactive', tenantId: queryParams.tenantId })

    return {
      feeStructures: feeStructures.map(fs => fs.toObject()),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      stats: {
        total: totalCount,
        active: activeCount,
        inactive: inactiveCount
      }
    }
  }

  /**
   * Update fee structure details
   * @param {String} id 
   * @param {Object} updateData 
   * @returns {Promise<Object>}
   */
  async updateFeeStructure(id, updateData, tenantId) {
    const feeStructure = await FeeStructure.findOne({ _id: id, tenantId })
    if (!feeStructure) {
      throw new Error('Fee structure not found')
    }

    // Verify duplicate course + academicYear if updated
    const checkCourse = updateData.course ? updateData.course.trim() : feeStructure.course
    const checkYear = updateData.academicYear ? updateData.academicYear.trim() : feeStructure.academicYear

    if (updateData.course || updateData.academicYear) {
      const exists = await FeeStructure.findOne({
        _id: { $ne: id },
        course: { $regex: new RegExp(`^${checkCourse}$`, 'i') },
        academicYear: checkYear,
        tenantId
      })
      if (exists) {
        throw new Error(`A fee structure for course "${checkCourse}" and academic year "${checkYear}" already exists`)
      }
    }

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        feeStructure[key] = updateData[key]
      }
    })

    await feeStructure.save()
    return feeStructure.toObject()
  }

  /**
   * Hard delete fee structure
   * @param {String} id 
   * @returns {Promise<Object>}
   */
  async deleteFeeStructure(id, tenantId) {
    const feeStructure = await FeeStructure.findOne({ _id: id, tenantId })
    if (!feeStructure) {
      throw new Error('Fee structure not found')
    }
    await FeeStructure.findOneAndDelete({ _id: id, tenantId })
    return feeStructure.toObject()
  }
}

module.exports = new FeeStructureService()
