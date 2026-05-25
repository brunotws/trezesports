'use server'

import { revalidatePath } from 'next/cache'
import { createExercise, deleteExercise } from '@/lib/queries/exercises'

export async function createExerciseAction(values: {
  name: string
  description?: string | null
  attribute_target?: string | null
  type: string
  fatigue_level: number
  is_eccentric?: boolean
  contraindicated_doms_below?: number | null
}): Promise<{ id: string }> {
  const ex = await createExercise(values)
  revalidatePath('/exercicios')
  return { id: ex.id }
}

export async function deleteExerciseAction(id: string): Promise<void> {
  await deleteExercise(id)
  revalidatePath('/exercicios')
}
