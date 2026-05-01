import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../providers/AuthProvider'
import { useProfile } from './useProfile'
import { resolveTimezone, scheduledLocalDate, scheduledMonthRange } from '../lib/scheduledDates'

export interface DayPips {
  bloom: boolean    // had completed daily tasks that day
  deadline: boolean // has scheduled tasks due that day
}

export function monthBounds(month: string) {
  const [y, m] = month.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  return {
    monthStart: `${month}-01`,
    monthEnd:   `${month}-${String(lastDay).padStart(2, '0')}`,
  }
}

export function buildMonthPips(
  dailyRows: Array<{ completed_on: string | null }>,
  scheduledRows: Array<{ due_at: string | null }>,
  timezone: string = resolveTimezone()
) {
  const map = new Map<string, DayPips>()
  const get = (key: string) => map.get(key) ?? { bloom: false, deadline: false }

  for (const row of dailyRows) {
    if (!row.completed_on) continue
    map.set(row.completed_on, { ...get(row.completed_on), bloom: true })
  }
  for (const row of scheduledRows) {
    if (!row.due_at) continue
    const key = scheduledLocalDate(row.due_at, timezone)
    map.set(key, { ...get(key), deadline: true })
  }

  return map
}

export function useMonthPips(month: string) {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const timezone = resolveTimezone(profile?.timezone)
  const { monthStart, monthEnd } = monthBounds(month)
  const scheduledRange = scheduledMonthRange(month, timezone)

  return useQuery<Map<string, DayPips>>({
    queryKey: ['month_pips', user?.id ?? '', month, timezone],
    queryFn: async () => {
      const [dailyRes, scheduledRes] = await Promise.all([
        supabase
          .from('daily_task_completions')
          .select('completed_on')
          .eq('user_id', user!.id)
          .gte('completed_on', monthStart)
          .lte('completed_on', monthEnd),
        supabase
          .from('scheduled_tasks')
          .select('due_at')
          .eq('user_id', user!.id)
          .gte('due_at', scheduledRange.start)
          .lte('due_at', scheduledRange.end),
      ])
      if (dailyRes.error) throw dailyRes.error
      if (scheduledRes.error) throw scheduledRes.error

      return buildMonthPips(dailyRes.data ?? [], scheduledRes.data ?? [], timezone)
    },
    enabled: !!user,
  })
}
