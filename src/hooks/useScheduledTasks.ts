import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../providers/AuthProvider'
import type { Category } from '../lib/theme'
import { useProfile } from './useProfile'
import { resolveTimezone, scheduledDayRange, scheduledMonthRange } from '../lib/scheduledDates'

export interface ScheduledTask {
  id: string
  user_id: string
  title: string
  notes: string | null
  due_at: string // ISO timestamptz
  all_day: boolean
  reminder_at: string | null
  category: Category
  completed_at: string | null
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  created_at: string
}

export type NewScheduledTask = Pick<ScheduledTask, 'title' | 'due_at' | 'all_day' | 'category' | 'notes' | 'recurrence'>

const BASE_KEY = (userId: string) => ['scheduled_tasks', userId] as const

export function invalidateScheduledTaskQueries(
  queryClient: Pick<QueryClient, 'invalidateQueries'>,
  userId: string
) {
  queryClient.invalidateQueries({ queryKey: BASE_KEY(userId) })
  queryClient.invalidateQueries({ queryKey: ['month_pips', userId] })
}

export function useScheduledTasksForMonth(month: string) {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const timezone = resolveTimezone(profile?.timezone)
  const { start, end } = scheduledMonthRange(month, timezone)

  return useQuery<ScheduledTask[]>({
    queryKey: [...BASE_KEY(user?.id ?? ''), month, timezone],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_tasks')
        .select('*')
        .eq('user_id', user!.id)
        .gte('due_at', start)
        .lte('due_at', end)
        .order('due_at', { ascending: true })
      if (error) throw error
      return data as ScheduledTask[]
    },
    enabled: !!user,
  })
}

export function useCreateScheduledTask() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (task: NewScheduledTask) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('scheduled_tasks').insert({ ...task, user_id: user.id })
      if (error) throw error
    },
    onSettled: () => {
      if (user) invalidateScheduledTaskQueries(queryClient, user.id)
    },
  })
}

export function useToggleScheduledTask() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, complete }: { id: string; complete: boolean }) => {
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('scheduled_tasks')
        .update({ completed_at: complete ? now : null })
        .eq('id', id)
      if (error) throw error
    },
    onSettled: () => {
      if (user) invalidateScheduledTaskQueries(queryClient, user.id)
    },
  })
}

export function useDeleteScheduledTask() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('scheduled_tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSettled: () => {
      if (user) invalidateScheduledTaskQueries(queryClient, user.id)
    },
  })
}

export function useEditScheduledTask() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase.from('scheduled_tasks').update({ title }).eq('id', id)
      if (error) throw error
    },
    onSettled: () => {
      if (user) invalidateScheduledTaskQueries(queryClient, user.id)
    },
  })
}

const DAY_KEY = (userId: string, date: string) => ['scheduled_tasks', userId, 'day', date] as const

export function useScheduledTasksForDay(date: string) {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const queryClient = useQueryClient()
  const timezone = resolveTimezone(profile?.timezone)
  const { start, end } = scheduledDayRange(date, timezone)

  const query = useQuery<ScheduledTask[]>({
    queryKey: [...DAY_KEY(user?.id ?? '', date), timezone],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_tasks')
        .select('*')
        .eq('user_id', user!.id)
        .gte('due_at', start)
        .lte('due_at', end)
        .order('due_at', { ascending: true })
      if (error) throw error
      return data as ScheduledTask[]
    },
    enabled: !!user,
  })

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`scheduled_tasks_day:${user.id}:${date}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scheduled_tasks', filter: `user_id=eq.${user.id}` },
        () => { invalidateScheduledTaskQueries(queryClient, user.id) }
      )
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, date, queryClient])

  return {
    events: query.data ?? [],
    isLoading: query.isLoading,
  }
}
