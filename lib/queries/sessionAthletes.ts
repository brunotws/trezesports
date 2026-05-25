import { createClient } from '@/lib/supabase/server'

export async function addAthleteToSession(
  sessionId: string,
  athleteId: string,
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('session_athletes')
    .upsert(
      { session_id: sessionId, athlete_id: athleteId },
      { onConflict: 'session_id,athlete_id', ignoreDuplicates: true },
    )
  if (error) throw new Error(error.message)
}

export async function upsertSessionAthlete(
  sessionId: string,
  athleteId: string,
  pse: number | null,
  attended: boolean,
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('session_athletes')
    .upsert(
      { session_id: sessionId, athlete_id: athleteId, pse, attended },
      { onConflict: 'session_id,athlete_id' },
    )
  if (error) throw new Error(error.message)
}
