import { createClient } from '@/lib/supabase/server'
import type { Exercise } from '@/types'

export async function getExercises(): Promise<Exercise[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createExercise(values: {
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
  contraindicated_doms_below?: number | null
}): Promise<Exercise> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exercises')
    .insert(values)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function getExercise(id: string): Promise<Exercise | null> {
  const supabase = createClient()
  const { data } = await supabase.from('exercises').select('*').eq('id', id).single()
  return data
}

export async function updateExercise(
  id: string,
  values: Partial<Omit<Exercise, 'id' | 'created_at'>>,
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('exercises').update(values).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function duplicateExercise(id: string): Promise<Exercise> {
  const supabase = createClient()
  const { data: original, error: fetchErr } = await supabase
    .from('exercises').select('*').eq('id', id).single()
  if (fetchErr || !original) throw new Error('Exercício não encontrado')

  const { id: _id, created_at: _ca, ...fields } = original
  const { data, error } = await supabase
    .from('exercises')
    .insert({ ...fields, name: `Cópia de ${original.name}` })
    .select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteExercise(id: string): Promise<void> {
  const supabase = createClient()
  // Remove FK references before deleting the exercise
  await supabase.from('session_exercises').delete().eq('exercise_id', id)
  const { error } = await supabase.from('exercises').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
