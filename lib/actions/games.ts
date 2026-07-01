'use server'

import { revalidatePath } from 'next/cache'
import { createGame, deleteGame, addGameAthletes, upsertGameAthletePse } from '@/lib/queries/games'

export async function createGameAction(
  values: {
    date: string
    opponent: string
    type: 'amistoso' | 'campeonato'
    blocks_day_before: boolean
    intensity_level?: number
  },
  athleteIds: string[] = [],
): Promise<{ id: string }> {
  const game = await createGame(values)
  if (athleteIds.length > 0) {
    await addGameAthletes(game.id, athleteIds)
  }
  revalidatePath('/jogos')
  revalidatePath('/planejador', 'layout')
  return { id: game.id }
}

export async function deleteGameAction(id: string): Promise<void> {
  await deleteGame(id)
  revalidatePath('/jogos')
  revalidatePath('/planejador', 'layout')
}

export async function submitGamePseAction(
  gameId: string,
  entries: Array<{ athleteId: string; pse: number | null; durationMin: number; attended: boolean }>,
): Promise<void> {
  await upsertGameAthletePse(
    entries.map(e => ({
      game_id:      gameId,
      athlete_id:   e.athleteId,
      pse:          e.pse,
      duration_min: e.durationMin,
      attended:     e.attended,
    })),
  )
  revalidatePath('/jogos')
  revalidatePath('/atletas', 'layout')
}
