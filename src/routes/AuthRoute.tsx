import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

export function AuthRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />
  return <Outlet />
}
