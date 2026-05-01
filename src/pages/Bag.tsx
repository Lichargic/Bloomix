import { Link } from 'react-router-dom'
import { Topbar } from '../components/Topbar'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { BAG_EMPTY_STATE, getEmptyBagInventory } from '../lib/pageModels/bagModel'

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
            <p className="section-sub">{BAG_EMPTY_STATE.body}</p>
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
            <p>{BAG_EMPTY_STATE.boostCopy}</p>
          </div>
          <div className="empty-panel">
            <h3 className="bag-section-h">SEEDS</h3>
            <p>{BAG_EMPTY_STATE.seedCopy}</p>
          </div>
        </section>
      </main>
    </div>
  )
}
