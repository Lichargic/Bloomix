export type SkinId = 'magma' | 'spirit' | 'galaxy'

export interface StoreSkin {
  id: SkinId
  name: string
  flavor: string
  cost: number
  available: boolean
  artSrc: string
  /** Season whose tree images are used as placeholder until real assets ship */
  placeholderSeason: 'spring' | 'summer' | 'autumn' | 'winter'
  /** CSS overrides applied inline on .tree-stage when skin is active */
  treeTheme: {
    skyTop: string
    skyBot: string
    accent2: string   // --accent-2: ground / hill colour
    panel: string     // --panel: secondary ground colour
    haloColor: string // --accent: tree halo glow
    particleGlyphs: string[]
    particleColor1: string
    particleColor2: string
    cardGradient: string  // art area gradient on skin card
    glowColor: string     // hover glow ring colour
  }
}

export const STORE_SKINS: StoreSkin[] = [
  {
    id: 'magma',
    name: 'Magma Tree',
    flavor: 'Born from deep earth. Embers rise as your tree grows.',
    cost: 600,
    available: true,
    artSrc: '/assets/trees/special/MagmaTree.png',
    placeholderSeason: 'autumn',
    treeTheme: {
      skyTop: '#ff6b2b',
      skyBot: '#1a0200',
      accent2: '#9b3200',
      panel: '#5c1a00',
      haloColor: '#ff6b2b',
      particleGlyphs: ['✦', '·', '°'],
      particleColor1: '#ff6b2b',
      particleColor2: '#ffab4e',
      cardGradient: 'linear-gradient(160deg, #ff6b2b 0%, #3d0c02 100%)',
      glowColor: '#ff6b2b',
    },
  },
  {
    id: 'spirit',
    name: 'Spirit Tree',
    flavor: 'Ethereal and still. Soft light drifts through the branches.',
    cost: 800,
    available: true,
    artSrc: '/assets/trees/special/SpiritTree.png',
    placeholderSeason: 'winter',
    treeTheme: {
      skyTop: '#d4c5f9',
      skyBot: '#2a1a5e',
      accent2: '#9b89f0',
      panel: '#6a55c8',
      haloColor: '#c4b5f5',
      particleGlyphs: ['✧', '·', '✦'],
      particleColor1: '#b8a9f5',
      particleColor2: '#e2d9ff',
      cardGradient: 'linear-gradient(160deg, #d4c5f9 0%, #2a1a5e 100%)',
      glowColor: '#9b89f0',
    },
  },
  {
    id: 'galaxy',
    name: 'Galaxy Tree',
    flavor: 'Grown from starlight. The cosmos breathes through every stage.',
    cost: 1000,
    available: true,
    artSrc: '/assets/trees/special/GalaxyTree.png',
    placeholderSeason: 'summer',
    treeTheme: {
      skyTop: '#0d1b4b',
      skyBot: '#1a0533',
      accent2: '#1e3a7a',
      panel: '#12224e',
      haloColor: '#4fc3f7',
      particleGlyphs: ['✦', '★', '·'],
      particleColor1: '#4fc3f7',
      particleColor2: '#ce93d8',
      cardGradient: 'linear-gradient(160deg, #1a2a6b 0%, #1a0533 100%)',
      glowColor: '#4fc3f7',
    },
  },
]

export function getSkinById(id: SkinId | null | undefined): StoreSkin | null {
  if (!id) return null
  return STORE_SKINS.find(s => s.id === id) ?? null
}
