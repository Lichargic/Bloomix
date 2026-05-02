import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../providers/AuthProvider'
import type { GardenArchiveRecord } from '../lib/pageModels/gardenModel'

export interface GardenActivityStats {
  days: number
  tasks: number
}

export const GARDEN_ARCHIVES_KEY = (userId: string) =>
  ['garden_archives', userId] as const

export const GARDEN_ACTIVITY_BASE_KEY = (userId: string) =>
  ['garden_activity_stats', userId] as const

const GARDEN_ACTIVITY_KEY = (userId: string, sinceDate: string | null) =>
  [...GARDEN_ACTIVITY_BASE_KEY(userId), sinceDate ?? ''] as const

export function useGardenArchive() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`garden_archives:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'garden_archives',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: GARDEN_ARCHIVES_KEY(user.id) })
          queryClient.invalidateQueries({ queryKey: GARDEN_ACTIVITY_BASE_KEY(user.id) })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user, queryClient])

  return useQuery<GardenArchiveRecord[]>({
    queryKey: GARDEN_ARCHIVES_KEY(user?.id ?? ''),
    enabled: Boolean(user),
    queryFn: async () => {
      if (!user) return []

      const { data, error } = await supabase
        .from('garden_archives')
        .select('id, season, days, blooms, tasks, archived_at, cycle_started_on, cycle_ended_on')
        .eq('user_id', user.id)
        .order('archived_at', { ascending: false })

      if (error) throw error

      return (data ?? []) as GardenArchiveRecord[]
    },
  })
}

export function useGardenActivityStats(sinceDate: string | null) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`garden_activity_stats:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_task_completions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: GARDEN_ACTIVITY_BASE_KEY(user.id),
          })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user, queryClient])

  return useQuery<GardenActivityStats>({
    queryKey: GARDEN_ACTIVITY_KEY(user?.id ?? '', sinceDate),
    enabled: Boolean(user),
    queryFn: async () => {
      if (!user) return { days: 0, tasks: 0 }

      const baseQuery = supabase
        .from('daily_task_completions')
        .select('completed_on')
        .eq('user_id', user.id)
        .not('completed_on', 'is', null)

      const { data, error } = sinceDate
        ? await baseQuery.gt('completed_on', sinceDate)
        : await baseQuery

      if (error) throw error

      const completedDays = new Set(
        (data ?? [])
          .map(row => row.completed_on)
          .filter(Boolean),
      )

      return {
        days: completedDays.size,
        tasks: data?.length ?? 0,
      }
    },
  })
}
