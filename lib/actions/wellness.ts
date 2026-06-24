'use server'

import { revalidatePath } from 'next/cache'
import { upsertWellness } from '@/lib/queries/wellness'

export async function upsertWellnessAction(
  athleteId: string,
  values: { fatigue: number; sleep_quality: number; doms: number; mood: number; resting_hr?: number; nutrition_score?: number },
): Promise<{ fatigue: number; sleep_quality: number; doms: number; mood: number; nutrition_score?: number }> {
  const today = new Date().toISOString().split('T')[0]
  await upsertWellness(athleteId, today, values)
  revalidatePath(`/atletas/${athleteId}`)
  revalidatePath('/sessao', 'layout')
  return { fatigue: values.fatigue, sleep_quality: values.sleep_quality, doms: values.doms, mood: values.mood, nutrition_score: values.nutrition_score }
}
