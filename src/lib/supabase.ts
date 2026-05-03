import { createClient } from '@supabase/supabase-js'
import { getSupabaseConfig } from './supabaseConfig'

const { supabaseUrl, supabaseKey } = getSupabaseConfig(import.meta.env)

// Hybrid storage adapter:
//   - PKCE code_verifier  → cookie  (survives Chrome's cross-origin redirect chain)
//   - Everything else     → localStorage  (session JWTs are 2–4 KB; cookies cap at 4 KB
//                                          and silently drop oversized values)
//
// Chrome loses localStorage during the app → Google → Supabase → app redirect, which
// is why PKCE fails on Chrome but not Firefox. Cookies travel with every navigation.
// SameSite=Lax is intentional: Strict would drop the cookie on the final cross-site
// redirect back from Supabase, breaking the exchange.
function isPkceVerifierKey(key: string): boolean {
  return key.endsWith('-code-verifier')
}

function getCookie(key: string): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${encodeURIComponent(key)}=([^;]*)`)
  )
  return match ? decodeURIComponent(match[1]) : null
}

function setCookie(key: string, value: string): void {
  document.cookie =
    `${encodeURIComponent(key)}=${encodeURIComponent(value)}` +
    `; path=/; SameSite=Lax; max-age=600`
}

function removeCookie(key: string): void {
  document.cookie = `${encodeURIComponent(key)}=; path=/; max-age=0`
}

const hybridStorage = {
  getItem(key: string): string | null {
    return isPkceVerifierKey(key) ? getCookie(key) : localStorage.getItem(key)
  },
  setItem(key: string, value: string): void {
    if (isPkceVerifierKey(key)) {
      setCookie(key, value)
    } else {
      localStorage.setItem(key, value)
    }
  },
  removeItem(key: string): void {
    if (isPkceVerifierKey(key)) {
      removeCookie(key)
    } else {
      localStorage.removeItem(key)
    }
  },
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: hybridStorage,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})
