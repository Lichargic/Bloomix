import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../providers/AuthProvider'
import type { Season, Tone, Category } from '../lib/theme'

export interface Profile {
  id: string
  display_name: string
  season: Season
  tone: Tone | null
  categories: Category[] | null
  timezone: string | null
  show_categories: boolean | null
  show_weather: boolean | null
  onboarded_at: string | null
  created_at: string
}

export interface CreateProfileInput {
  display_name: string
  season: Season
  categories: Category[]
  tone?: Tone
  timezone?: string
}

export interface UpdateProfileInput {
  display_name?: string
  season?: Season
  tone?: Tone
  categories?: Category[]
  show_categories?: boolean
  show_weather?: boolean
}

export function useProfile() {
  const { user } = useAuth()

  return useQuery<Profile | null>({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
      if (error) throw error
      return data as Profile | null
    },
    enabled: !!user,
    staleTime: 60_000,
  })
}

export function useCreateProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateProfileInput) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        display_name: input.display_name,
        season: input.season,
        tone: input.tone ?? 'soft',
        categories: input.categories,
        timezone: input.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
        show_categories: true,
        show_weather: true,
        onboarded_at: new Date().toISOString(),
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
    },
  })
}

export function useUpdateProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('profiles')
        .update(input)
        .eq('id', user.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
    },
  })
}
