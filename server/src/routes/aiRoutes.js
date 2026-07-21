const express = require('express')
const router = express.Router()
const AIController = require('../controllers/AIController')
const { verifyToken } = require('../middlewares/authMiddleware')

// Protect all AI endpoints with existing verifyToken middleware
router.use(verifyToken)

// POST /api/v1/ai/query - Process user query with institutional context
router.post('/query', (req, res, next) => AIController.handleQuery(req, res, next))

// POST /api/v1/ai/generate-quiz - Generate structured quiz paper from resource / topic
router.post('/generate-quiz', (req, res, next) => AIController.handleGenerateQuiz(req, res, next))

// GET /api/v1/ai/status - Health check & active AI provider info
router.get('/status', (req, res, next) => AIController.getStatus(req, res, next))

module.exports = router
