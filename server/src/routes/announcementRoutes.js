const express = require('express')
const router = express.Router()
const AnnouncementController = require('../controllers/AnnouncementController')
const { verifyToken, requirePermission } = require('../middlewares/authMiddleware')
const { PERMISSIONS } = require('../config/permissions')
const { uploadDocument } = require('../middlewares/uploadMiddleware')
const { 
  validateCreateAnnouncement, 
  validateUpdateAnnouncement 
} = require('../validators/announcementValidator')

// Read-only access routes
router.get('/', verifyToken, requirePermission(PERMISSIONS.ANNOUNCEMENTS_VIEW), AnnouncementController.getAllAnnouncements)
router.get('/dashboard-stats', verifyToken, requirePermission(PERMISSIONS.ANNOUNCEMENTS_VIEW), AnnouncementController.getDashboardStats)
router.get('/:id', verifyToken, requirePermission(PERMISSIONS.ANNOUNCEMENTS_VIEW), AnnouncementController.getAnnouncementById)
router.post('/:id/view', verifyToken, requirePermission(PERMISSIONS.ANNOUNCEMENTS_VIEW), AnnouncementController.incrementView)
router.post('/:id/acknowledge', verifyToken, requirePermission(PERMISSIONS.ANNOUNCEMENTS_VIEW), AnnouncementController.incrementAcknowledgment)

// Parse JSON fields from multipart/form-data before validation checks run
const parseAnnouncementBody = (req, res, next) => {
  if (req.body.audience && typeof req.body.audience === 'string') {
    try {
      req.body.audience = JSON.parse(req.body.audience)
    } catch (e) {}
  }
  if (req.body.attachments && typeof req.body.attachments === 'string') {
    try {
      req.body.attachments = JSON.parse(req.body.attachments)
    } catch (e) {}
  }
  next()
}

// CRUD modification routes
router.post(
  '/', 
  verifyToken, 
  requirePermission(PERMISSIONS.ANNOUNCEMENTS_CREATE), 
  uploadDocument.array('attachments', 10), 
  parseAnnouncementBody,
  validateCreateAnnouncement, 
  AnnouncementController.createAnnouncement
)

router.put(
  '/:id', 
  verifyToken, 
  requirePermission(PERMISSIONS.ANNOUNCEMENTS_UPDATE), 
  uploadDocument.array('attachments', 10), 
  parseAnnouncementBody,
  validateUpdateAnnouncement, 
  AnnouncementController.updateAnnouncement
)

router.delete(
  '/:id', 
  verifyToken, 
  requirePermission(PERMISSIONS.ANNOUNCEMENTS_DELETE), 
  AnnouncementController.deleteAnnouncement
)

router.patch(
  '/:id/pin', 
  verifyToken, 
  requirePermission(PERMISSIONS.ANNOUNCEMENTS_UPDATE), 
  AnnouncementController.togglePinStatus
)

router.patch(
  '/:id/publish', 
  verifyToken, 
  requirePermission(PERMISSIONS.ANNOUNCEMENTS_UPDATE), 
  AnnouncementController.publishNow
)

module.exports = router
