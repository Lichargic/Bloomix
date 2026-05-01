import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'

export function browserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function resolveTimezone(timezone?: string | null) {
  return timezone || browserTimezone()
}

export function buildScheduledDueAt(
  date: string,
  time: string,
  allDay: boolean,
  timezone: string = browserTimezone()
) {
  const wallTime = allDay ? '00:00' : time
  return fromZonedTime(`${date}T${wallTime}:00`, timezone).toISOString()
}

export function scheduledDayRange(date: string, timezone: string = browserTimezone()) {
  return {
    start: fromZonedTime(`${date}T00:00:00.000`, timezone).toISOString(),
    end: fromZonedTime(`${date}T23:59:59.999`, timezone).toISOString(),
  }
}

export function scheduledMonthRange(month: string, timezone: string = browserTimezone()) {
  const [year, monthNumber] = month.split('-').map(Number)
  const lastDay = new Date(year, monthNumber, 0).getDate()
  return {
    start: fromZonedTime(`${month}-01T00:00:00.000`, timezone).toISOString(),
    end: fromZonedTime(`${month}-${String(lastDay).padStart(2, '0')}T23:59:59.999`, timezone).toISOString(),
  }
}

export function scheduledLocalDate(dueAt: string, timezone: string = browserTimezone()) {
  return formatInTimeZone(dueAt, timezone, 'yyyy-MM-dd')
}
