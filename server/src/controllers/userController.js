const userService = require('../services/userService')

class UserController {
  async getUsers(req, res, next) {
    try {
      const result = await userService.getUsers({ ...req.query, tenantId: req.tenantId })
      res.status(200).json({
        success: true,
        data: result
      })
    } catch (err) {
      next(err)
    }
  }

  async getUserStats(req, res, next) {
    try {
      const stats = await userService.getUserStats(req.tenantId)
      res.status(200).json({
        success: true,
        data: stats
      })
    } catch (err) {
      next(err)
    }
  }

  async getUnlinkedProfiles(req, res, next) {
    try {
      const profiles = await userService.getUnlinkedProfiles(req.tenantId)
      res.status(200).json({
        success: true,
        data: profiles
      })
    } catch (err) {
      next(err)
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id, req.tenantId)
      res.status(200).json({
        success: true,
        data: user
      })
    } catch (err) {
      next(err)
    }
  }

  async createUser(req, res, next) {
    try {
      const { email, password, role, firstName, lastName } = req.body
      if (!email || !password || !role || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          error: { message: 'Email, password, role, first name, and last name are required.' }
        })
      }

      const newUser = await userService.createUser({ ...req.body, tenantId: req.tenantId })
      res.status(201).json({
        success: true,
        message: 'User account created successfully.',
        data: newUser
      })
    } catch (err) {
      next(err)
    }
  }

  async updateUser(req, res, next) {
    try {
      const updatedUser = await userService.updateUser(req.params.id, req.body, req.user.id, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'User account updated successfully.',
        data: updatedUser
      })
    } catch (err) {
      next(err)
    }
  }

  async blockUser(req, res, next) {
    try {
      const user = await userService.blockUser(req.params.id, req.user.id, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'User account blocked successfully.',
        data: user
      })
    } catch (err) {
      next(err)
    }
  }

  async unblockUser(req, res, next) {
    try {
      const user = await userService.unblockUser(req.params.id, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'User account unblocked successfully.',
        data: user
      })
    } catch (err) {
      next(err)
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { password } = req.body
      await userService.resetPassword(req.params.id, password, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Password reset successfully. Active sessions have been invalidated.'
      })
    } catch (err) {
      next(err)
    }
  }

  async revokeSession(req, res, next) {
    try {
      const user = await userService.revokeSession(req.params.id, req.params.sessionId, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'Session revoked successfully.',
        data: user
      })
    } catch (err) {
      next(err)
    }
  }

  async revokeAllSessions(req, res, next) {
    try {
      const user = await userService.revokeAllSessions(req.params.id, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'All active sessions signed out successfully.',
        data: user
      })
    } catch (err) {
      next(err)
    }
  }

  async deleteUser(req, res, next) {
    try {
      await userService.deleteUser(req.params.id, req.user.id, req.tenantId)
      res.status(200).json({
        success: true,
        message: 'User login account removed successfully. Linked institutional profile data remains preserved.'
      })
    } catch (err) {
      next(err)
    }
  }
}

module.exports = new UserController()
