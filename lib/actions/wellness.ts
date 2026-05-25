'use server'

import { revalidatePath } from 'next/cache'
import { upsertWellness } from '@/lib/queries/wellness'

export async function upsertWellnessAction(
  athleteId: string,
  values: { fatigue: number; sleep_quality: number; doms: number; mood: number; resting_hr?: number },
): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  await upsertWellness(athleteId, today, values)
  revalidatePath(`/atletas/${athleteId}`)
}
