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
  type: string
  fatigue_level: number
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

export async function deleteExercise(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('exercises').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
