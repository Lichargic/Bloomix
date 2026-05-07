// src/pages/Bag.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { OptimizedImage } from '../components/OptimizedImage'
import { Topbar } from '../components/Topbar'
import { GetPetalsOverlay } from '../components/GetPetalsOverlay'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useProfile } from '../hooks/useProfile'
import { useOwnedSkins } from '../hooks/useOwnedSkins'
import { usePetalTransactions } from '../hooks/usePetalTransactions'
import { buildBagSkinLibrary, type BagSkinStatus } from '../lib/pageModels/bagModel'

const TX_ICONS: Record<string, string> = {
  earn_tended_day: '🌱',
  earn_cycle:      '✿',
  purchase_petals: '💎',
  spend_skin:      '🎨',
}

const SKIN_STATUS_LABELS: Record<BagSkinStatus, string> = {
  default: 'Seasonal default',
  owned: 'Unlocked special',
  active: 'Active skin',
  locked: 'Locked special',
}

export function Bag() {
  useDocumentTitle('Bag')
  const { data: profile } = useProfile()
  const { data: ownedSkins = [] } = useOwnedSkins()
  const { data: transactions = [] } = usePetalTransactions()
  const [showPetals, setShowPetals] = useState(false)
  const [selectedSkinId, setSelectedSkinId] = useState<string | null>(null)

  const balance = profile?.petals ?? 0
  const skinLibrary = buildBagSkinLibrary({
    season: profile?.season ?? 'spring',
    treeShape: profile?.tree_shape ?? 'shape-1',
    ownedSkinIds: ownedSkins.map(skin => skin.skin_id),
    activeSkinId: profile?.active_skin_id ?? null,
    petals: balance,
    selectedSkinId,
  })
  const selectedSkin = skinLibrary.selectedSkin

  const totalEarned = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const totalSpent  = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)

  return (
    <div className="app-shell">
      <Topbar />
      <main id="main-content" className="canvas fade-in" data-screen-label="Bag" style={{ position: 'relative' }}>
        <h1 className="sr-only">Bag</h1>

        <div className="bag-page">
          {/* Top row */}
          <div className="bag-top-row">
            <div className="store-petal-pill">
              <span className="petal-icon" aria-hidden="true">✿</span>
              <div>
                <b>{balance}</b>
                <span>petals</span>
              </div>
            </div>
            <button className="store-get-btn" onClick={() => setShowPetals(true)}>
              Get Petals ›
            </button>
          </div>

          <div className="bag-layout">
            <section className="bag-card bag-selector-card" aria-labelledby="bag-library-heading">
              <div className="bag-selector-card__header">
                <h2 id="bag-library-heading" className="bag-card-kicker">Skin Library</h2>
                <Link to="/store" className="bag-inline-link">Open Store ›</Link>
              </div>

              <div
                className="bag-library-selector"
                tabIndex={0}
                aria-label="Skin library list">
                {skinLibrary.groups.map(group => (
                  <section key={group.label} className="bag-library-group" role="group" aria-label={group.label}>
                    <h3 className="bag-library-group__title">{group.label}</h3>
                    <div className="bag-library-group__items">
                      {group.skins.map(skin => (
                        <button
                          key={skin.id}
                          type="button"
                          className={`bag-library-item${skin.isSelected ? ' bag-library-item--selected' : ''}`}
                          aria-pressed={skin.isSelected}
                          onClick={() => setSelectedSkinId(skin.id)}>
                          <div className="bag-library-item__copy">
                            <span className="bag-library-item__name">{skin.name}</span>
                            <span className="bag-library-item__meta">{SKIN_STATUS_LABELS[skin.status]}</span>
                          </div>
                          {skin.ctaLabel && (
                            <span className="bag-library-item__hint">{skin.ctaLabel}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>

            <section className="bag-card bag-featured-card" aria-labelledby="bag-featured-heading">
              <h2 id="bag-featured-heading" className="bag-card-kicker">Featured Skin</h2>
              <div className="bag-featured">
                <div className="bag-featured__art">
                  <div className="bag-featured__media">
                    <OptimizedImage
                      src={selectedSkin.artSrc}
                      alt={`${selectedSkin.name} preview`}
                      className="bag-featured__tree"
                      width={560}
                      height={560}
                      loading="eager"
                    />
                  </div>
                </div>
                <div className="bag-featured__body">
                  <span className={`bag-skin-state bag-skin-state--${selectedSkin.status}`}>
                    {SKIN_STATUS_LABELS[selectedSkin.status]}
                  </span>
                  <div className="bag-featured__name">{selectedSkin.name}</div>
                  <p className="bag-featured__flavor">{selectedSkin.flavor}</p>
                  {selectedSkin.ctaLabel && (
                    <p className="bag-featured__meta">{selectedSkin.ctaLabel}</p>
                  )}
                </div>
              </div>
            </section>

            <aside className="bag-sidebar">
              <section className="bag-card bag-seeds-card" aria-labelledby="bag-seeds-heading">
                <h2 id="bag-seeds-heading" className="bag-card-kicker">Seeds</h2>
                <div className="bag-seeds-support">
                  <span className="placeholder-icon" aria-hidden="true">🌱</span>
                  <div className="bag-seeds-support__copy">
                    <p>Tend your tree to earn seeds.<br />Each archived cycle drops one seed.</p>
                    <Link to="/today" className="bag-inline-link">
                      Go to today ›
                    </Link>
                  </div>
                </div>
              </section>

              <section className="bag-card bag-history-card" aria-labelledby="bag-history-heading">
                <h2 id="bag-history-heading" className="bag-card-kicker">Petal History</h2>

                {transactions.length === 0 ? (
                  <p className="petal-history-empty">
                    No transactions yet. Complete a daily task to earn your first petals.
                  </p>
                ) : (
                  <>
                    <div
                      className="petal-history-list"
                      role="list"
                      tabIndex={0}
                      aria-label="Petal history list">
                      {transactions.map(tx => (
                        <div key={tx.id} className="petal-tx" role="listitem">
                          <span className="petal-tx__icon" aria-hidden="true">
                            {TX_ICONS[tx.type] ?? '✿'}
                          </span>
                          <div className="petal-tx__body">
                            <div className="petal-tx__label">{tx.label}</div>
                            <div className="petal-tx__date">
                              {new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                          <span className={`petal-tx__amount ${tx.amount > 0 ? 'petal-tx__amount--earn' : 'petal-tx__amount--spend'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount} ✿
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="petal-history-summary" aria-label="Petal totals">
                      <span>Earned: <b>+{totalEarned} ✿</b></span>
                      <span>Spent: <b>-{totalSpent} ✿</b></span>
                    </div>
                  </>
                )}
              </section>
            </aside>
          </div>
        </div>

        {showPetals && <GetPetalsOverlay onClose={() => setShowPetals(false)} />}
      </main>
    </div>
  )
}
