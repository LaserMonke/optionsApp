import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export function onAuthStateChange(callback: (session: Session | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
  return () => data.subscription.unsubscribe()
}

/**
 * Records the one-time risk-disclosure acknowledgement (checkbox + timestamp).
 * Insert-only by design: RLS has no update/delete policy on this table.
 */
export async function acknowledgeRiskDisclosure(userId: string) {
  const { error } = await supabase
    .from('user_disclosures')
    .insert({ user_id: userId, disclosure_key: 'risk_disclosure_v1' })
  // 23505 = already acknowledged; that is fine.
  if (error && error.code !== '23505') throw error
}

export async function hasAcknowledgedRiskDisclosure(userId: string) {
  const { data, error } = await supabase
    .from('user_disclosures')
    .select('id')
    .eq('user_id', userId)
    .eq('disclosure_key', 'risk_disclosure_v1')
    .maybeSingle()
  if (error) throw error
  return data !== null
}
