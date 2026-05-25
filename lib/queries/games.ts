import { createClient } from '@/lib/supabase/server'
import type { Game } from '@/types'
import { weekIdToDate, addDays, toISODate } from '@/lib/utils/week'

export async function addGameAthletes(gameId: string, athleteIds: string[]): Promise<void> {
  if (athleteIds.length === 0) return
  const supabase = createClient()
  const { error } = await supabase
    .from('game_athletes')
    .upsert(
      athleteIds.map(athlete_id => ({ game_id: gameId, athlete_id })),
      { onConflict: 'game_id,athlete_id', ignoreDuplicates: true },
    )
  if (error) throw new Error(error.message)
}

export async function getGameAthletes(gameId: string): Promise<string[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('game_athletes')
    .select('athlete_id')
    .eq('game_id', gameId)
  return (data ?? []).map((r: { athlete_id: string }) => r.athlete_id)
}

export async function getGames(): Promise<Game[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('games')
    .select('*')
    .order('date', { ascending: false })
  return data ?? []
}

export async function deleteGame(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('games').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getWeekGames(weekId: string): Promise<Game[]> {
  const supabase = createClient()
  const start = weekIdToDate(weekId)
  const from  = weekId
  const to    = toISODate(addDays(start, 6))

  const { data } = await supabase
    .from('games')
    .select('*')
    .gte('date', from)
    .lte('date', to)
    .order('date')

  return data ?? []
}

export async function createGame(values: {
  date: string
  opponent: string
  type: 'amistoso' | 'campeonato'
  blocks_day_before: boolean
}): Promise<Game> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('games')
    .insert(values)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}
