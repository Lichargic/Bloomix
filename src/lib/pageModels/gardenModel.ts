import type { Season } from '../theme'

export interface GardenArchiveRecord {
  id: string
  season: Season
  days: number
  blooms: number
  tasks: number
  archived_at: string
  cycle_started_on: string | null
  cycle_ended_on: string | null
}

interface GardenStats {
  trees: number
  days: number
  blooms: number
  tasks: number
}

export const GARDEN_EMPTY_STATE = {
  title: 'No archived trees yet',
  body: 'Keep tending your tree. Once a tree is archived, it will appear here as part of your garden.',
  actionLabel: 'Return to today',
} as const

export function getGardenStats(records: GardenArchiveRecord[]): GardenStats {
  return records.reduce<GardenStats>(
    (acc, record) => ({
      trees: acc.trees + 1,
      days: acc.days + record.days,
      blooms: acc.blooms + record.blooms,
      tasks: acc.tasks + record.tasks,
    }),
    { trees: 0, days: 0, blooms: 0, tasks: 0 },
  )
}
