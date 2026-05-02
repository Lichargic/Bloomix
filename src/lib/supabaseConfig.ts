type SupabaseEnv = Record<string, string | boolean | undefined>

function readEnvString(value: string | boolean | undefined) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function getSupabaseConfig(env: SupabaseEnv) {
  const supabaseUrl = readEnvString(env.VITE_SUPABASE_URL) ?? 'https://placeholder.supabase.co'
  const supabaseKey = readEnvString(env.VITE_SUPABASE_PUBLISHABLE_KEY) ?? 'placeholder-publishable-key'

  return {
    supabaseUrl,
    supabaseKey,
  }
}
