import Link from 'next/link'
import { Plus, Trophy } from 'lucide-react'
import { getGames } from '@/lib/queries/games'
import DeleteGameButton from './DeleteGameButton'
import PageHeader from '@/components/layout/PageHeader'

export default async function JogosPage() {
  const games = await getGames()

  const upcoming = games.filter(g => g.date >= new Date().toISOString().split('T')[0])
  const past     = games.filter(g => g.date <  new Date().toISOString().split('T')[0])

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
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Próximos</p>
            <div className="flex flex-col gap-2">
              {upcoming.map(game => <GameCard key={game.id} game={game} />)}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Anteriores</p>
            <div className="flex flex-col gap-2">
              {past.map(game => <GameCard key={game.id} game={game} muted />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function GameCard({ game, muted }: { game: { id: string; date: string; opponent: string; type: string; blocks_day_before: boolean }; muted?: boolean }) {
  const dateObj = new Date(game.date + 'T00:00:00')
  const dateStr = dateObj.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${muted ? 'border-border bg-card opacity-60' : 'border-red-500/30 bg-red-500/5'}`}>
      <div className="flex items-center gap-3">
        <Trophy size={16} className={muted ? 'text-muted-foreground' : 'text-red-400'} />
        <div>
          <p className="text-sm font-medium">{game.opponent}</p>
          <p className="text-[11px] text-muted-foreground">
            {dateStr} · {game.type}
            {game.blocks_day_before ? ' · Bloqueia véspera' : ''}
          </p>
        </div>
      </div>
      <DeleteGameButton id={game.id} />
    </div>
  )
}
