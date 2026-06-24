'use server'

import { revalidatePath } from 'next/cache'
import {
  createSession, startSession, closeSession, addSessionExercises, updateSessionLogs,
  deleteSessionExercise, reorderSessionExercises, updateSessionExerciseDuration,
  insertDuplicateSessionExercise, markSessionExerciseSkipped, addSessionExercisesWithReturn,
} from '@/lib/queries/sessions'
import { addAthleteToSession, upsertSessionAthlete } from '@/lib/queries/sessionAthletes'
import type { SessionExercise, SessionType } from '@/types'

export async function createSessionAction(
  weekId: string,
  day: number,
  sn: number,
  sessionType: SessionType,
  extra?: {
    title?: string | null
    scheduledTime?: string | null
    category?: string | null
    objective?: string | null
    coachNotes?: string | null
    teamIntensity?: number | null
    stages?: { id: string; name: string }[]
  },
): Promise<{ id: string }> {
  const session = await createSession(weekId, day, sn, sessionType, extra)
  revalidatePath('/planejador', 'layout')
  return { id: session.id }
}

export async function addAthletesToSessionAction(
  sessionId: string,
  athleteIds: string[],
): Promise<void> {
  await Promise.all(athleteIds.map(id => addAthleteToSession(sessionId, id)))
}

export async function addExercisesToSessionAction(
  sessionId: string,
  exercises: Array<{ exerciseId: string; blockType?: string; position: number; customDuration?: number | null }>,
): Promise<void> {
  await addSessionExercises(sessionId, exercises)
}

export async function startSessionAction(sessionId: string): Promise<void> {
  await startSession(sessionId)
  revalidatePath(`/sessao/${sessionId}`)
}

export async function closeSessionAction(
  sessionId: string,
  actualRpe: number,
  actualDurationMin: number,
): Promise<void> {
  await closeSession(sessionId, actualRpe, actualDurationMin)
  revalidatePath(`/sessao/${sessionId}`)
}

export async function updateSessionLogsAction(
  sessionId: string,
  values: { coach_notes?: string | null; team_intensity?: number | null },
): Promise<void> {
  await updateSessionLogs(sessionId, values)
  revalidatePath(`/sessao/${sessionId}`)
}

export async function submitPseAction(
  sessionId: string,
  pses: Array<{ athleteId: string; pse: number | null; attended: boolean }>,
): Promise<void> {
  await Promise.all(
    pses.map(({ athleteId, pse, attended }) =>
      upsertSessionAthlete(sessionId, athleteId, pse, attended),
    ),
  )
  revalidatePath(`/sessao/${sessionId}`)
}

export async function deleteSessionExerciseAction(id: string, sessionId: string): Promise<void> {
  await deleteSessionExercise(id)
  revalidatePath(`/sessao/${sessionId}`)
}

export async function reorderSessionExercisesAction(
  sessionId: string,
  updates: Array<{ id: string; position: number }>,
): Promise<void> {
  await reorderSessionExercises(updates)
  revalidatePath(`/sessao/${sessionId}`)
}

export async function updateSessionExerciseDurationAction(
  id: string,
  customDuration: number | null,
  sessionId: string,
): Promise<void> {
  await updateSessionExerciseDuration(id, customDuration)
  revalidatePath(`/sessao/${sessionId}`)
}

export async function insertDuplicateSessionExerciseAction(
  sessionId:      string,
  exerciseId:     string,
  blockType:      string | null,
  position:       number,
  customDuration: number | null,
): Promise<SessionExercise> {
  const se = await insertDuplicateSessionExercise(sessionId, exerciseId, blockType, position, customDuration)
  revalidatePath(`/sessao/${sessionId}`)
  return se
}

export async function markSessionExerciseSkippedAction(id: string, sessionId: string): Promise<void> {
  await markSessionExerciseSkipped(id)
  revalidatePath(`/sessao/${sessionId}`)
}

export async function addExercisesToSessionEditorAction(
  sessionId: string,
  exercises: Array<{ exerciseId: string; blockType?: string | null; position: number; customDuration?: number | null }>,
): Promise<SessionExercise[]> {
  const ses = await addSessionExercisesWithReturn(sessionId, exercises)
  revalidatePath(`/sessao/${sessionId}`)
  return ses
}
