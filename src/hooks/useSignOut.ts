import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function useSignOut() {
  const navigate = useNavigate()

  return useCallback(async () => {
    navigate('/', { replace: true })
    await supabase.auth.signOut()
  }, [navigate])
}
