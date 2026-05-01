import type { Season } from './theme'

export const TREE_STAGE_THRESHOLDS = [0, 1, 3, 7, 14, 21, 28] as const
export const TREE_CYCLE_DAYS = TREE_STAGE_THRESHOLDS[TREE_STAGE_THRESHOLDS.length - 1]

const SEASON_POOL: Season[] = ['spring', 'summer', 'autumn', 'winter']

export function getTreeStageFromTendedDays(tendedDays: number) {
  const safeDays = Math.max(0, Math.floor(tendedDays))
  let stage = 0

  for (let i = 0; i < TREE_STAGE_THRESHOLDS.length; i += 1) {
    if (safeDays >= TREE_STAGE_THRESHOLDS[i]) stage = i
  }

  return stage
}

export function getTreeCycleProgress(tendedDays: number) {
  const safeDays = Math.max(0, Math.min(TREE_CYCLE_DAYS, Math.floor(tendedDays)))
  return Math.round((safeDays / TREE_CYCLE_DAYS) * 100)
}

export function chooseRandomSeason(random = Math.random): Season {
  const index = Math.min(SEASON_POOL.length - 1, Math.floor(random() * SEASON_POOL.length))
  return SEASON_POOL[index]
}
