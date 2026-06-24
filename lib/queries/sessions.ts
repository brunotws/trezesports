import { createClient } from '@/lib/supabase/server'
import type { Session, SessionAthlete, SessionExercise, SessionPlannedLoad, SessionType } from '@/types'

export async function getWeekSessions(weekId: string): Promise<Session[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('week_id', weekId)
    .in('status', ['planejada', 'em_andamento', 'encerrada'])
    .order('day_of_week')
    .order('session_number')

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getSessionWithExercises(sessionId: string): Promise<(Session & { exercises: SessionExercise[] }) | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*, session_exercises(*, exercise:exercises(*))')
    .eq('id', sessionId)
    .single()

  if (error) return null
  return {
    ...data,
    exercises: (data.session_exercises ?? []).sort(
      (a: SessionExercise, b: SessionExercise) => a.position - b.position
    ),
  }
}

export async function getWeekPlannedLoads(sessionIds: string[]): Promise<SessionPlannedLoad[]> {
  if (sessionIds.length === 0) return []
  const supabase = createClient()
  const { data } = await supabase
    .from('session_planned_load')
    .select('*')
    .in('session_id', sessionIds)
  return data ?? []
}

export async function createSession(
  weekId: string,
  dayOfWeek: number,
  sessionNumber: number,
  sessionType: SessionType = 'free',
  extra?: {
    title?: string | null
    scheduledTime?: string | null
    category?: string | null
    objective?: string | null
    coachNotes?: string | null
    teamIntensity?: number | null
    stages?: { id: string; name: string }[]
  },
): Promise<Session> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      week_id:        weekId,
      day_of_week:    dayOfWeek,
      session_number: sessionNumber,
      session_type:   sessionType,
      title:          extra?.title ?? null,
      scheduled_time: extra?.scheduledTime ?? null,
      category:       extra?.category ?? null,
      objective:      extra?.objective ?? null,
      coach_notes:    extra?.coachNotes ?? null,
      team_intensity: extra?.teamIntensity ?? null,
      stages:         extra?.stages ?? [],
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateSessionLogs(
  sessionId: string,
  values: { coach_notes?: string | null; team_intensity?: number | null },
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('sessions')
    .update(values)
    .eq('id', sessionId)
  if (error) throw new Error(error.message)
}

export async function startSession(sessionId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('sessions')
    .update({ status: 'em_andamento' })
    .eq('id', sessionId)
  if (error) throw new Error(error.message)
}

export async function getSessionAthleteCounts(
  sessionIds: string[],
): Promise<Record<string, number>> {
  if (sessionIds.length === 0) return {}
  const supabase = createClient()
  const { data } = await supabase
    .from('session_athletes')
    .select('session_id')
    .in('session_id', sessionIds)

  if (!data) return {}
  const counts: Record<string, number> = {}
  for (const row of data) {
    counts[row.session_id] = (counts[row.session_id] ?? 0) + 1
  }
  return counts
}

export async function getSessionAthletes(sessionId: string): Promise<SessionAthlete[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('session_athletes')
    .select('*, athlete:athletes(*)')
    .eq('session_id', sessionId)
    .order('created_at')

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function updateSessionType(
  sessionId: string,
  sessionType: string,
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('sessions')
    .update({ session_type: sessionType })
    .eq('id', sessionId)
  if (error) throw new Error(error.message)
}

export async function addSessionExercises(
  sessionId: string,
  exercises: Array<{ exerciseId: string; blockType?: string; position: number }>,
): Promise<void> {
  if (exercises.length === 0) return
  const supabase = createClient()
  const rows = exercises.map(({ exerciseId, blockType, position }) => ({
    session_id:  sessionId,
    exercise_id: exerciseId,
    block_type:  blockType ?? null,
    position,
  }))
  const { error } = await supabase.from('session_exercises').insert(rows)
  if (error) throw new Error(error.message)
}

export async function closeSession(
  sessionId: string,
  actualRpe: number,
  actualDurationMin: number,
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('sessions')
    .update({
      status: 'encerrada',
      actual_rpe: actualRpe,
      actual_duration_min: actualDurationMin,
    })
    .eq('id', sessionId)
  if (error) throw new Error(error.message)
}
