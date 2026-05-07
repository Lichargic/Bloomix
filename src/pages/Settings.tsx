import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '../components/Topbar'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useProfile, useUpdateProfile } from '../hooks/useProfile'
import { useTheme } from '../providers/ThemeProvider'
import { useSignOut } from '../hooks/useSignOut'
import { useAuth } from '../providers/AuthProvider'
import type { Tone } from '../lib/theme'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: 'soft', label: 'Soft' },
  { value: 'whimsy', label: 'Whimsy' },
  { value: 'matter', label: 'Plain' },
]

export function Settings() {
  useDocumentTitle('Settings')
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const {
    tone,
    setTone,
    showCategories,
    setShowCategories,
    showWeather,
    setShowWeather,
  } = useTheme()
  const signOut = useSignOut()
  const [draftName, setDraftName] = useState('')
  const [editingName, setEditingName] = useState(false)

  const displayName = profile?.display_name ?? ''
  const currentName = editingName ? draftName : displayName

  const trimmedName = currentName.trim()
  const nameHasChanges = Boolean(trimmedName && trimmedName !== displayName)

  function saveName(e: React.FormEvent) {
    e.preventDefault()
    if (nameHasChanges) {
      updateProfile.mutate({ display_name: trimmedName })
    }
    setEditingName(false)
  }

  function chooseTone(nextTone: Tone) {
    setTone(nextTone)
    updateProfile.mutate({ tone: nextTone })
  }

  function toggleCategories(nextValue: boolean) {
    setShowCategories(nextValue)
    updateProfile.mutate({ show_categories: nextValue })
  }

  function toggleWeather(nextValue: boolean) {
    setShowWeather(nextValue)
    updateProfile.mutate({ show_weather: nextValue })
  }

  return (
    <div className="app-shell">
      <Topbar />
      <main id="main-content" className="canvas settings-canvas fade-in" data-screen-label="Settings">
        <h1 className="sr-only">Settings</h1>

        <button className="settings-back" onClick={() => navigate(-1)} aria-label="Go back">
          ← Back
        </button>

        <div className="settings-board">
          <section className="settings-sheet" aria-label="Main settings">
            <section className="settings-section" aria-labelledby="settings-profile-title">
              <div className="settings-copy">
                <h2 id="settings-profile-title" className="section-h">Profile</h2>
                <p>Your display name</p>
              </div>

              <form className="settings-name-form" onSubmit={saveName}>
                <label className="settings-field">
                  <span>Display name</span>
                  <Input
                    value={currentName}
                    onChange={e => {
                      setEditingName(true)
                      setDraftName(e.target.value)
                    }}
                    autoComplete="name"
                  />
                </label>

                <div className="settings-actions">
                  <Button type="submit" disabled={!nameHasChanges || updateProfile.isPending}>
                    Save
                  </Button>
                  {editingName && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setDraftName(displayName)
                        setEditingName(false)
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </section>

            <section className="settings-section" aria-labelledby="settings-voice-title">
              <div className="settings-copy">
                <h2 id="settings-voice-title" className="section-h">Voice</h2>
                <p>How Bloomix speaks to you</p>
              </div>

              <div className="seg settings-seg" aria-label="Voice tone">
                {TONE_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    className={tone === option.value ? 'on' : ''}
                    aria-pressed={tone === option.value}
                    onClick={() => chooseTone(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="settings-section" aria-labelledby="settings-categories-title">
              <div className="settings-copy">
                <h2 id="settings-categories-title" className="section-h">Categories</h2>
                <p>Category labels on tasks</p>
              </div>

              <label className="settings-switch">
                <span>{showCategories ? 'Shown' : 'Hidden'}</span>
                <input
                  type="checkbox"
                  checked={showCategories}
                  onChange={e => toggleCategories(e.target.checked)}
                />
              </label>
            </section>

            <section className="settings-section" aria-labelledby="settings-weather-title">
              <div className="settings-copy">
                <h2 id="settings-weather-title" className="section-h">Weather</h2>
                <p>Weather widget on Today</p>
              </div>

              <label className="settings-switch">
                <span>{showWeather ? 'Shown' : 'Hidden'}</span>
                <input
                  type="checkbox"
                  checked={showWeather}
                  onChange={e => toggleWeather(e.target.checked)}
                />
              </label>
            </section>
          </section>

          <aside className="settings-sheet settings-sheet--side" aria-label="Account settings">
            <div className="settings-identity">
              <div className="settings-avatar" aria-hidden="true">
                {(displayName || user?.email || '?')[0].toUpperCase()}
              </div>
              <div className="settings-identity-meta">
                {displayName && <b>{displayName}</b>}
                {user?.email && <span>{user.email}</span>}
              </div>
            </div>

            <section className="settings-section settings-section--side" aria-labelledby="settings-account-title">
              <div className="settings-copy">
                <h2 id="settings-account-title" className="section-h">Account</h2>
              </div>

              <Button variant="danger" className="settings-danger" onClick={signOut}>
                Sign out
              </Button>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}
