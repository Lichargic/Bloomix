import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../providers/AuthProvider'
import { useProfile } from '../hooks/useProfile'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function AuthCallback() {
  useDocumentTitle('Signing you in')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const exchanged = useRef(false)

  // Exchange PKCE code for session on first render
  useEffect(() => {
    if (exchanged.current) return
    exchanged.current = true

    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      navigate('/auth?error=expired', { replace: true })
      return
    }

    if (!code) {
      navigate('/auth?error=expired', { replace: true })
      return
    }

    void supabase.auth.exchangeCodeForSession(code)
      .then(({ error: exchangeError }) => {
        if (exchangeError) navigate('/auth?error=expired', { replace: true })
      })
      .catch(() => {
        navigate('/auth?error=expired', { replace: true })
      })
  }, [navigate, searchParams])

  // Redirect once we have a confirmed session + profile result
  useEffect(() => {
    if (authLoading || profileLoading) return
    if (!user) return

    if (!profile?.onboarded_at) {
      navigate('/onboarding', { replace: true })
    } else {
      navigate('/today', { replace: true })
    }
  }, [user, authLoading, profile, profileLoading, navigate])

  return (
    <div className="welcome" data-screen-label="Auth callback">
      <main id="main-content" className="welcome-card fade-in">
        <p className="tagline">Signing you in…</p>
      </main>
    </div>
  )
}
