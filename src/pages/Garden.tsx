import { Link } from 'react-router-dom'
import { Topbar } from '../components/Topbar'
import { SEASONS } from '../lib/theme'
import { useProfile } from '../hooks/useProfile'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useTheme } from '../providers/ThemeProvider'
import { OptimizedImage } from '../components/OptimizedImage'
import { GARDEN_EMPTY_STATE, getGardenStats } from '../lib/pageModels/gardenModel'

export function Garden() {
  useDocumentTitle('Garden')
  const { data: profile } = useProfile()
  const { season } = useTheme()
  const activeSeason = profile?.season ?? season
  const activeTree = SEASONS[activeSeason]
  const stats = getGardenStats([])

  return (
    <div className="app-shell">
      <Topbar />
      <main id="main-content" className="canvas fade-in" data-screen-label="Garden">
        <section aria-labelledby="garden-title">
          <h1 id="garden-title" className="section-title">GARDEN</h1>
          <p className="section-sub">A quiet archive for trees you have finished growing.</p>
        </section>

        <section className="garden-stats" aria-label="Garden summary">
          <div className="g-stat">
            <b>{stats.trees}</b>
            <span>trees grown</span>
          </div>
          <div className="g-stat">
            <b>{stats.days}</b>
            <span>days tended</span>
          </div>
          <div className="g-stat">
            <b>{stats.blooms}</b>
            <span>blooms</span>
          </div>
          <div className="g-stat">
            <b>{stats.tasks}</b>
            <span>tasks done</span>
          </div>
        </section>

        <section className="empty-state-card garden-empty-card" aria-label="Empty garden">
          <OptimizedImage src={activeTree.treeImg} alt="" className="garden-empty-tree" width={180} height={180} />
          <div className="garden-empty-copy">
            <span className="empty-kicker">Current tree</span>
            <h3>{GARDEN_EMPTY_STATE.title}</h3>
            <p>{GARDEN_EMPTY_STATE.body}</p>
            <Link className="empty-action" to="/today">{GARDEN_EMPTY_STATE.actionLabel}</Link>
          </div>
        </section>
      </main>
    </div>
  )
}
