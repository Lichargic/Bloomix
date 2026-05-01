/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import type { Season, Tone } from '../lib/theme'

interface ThemeContextValue {
  season: Season
  setSeason: (s: Season) => void
  tone: Tone
  setTone: (t: Tone) => void
  showCategories: boolean
  setShowCategories: (v: boolean) => void
  showWeather: boolean
  setShowWeather: (v: boolean) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  season: 'spring',
  setSeason: () => {},
  tone: 'soft',
  setTone: () => {},
  showCategories: true,
  setShowCategories: () => {},
  showWeather: true,
  setShowWeather: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [season, setSeason] = useState<Season>('spring')
  const [tone, setTone] = useState<Tone>('soft')
  const [showCategories, setShowCategories] = useState(true)
  const [showWeather, setShowWeather] = useState(true)

  useEffect(() => {
    document.body.setAttribute('data-season', season)
  }, [season])

  return (
    <ThemeContext.Provider value={{ season, setSeason, tone, setTone, showCategories, setShowCategories, showWeather, setShowWeather }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
