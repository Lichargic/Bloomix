import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { sendMagicLink } from '../lib/auth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { OptimizedImage } from '../components/OptimizedImage'
import { SEASONS } from '../lib/theme'

type AuthView = 'form' | 'sent'

export function Auth() {
  useDocumentTitle('Sign in')
  const [email, setEmail] = useState('')
  const [view, setView] = useState<AuthView>('form')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [searchParams] = useSearchParams()
  const callbackError = searchParams.get('error')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setFormError('')

    try {
      const result = await sendMagicLink(supabase.auth, email, window.location.origin)

      if (!result.ok) {
        setFormError(result.message)
        return
      }

      setView('sent')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Supabase could not send a login email.')
    } finally {
      setLoading(false)
    }
  }

  if (view === 'sent') {
    return (
      <div className="welcome" data-screen-label="Auth: check inbox">
      <main id="main-content" className="welcome-card fade-in">
        <OptimizedImage src={SEASONS.spring.logo} alt="" className="logo" width={300} height={300} loading="eager" />
        <h1 className="bloomix-mark">check your inbox</h1>
          <p className="tagline">
            We sent a link to <strong>{email}</strong>.<br />
            Open it to sign in. It works on any device.
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
        <OptimizedImage src={SEASONS.spring.logo} alt="" className="logo" width={300} height={300} loading="eager" />
        <h1 className="bloomix-mark">Bloomix</h1>
        <p className="tagline">A calm productivity app for the students and the stressed.<br />Rewards effort, not perfection.</p>

        {callbackError === 'expired' && (
          <p className="auth-error">
            That link has expired. Enter your email to get a new one.
          </p>
        )}

        {formError && (
          <p className="auth-error">
            {formError}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <input
            className="name-input"
            type="email"
            placeholder="your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            autoComplete="email"
            required
          />
          <button type="submit" className="cta" disabled={!email.trim() || loading}>
            {loading ? 'sending…' : 'send me a link ›'}
          </button>
        </form>

        <p className="auth-help">
          No password. A magic link lands in your inbox.
        </p>
      </main>
    </div>
  )
}
