type SupabaseEnv = Record<string, string | boolean | undefined>

export function getSupabaseConfig(env: SupabaseEnv) {
  const supabaseUrl = typeof env.VITE_SUPABASE_URL === 'string'
    ? env.VITE_SUPABASE_URL
    : 'https://placeholder.supabase.co'

  const supabaseKey =
    typeof env.VITE_SUPABASE_PUBLISHABLE_KEY === 'string'
      ? env.VITE_SUPABASE_PUBLISHABLE_KEY
      : 'placeholder-publishable-key'

  return {
    supabaseUrl,
    supabaseKey,
  }
}

