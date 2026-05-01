export interface GardenArchiveRecord {
  days: number
  blooms: number
  tasks: number
}

interface GardenStats {
  trees: number
  days: number
  blooms: number
  tasks: number
}

export const GARDEN_EMPTY_STATE = {
  title: 'No archived trees yet',
  body: 'Your current tree is still growing. Finished trees will live here once they are archived.',
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
