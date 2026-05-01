import { createClient } from '@supabase/supabase-js'
import { getSupabaseConfig } from './supabaseConfig'

const { supabaseUrl, supabaseKey } = getSupabaseConfig(import.meta.env)

export const supabase = createClient(supabaseUrl, supabaseKey)
