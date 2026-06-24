'use server'

import { revalidatePath } from 'next/cache'
import {
  createExerciseGroup,
  deleteExerciseGroup,
  addExercisesToGroup,
  removeExerciseFromGroup,
} from '@/lib/queries/exerciseGroups'
import type { ExerciseGroup } from '@/types'

export async function createExerciseGroupAction(
  name: string,
  exerciseIds: string[] = [],
): Promise<ExerciseGroup> {
  const group = await createExerciseGroup(name, exerciseIds)
  revalidatePath('/exercicios', 'layout')
  return group
}

export async function deleteExerciseGroupAction(id: string): Promise<void> {
  await deleteExerciseGroup(id)
  revalidatePath('/exercicios', 'layout')
}

export async function addExercisesToGroupAction(
  groupId: string,
  exerciseIds: string[],
): Promise<void> {
  await addExercisesToGroup(groupId, exerciseIds)
  revalidatePath('/exercicios', 'layout')
}

export async function removeExerciseFromGroupAction(
  groupId: string,
  exerciseId: string,
): Promise<void> {
  await removeExerciseFromGroup(groupId, exerciseId)
  revalidatePath('/exercicios', 'layout')
}
