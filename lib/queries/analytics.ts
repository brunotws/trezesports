import { createClient } from '@/lib/supabase/server'
import type { ACWRRow } from '@/types'

export async function getAllACWR(): Promise<ACWRRow[]> {
  const supabase = createClient()
  const { data } = await supabase.from('v_acwr').select('*')
  return (data as ACWRRow[]) ?? []
}

export async function getAthleteACWR(athleteId: string): Promise<ACWRRow | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('v_acwr')
    .select('*')
    .eq('athlete_id', athleteId)
    .single()
  return (data as ACWRRow | null)
}
