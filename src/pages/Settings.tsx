import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '../components/Topbar'
import { supabase } from '../lib/supabase'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useProfile, useUpdateProfile } from '../hooks/useProfile'
import { useTheme } from '../providers/ThemeProvider'
import { useBackgroundMusic } from '../providers/AudioProvider'
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
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const { tone, setTone, showCategories, setShowCategories } = useTheme()
  const { muted, toggleMute } = useBackgroundMusic()
  const [draftName, setDraftName] = useState('')
  const [editingName, setEditingName] = useState(false)

  const displayName = profile?.display_name ?? ''
  const currentName = editingName ? draftName : displayName

  function saveName(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = currentName.trim()
    if (trimmed && trimmed !== displayName) {
      updateProfile.mutate({ display_name: trimmed })
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

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  return (
    <div className="app-shell">
      <Topbar />
      <main id="main-content" className="canvas fade-in" data-screen-label="Settings">
        <section aria-labelledby="settings-title">
          <h1 id="settings-title" className="section-title">Settings</h1>
          <p className="section-sub">Keep Bloomix tuned to how you work.</p>
        </section>

        <div className="settings-grid">
          <section className="settings-panel" aria-labelledby="settings-profile-title">
            <h2 id="settings-profile-title" className="section-h">Profile</h2>
            <form className="settings-form" onSubmit={saveName}>
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
              <Button type="submit" disabled={!currentName.trim() || updateProfile.isPending}>
                Save name
              </Button>
            </form>
            <div className="settings-readonly">
              <span>Timezone</span>
              <b>{profile?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone}</b>
            </div>
          </section>

          <section className="settings-panel" aria-labelledby="settings-preferences-title">
            <h2 id="settings-preferences-title" className="section-h">Preferences</h2>
            <div className="settings-group">
              <span className="settings-label">Voice</span>
              <div className="seg" aria-label="Voice tone">
                {TONE_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    className={tone === option.value ? 'on' : ''}
                    onClick={() => chooseTone(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="menu-toggle settings-toggle">
              <input
                type="checkbox"
                checked={showCategories}
                onChange={e => toggleCategories(e.target.checked)}
              />
              <span>Show categories</span>
            </label>
          </section>

          <section className="settings-panel" aria-labelledby="settings-audio-title">
            <h2 id="settings-audio-title" className="section-h">Audio</h2>
            <label className="menu-toggle settings-toggle">
              <input
                type="checkbox"
                checked={!muted}
                onChange={toggleMute}
              />
              <span>Background music</span>
            </label>
          </section>

          <section className="settings-panel" aria-labelledby="settings-account-title">
            <h2 id="settings-account-title" className="section-h">Account</h2>
            <Button variant="danger" className="settings-danger" onClick={handleSignOut}>
              Sign out
            </Button>
          </section>
        </div>
      </main>
    </div>
  )
}
