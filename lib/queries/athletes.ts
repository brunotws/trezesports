import { createClient } from '@/lib/supabase/server'
import type { Athlete } from '@/types'

export async function getAthletes(): Promise<Athlete[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('athletes')
    .select('*')
    .order('name')

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getDailyLoadHistory(
  athleteId: string,
  days = 28,
): Promise<number[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('v_daily_load')
    .select('date, daily_srpe')
    .eq('athlete_id', athleteId)
    .order('date', { ascending: true })
    .limit(days)

  if (!data) return Array(days).fill(0)
  const loads = data.map((r: { daily_srpe: number | null }) => r.daily_srpe ?? 0)
  while (loads.length < days) loads.unshift(0)
  return loads.slice(-days)
}
