import type { Season, TreeShape } from '../theme'
import { getTreeStages, SEASONS } from '../theme'
import { STORE_SKINS, type SkinId } from '../store'

export type BagSkinStatus = 'default' | 'owned' | 'active' | 'locked'

export interface BagSkinLibraryInput {
  season: Season
  treeShape: TreeShape
  ownedSkinIds: SkinId[]
  activeSkinId: SkinId | null
  petals: number
  selectedSkinId?: string | null
}

export interface BagSkinLibraryItem {
  id: string
  name: string
  artSrc: string
  flavor: string
  status: BagSkinStatus
  ctaLabel: string | null
  cost: number | null
  isSelected: boolean
}

export interface BagSkinLibraryGroup {
  label: 'Default Skins' | 'Unlocked Specials' | 'Locked Specials'
  skins: BagSkinLibraryItem[]
}

export interface BagSkinLibraryModel {
  selectedSkin: BagSkinLibraryItem
  groups: [BagSkinLibraryGroup, BagSkinLibraryGroup, BagSkinLibraryGroup]
}

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

export function buildBagSkinLibrary({
  season,
  treeShape,
  ownedSkinIds,
  activeSkinId,
  petals,
  selectedSkinId,
}: BagSkinLibraryInput): BagSkinLibraryModel {
  const ownedSkinSet = new Set(ownedSkinIds)
  const defaultSkinId = `${season}-default`
  const activeOwnedSkinId = activeSkinId && ownedSkinSet.has(activeSkinId) ? activeSkinId : null

  const defaultSkin: BagSkinLibraryItem = {
    id: defaultSkinId,
    name: `${SEASONS[season].label} Default`,
    artSrc: getTreeStages(season, treeShape)[6],
    flavor: `${SEASONS[season].mood} seasonal tree.`,
    status: 'default',
    ctaLabel: null,
    cost: null,
    isSelected: false,
  }

  const unlockedSpecials = STORE_SKINS
    .filter(skin => ownedSkinSet.has(skin.id))
    .map<BagSkinLibraryItem>(skin => ({
      id: skin.id,
      name: skin.name,
      artSrc: skin.artSrc,
      flavor: skin.flavor,
      status: activeSkinId === skin.id ? 'active' : 'owned',
      ctaLabel: null,
      cost: skin.cost,
      isSelected: false,
    }))

  const lockedSpecials = STORE_SKINS
    .filter(skin => !ownedSkinSet.has(skin.id))
    .map<BagSkinLibraryItem>(skin => ({
      id: skin.id,
      name: skin.name,
      artSrc: skin.artSrc,
      flavor: skin.flavor,
      status: 'locked',
      ctaLabel: petals >= skin.cost ? 'Open Store' : `Need ${skin.cost - petals} more petals`,
      cost: skin.cost,
      isSelected: false,
    }))

  const groups: BagSkinLibraryModel['groups'] = [
    { label: 'Default Skins', skins: [defaultSkin] },
    { label: 'Unlocked Specials', skins: unlockedSpecials },
    { label: 'Locked Specials', skins: lockedSpecials },
  ]

  const preferredSelectedId = selectedSkinId ?? activeOwnedSkinId ?? defaultSkinId
  const selectedSkin =
    groups.flatMap(group => group.skins).find(skin => skin.id === preferredSelectedId)
    ?? defaultSkin

  selectedSkin.isSelected = true

  return {
    selectedSkin,
    groups,
  }
}
