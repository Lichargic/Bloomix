import { Navigate, Outlet } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'

export function OnboardingRoute() {
  const { data: profile, isLoading } = useProfile()

  if (isLoading) return null
  if (profile) return <Navigate to="/today" replace />
  return <Outlet />
}
