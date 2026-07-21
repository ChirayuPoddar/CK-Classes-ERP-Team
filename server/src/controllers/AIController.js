const AIService = require('../services/ai/AIService')
const ApiError = require('../utils/ApiError')

class AIController {
  /**
   * POST /api/v1/ai/query
   */
  async handleQuery(req, res, next) {
    try {
      const prompt = req.body.prompt || req.body.query || req.body.message

      if (!prompt) {
        throw new ApiError('Prompt message is required.', 400, 'VALIDATION_ERROR')
      }

      const result = await AIService.processQuery(req.user, prompt)

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/v1/ai/generate-quiz
   */
  async handleGenerateQuiz(req, res, next) {
    try {
      const quiz = await AIService.generateQuizFromResource(req.user, req.body)
      res.status(200).json({
        success: true,
        data: quiz
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/v1/ai/status
   * Check active AI Provider configuration status
   */
  async getStatus(req, res, next) {
    try {
      const provider = process.env.AI_PROVIDER || 'groq'
      res.status(200).json({
        success: true,
        provider,
        status: 'active',
        timestamp: new Date()
      })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new AIController()
