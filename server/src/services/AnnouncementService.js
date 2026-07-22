const Announcement = require('../models/Announcement')
const Subject = require('../models/Subject')
const ImageKitStorageService = require('./ImageKitStorageService')
const mongoose = require('mongoose')

const classHierarchy = [
  'Play Group', 'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11 Science', 'Class 11 Commerce',
  'Class 12 Science', 'Class 12 Commerce'
]

const getClassSortIndex = (className) => {
  if (!className) return 99900
  const str = String(className).trim()
  for (let i = 0; i < classHierarchy.length; i++) {
    const hClass = classHierarchy[i]
    if (str === hClass) {
      return i * 100
    }
    if (str.startsWith(hClass + ' ')) {
      const sectionPart = str.slice(hClass.length).trim()
      const code = sectionPart.charCodeAt(0) || 0
      return i * 100 + code
    }
  }
  return 99900
}

class AnnouncementService {
  /**
   * Helper for uploading files to ImageKit Storage
   */
  async uploadAttachment(file, classGrade) {
    if (!file) return null

    const folderClass = (classGrade || 'General').replace(/\s+/g, '-')
    const folder = `ck-classes/announcements/${folderClass}`

    const result = await ImageKitStorageService.uploadDocument(file, folder)
    return {
      fileId: result.fileId,
      fileName: result.name,
      url: result.url,
      thumbnailUrl: result.thumbnailUrl,
      filePath: result.filePath,
      mimeType: result.mimeType,
      fileSize: result.size,
      uploadedAt: new Date()
    }
  }

  async createAnnouncement(data, creatorId) {
    const docData = { ...data, createdBy: creatorId }
    const tenantId = docData.tenantId
    
    if (docData.subject === 'null' || docData.subject === '') {
      docData.subject = null
    }

    if (docData.publishMode === 'instant') {
      docData.publishAt = new Date()
    }

    const announcement = new Announcement(docData)
    await announcement.save()
    return this.getAnnouncementById(announcement._id, tenantId)
  }

  /**
   * Retrieve details for a single announcement
   */
  async getAnnouncementById(id, tenantId) {
    const announcement = await Announcement.findOne({ _id: id, tenantId })
      .populate('createdBy', 'name email role')
      .populate('subject', 'name code')
    
    if (!announcement) {
      throw new Error('Announcement not found')
    }
    return announcement.toObject()
  }

  /**
   * Update existing announcement details
   */
  async updateAnnouncement(id, data, tenantId) {
    const docData = { ...data }
    if (docData.subject === 'null' || docData.subject === '') {
      docData.subject = null
    }

    const announcement = await Announcement.findOne({ _id: id, tenantId })
    if (!announcement) {
      throw new Error('Announcement not found')
    }

    if (announcement.status === 'Published') {
      delete docData.publishAt
      delete docData.publishMode
    } else if (docData.publishMode === 'instant') {
      docData.publishAt = new Date()
    }

    Object.assign(announcement, docData)
    await announcement.save()
    return this.getAnnouncementById(announcement._id, tenantId)
  }

  /**
   * Delete an announcement
   */
  async deleteAnnouncement(id, tenantId) {
    const result = await Announcement.findOneAndDelete({ _id: id, tenantId })
    if (!result) {
      throw new Error('Announcement not found')
    }
    return true
  }

  /**
   * Toggle pinned state
   */
  async togglePinStatus(id, tenantId) {
    const announcement = await Announcement.findOne({ _id: id, tenantId })
    if (!announcement) {
      throw new Error('Announcement not found')
    }
    announcement.isPinned = !announcement.isPinned
    await announcement.save()
    return announcement
  }

  /**
   * Publish scheduled or draft announcement immediately
   */
  async publishNow(id, tenantId) {
    const announcement = await Announcement.findOne({ _id: id, tenantId })
    if (!announcement) {
      throw new Error('Announcement not found')
    }
    announcement.isPublished = true
    announcement.publishAt = new Date()
    await announcement.save()
    return this.getAnnouncementById(id, tenantId)
  }

  async getDashboardStats(userContext, tenantId) {
    const now = new Date()
    // Recalculate status triggers in database
    await Announcement.updateMany(
      { publishAt: { $lte: now }, status: { $ne: 'Published' }, tenantId },
      { status: 'Published' }
    )
    await Announcement.updateMany(
      { publishAt: { $gt: now }, status: { $ne: 'Scheduled' }, tenantId },
      { status: 'Scheduled' }
    )

    // Visibility filter (role guided)
    const baseFilter = { tenantId }
    const isStaff = userContext.role === 'admin' || userContext.role === 'teacher'
    if (!isStaff) {
      baseFilter.status = 'Published'
    }
    
    if (userContext.role !== 'admin') {
      const roleFilterMap = {
        teacher: 'Teachers Only',
        student: 'Students Only',
        parent: 'Parents Only'
      }
      
      const currentRoleOption = roleFilterMap[userContext.role]
      
      baseFilter.$or = [
        { audience: 'Entire Institute' },
        ...(currentRoleOption ? [{ audience: currentRoleOption }] : [])
      ]
    }

    const total = await Announcement.countDocuments(baseFilter)
    const published = await Announcement.countDocuments({ ...baseFilter, status: 'Published' })
    const scheduled = await Announcement.countDocuments({ ...baseFilter, status: 'Scheduled' })
    const pinned = await Announcement.countDocuments({ ...baseFilter, isPinned: true })

    return {
      total,
      published,
      scheduled,
      pinned
    }
  }

  /**
   * Fetch listings with filter combinations, query matches, and customized sorts
   */
  async getAllAnnouncements(queryParams, userContext) {
    const page = parseInt(queryParams.page, 10) || 1
    const limit = parseInt(queryParams.limit, 10) || 10
    const skip = (page - 1) * limit

    const now = new Date()
    // Trigger recalculations
    await Announcement.updateMany(
      { publishAt: { $lte: now }, status: { $ne: 'Published' }, tenantId: queryParams.tenantId },
      { status: 'Published' }
    )
    await Announcement.updateMany(
      { publishAt: { $gt: now }, status: { $ne: 'Scheduled' }, tenantId: queryParams.tenantId },
      { status: 'Scheduled' }
    )

    const filter = { tenantId: queryParams.tenantId }
    const isStaff = userContext.role === 'admin' || userContext.role === 'teacher'

    // 1. Role boundaries checks
    if (!isStaff) {
      filter.status = 'Published'
    }

    if (userContext.role !== 'admin') {
      const roleFilterMap = {
        teacher: 'Teachers Only',
        student: 'Students Only',
        parent: 'Parents Only'
      }
      
      const currentRoleOption = roleFilterMap[userContext.role]
      
      filter.$or = [
        { audience: 'Entire Institute' },
        ...(currentRoleOption ? [{ audience: currentRoleOption }] : [])
      ]
    }

    // 2. Query filter params
    if (queryParams.status) {
      filter.status = queryParams.status
    }
    if (queryParams.audience) {
      filter.audience = queryParams.audience
    }
    if (queryParams.class) {
      filter.class = queryParams.class
    }
    if (queryParams.isPinned !== undefined && queryParams.isPinned !== '') {
      filter.isPinned = queryParams.isPinned === 'true'
    }

    // 3. Search query filters
    if (queryParams.search) {
      const regex = new RegExp(queryParams.search.trim(), 'i')
      const matchingSubjects = await Subject.find({ name: regex, tenantId: queryParams.tenantId }).select('_id')

      const searchConditions = [
        { title: regex },
        { shortDescription: regex },
        { message: regex },
        { audience: regex },
        { class: regex },
        { subject: { $in: matchingSubjects.map(s => s._id) } }
      ]

      if (filter.$or) {
        // Must satisfy both the role constraints and the search constraints
        filter.$and = [
          { $or: filter.$or },
          { $or: searchConditions }
        ]
        delete filter.$or
      } else {
        filter.$or = searchConditions
      }
    }

    const announcements = await Announcement.find(filter)
      .populate('createdBy', 'name email role')
      .populate('subject', 'name code')
      .lean()

    // 4. Custom sorting
    if (queryParams.sortBy) {
      let sortField = queryParams.sortBy
      let sortOrder = 1
      if (sortField.startsWith('-')) {
        sortField = sortField.slice(1)
        sortOrder = -1
      }

      if (sortField === 'title') {
        announcements.sort((a, b) => {
          return String(a.title || '').localeCompare(String(b.title || '')) * sortOrder
        })
      } else if (sortField === 'class') {
        announcements.sort((a, b) => {
          const cmp = getClassSortIndex(a.class) - getClassSortIndex(b.class)
          if (cmp !== 0) return cmp * sortOrder
          return String(a.title || '').localeCompare(String(b.title || ''))
        })
      } else if (sortField === 'publishAt') {
        announcements.sort((a, b) => {
          const dateA = a.publishAt ? new Date(a.publishAt).getTime() : 0
          const dateB = b.publishAt ? new Date(b.publishAt).getTime() : 0
          const cmp = dateA - dateB
          if (cmp !== 0) return cmp * sortOrder
          return String(a.title || '').localeCompare(String(b.title || ''))
        })
      } else if (sortField === 'status') {
        announcements.sort((a, b) => {
          return String(a.status || '').localeCompare(String(b.status || '')) * sortOrder
        })
      } else if (sortField === 'isPinned') {
        announcements.sort((a, b) => {
          const pinA = a.isPinned ? 1 : 0
          const pinB = b.isPinned ? 1 : 0
          return (pinA - pinB) * sortOrder
        })
      } else {
        // Fallback default sorting: pinned first, then newest publishAt first
        announcements.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1
          if (!a.isPinned && b.isPinned) return 1
          const dateA = a.publishAt ? new Date(a.publishAt).getTime() : 0
          const dateB = b.publishAt ? new Date(b.publishAt).getTime() : 0
          return dateB - dateA
        })
      }
    } else {
      // Pinned first, then newest publishAt first
      announcements.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        const dateA = a.publishAt ? new Date(a.publishAt).getTime() : 0
        const dateB = b.publishAt ? new Date(b.publishAt).getTime() : 0
        return dateB - dateA
      })
    }

    const total = announcements.length
    const paginated = announcements.slice(skip, skip + limit)

    return {
      announcements: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  /**
   * Log view increment
   */
  async incrementView(id, tenantId) {
    return Announcement.findOneAndUpdate({ _id: id, tenantId }, { $inc: { viewsCount: 1 } }, { new: true })
  }

  /**
   * Log acknowledgment increment
   */
  async incrementAcknowledgment(id, tenantId) {
    return Announcement.findOneAndUpdate({ _id: id, tenantId }, { $inc: { acknowledgedCount: 1 } }, { new: true })
  }
}

module.exports = new AnnouncementService()
