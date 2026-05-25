'use server'

import { revalidatePath } from 'next/cache'
import { createGame, deleteGame } from '@/lib/queries/games'

export async function createGameAction(values: {
  date: string
  opponent: string
  type: 'amistoso' | 'campeonato'
  blocks_day_before: boolean
}): Promise<{ id: string }> {
  const game = await createGame(values)
  revalidatePath('/jogos')
  revalidatePath('/planejador', 'layout')
  return { id: game.id }
}

export async function deleteGameAction(id: string): Promise<void> {
  await deleteGame(id)
  revalidatePath('/jogos')
  revalidatePath('/planejador', 'layout')
}
