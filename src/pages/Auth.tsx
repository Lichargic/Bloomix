import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { sendMagicLink, signInWithGoogle } from '../lib/auth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { OptimizedImage } from '../components/OptimizedImage'
import { SEASONS } from '../lib/theme'
import type { Season } from '../lib/theme'

type AuthView = 'form' | 'sent'

function currentSeason(): Season {
  const month = new Date().getMonth() // 0-indexed
  if (month <= 2) return 'winter'
  if (month <= 5) return 'spring'
  if (month <= 8) return 'summer'
  return 'autumn'
}

const season = currentSeason()
const logo = SEASONS[season].logo

export function Auth() {
  useDocumentTitle('Sign in')
  const [email, setEmail] = useState('')
  const [view, setView] = useState<AuthView>('form')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const callbackError = searchParams.get('error')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setFormError(null)
    try {
      const result = await sendMagicLink(supabase.auth, email, window.location.origin)
      if (!result.ok) { setFormError(result.message); return }
      setView('sent')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not send a login email.')
    } finally {
      setLoading(false)
    }
  }

  if (view === 'sent') {
    return (
      <div className="welcome" data-screen-label="Auth: check inbox">
        <main id="main-content" className="welcome-card fade-in">
          <OptimizedImage src={logo} alt="" className="logo" width={300} height={300} loading="eager" />
          <h1 className="bloomix-mark">check your inbox</h1>
          <p className="tagline">
            We sent a magic link to<br />
            <strong>{email}</strong>
          </p>
          <p className="auth-help" style={{ marginBottom: 20 }}>
            It works on any device. You can close this tab.
          </p>
          <button className="cta-ghost" onClick={() => setView('form')}>
            ‹ use a different email
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="welcome" data-screen-label="Auth">
      <main id="main-content" className="welcome-card fade-in">
        <OptimizedImage src={logo} alt="" className="logo" width={300} height={300} loading="eager" />
        <h1 className="bloomix-mark">Bloomix</h1>
        <p className="tagline">
          Grow a little tree alongside your habits.<br />
          Rewards effort, not perfection.
        </p>

        {(callbackError === 'expired') && (
          <p className="auth-error">That link has expired — get a fresh one below.</p>
        )}
        {formError && <p className="auth-error">{formError}</p>}

        <div className="auth-actions">
          <button
            className="cta-google"
            onClick={() => signInWithGoogle(window.location.origin)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="auth-divider"><span>or sign in with email</span></div>

          <form onSubmit={handleSubmit} className="auth-email-form">
            <input
              className="name-input"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <button type="submit" className="cta auth-email-btn" disabled={!email.trim() || loading}>
              {loading ? 'sending…' : 'send magic link ›'}
            </button>
          </form>

          <p className="auth-help">No password needed — a link lands in your inbox.</p>
        </div>
      </main>
    </div>
  )
}
