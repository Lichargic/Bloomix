import { Navigate, Outlet } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'

export function ProfileRoute() {
  const { data: profile, isLoading } = useProfile()

  if (isLoading) return null
  if (!profile) return <Navigate to="/onboarding" replace />
  return <Outlet />
}
