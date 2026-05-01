interface BagInventory {
  petals: number
  boosts: []
  seeds: []
}

export const BAG_EMPTY_STATE = {
  title: 'Your bag is empty',
  body: 'Boosts, seeds, and petals will appear here when they are earned.',
  boostCopy: 'No boosts yet.',
  seedCopy: 'No seeds yet.',
  actionLabel: 'Plan today',
} as const

export function getEmptyBagInventory(): BagInventory {
  return {
    petals: 0,
    boosts: [],
    seeds: [],
  }
}
