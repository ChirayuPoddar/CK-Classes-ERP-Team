import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '@/services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const checkSession = async () => {
    try {
      setIsLoading(true)
      const data = await api.get('/auth/me')
      if (data && data.user) {
        setUser(data.user)
        setIsAuthenticated(true)
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkSession()
  }, [])

  const login = async (email, password) => {
    setIsLoading(true)
    try {
      const data = await api.post('/auth/login', { email, password })
      if (data && data.user) {
        setUser(data.user)
        setIsAuthenticated(true)
        try { localStorage.removeItem('ck_token') } catch {}
        return data.user
      } else {
        throw new Error('Invalid authentication response')
      }
    } catch (error) {
      setUser(null)
      setIsAuthenticated(false)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // Catch silently
    } finally {
      try { localStorage.removeItem('ck_token') } catch {}
      setUser(null)
      setIsAuthenticated(false)
      setIsLoading(false)
      window.location.href = '/auth/login'
    }
  }

  const forgotPassword = async (email) => {
    try {
      const data = await api.post('/auth/forgot-password', { email })
      return data.message || 'If an account exists for this email, a verification code has been sent.'
    } catch (error) {
      throw error
    }
  }

  const verifyResetOtp = async (email, otp) => {
    try {
      const data = await api.post('/auth/verify-reset-otp', { email, otp })
      return data
    } catch (error) {
      throw error
    }
  }

  const resetPasswordWithToken = async (resetToken, newPassword, confirmPassword) => {
    try {
      const data = await api.post('/auth/reset-password', { resetToken, newPassword, confirmPassword })
      return data.message
    } catch (error) {
      throw error
    }
  }

  const resetPassword = async (token, password) => {
    try {
      const data = await api.post('/auth/reset-password', { resetToken: token, newPassword: password })
      return data.message
    } catch (error) {
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        forgotPassword,
        verifyResetOtp,
        resetPasswordWithToken,
        resetPassword,
        refreshUser: checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
