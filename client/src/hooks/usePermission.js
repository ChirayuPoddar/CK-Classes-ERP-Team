import { useAuth } from '@/contexts/AuthContext'
import { hasPermission } from '@/utils/permissions'

export function usePermission() {
  const { user } = useAuth()

  const can = (permission) => {
    return hasPermission(user?.role, permission)
  }

  return {
    can,
    role: user?.role,
    user
  }
}
