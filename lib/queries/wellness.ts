import { createClient } from '@/lib/supabase/server'
import type { DailyWellness } from '@/types'

export async function getTodayWellness(athleteId: string): Promise<DailyWellness | null> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('daily_wellness')
    .select('*')
    .eq('athlete_id', athleteId)
    .eq('date', today)
    .single()
  return data
}

export async function getWellnessRange(
  athleteId: string,
  from: string,
  to: string,
): Promise<DailyWellness[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('daily_wellness')
    .select('*')
    .eq('athlete_id', athleteId)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true })
  return data ?? []
}

export async function upsertWellness(
  athleteId: string,
  date: string,
  values: { fatigue: number; sleep_quality: number; doms: number; mood: number; resting_hr?: number },
): Promise<DailyWellness> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('daily_wellness')
    .upsert({ athlete_id: athleteId, date, ...values }, { onConflict: 'athlete_id,date' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}
