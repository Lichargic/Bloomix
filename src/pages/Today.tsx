import { useEffect, useMemo } from 'react'
import { useAuth } from '../providers/AuthProvider'
import { useProfile } from '../hooks/useProfile'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useTheme } from '../providers/ThemeProvider'
import { useDailyTasks, useTendedDays } from '../hooks/useDailyTasks'
import { getTreeGreeting } from '../lib/theme'
import { getTreeCycleProgress, getTreeStageFromTendedDays } from '../lib/growth'
import { TreeStage } from '../components/Tree'
import { Checklist } from '../components/Checklist'
import { Topbar } from '../components/Topbar'

export function Today() {
  useDocumentTitle('Today')
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { season, tone, showCategories, showWeather, setSeason, setTone, setShowCategories, setShowWeather } = useTheme()
  const { tasks, today } = useDailyTasks()
  const { data: tendedDaysFromHistory = 0 } = useTendedDays()

  useEffect(() => {
    if (!profile) return
    setSeason(profile.season)
    setTone(profile.tone)
    setShowCategories(profile.show_categories)
    setShowWeather(profile.show_weather)
  }, [profile?.season, profile?.tone, profile?.show_categories, profile?.show_weather, setSeason, setTone, setShowCategories, setShowWeather])

  const completed = tasks.filter(t => t.completed_at !== null).length
  const pct = Math.round((completed / Math.max(tasks.length, 1)) * 100)
  const tendedDays = Math.max(tendedDaysFromHistory, completed > 0 ? 1 : 0)
  const treeStage = getTreeStageFromTendedDays(tendedDays)
  const treeGrowth = getTreeCycleProgress(tendedDays)

  const greeting = useMemo(() => {
    const name = profile?.display_name ?? user?.email ?? 'friend'
    return getTreeGreeting(tone, name, pct, treeStage)
  }, [tone, pct, treeStage, profile?.display_name, user?.email])

  const dayCount = profile?.created_at
    ? Math.max(1, Math.ceil((new Date(today).getTime() - new Date(profile.created_at).getTime()) / 86_400_000))
    : 1

  return (
    <div className="app-shell">
      <Topbar />
      <main id="main-content" className="canvas fade-in">
        <h1 className="sr-only">Today</h1>
        <div className="today-grid">
          <section className="tree-region" aria-label="Bloomix tree progress">
            <TreeStage
              season={season}
              growth={treeGrowth}
              treeStage={treeStage}
              tendedDays={tendedDays}
              todayCare={pct}
              greeting={greeting}
              weather={showWeather ? 'default' : 'none'}
              day={dayCount}
            />
          </section>
          <Checklist showCategories={showCategories} date={today} />
        </div>
      </main>
    </div>
  )
}
