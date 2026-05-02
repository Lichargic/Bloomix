/**
 * Sorts items so that incomplete items come first (alphabetically),
 * followed by completed items (alphabetically).
 *
 * @param items   - Array of items to sort (not mutated).
 * @param getText - Extracts the display text used for alphabetical comparison.
 * @param isDone  - Returns true when an item is considered complete.
 *                  Defaults to checking for a truthy `completed_at` field.
 */
export function sortByCompletionThenAlpha<T extends object>(
  items: T[],
  getText: (item: T) => string,
  isDone: (item: T) => boolean = (item) =>
    'completed_at' in item
      ? Boolean((item as Record<string, unknown>).completed_at)
      : false,
): T[] {
  return [...items].sort((a, b) => {
    const doneA = isDone(a) ? 1 : 0
    const doneB = isDone(b) ? 1 : 0
    if (doneA !== doneB) return doneA - doneB
    return getText(a).localeCompare(getText(b))
  })
}
