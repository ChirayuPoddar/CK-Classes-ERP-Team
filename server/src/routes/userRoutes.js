const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const { verifyToken, requirePermission } = require('../middlewares/authMiddleware')
const { PERMISSIONS } = require('../config/permissions')
const { validateCreateUser, validateUpdateUser } = require('../validators/userValidator')

router.use(verifyToken)

router.get('/', requirePermission(PERMISSIONS.USERS_VIEW), (req, res, next) => userController.getUsers(req, res, next))
router.get('/stats', requirePermission(PERMISSIONS.USERS_VIEW), (req, res, next) => userController.getUserStats(req, res, next))
router.get('/unlinked-profiles', requirePermission(PERMISSIONS.USERS_CREATE), (req, res, next) => userController.getUnlinkedProfiles(req, res, next))
router.get('/:id', requirePermission(PERMISSIONS.USERS_VIEW), (req, res, next) => userController.getUserById(req, res, next))

router.post('/', requirePermission(PERMISSIONS.USERS_CREATE), validateCreateUser, (req, res, next) => userController.createUser(req, res, next))
router.patch('/:id', requirePermission(PERMISSIONS.USERS_UPDATE), validateUpdateUser, (req, res, next) => userController.updateUser(req, res, next))
router.patch('/:id/block', requirePermission(PERMISSIONS.USERS_BLOCK), (req, res, next) => userController.blockUser(req, res, next))
router.patch('/:id/unblock', requirePermission(PERMISSIONS.USERS_BLOCK), (req, res, next) => userController.unblockUser(req, res, next))
router.post('/:id/reset-password', requirePermission(PERMISSIONS.USERS_UPDATE), (req, res, next) => userController.resetPassword(req, res, next))

router.delete('/:id/sessions/:sessionId', requirePermission(PERMISSIONS.USERS_SESSIONS), (req, res, next) => userController.revokeSession(req, res, next))
router.delete('/:id/sessions', requirePermission(PERMISSIONS.USERS_SESSIONS), (req, res, next) => userController.revokeAllSessions(req, res, next))
router.delete('/:id', requirePermission(PERMISSIONS.USERS_DELETE), (req, res, next) => userController.deleteUser(req, res, next))

module.exports = router
