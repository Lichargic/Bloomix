import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

export function AuthRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!user) {
    sessionStorage.setItem('auth:redirect_to', location.pathname + location.search)
    return <Navigate to="/auth" replace />
  }
  return <Outlet />
}
