import { supabase } from './supabase'

interface MagicLinkAuthClient {
  signInWithOtp(credentials: {
    email: string
    options: { emailRedirectTo: string }
  }): Promise<{ error: { message?: string } | null }>
}

export async function signInWithGoogle(origin: string) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/auth/callback` },
  })
  return error ? { ok: false as const, message: error.message } : { ok: true as const }
}

export type MagicLinkResult =
  | { ok: true }
  | { ok: false; message: string }

export async function sendMagicLink(
  auth: MagicLinkAuthClient,
  email: string,
  origin: string,
): Promise<MagicLinkResult> {
  const normalizedEmail = email.trim().toLowerCase()

  const { error } = await auth.signInWithOtp({
    email: normalizedEmail,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  })

  if (error) {
    return {
      ok: false,
      message: error.message || 'Supabase could not send a login email.',
    }
  }

  return { ok: true }
}
