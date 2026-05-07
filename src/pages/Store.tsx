// src/pages/Store.tsx
import { useState } from 'react'
import { Topbar } from '../components/Topbar'
import { GetPetalsOverlay } from '../components/GetPetalsOverlay'
import { OptimizedImage } from '../components/OptimizedImage'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useProfile } from '../hooks/useProfile'
import { useOwnedSkins } from '../hooks/useOwnedSkins'
import { usePurchaseSkin } from '../hooks/usePurchaseSkin'
import { STORE_SKINS } from '../lib/store'
import type { SkinId } from '../lib/store'

export function Store() {
  useDocumentTitle('Store')
  const { data: profile } = useProfile()
  const { data: ownedSkins = [] } = useOwnedSkins()
  const purchaseSkin = usePurchaseSkin()
  const [showPetals, setShowPetals] = useState(false)

  const balance = profile?.petals ?? 0
  const ownedIds = new Set(ownedSkins.map(s => s.skin_id))

  function handleBuy(skinId: SkinId) {
    if (purchaseSkin.isPending) return
    purchaseSkin.mutate(skinId)
  }

  return (
    <div className="app-shell">
      <Topbar />
      <main id="main-content" className="canvas fade-in" data-screen-label="Store" style={{ position: 'relative' }}>
        <h1 className="sr-only">Store</h1>

        <div className="store-page">
          {/* Top row */}
          <div className="store-top-row">
            <div className="store-petal-pill">
              <span className="petal-icon" aria-hidden="true">✿</span>
              <div>
                <b>{balance}</b>
                <span>petals</span>
              </div>
              <span className="store-petal-earn">+20 ✿ per day tended</span>
            </div>
            <button className="store-get-btn" onClick={() => setShowPetals(true)}>
              Get Petals ›
            </button>
          </div>

          {/* Skin grid */}
          <div className="skin-grid" role="list">
            {STORE_SKINS.map(skin => {
              const owned = ownedIds.has(skin.id)
              const affordable = balance >= skin.cost
              const shortfall = skin.cost - balance

              return (
                <article
                  key={skin.id}
                  className={`skin-card${!skin.available ? ' skin-card--coming-soon' : ''}`}
                  data-skin={skin.id}
                  role="listitem">

                  {/* Art area */}
                  <div
                    className="skin-card__art"
                    style={{ background: skin.treeTheme.cardGradient }}
                    aria-hidden="true">
                    <OptimizedImage
                      src={skin.artSrc}
                      alt=""
                      className="skin-card__tree"
                      width={256}
                      height={256}
                    />
                    {owned && (
                      <span className="skin-card__art-chip skin-card__art-chip--owned">✓ Owned</span>
                    )}
                    {!skin.available && (
                      <span className="skin-card__art-chip skin-card__art-chip--soon">Soon</span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="skin-card__body">
                    <div className="skin-card__name">{skin.name}</div>
                    <div className="skin-card__flavor">{skin.flavor}</div>
                    <div className="skin-card__cost">{skin.cost} ✿</div>

                    {!owned && !affordable && skin.available && (
                      <div className="skin-card__need">need {shortfall} more ✿</div>
                    )}

                    {owned ? (
                      <button className="skin-card__btn skin-card__btn--owned" disabled>
                        ✓ in your bag
                      </button>
                    ) : (
                      <button
                        className="skin-card__btn"
                        disabled={!skin.available || !affordable || purchaseSkin.isPending}
                        onClick={() => handleBuy(skin.id)}>
                        {!skin.available ? 'Coming soon' : 'Get ›'}
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>

          <p className="store-mechanic-note">
            ✦ Skins are chosen when you plant a seed — they stay with that tree until it's archived.
          </p>
        </div>

        {showPetals && <GetPetalsOverlay onClose={() => setShowPetals(false)} />}
      </main>
    </div>
  )
}
