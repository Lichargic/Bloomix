import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

export function PublicOnly() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (user) return <Navigate to="/today" replace />
  return <Outlet />
}
