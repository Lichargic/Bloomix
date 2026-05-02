import { useMemo, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../providers/AuthProvider'
import { useProfile } from './useProfile'
import { currentDailyDay } from '../lib/dates'
import type { Category } from '../lib/theme'
import { GARDEN_ACTIVITY_BASE_KEY } from './useGardenArchive'

export interface DailyTask {
  id: string
  user_id: string
  text: string
  category: Category
  completed_at: string | null // YYYY-MM-DD or null
  position: number
  created_at: string
}

export interface DailyTaskCompletion {
  daily_task_id: string
  completed_on: string | null
}

function useToday() {
  const { data: profile } = useProfile()
  const fallbackToday = useMemo(
    () => currentDailyDay(profile?.timezone ?? 'UTC'),
    [profile?.timezone]
  )
  const { user } = useAuth()
  const verifiedToday = useQuery<string>({
    queryKey: ['current_daily_day', user?.id ?? '', profile?.timezone ?? 'UTC'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_daily_day')
      if (error) throw error
      return data as string
    },
    enabled: !!user,
    staleTime: 60_000,
  })

  return verifiedToday.data ?? fallbackToday
}

const BASE_KEY = (userId: string) => ['daily_tasks', userId] as const
const TASKS_KEY = (userId: string, today: string) => [...BASE_KEY(userId), today] as const
const TENDED_DAYS_KEY = (userId: string) => ['tree_tended_days', userId] as const
const COMPLETIONS_KEY = (userId: string) => ['daily_task_completions', userId] as const

export function dailyTasksChannelName(userId: string) {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `daily_tasks:${userId}:${id}`
}

export function normalizeDailyTasksForToday(tasks: DailyTask[], today: string): DailyTask[] {
  return tasks.map(task => (
    task.completed_at === today
      ? task
      : { ...task, completed_at: null }
  ))
}

export function applyDailyCompletionsForDay(
  tasks: DailyTask[],
  completions: DailyTaskCompletion[],
  today: string
): DailyTask[] {
  const completedTaskIds = new Set(
    completions
      .filter(completion => completion.completed_on === today)
      .map(completion => completion.daily_task_id)
  )

  return tasks.map(task => ({
    ...task,
    completed_at: completedTaskIds.has(task.id) ? today : null,
  }))
}

export function completionDatesToTendedDays(completions: Array<{ completed_on: string | null }>) {
  return new Set(completions.map(row => row.completed_on).filter(Boolean)).size
}

// ─── Query ──────────────────────────────────────────────────────────────────

export function useDailyTasks() {
  const { user } = useAuth()
  const today = useToday()
  const queryClient = useQueryClient()

  const query = useQuery<DailyTask[]>({
    queryKey: TASKS_KEY(user?.id ?? '', today),
    queryFn: async () => {
      const [tasksRes, completionsRes] = await Promise.all([
        supabase
          .from('daily_tasks')
          .select('*')
          .eq('user_id', user!.id)
          .order('position', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase
          .from('daily_task_completions')
          .select('daily_task_id, completed_on')
          .eq('user_id', user!.id)
          .eq('completed_on', today),
      ])
      if (tasksRes.error) throw tasksRes.error
      if (completionsRes.error) throw completionsRes.error
      return applyDailyCompletionsForDay(
        tasksRes.data as DailyTask[],
        completionsRes.data as DailyTaskCompletion[],
        today
      )
    },
    enabled: !!user,
  })

  // Realtime subscription: invalidate on any change to user's tasks
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(dailyTasksChannelName(user.id))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_tasks', filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: BASE_KEY(user.id) })
          queryClient.invalidateQueries({ queryKey: TENDED_DAYS_KEY(user.id) })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_task_completions', filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: BASE_KEY(user.id) })
          queryClient.invalidateQueries({ queryKey: COMPLETIONS_KEY(user.id) })
          queryClient.invalidateQueries({ queryKey: TENDED_DAYS_KEY(user.id) })
        }
      )
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, queryClient])

  return {
    tasks: query.data ?? [],
    isLoading: query.isLoading,
    today,
  }
}

export function useTendedDays() {
  const { user } = useAuth()

  return useQuery<number>({
    queryKey: TENDED_DAYS_KEY(user?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_task_completions')
        .select('completed_on')
        .eq('user_id', user!.id)
        .not('completed_on', 'is', null)

      if (error) throw error

      return completionDatesToTendedDays(data ?? [])
    },
    enabled: !!user,
    staleTime: 60_000,
  })
}

// ─── Mutations ───────────────────────────────────────────────────────────────

function useInvalidateDailyTaskQueries() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return () => {
    if (!user) return
    queryClient.invalidateQueries({ queryKey: BASE_KEY(user.id) })
    queryClient.invalidateQueries({ queryKey: COMPLETIONS_KEY(user.id) })
    queryClient.invalidateQueries({ queryKey: TENDED_DAYS_KEY(user.id) })
    queryClient.invalidateQueries({ queryKey: GARDEN_ACTIVITY_BASE_KEY(user.id) })
  }
}

export function useCreateDailyTask() {
  const { user } = useAuth()
  const invalidate = useInvalidateDailyTaskQueries()

  return useMutation({
    mutationFn: async ({ text, category }: { text: string; category: Category }) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('daily_tasks').insert({
        user_id: user.id,
        text,
        category,
        completed_at: null,
      })
      if (error) throw error
    },
    onSettled: invalidate,
  })
}

export function useToggleDailyTask() {
  const { user } = useAuth()
  const today = useToday()
  const queryClient = useQueryClient()
  const invalidate = useInvalidateDailyTaskQueries()

  return useMutation({
    mutationFn: async ({ id, complete }: { id: string; complete: boolean }) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = complete
        ? await supabase.rpc('complete_daily_task', { p_task_id: id })
        : await supabase.rpc('uncomplete_daily_task', { p_task_id: id })
      if (error) throw error
    },
    onMutate: async ({ id, complete }) => {
      const key = TASKS_KEY(user?.id ?? '', today)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<DailyTask[]>(key)
      queryClient.setQueryData<DailyTask[]>(key, (old = []) =>
        old.map(t => t.id === id ? { ...t, completed_at: complete ? today : null } : t)
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(TASKS_KEY(user?.id ?? '', today), ctx.previous)
    },
    onSettled: invalidate,
  })
}

export function useEditDailyTask() {
  const { user } = useAuth()
  const today = useToday()
  const queryClient = useQueryClient()
  const invalidate = useInvalidateDailyTaskQueries()

  return useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('daily_tasks')
        .update({ text })
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) throw error
    },
    onMutate: async ({ id, text }) => {
      const key = TASKS_KEY(user?.id ?? '', today)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<DailyTask[]>(key)
      queryClient.setQueryData<DailyTask[]>(key, (old = []) =>
        old.map(t => t.id === id ? { ...t, text } : t)
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(TASKS_KEY(user?.id ?? '', today), ctx.previous)
    },
    onSettled: invalidate,
  })
}

export function useDeleteDailyTask() {
  const { user } = useAuth()
  const today = useToday()
  const queryClient = useQueryClient()
  const invalidate = useInvalidateDailyTaskQueries()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('daily_tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) throw error
    },
    onMutate: async (id) => {
      const key = TASKS_KEY(user?.id ?? '', today)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<DailyTask[]>(key)
      queryClient.setQueryData<DailyTask[]>(key, (old = []) => old.filter(t => t.id !== id))
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(TASKS_KEY(user?.id ?? '', today), ctx.previous)
    },
    onSettled: invalidate,
  })
}
