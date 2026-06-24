'use server'

import { revalidatePath } from 'next/cache'
import {
  createCategory, updateCategory, deleteCategory,
  setExerciseCategories, bulkAssignCategory,
} from '@/lib/queries/categories'
import type { Category } from '@/types'

export async function createCategoryAction(name: string, color: string): Promise<Category> {
  const cat = await createCategory(name, color)
  revalidatePath('/exercicios')
  revalidatePath('/exercicios/categorias')
  return cat
}

export async function updateCategoryAction(id: string, name: string, color: string): Promise<void> {
  await updateCategory(id, name, color)
  revalidatePath('/exercicios')
  revalidatePath('/exercicios/categorias')
}

export async function deleteCategoryAction(id: string): Promise<void> {
  await deleteCategory(id)
  revalidatePath('/exercicios')
  revalidatePath('/exercicios/categorias')
}

export async function setExerciseCategoriesAction(exerciseId: string, categoryIds: string[]): Promise<void> {
  await setExerciseCategories(exerciseId, categoryIds)
  revalidatePath('/exercicios')
  revalidatePath(`/exercicios/${exerciseId}`)
}

export async function bulkAssignCategoryAction(exerciseIds: string[], categoryId: string): Promise<void> {
  await bulkAssignCategory(exerciseIds, categoryId)
  revalidatePath('/exercicios')
}
