'use server'

import { revalidatePath } from 'next/cache'
import { createAthlete, updateAthlete, deleteAthlete } from '@/lib/queries/athletes'
import type { Athlete } from '@/types'

type AthleteInput = {
  name: string
  birth_date?: string | null
  position?: string | null
  modality?: string
  turma?: string | null
  resting_hr?: number | null
}

export async function createAthleteAction(values: AthleteInput): Promise<{ id: string }> {
  const athlete = await createAthlete(values)
  revalidatePath('/atletas')
  return { id: athlete.id }
}

export async function updateAthleteAction(
  id: string,
  values: Partial<Omit<Athlete, 'id' | 'created_at'>>,
): Promise<void> {
  await updateAthlete(id, values)
  revalidatePath('/atletas')
  revalidatePath(`/atletas/${id}`)
}

export async function deleteAthleteAction(id: string): Promise<void> {
  await deleteAthlete(id)
  revalidatePath('/atletas')
}
