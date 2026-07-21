const Resource = require('../models/Resource')
const ImageKitStorageService = require('./ImageKitStorageService')
const mongoose = require('mongoose')
const axios = require('axios')

class ResourceService {
  /**
   * Helper: Extract YouTube video ID (supports Shorts, Watch, Embed, and short links)
   */
  extractYoutubeId(url) {
    if (!url) return null
    const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[1].length === 11) ? match[1] : null
  }

  /**
   * Helper: Sanitize Filenames (Convert spaces to hyphens, strip special characters)
   */
  sanitizeFilename(name) {
    if (!name) return 'file'
    const extIndex = name.lastIndexOf('.')
    const ext = extIndex !== -1 ? name.slice(extIndex) : ''
    let base = extIndex !== -1 ? name.slice(0, extIndex) : name
    base = base
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-z0-9\-_]/g, '') // Remove all non-alphanumeric except hyphen and underscore
    return `${base}${ext}`
  }

  /**
   * Helper: Automatically detect resource category type
   */
  detectResourceType(file, url) {
    if (file) {
      const mime = file.mimetype
      if (mime === 'application/pdf') return 'PDF'
      if (mime.includes('word') || mime.includes('officedocument.wordprocessingml') || mime === 'text/plain') return 'Document'
      if (mime.includes('powerpoint') || mime.includes('officedocument.presentationml')) return 'Presentation'
      if (mime.includes('excel') || mime.includes('officedocument.spreadsheetml') || mime.includes('sheet')) return 'Spreadsheet'
      if (mime.startsWith('image/')) return 'Image'
      if (mime.startsWith('video/')) return 'Cloud Video'
      if (mime.includes('zip') || mime.includes('octet-stream') || mime.includes('compressed')) return 'ZIP'
      return 'Document'
    }
    
    if (url) {
      const ytId = this.extractYoutubeId(url)
      if (ytId) return 'YouTube Video'
      if (url.match(/\.(mp4|webm|mov|ogg)$/i)) return 'External Link'
      return 'External Link'
    }
    
    return 'Document'
  }

  /**
   * Create a new learning resource
   */
  async createResource(data, file, userId) {
    const docData = { ...data, uploadedBy: userId }

    // 1. Validation size limit checks
    if (file) {
      const isVideo = file.mimetype.startsWith('video/')
      const limit = isVideo ? 500 * 1024 * 1024 : 50 * 1024 * 1024
      if (file.size > limit) {
        throw new Error(isVideo ? 'Video file size exceeds the 500MB limit.' : 'File size exceeds the 50MB limit.')
      }

      // Sanitize upload filename
      file.originalname = this.sanitizeFilename(file.originalname)
      docData.fileName = file.originalname

      // Upload to ImageKit
      const folderPath = `ck-classes/resources/${docData.class || 'general'}`
      const uploadRes = await ImageKitStorageService.uploadDocument(file, folderPath)
      
      docData.resourceUrl = uploadRes.url
      docData.cloudPublicId = uploadRes.fileId
      docData.fileSize = file.size
      docData.fileType = file.mimetype
      docData.resourceType = this.detectResourceType(file, null)
      docData.thumbnailUrl = uploadRes.thumbnailUrl || ''
    } else if (docData.externalUrl) {
      docData.resourceUrl = docData.externalUrl
      docData.resourceType = this.detectResourceType(null, docData.externalUrl)
      
      // Get base filename from URL
      try {
        const urlObj = new URL(docData.externalUrl)
        const pathParts = urlObj.pathname.split('/')
        docData.fileName = pathParts[pathParts.length - 1] || 'external-link'
      } catch {
        docData.fileName = 'external-link'
      }

      const ytId = this.extractYoutubeId(docData.externalUrl)
      if (ytId) {
        docData.youtubeId = ytId
        docData.thumbnailUrl = `https://img.youtube.com/vi/${ytId}/0.jpg`
      }
    } else {
      throw new Error('Either a file upload or an external URL is required.')
    }

    if (docData.publishMode === 'instant') {
      docData.publishAt = new Date()
    }

    if (docData.subject === 'null' || docData.subject === '') {
      docData.subject = null
    }

    // Parse tags array
    if (docData.tags && typeof docData.tags === 'string') {
      try {
        docData.tags = JSON.parse(docData.tags)
      } catch (e) {
        docData.tags = docData.tags.split(',').map(t => t.trim()).filter(Boolean)
      }
    }

    const resource = new Resource(docData)
    await resource.save()
    return this.getResourceById(resource._id)
  }

  /**
   * Retrieve resource by ID
   */
  async getResourceById(id) {
    const resource = await Resource.findOne({ _id: id, isDeleted: { $ne: true } })
      .populate('uploadedBy', 'name email role')
      .populate('subject', 'name code')

    if (!resource) {
      throw new Error('Resource not found')
    }
    return resource.toObject()
  }

  /**
   * Update existing resource with safe cloud storage lifecycle handling
   */
  async updateResource(id, data, file, userId) {
    const docData = { ...data }
    const resource = await Resource.findOne({ _id: id, isDeleted: { $ne: true } })
    if (!resource) {
      throw new Error('Resource not found')
    }

    // Cannot modify downloadCount or views directly via edit form
    delete docData.downloadCount
    delete docData.viewCount
    delete docData.versions

    // If already published, lock rescheduled publish settings
    if (resource.status === 'Published') {
      delete docData.publishAt
      delete docData.publishMode
    } else if (docData.publishMode === 'instant') {
      docData.publishAt = new Date()
    }

    let newUploadRes = null
    let oldCloudPublicIdToDelete = null

    // Explicit file removal option requested
    if (docData.removeFile === 'true' || docData.removeFile === true) {
      if (resource.cloudPublicId) {
        try {
          await ImageKitStorageService.deleteDocument(resource.cloudPublicId)
        } catch (err) {
          console.error('[Warning] Failed to delete cloud document on file removal:', err)
        }
      }
      docData.resourceUrl = null
      docData.cloudPublicId = null
      docData.fileSize = 0
      docData.fileType = null
      docData.fileName = null
    }

    if (file) {
      const isVideo = file.mimetype.startsWith('video/')
      const limit = isVideo ? 500 * 1024 * 1024 : 50 * 1024 * 1024
      if (file.size > limit) {
        throw new Error(isVideo ? 'Video file size exceeds the 500MB limit.' : 'File size exceeds the 50MB limit.')
      }

      // Save old cloud public ID to delete ONLY AFTER new upload AND DB save succeed
      if (resource.cloudPublicId) {
        oldCloudPublicIdToDelete = resource.cloudPublicId
      }

      // Sanitize new upload name
      file.originalname = this.sanitizeFilename(file.originalname)
      docData.fileName = file.originalname

      // Step 1: Upload NEW file to ImageKit FIRST
      const folderPath = `ck-classes/resources/${docData.class || resource.class || 'general'}`
      newUploadRes = await ImageKitStorageService.uploadDocument(file, folderPath)
      
      docData.resourceUrl = newUploadRes.url
      docData.cloudPublicId = newUploadRes.fileId
      docData.fileSize = file.size
      docData.fileType = file.mimetype
      docData.resourceType = this.detectResourceType(file, null)
      docData.thumbnailUrl = newUploadRes.thumbnailUrl || ''
      docData.youtubeId = null
    } else if (docData.externalUrl && docData.externalUrl !== resource.externalUrl) {
      // Switching to a new external URL: delete old cloud file if existed
      if (resource.cloudPublicId) {
        try {
          await ImageKitStorageService.deleteDocument(resource.cloudPublicId)
        } catch (err) {
          console.error('[Warning] Failed to delete old cloud document when switching to URL:', err)
        }
      }

      docData.resourceUrl = docData.externalUrl
      docData.resourceType = this.detectResourceType(null, docData.externalUrl)
      
      try {
        const urlObj = new URL(docData.externalUrl)
        const pathParts = urlObj.pathname.split('/')
        docData.fileName = pathParts[pathParts.length - 1] || 'external-link'
      } catch {
        docData.fileName = 'external-link'
      }

      const ytId = this.extractYoutubeId(docData.externalUrl)
      if (ytId) {
        docData.youtubeId = ytId
        docData.thumbnailUrl = `https://img.youtube.com/vi/${ytId}/0.jpg`
      } else {
        docData.youtubeId = null
        docData.thumbnailUrl = ''
      }
      
      docData.cloudPublicId = null
      docData.fileSize = 0
      docData.fileType = null
    }

    // Validate that resource has a content source
    const finalUrl = docData.resourceUrl !== undefined ? docData.resourceUrl : resource.resourceUrl
    const finalExt = docData.externalUrl !== undefined ? docData.externalUrl : resource.externalUrl
    if (!finalUrl && !finalExt && !file) {
      throw new Error('Either a file upload or an external URL is required.')
    }

    if (docData.subject === 'null' || docData.subject === '') {
      docData.subject = null
    }

    // Parse tags array
    if (docData.tags && typeof docData.tags === 'string') {
      try {
        docData.tags = JSON.parse(docData.tags)
      } catch (e) {
        docData.tags = docData.tags.split(',').map(t => t.trim()).filter(Boolean)
      }
    }

    Object.assign(resource, docData)

    // Step 2 & 3: Save database record and handle DB save errors safely
    try {
      await resource.save()
    } catch (dbErr) {
      // If DB save failed after uploading new file, clean up newly uploaded cloud file
      if (newUploadRes && newUploadRes.fileId) {
        try {
          await ImageKitStorageService.deleteDocument(newUploadRes.fileId)
        } catch (cleanErr) {
          console.error('[Warning] Failed to cleanup new upload after DB save error:', cleanErr)
        }
      }
      throw dbErr
    }

    // Step 4: Delete OLD cloud file ONLY AFTER successful upload and DB save
    if (oldCloudPublicIdToDelete) {
      try {
        await ImageKitStorageService.deleteDocument(oldCloudPublicIdToDelete)
      } catch (deleteErr) {
        console.error('[Warning] Failed to delete old cloud document after replacement:', deleteErr)
      }
    }

    return this.getResourceById(resource._id)
  }

  /**
   * Toggle Star / Starred state
   */
  async toggleStar(id) {
    const resource = await Resource.findOne({ _id: id, isDeleted: { $ne: true } })
    if (!resource) throw new Error('Resource not found')
    resource.isStarred = !resource.isStarred
    await resource.save()
    return resource.isStarred
  }

  /**
   * Duplicate learning resource with separate physical cloud file to prevent shared reference leaks
   */
  async duplicateResource(id, userId) {
    const original = await Resource.findOne({ _id: id, isDeleted: { $ne: true } })
    if (!original) throw new Error('Resource not found')

    const cloneData = original.toObject()
    delete cloneData._id
    delete cloneData.createdAt
    delete cloneData.updatedAt
    delete cloneData.__v
    delete cloneData.versions

    cloneData.title = `${original.title} (Copy)`
    cloneData.downloadCount = 0
    cloneData.viewCount = 0
    cloneData.lastViewedAt = null
    cloneData.classAnalytics = {}
    cloneData.uploadedBy = userId
    cloneData.publishAt = new Date()

    // Upload a distinct physical copy to ImageKit if original had a cloud file
    if (original.resourceUrl && original.cloudPublicId) {
      try {
        const fileRes = await axios.get(original.resourceUrl, { responseType: 'arraybuffer' })
        const fakeFile = {
          buffer: Buffer.from(fileRes.data),
          originalname: original.fileName || 'duplicated-file',
          mimetype: original.fileType || 'application/pdf',
          size: original.fileSize || fileRes.data.length
        }
        const folderPath = `ck-classes/resources/${cloneData.class || 'general'}`
        const uploadRes = await ImageKitStorageService.uploadDocument(fakeFile, folderPath)
        cloneData.resourceUrl = uploadRes.url
        cloneData.cloudPublicId = uploadRes.fileId
      } catch (err) {
        console.error('[Warning] Could not re-upload duplicated file to cloud, clearing cloudPublicId for duplicate safety:', err)
        cloneData.cloudPublicId = null
      }
    }

    const duplicated = new Resource(cloneData)
    await duplicated.save()
    return this.getResourceById(duplicated._id)
  }

  /**
   * Bulk soft-deletes resources
   */
  async bulkDelete(ids) {
    await Resource.updateMany(
      { _id: { $in: ids }, isDeleted: { $ne: true } },
      { $set: { isDeleted: true } }
    )
    return true
  }

  /**
   * Bulk edit update visibility, category, class, or subject
   */
  async bulkUpdate(ids, fields) {
    const cleanFields = {}
    if (fields.category) cleanFields.category = fields.category
    if (fields.visibility) cleanFields.visibility = fields.visibility
    
    // Assign targets parameters
    if (fields.class !== undefined) {
      cleanFields.class = fields.class || ''
      cleanFields.targetClasses = fields.class ? [fields.class] : []
    }
    if (fields.subject !== undefined) {
      cleanFields.subject = (fields.subject === 'null' || fields.subject === '') ? null : fields.subject
      cleanFields.targetSubjects = cleanFields.subject ? [cleanFields.subject] : []
    }

    await Resource.updateMany(
      { _id: { $in: ids }, isDeleted: { $ne: true } },
      { $set: cleanFields }
    )
    return true
  }

  /**
   * Soft-delete resource and clean up cloud files
   */
  async deleteResource(id) {
    const resource = await Resource.findOne({ _id: id, isDeleted: { $ne: true } })
    if (!resource) {
      throw new Error('Resource not found')
    }

    resource.isDeleted = true
    await resource.save()

    if (resource.cloudPublicId) {
      try {
        await ImageKitStorageService.deleteDocument(resource.cloudPublicId)
      } catch (err) {
        console.error('[Warning] Failed to delete ImageKit cloud document:', err)
      }
    }
    return true
  }

  /**
   * Increment download count
   */
  async incrementDownload(id) {
    const resource = await Resource.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { $inc: { downloadCount: 1 } },
      { new: true }
    )
    if (!resource) throw new Error('Resource not found')
    return resource.downloadCount
  }

  /**
   * Increment view count and track class analytics
   */
  async incrementView(id, user) {
    const updateQuery = {
      $inc: { viewCount: 1 },
      $set: { lastViewedAt: new Date() }
    }

    if (user && user.class) {
      updateQuery.$inc = updateQuery.$inc || {}
      updateQuery.$inc[`classAnalytics.${user.class}`] = 1
    }

    const resource = await Resource.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      updateQuery,
      { new: true }
    )
    if (!resource) throw new Error('Resource not found')
    return resource.viewCount
  }

  /**
   * Get dynamic dashboard stats with storage sum metrics
   */
  async getDashboardStats(userContext) {
    const now = new Date()
    // Trigger recalculations
    await Resource.updateMany(
      { publishAt: { $lte: now }, status: { $ne: 'Published' }, isDeleted: { $ne: true } },
      { status: 'Published' }
    )
    await Resource.updateMany(
      { publishAt: { $gt: now }, status: { $ne: 'Scheduled' }, isDeleted: { $ne: true } },
      { status: 'Scheduled' }
    )

    const baseFilter = { isDeleted: { $ne: true } }
    const isStaff = userContext.role === 'admin' || userContext.role === 'teacher'
    if (!isStaff) {
      baseFilter.status = 'Published'
      
      // Filter visibility access bounds for students/parents
      baseFilter.visibility = { $ne: 'Teachers Only' }
      if (userContext.class) {
        baseFilter.$or = [
          { visibility: 'Entire Institute' },
          { visibility: 'Specific Class', class: userContext.class },
          { visibility: 'Specific Subject', class: userContext.class }
        ]
      } else {
        baseFilter.visibility = 'Entire Institute'
      }
    }

    const total = await Resource.countDocuments(baseFilter)
    const pdfs = await Resource.countDocuments({ ...baseFilter, resourceType: 'PDF' })
    const videos = await Resource.countDocuments({
      ...baseFilter,
      resourceType: { $in: ['Video', 'Cloud Video', 'YouTube Video'] }
    })

    // Sum of all downloads
    const downloadStats = await Resource.aggregate([
      { $match: baseFilter },
      { $group: { _id: null, totalDownloads: { $sum: '$downloadCount' } } }
    ])
    const downloads = (downloadStats.length > 0) ? downloadStats[0].totalDownloads : 0

    // Sum of all files size storage metrics
    const storageStats = await Resource.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: null, totalBytes: { $sum: '$fileSize' } } }
    ])
    const storageBytes = (storageStats.length > 0) ? storageStats[0].totalBytes : 0

    // Count starred resources
    const starredCount = await Resource.countDocuments({ ...baseFilter, isStarred: true })

    return {
      total,
      pdfs,
      videos,
      downloads,
      storageBytes,
      starredCount
    }
  }

  /**
   * Fetch listing query with filters, search, and sorting
   */
  async getAllResources(queryParams, userContext) {
    const page = parseInt(queryParams.page, 10) || 1
    const limit = parseInt(queryParams.limit, 10) || 10
    const skip = (page - 1) * limit

    const now = new Date()
    // Trigger recalculations
    await Resource.updateMany(
      { publishAt: { $lte: now }, status: { $ne: 'Published' }, isDeleted: { $ne: true } },
      { status: 'Published' }
    )
    await Resource.updateMany(
      { publishAt: { $gt: now }, status: { $ne: 'Scheduled' }, isDeleted: { $ne: true } },
      { status: 'Scheduled' }
    )

    const filter = { isDeleted: { $ne: true } }
    const isStaff = userContext.role === 'admin' || userContext.role === 'teacher'

    // 1. Role boundaries checks
    if (!isStaff) {
      filter.status = 'Published'
      filter.visibility = { $ne: 'Teachers Only' }
      if (userContext.class) {
        filter.$or = [
          { visibility: 'Entire Institute' },
          { visibility: 'Specific Class', class: userContext.class },
          { visibility: 'Specific Subject', class: userContext.class }
        ]
      } else {
        filter.visibility = 'Entire Institute'
      }
    }

    // 2. Query filter params
    if (queryParams.status) {
      filter.status = queryParams.status
    }
    if (queryParams.visibility) {
      filter.visibility = queryParams.visibility
    }
    if (queryParams.class) {
      filter.class = queryParams.class
    }
    if (queryParams.subject) {
      filter.subject = queryParams.subject
    }
    if (queryParams.category) {
      filter.category = queryParams.category
    }
    if (queryParams.resourceType) {
      filter.resourceType = queryParams.resourceType
    }
    if (queryParams.isStarred === 'true') {
      filter.isStarred = true
    }

    // 3. Date range quick-filters
    if (queryParams.createdRange) {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      
      if (queryParams.createdRange === 'Today') {
        filter.createdAt = { $gte: todayStart }
      } else if (queryParams.createdRange === 'This Week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        filter.createdAt = { $gte: weekAgo }
      } else if (queryParams.createdRange === 'This Month') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        filter.createdAt = { $gte: monthAgo }
      }
    }

    // 4. Search query params (Title, Description, Tags, Subject, Class, FileName, UploadedBy)
    if (queryParams.search) {
      const searchRegex = new RegExp(queryParams.search.trim(), 'i')
      
      // Match Subject search
      const subjectsMatched = await mongoose.model('Subject').find({
        $or: [{ name: searchRegex }, { code: searchRegex }]
      }).select('_id')
      const matchedSubjectIds = subjectsMatched.map(s => s._id)

      // Match UploadedBy username search
      const usersMatched = await mongoose.model('User').find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex }
        ]
      }).select('_id')
      const matchedUserIds = usersMatched.map(u => u._id)

      filter.$and = filter.$and || []
      filter.$and.push({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { category: searchRegex },
          { fileName: searchRegex },
          { tags: { $in: [searchRegex] } },
          { class: searchRegex },
          ...(matchedSubjectIds.length > 0 ? [{ subject: { $in: matchedSubjectIds } }] : []),
          ...(matchedUserIds.length > 0 ? [{ uploadedBy: { $in: matchedUserIds } }] : [])
        ]
      })
    }

    // 5. Sorting logic
    const sortField = queryParams.sortField || 'createdAt'
    const sortOrder = queryParams.sortOrder === 'asc' ? 1 : -1

    let resources = await Resource.find(filter)
      .populate('uploadedBy', 'name email role')
      .populate('subject', 'name code')
      .lean()

    // Perform sorting
    if (sortField === 'title') {
      resources.sort((a, b) => {
        return String(a.title || '').localeCompare(String(b.title || '')) * sortOrder
      })
    } else if (sortField === 'class') {
      // Custom class grade hierarchy order
      const fixedHierarchy = [
        'Play Group', 'Nursery', 'LKG', 'UKG',
        'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
        'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
        'Class 11 Science', 'Class 11 Commerce',
        'Class 12 Science', 'Class 12 Commerce'
      ]
      resources.sort((a, b) => {
        const indexA = fixedHierarchy.indexOf(a.class || '')
        const indexB = fixedHierarchy.indexOf(b.class || '')
        const valA = indexA === -1 ? 999 : indexA
        const valB = indexB === -1 ? 999 : indexB
        return (valA - valB) * sortOrder
      })
    } else if (sortField === 'publishAt') {
      resources.sort((a, b) => {
        const timeA = a.publishAt ? new Date(a.publishAt).getTime() : 0
        const timeB = b.publishAt ? new Date(b.publishAt).getTime() : 0
        return (timeA - timeB) * sortOrder
      })
    } else if (sortField === 'status') {
      resources.sort((a, b) => {
        return String(a.status || '').localeCompare(String(b.status || '')) * sortOrder
      })
    } else if (sortField === 'category') {
      resources.sort((a, b) => {
        return String(a.category || '').localeCompare(String(b.category || '')) * sortOrder
      })
    } else if (sortField === 'resourceType') {
      resources.sort((a, b) => {
        return String(a.resourceType || '').localeCompare(String(b.resourceType || '')) * sortOrder
      })
    } else if (sortField === 'fileSize') {
      resources.sort((a, b) => {
        return ((a.fileSize || 0) - (b.fileSize || 0)) * sortOrder
      })
    } else if (sortField === 'downloadCount') {
      resources.sort((a, b) => {
        return ((a.downloadCount || 0) - (b.downloadCount || 0)) * sortOrder
      })
    } else {
      // Default: newest first
      resources.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return (timeB - timeA)
      })
    }

    // Pagination slice
    const total = resources.length
    const paginated = resources.slice(skip, skip + limit)
    const totalPages = Math.ceil(total / limit)

    return {
      resources: paginated,
      total,
      page,
      totalPages
    }
  }
}

module.exports = new ResourceService()
