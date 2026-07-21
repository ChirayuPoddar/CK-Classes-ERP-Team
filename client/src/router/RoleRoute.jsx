import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { hasPermission } from '@/utils/permissions'

export const RoleRoute = ({ children, allowedRoles, requiredPermission }) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-blue-500 border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />
  }

  // Check role array if provided
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />
  }

  // Check required permission if provided
  if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
    return <Navigate to="/forbidden" replace />
  }

  return children
}
