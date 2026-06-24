import { createClient } from '@/lib/supabase/server'
import type { Category, ExerciseWithCategories, Exercise } from '@/types'

export async function getCategories(): Promise<Category[]> {
  const supabase = createClient()
  const { data } = await supabase.from('categories').select('*').order('name')
  return data ?? []
}

export async function createCategory(name: string, color: string): Promise<Category> {
  const supabase = createClient()
  const { data, error } = await supabase.from('categories').insert({ name, color }).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateCategory(id: string, name: string, color: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('categories').update({ name, color }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getExerciseCategories(exerciseId: string): Promise<Category[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('exercise_categories')
    .select('categories(*)')
    .eq('exercise_id', exerciseId)
  if (!data) return []
  return data.map(r => r.categories as unknown as Category).filter(Boolean)
}

export async function setExerciseCategories(exerciseId: string, categoryIds: string[]): Promise<void> {
  const supabase = createClient()
  await supabase.from('exercise_categories').delete().eq('exercise_id', exerciseId)
  if (categoryIds.length === 0) return
  const { error } = await supabase.from('exercise_categories').insert(
    categoryIds.map(category_id => ({ exercise_id: exerciseId, category_id }))
  )
  if (error) throw new Error(error.message)
}

export async function bulkAssignCategory(exerciseIds: string[], categoryId: string): Promise<void> {
  if (exerciseIds.length === 0) return
  const supabase = createClient()
  const rows = exerciseIds.map(exercise_id => ({ exercise_id, category_id: categoryId }))
  const { error } = await supabase.from('exercise_categories').upsert(rows, { ignoreDuplicates: true })
  if (error) throw new Error(error.message)
}

export async function getExercisesWithCategories(): Promise<ExerciseWithCategories[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exercises')
    .select('*, exercise_categories(categories(*))')
    .order('name')
  if (error) throw new Error(error.message)
  return (data ?? []).map(ex => ({
    ...(ex as Exercise),
    categories: ((ex as { exercise_categories: { categories: unknown }[] }).exercise_categories ?? [])
      .map(ec => ec.categories as Category)
      .filter(Boolean),
  }))
}
