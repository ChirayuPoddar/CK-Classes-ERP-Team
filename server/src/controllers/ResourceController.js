const ResourceService = require('../services/ResourceService')
const axios = require('axios')
const archiver = require('archiver')

class ResourceController {
  /**
   * Create a new resource
   */
  async createResource(req, res, next) {
    try {
      const resource = await ResourceService.createResource(req.body, req.file, req.user.id || req.user._id)
      return res.status(201).json({
        success: true,
        message: 'Resource created successfully',
        data: resource
      })
    } catch (error) {
      console.error('[Error] Create resource failed:', error)
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to create resource',
        error: error.message
      })
    }
  }

  /**
   * Retrieve single resource details
   */
  async getResourceById(req, res, next) {
    try {
      const resource = await ResourceService.getResourceById(req.params.id)
      return res.status(200).json({
        success: true,
        data: resource
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Fetch paginated list of resources matching filters
   */
  async getAllResources(req, res, next) {
    try {
      const result = await ResourceService.getAllResources(req.query, req.user)
      return res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Fetch dynamic dashboard stats
   */
  async getDashboardStats(req, res, next) {
    try {
      const stats = await ResourceService.getDashboardStats(req.user)
      return res.status(200).json({
        success: true,
        data: stats
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update existing resource
   */
  async updateResource(req, res, next) {
    try {
      const resource = await ResourceService.updateResource(req.params.id, req.body, req.file, req.user.id || req.user._id)
      return res.status(200).json({
        success: true,
        message: 'Resource updated successfully',
        data: resource
      })
    } catch (error) {
      console.error('[Error] Update resource failed:', error)
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to update resource',
        error: error.message
      })
    }
  }

  /**
   * Toggle Starred / Favorites state
   */
  async toggleStar(req, res, next) {
    try {
      const isStarred = await ResourceService.toggleStar(req.params.id)
      return res.status(200).json({
        success: true,
        message: isStarred ? 'Resource marked as starred' : 'Resource removed from starred',
        data: { isStarred }
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Duplicate learning resource
   */
  async duplicateResource(req, res, next) {
    try {
      const resource = await ResourceService.duplicateResource(req.params.id, req.user.id || req.user._id)
      return res.status(201).json({
        success: true,
        message: 'Resource duplicated successfully',
        data: resource
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Bulk deletes multiple resources
   */
  async bulkDelete(req, res, next) {
    try {
      const { ids } = req.body
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid resource IDs list' })
      }
      await ResourceService.bulkDelete(ids)
      return res.status(200).json({
        success: true,
        message: 'Selected resources deleted successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Bulk updates properties for multiple resources
   */
  async bulkUpdate(req, res, next) {
    try {
      const { ids, fields } = req.body
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid resource IDs list' })
      }
      await ResourceService.bulkUpdate(ids, fields)
      return res.status(200).json({
        success: true,
        message: 'Selected resources updated successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Bulk download selected files as compressed ZIP archive
   */
  async bulkZip(req, res, next) {
    try {
      const { ids } = req.body
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid resource IDs list' })
      }

      const Resource = require('../models/Resource')
      const items = await Resource.find({ _id: { $in: ids }, isDeleted: { $ne: true } })

      if (items.length === 0) {
        return res.status(404).json({ success: false, message: 'No valid resources found' })
      }

      res.setHeader('Content-Type', 'application/zip')
      res.setHeader('Content-Disposition', 'attachment; filename=resources-bulk.zip')

      const archive = archiver('zip', { zlib: { level: 9 } })
      archive.pipe(res)

      for (const item of items) {
        if (item.resourceUrl && item.resourceType !== 'YouTube Video' && item.resourceType !== 'External Link') {
          try {
            // Fetch source files arraybuffer from remote ImageKit CDN
            const fileResponse = await axios.get(item.resourceUrl, { responseType: 'arraybuffer' })
            const fileName = item.fileName || `file-${item._id}`
            archive.append(fileResponse.data, { name: fileName })
          } catch (err) {
            console.error(`Failed to package resource file: ${item.resourceUrl}`, err)
          }
        }
      }

      await archive.finalize()
    } catch (error) {
      next(error)
    }
  }

  /**
   * Soft-delete resource
   */
  async deleteResource(req, res, next) {
    try {
      await ResourceService.deleteResource(req.params.id)
      return res.status(200).json({
        success: true,
        message: 'Resource deleted successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Increment download count
   */
  async incrementDownload(req, res, next) {
    try {
      const count = await ResourceService.incrementDownload(req.params.id)
      return res.status(200).json({
        success: true,
        data: { downloadCount: count }
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Increment view count
   */
  async incrementView(req, res, next) {
    try {
      const count = await ResourceService.incrementView(req.params.id, req.user)
      return res.status(200).json({
        success: true,
        data: { viewCount: count }
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new ResourceController()
