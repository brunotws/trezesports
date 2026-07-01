import { createClient } from '@/lib/supabase/server'
import type { Athlete, Game, GameAthlete } from '@/types'
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

export async function getGameWithAthletes(gameId: string): Promise<{
  game: Game
  athletes: (GameAthlete & { athlete: Athlete | null })[]
} | null> {
  const supabase = createClient()
  const { data: game } = await supabase.from('games').select('*').eq('id', gameId).single()
  if (!game) return null
  const { data: athletes } = await supabase
    .from('game_athletes')
    .select('*, athlete:athletes(*)')
    .eq('game_id', gameId)
  return { game: game as Game, athletes: (athletes ?? []) as (GameAthlete & { athlete: Athlete | null })[] }
}

export async function upsertGameAthletePse(
  entries: Array<{ game_id: string; athlete_id: string; pse: number | null; duration_min: number; attended: boolean }>,
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('game_athletes')
    .upsert(entries, { onConflict: 'game_id,athlete_id' })
  if (error) throw new Error(error.message)
}

export async function createGame(values: {
  date: string
  opponent: string
  type: 'amistoso' | 'campeonato'
  blocks_day_before: boolean
  intensity_level?: number
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

export async function getRecentGameDateByAthlete(): Promise<Record<string, number>> {
  const supabase = createClient()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const cutoff = sevenDaysAgo.toISOString().split('T')[0]

  const { data: recentGames } = await supabase
    .from('games')
    .select('id, date')
    .gte('date', cutoff)
  if (!recentGames || recentGames.length === 0) return {}

  const gameIds = recentGames.map(g => g.id)
  const { data: entries } = await supabase
    .from('game_athletes')
    .select('athlete_id, game_id')
    .in('game_id', gameIds)
    .eq('attended', true)

  const gameDate = Object.fromEntries(recentGames.map(g => [g.id, g.date as string]))
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const result: Record<string, number> = {}
  for (const row of entries ?? []) {
    const d = new Date(gameDate[row.game_id]); d.setHours(0, 0, 0, 0)
    const days = Math.round((today.getTime() - d.getTime()) / 86400000)
    if (result[row.athlete_id] === undefined || days < result[row.athlete_id]) {
      result[row.athlete_id] = days
    }
  }
  return result
}
