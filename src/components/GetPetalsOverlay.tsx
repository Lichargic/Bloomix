// src/components/GetPetalsOverlay.tsx
import { useEffect } from 'react'
import { usePurchasePetals, type PetalBundle } from '../hooks/usePurchasePetals'

interface GetPetalsOverlayProps {
  onClose: () => void
}

const BUNDLES: { amount: PetalBundle; price: string; best?: boolean }[] = [
  { amount: 100, price: '$0.99' },
  { amount: 350, price: '$2.99', best: true },
  { amount: 750, price: '$5.99' },
]

export function GetPetalsOverlay({ onClose }: GetPetalsOverlayProps) {
  const purchase = usePurchasePetals()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleBundle(amount: PetalBundle) {
    purchase.mutate(amount, { onSuccess: onClose })
  }

  return (
    <div
      className="get-petals-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Get Petals"
      onClick={onClose}>
      <div
        className="get-petals-panel"
        onClick={e => e.stopPropagation()}>
        <div className="get-petals-header">
          <span className="get-petals-title">✦ Get Petals</span>
          <button className="get-petals-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="get-petals-earn-callout">
          <span>+20 ✿ per day tended · +150 ✿ when a cycle is archived</span>
        </div>

        <div className="get-petals-bundles">
          {BUNDLES.map(b => (
            <button
              key={b.amount}
              className={`get-petals-bundle${b.best ? ' best' : ''}`}
              onClick={() => handleBundle(b.amount)}
              disabled={purchase.isPending}>
              {b.best && <span className="bundle-best-tag">✦ best</span>}
              <span className="bundle-amount">{b.amount} ✿</span>
              <span className="bundle-price">{b.price}</span>
            </button>
          ))}
        </div>

        <p className="get-petals-disclaimer">
          Simulated — no real money is charged in this build.
        </p>
      </div>
    </div>
  )
}
