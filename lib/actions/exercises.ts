'use server'

import { revalidatePath } from 'next/cache'
import { createExercise, updateExercise, deleteExercise, duplicateExercise } from '@/lib/queries/exercises'
import { setExerciseCategories } from '@/lib/queries/categories'
import type { Exercise } from '@/types'

export async function createExerciseAction(values: {
  name: string
  description?: string | null
  attribute_target?: string | null
  attr_secondary?: string | null
  type: string
  fatigue_level: number
  for_goalkeeper?: boolean
  duration_min?: number | null
  diagram_url?: string | null
  progressao?: string | null
  regressao?: string | null
  espaco_necessario?: string | null
  num_cones?: number | null
  num_coletes?: number | null
  cores_coletes?: number | null
  num_bolas?: number | null
  is_eccentric?: boolean
  is_regenerative?: boolean
  contraindicated_doms_below?: number | null
}): Promise<{ id: string }> {
  const ex = await createExercise(values)
  revalidatePath('/exercicios')
  return { id: ex.id }
}

export async function updateExerciseAction(
  id: string,
  values: Partial<Omit<Exercise, 'id' | 'created_at'>>,
): Promise<void> {
  await updateExercise(id, values)
  revalidatePath('/exercicios')
  revalidatePath(`/exercicios/${id}`)
}

export async function deleteExerciseAction(id: string): Promise<void> {
  await deleteExercise(id)
  revalidatePath('/exercicios')
}

export async function duplicateExerciseAction(id: string, categoryIds: string[]): Promise<{ id: string }> {
  const copy = await duplicateExercise(id)
  if (categoryIds.length > 0) {
    await setExerciseCategories(copy.id, categoryIds)
  }
  revalidatePath('/exercicios')
  return { id: copy.id }
}
