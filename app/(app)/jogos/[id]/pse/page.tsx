import { notFound } from 'next/navigation'
import { getGameWithAthletes } from '@/lib/queries/games'
import PageHeader from '@/components/layout/PageHeader'
import GamePseForm from './GamePseForm'

interface Props {
  params: { id: string }
}

export default async function GamePsePage({ params }: Props) {
  const result = await getGameWithAthletes(params.id)
  if (!result) notFound()

  const { game, athletes } = result

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader title="PSE do Jogo" subtitle={game.opponent} backHref="/jogos" />
      <GamePseForm
        gameId={game.id}
        opponent={game.opponent}
        gameDate={game.date}
        athleteEntries={athletes.map(ga => ({
          gameId:    game.id,
          athleteId: ga.athlete_id,
          athlete:   ga.athlete ?? null,
          pse:       ga.pse ?? null,
          attended:  ga.attended ?? true,
        }))}
      />
    </div>
  )
}
