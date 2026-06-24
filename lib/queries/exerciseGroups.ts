import { createClient } from '@/lib/supabase/server'
import type { ExerciseGroup } from '@/types'

export async function getExerciseGroups(): Promise<ExerciseGroup[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('exercise_groups')
      .select('*, items:exercise_group_items(*, exercise:exercises(*))')
      .order('name')
    if (error) return []  // table might not exist yet (migration pending)
    return (data ?? []).map(g => ({
      ...g,
      items: (g.items ?? []).sort((a: { position: number }, b: { position: number }) => a.position - b.position),
    }))
  } catch {
    return []
  }
}

export async function createExerciseGroup(name: string, exerciseIds: string[]): Promise<ExerciseGroup> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exercise_groups')
    .insert({ name })
    .select()
    .single()
  if (error) throw new Error(error.message)

  if (exerciseIds.length > 0) {
    const rows = exerciseIds.map((exercise_id, i) => ({
      group_id: data.id,
      exercise_id,
      position: i,
    }))
    const { error: itemErr } = await supabase.from('exercise_group_items').insert(rows)
    if (itemErr) throw new Error(itemErr.message)
  }

  return { ...data, items: [] }
}

export async function deleteExerciseGroup(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('exercise_groups').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function addExercisesToGroup(groupId: string, exerciseIds: string[]): Promise<void> {
  const supabase = createClient()
  const { data: existing } = await supabase
    .from('exercise_group_items')
    .select('position')
    .eq('group_id', groupId)
    .order('position', { ascending: false })
    .limit(1)

  const startPos = (existing?.[0]?.position ?? -1) + 1
  const rows = exerciseIds.map((exercise_id, i) => ({
    group_id: groupId,
    exercise_id,
    position: startPos + i,
  }))
  const { error } = await supabase.from('exercise_group_items').insert(rows)
  if (error) throw new Error(error.message)
}

export async function removeExerciseFromGroup(groupId: string, exerciseId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('exercise_group_items')
    .delete()
    .eq('group_id', groupId)
    .eq('exercise_id', exerciseId)
  if (error) throw new Error(error.message)
}
