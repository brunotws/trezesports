import { createClient } from '@/lib/supabase/server'
import type { Athlete, SessionAthlete } from '@/types'

export async function getAthletes(): Promise<Athlete[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('athletes')
    .select('*')
    .order('name')

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getAthlete(id: string): Promise<Athlete | null> {
  const supabase = createClient()
  const { data } = await supabase.from('athletes').select('*').eq('id', id).single()
  return data
}

export async function createAthlete(values: {
  name: string
  birth_date?: string | null
  position?: string | null
  modality?: string
  turma?: string | null
  resting_hr?: number | null
}): Promise<Athlete> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('athletes')
    .insert(values)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateAthlete(
  id: string,
  values: Partial<Omit<Athlete, 'id' | 'created_at'>>,
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('athletes').update(values).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteAthlete(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('athletes').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getAthleteSessionHistory(
  athleteId: string,
  limit = 10,
): Promise<(SessionAthlete & { session: { day_of_week: number; session_number: number; status: string; session_type: string; actual_rpe: number | null; week: { start_date: string } } })[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('session_athletes')
    .select('*, session:sessions(day_of_week, session_number, status, session_type, actual_rpe, week:weeks(start_date))')
    .eq('athlete_id', athleteId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data as typeof data & { session: { day_of_week: number; session_number: number; status: string; session_type: string; actual_rpe: number | null; week: { start_date: string } } }[]) ?? []
}

export async function getAthleteCalendarSessions(
  athleteId: string,
): Promise<Array<{
  sessionId:     string
  date:          string
  sessionNumber: number
  title:         string | null
  category:      string | null
}>> {
  const supabase = createClient()
  const { data } = await supabase
    .from('session_athletes')
    .select(`
      session:sessions(
        id,
        day_of_week,
        session_number,
        title,
        category,
        week:weeks(start_date)
      )
    `)
    .eq('athlete_id', athleteId)

  if (!data) return []

  return (data as any[])
    .map(row => {
      const s = row.session
      if (!s?.week?.start_date) return null
      const weekStart = new Date(s.week.start_date + 'T00:00:00')
      weekStart.setDate(weekStart.getDate() + s.day_of_week)
      return {
        sessionId:     s.id as string,
        date:          weekStart.toISOString().split('T')[0],
        sessionNumber: s.session_number as number,
        title:         (s.title ?? null) as string | null,
        category:      (s.category ?? null) as string | null,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
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
