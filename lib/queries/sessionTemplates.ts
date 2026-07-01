import { createClient } from '@/lib/supabase/server'
import type { Session, SessionExercise, Stage, TemplateSession } from '@/types'

export async function getTemplates(): Promise<TemplateSession[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('sessions')
    .select('*, session_exercises(count)')
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
  if (!data) return []
  return data.map(s => ({
    ...s,
    exerciseCount: (s.session_exercises as unknown as { count: number }[])?.[0]?.count ?? 0,
  }))
}

export async function cloneAsTemplate(sessionId: string): Promise<Session> {
  const supabase = createClient()

  const { data: original, error: fetchErr } = await supabase
    .from('sessions')
    .select('*, session_exercises(*)')
    .eq('id', sessionId)
    .single()
  if (fetchErr || !original) throw new Error('Sessão não encontrada')

  const { data: template, error: createErr } = await supabase
    .from('sessions')
    .insert({
      week_id:        null,
      day_of_week:    0,
      session_number: 1,
      session_type:   original.session_type,
      status:         'draft',
      title:          original.title ? `Modelo: ${original.title}` : 'Modelo',
      stages:         original.stages ?? [],
      category:       original.category,
      objective:      original.objective,
    })
    .select()
    .single()
  if (createErr || !template) throw new Error(createErr?.message ?? 'Erro ao criar modelo')

  const exercises: SessionExercise[] = original.session_exercises ?? []
  if (exercises.length > 0) {
    await supabase.from('session_exercises').insert(
      exercises.map(se => ({
        session_id:      template.id,
        exercise_id:     se.exercise_id,
        position:        se.position,
        block_type:      se.block_type,
        custom_duration: se.custom_duration ?? null,
      })),
    )
  }

  return template
}

export async function archiveSession(sessionId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('sessions')
    .update({ status: 'archived' })
    .eq('id', sessionId)
  if (error) throw new Error(error.message)
}

export async function deleteSession(sessionId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('sessions').delete().eq('id', sessionId)
  if (error) throw new Error(error.message)
}

export async function bulkArchiveSessions(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const supabase = createClient()
  const { error } = await supabase
    .from('sessions')
    .update({ status: 'archived' })
    .in('id', ids)
  if (error) throw new Error(error.message)
}

export async function bulkDeleteSessions(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const supabase = createClient()
  const { error } = await supabase.from('sessions').delete().in('id', ids)
  if (error) throw new Error(error.message)
}

export interface TemplateData {
  title:     string | null
  category:  string | null
  objective: string | null
  stages:    Stage[]
  exercises: Array<{
    exercise_id:     string
    block_type:      string | null
    position:        number
    custom_duration: number | null
  }>
}

export async function getTemplateWithExercises(templateId: string): Promise<TemplateData | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('sessions')
    .select('title, category, objective, stages, session_exercises(exercise_id, block_type, position, custom_duration)')
    .eq('id', templateId)
    .single()
  if (!data) return null
  return {
    title:     data.title?.replace(/^Modelo:\s*/i, '') ?? null,
    category:  data.category,
    objective: data.objective,
    stages:    (data.stages as Stage[] | null) ?? [],
    exercises: (data.session_exercises as TemplateData['exercises']) ?? [],
  }
}
