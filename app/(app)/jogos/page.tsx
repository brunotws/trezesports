import Link from 'next/link'
import { Plus, Trophy, Users } from 'lucide-react'
import { getGames, getGameAthletes } from '@/lib/queries/games'
import { getAthletes } from '@/lib/queries/athletes'
import DeleteGameButton from './DeleteGameButton'
import PageHeader from '@/components/layout/PageHeader'
import type { Athlete, Game } from '@/types'

export default async function JogosPage() {
  const [games, athletes] = await Promise.all([getGames(), getAthletes()])

  const athleteMap = Object.fromEntries(athletes.map(a => [a.id, a]))

  // Buscar convocados de todos os jogos em paralelo
  const convocadosLists = await Promise.all(games.map(g => getGameAthletes(g.id)))
  const convocadosMap = Object.fromEntries(
    games.map((g, i) => [g.id, convocadosLists[i]]),
  )

  const today    = new Date().toISOString().split('T')[0]
  const upcoming = games.filter(g => g.date >= today)
  const past     = games.filter(g => g.date < today)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader title="Jogos" subtitle="Treze Sports" backHref="/dashboard">
        <Link
          href="/jogos/novo"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
        >
          <Plus size={15} />
          Novo
        </Link>
      </PageHeader>

      <div className="flex flex-col gap-6 px-4 py-5">
        {games.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Trophy size={32} className="text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">Nenhum jogo cadastrado.</p>
            <Link
              href="/jogos/novo"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              Registrar primeiro jogo
            </Link>
          </div>
        )}

        {upcoming.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Próximos</p>
            <div className="flex flex-col gap-3">
              {upcoming.map(game => (
                <GameCard
                  key={game.id}
                  game={game}
                  convocadoIds={convocadosMap[game.id] ?? []}
                  athleteMap={athleteMap}
                />
              ))}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Anteriores</p>
            <div className="flex flex-col gap-3">
              {past.map(game => (
                <GameCard
                  key={game.id}
                  game={game}
                  convocadoIds={convocadosMap[game.id] ?? []}
                  athleteMap={athleteMap}
                  muted
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function GameCard({
  game, convocadoIds, athleteMap, muted,
}: {
  game: Game
  convocadoIds: string[]
  athleteMap: Record<string, Athlete>
  muted?: boolean
}) {
  const dateObj = new Date(game.date + 'T00:00:00')
  const dateStr = dateObj.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })

  return (
    <div className={`rounded-xl border px-4 py-3 flex flex-col gap-3 ${muted ? 'border-border bg-card opacity-70' : 'border-red-500/30 bg-red-500/5'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy size={16} className={muted ? 'text-muted-foreground' : 'text-red-400'} />
          <div>
            <p className="text-sm font-semibold">{game.opponent}</p>
            <p className="text-[11px] text-muted-foreground">
              {dateStr} · <span className="capitalize">{game.type}</span>
              {game.blocks_day_before ? ' · Bloqueia véspera' : ''}
            </p>
          </div>
        </div>
        <DeleteGameButton id={game.id} />
      </div>

      {/* Convocados */}
      {convocadoIds.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <Users size={11} className="text-muted-foreground" />
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Convocados ({convocadoIds.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {convocadoIds.map(id => {
              const a = athleteMap[id]
              return (
                <span
                  key={id}
                  className="text-[11px] px-2 py-0.5 rounded-md border border-border bg-muted text-muted-foreground"
                >
                  {a?.name ?? '—'}
                </span>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground/60 italic">Nenhum convocado registrado</p>
      )}
    </div>
  )
}
