'use server'

import { revalidatePath } from 'next/cache'
import { createSession, startSession, closeSession } from '@/lib/queries/sessions'
import { addAthleteToSession, upsertSessionAthlete } from '@/lib/queries/sessionAthletes'
import type { SessionType } from '@/types'

export async function createSessionAction(
  weekId: string,
  day: number,
  sn: number,
  sessionType: SessionType,
): Promise<{ id: string }> {
  const session = await createSession(weekId, day, sn, sessionType)
  revalidatePath('/planejador', 'layout')
  return { id: session.id }
}

export async function addAthletesToSessionAction(
  sessionId: string,
  athleteIds: string[],
): Promise<void> {
  await Promise.all(athleteIds.map(id => addAthleteToSession(sessionId, id)))
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
