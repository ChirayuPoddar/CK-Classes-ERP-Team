import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function DashboardRedirect() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/auth/login')
      } else {
        switch (user.role) {
          case 'admin':
            navigate('/admin')
            break
          case 'teacher':
            navigate('/teacher')
            break
          case 'student':
          case 'parent':
            navigate('/student')
            break
          default:
            navigate('/')
        }
      }
    }
  }, [user, isLoading, navigate])

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-white">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-blue-500 border-t-transparent" />
    </div>
  )
}
