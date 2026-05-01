interface MagicLinkAuthClient {
  signInWithOtp(credentials: {
    email: string
    options: { emailRedirectTo: string }
  }): Promise<{ error: { message?: string } | null }>
}

export type MagicLinkResult =
  | { ok: true }
  | { ok: false; message: string }

export async function sendMagicLink(
  auth: MagicLinkAuthClient,
  email: string,
  origin: string,
): Promise<MagicLinkResult> {
  const { error } = await auth.signInWithOtp({
    email: email.trim(),
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
