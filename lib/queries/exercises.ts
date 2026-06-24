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

export async function deleteExercise(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('exercises').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
