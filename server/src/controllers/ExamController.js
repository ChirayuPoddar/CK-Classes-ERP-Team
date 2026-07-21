const ExamService = require('../services/ExamService')

class ExamController {
  async createExam(req, res, next) {
    try {
      const exam = await ExamService.createExam(req.body, req.user.id)
      return res.status(201).json({
        success: true,
        message: 'Exam configuration created successfully',
        data: exam
      })
    } catch (err) {
      next(err)
    }
  }

  async getExamById(req, res, next) {
    try {
      const exam = await ExamService.getExamById(req.params.id)
      return res.status(200).json({
        success: true,
        data: exam
      })
    } catch (err) {
      next(err)
    }
  }

  async getAllExams(req, res, next) {
    try {
      const result = await ExamService.getAllExams(req.query)
      return res.status(200).json({
        success: true,
        data: result
      })
    } catch (err) {
      next(err)
    }
  }

  async updateExam(req, res, next) {
    try {
      const exam = await ExamService.updateExam(req.params.id, req.body, req.user.id)
      return res.status(200).json({
        success: true,
        message: 'Exam configuration updated successfully',
        data: exam
      })
    } catch (err) {
      next(err)
    }
  }

  async deleteExam(req, res, next) {
    try {
      await ExamService.deleteExam(req.params.id)
      return res.status(200).json({
        success: true,
        message: 'Exam configuration deleted successfully'
      })
    } catch (err) {
      next(err)
    }
  }

  async getDashboardStats(req, res, next) {
    try {
      const stats = await ExamService.getDashboardStats()
      return res.status(200).json({
        success: true,
        data: stats
      })
    } catch (err) {
      next(err)
    }
  }

  async getStudentsForMarksEntry(req, res, next) {
    try {
      const list = await ExamService.getStudentsForMarksEntry(req.params.examId)
      return res.status(200).json({
        success: true,
        data: list
      })
    } catch (err) {
      next(err)
    }
  }

  async saveMarks(req, res, next) {
    try {
      const result = await ExamService.saveMarks(
        req.params.examId,
        req.body.marks,
        req.user.id
      )
      return res.status(200).json({
        success: true,
        message: 'Student marks submitted successfully',
        data: result
      })
    } catch (err) {
      next(err)
    }
  }

  async getStudentResults(req, res, next) {
    try {
      const results = await ExamService.getStudentResults(req.params.studentId)
      return res.status(200).json({
        success: true,
        data: results
      })
    } catch (err) {
      next(err)
    }
  }

  async getMyResults(req, res, next) {
    try {
      const results = await ExamService.getStudentResultsByEmail(req.user.email)
      return res.status(200).json({
        success: true,
        data: results
      })
    } catch (err) {
      next(err)
    }
  }

  async queryAllResults(req, res, next) {
    try {
      const results = await ExamService.queryGroupedResults(req.query)
      return res.status(200).json({
        success: true,
        data: results
      })
    } catch (err) {
      next(err)
    }
  }
}

module.exports = new ExamController()
