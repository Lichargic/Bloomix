import { toZonedTime } from 'date-fns-tz'

const RESET_HOUR = 4 // 4 AM: before this hour the day still belongs to "yesterday"

/** Returns the current "active daily day" as a YYYY-MM-DD string in the user's timezone.
 *  Hours 00:00–03:59 still belong to the previous calendar day. */
export function currentDailyDay(timezone: string): string {
  const zoned = toZonedTime(new Date(), timezone)
  const h = zoned.getHours()

  const y = zoned.getFullYear()
  const mo = zoned.getMonth()
  const d = zoned.getDate()

  // Roll back one day for the pre-reset window
  const effective = h < RESET_HOUR
    ? new Date(y, mo, d - 1)
    : new Date(y, mo, d)

  const ey = effective.getFullYear()
  const em = String(effective.getMonth() + 1).padStart(2, '0')
  const ed = String(effective.getDate()).padStart(2, '0')
  return `${ey}-${em}-${ed}`
}
