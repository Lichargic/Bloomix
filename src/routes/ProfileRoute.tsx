import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { useTheme } from '../providers/ThemeProvider'

export function ProfileRoute() {
  const { data: profile, isLoading } = useProfile()
  const {
    setSeason,
    setTone,
    setShowCategories,
    setShowWeather,
  } = useTheme()

  useEffect(() => {
    if (!profile?.onboarded_at) return

    setSeason(profile.season ?? 'spring')
    setTone(profile.tone ?? 'soft')
    setShowCategories(profile.show_categories ?? true)
    setShowWeather(profile.show_weather ?? true)
  }, [
    profile?.onboarded_at,
    profile?.season,
    profile?.tone,
    profile?.show_categories,
    profile?.show_weather,
    setSeason,
    setTone,
    setShowCategories,
    setShowWeather,
  ])

  if (isLoading) return null
  if (!profile?.onboarded_at) return <Navigate to="/onboarding" replace />
  return <Outlet />
}
