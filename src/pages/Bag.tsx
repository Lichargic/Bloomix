import { Link } from 'react-router-dom'
import { Topbar } from '../components/Topbar'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { BAG_EMPTY_STATE, getEmptyBagInventory } from '../lib/pageModels/bagModel'

const TEASER_BOOSTS = [
  { icon: '⚡', name: 'Focus Surge', desc: 'Sharpen concentration for a task block.' },
  { icon: '🌿', name: 'Rest Restore', desc: 'Recover energy between sessions.' },
  { icon: '🔥', name: 'Streak Shield', desc: 'Protect a streak from a missed day.' },
] as const

const TEASER_SEEDS = [
  { icon: '🌱', name: 'Calm Seed', desc: 'Grow a tree rooted in stillness.' },
  { icon: '🌸', name: 'Joy Seed', desc: 'Bloom when happiness compounds.' },
  { icon: '🍂', name: 'Resilience Seed', desc: 'Thrives through consistent effort.' },
] as const

export function Bag() {
  useDocumentTitle('Bag')
  const inventory = getEmptyBagInventory()

  return (
    <div className="app-shell">
      <Topbar />
      <main id="main-content" className="canvas fade-in" data-screen-label="Bag">
        <section className="bag-hero" aria-labelledby="bag-title">
          <div>
            <h1 id="bag-title" className="section-title">BAG</h1>
          </div>
          <div className="petal-balance">
            <span className="petal-icon" aria-hidden="true">✿</span>
            <div>
              <b>{inventory.petals}</b>
              <span>petals</span>
            </div>
          </div>
        </section>

        <section className="empty-state-card" aria-label="Empty bag">
          <span className="empty-kicker">Inventory</span>
          <div className="empty-icon" aria-hidden="true">✿</div>
          <h3>{BAG_EMPTY_STATE.title}</h3>
          <p>{BAG_EMPTY_STATE.body}</p>
          <Link className="empty-action" to="/today">{BAG_EMPTY_STATE.actionLabel}</Link>
        </section>

        <section className="bag-cols bag-empty-cols" aria-label="Bag sections">
          <div className="empty-panel">
            <h3 className="bag-section-h">BOOSTS</h3>
            <div className="bag-grid">
              {TEASER_BOOSTS.map(item => (
                <div key={item.name} className="bag-cell locked" aria-hidden="true">
                  <div className="icon">{item.icon}</div>
                  <h3>{item.name}</h3>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="empty-panel">
            <h3 className="bag-section-h">SEEDS</h3>
            <div className="bag-grid">
              {TEASER_SEEDS.map(item => (
                <div key={item.name} className="bag-cell locked" aria-hidden="true">
                  <div className="icon">{item.icon}</div>
                  <h3>{item.name}</h3>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
