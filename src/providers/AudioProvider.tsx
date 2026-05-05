/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { isBgMuted, setBgMuted } from '../lib/audio'

interface AudioContextValue {
  muted: boolean
  toggleMute: () => void
}

const AudioContext = createContext<AudioContextValue | null>(null)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMuted] = useState(isBgMuted)

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev
      setBgMuted(next)
      return next
    })
  }, [])

  const value = useMemo(() => ({ muted, toggleMute }), [muted, toggleMute])

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  )
}

export function useBackgroundMusic(): AudioContextValue {
  const ctx = useContext(AudioContext)
  if (!ctx) throw new Error('useBackgroundMusic must be used inside AudioProvider')
  return ctx
}
