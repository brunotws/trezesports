import { createClient } from '@/lib/supabase/server'
import type { Week } from '@/types'

export async function getWeek(startDate: string): Promise<Week | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('weeks')
    .select('*')
    .eq('start_date', startDate)
    .single()
  return data
}

export async function getOrCreateWeek(startDate: string): Promise<Week> {
  const supabase = createClient()

  const { data: existing } = await supabase
    .from('weeks')
    .select('*')
    .eq('start_date', startDate)
    .single()

  if (existing) return existing

  const { data, error } = await supabase
    .from('weeks')
    .insert({ start_date: startDate })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar semana: ${error.message}`)
  return data
}
