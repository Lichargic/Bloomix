import { formatInTimeZone } from 'date-fns-tz'
import { resolveTimezone, scheduledLocalDate } from '../scheduledDates'

interface CalendarDayEmptyStateInput {
  selectedDay: string | null
  scheduledCount: number
  hasPastBloom: boolean
}

interface CalendarEventSummaryInput {
  all_day: boolean
}

export const CALENDAR_EMPTY_STATES = {
  unselectedDay: {
    icon: '◌',
    title: 'Pick a day',
    body: 'Select a date to see tasks, blooms, and events in one place.',
  },
  quietDay: {
    icon: '✦',
    title: 'Nothing planned yet',
    body: 'Add an event or deadline to make this day easier to remember.',
    actionLabel: 'Add event / deadline',
  },
  quietMonth: {
    icon: '✿',
    title: 'No events this month',
    body: 'Deadlines and events you add will appear here as cards.',
  },
} as const

export function getCalendarDayEmptyState({
  selectedDay,
  scheduledCount,
  hasPastBloom,
}: CalendarDayEmptyStateInput) {
  if (!selectedDay) return CALENDAR_EMPTY_STATES.unselectedDay
  if (scheduledCount === 0 && !hasPastBloom) return CALENDAR_EMPTY_STATES.quietDay
  return null
}

export function formatCalendarEventDate(dueAt: string, timezone: string = resolveTimezone()) {
  const dateKey = scheduledLocalDate(dueAt, timezone)
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
  })
}

export function formatCalendarEventTime(dueAt: string, allDay: boolean, timezone: string = resolveTimezone()) {
  if (allDay) return 'All day'
  return formatInTimeZone(dueAt, timezone, 'h:mm a')
    .replace('AM', 'a.m.')
    .replace('PM', 'p.m.')
}

export function formatUpcomingEventWhen(dueAt: string, allDay: boolean, timezone: string = resolveTimezone()) {
  return `${formatCalendarEventDate(dueAt, timezone)} · ${formatCalendarEventTime(dueAt, allDay, timezone)}`
}

export function getCalendarEventSummary(events: CalendarEventSummaryInput[]) {
  const allDayCount = events.filter(event => event.all_day).length
  const timedCount = events.length - allDayCount
  return [
    allDayCount > 0 ? `${allDayCount} all-day` : '',
    timedCount > 0 ? `${timedCount} timed` : '',
  ].filter(Boolean).join(' · ')
}
