'use server'

import { revalidatePath } from 'next/cache'
import { createGame, deleteGame, addGameAthletes } from '@/lib/queries/games'

export async function createGameAction(
  values: {
    date: string
    opponent: string
    type: 'amistoso' | 'campeonato'
    blocks_day_before: boolean
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
