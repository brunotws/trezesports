'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import RPEGrid from '@/components/sessao/RPEGrid'
import { submitGamePseAction } from '@/lib/actions/games'
import type { Athlete } from '@/types'

interface GameAthletePse {
  gameId:    string
  athleteId: string
  athlete:   Athlete | null
  pse:       number | null
  attended:  boolean
}

interface Props {
  gameId:      string
  opponent:    string
  gameDate:    string
  athleteEntries: GameAthletePse[]
}

export default function GamePseForm({ gameId, opponent, gameDate, athleteEntries }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [entries, setEntries] = useState(
    athleteEntries.map(e => ({
      athleteId: e.athleteId,
      name:      e.athlete?.name ?? '—',
      attended:  e.attended,
      pse:       e.pse,
    })),
  )

  const [duration, setDuration] = useState('90')

  function toggleAttended(athleteId: string) {
    setEntries(prev =>
      prev.map(e =>
        e.athleteId === athleteId
          ? { ...e, attended: !e.attended, pse: !e.attended ? e.pse : null }
          : e,
      ),
    )
  }

  function setPse(athleteId: string, pse: number) {
    setEntries(prev => prev.map(e => e.athleteId === athleteId ? { ...e, pse } : e))
  }

  function handleSubmit() {
    const durationMin = Math.max(1, Number(duration) || 90)
    startTransition(async () => {
      await submitGamePseAction(
        gameId,
        entries.map(e => ({
          athleteId:   e.athleteId,
          pse:         e.pse,
          durationMin: durationMin,
          attended:    e.attended,
        })),
      )
      router.push('/jogos')
    })
  }

  const dateStr = new Date(gameDate + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit',
  })

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{opponent}</p>
          <p className="text-[11px] text-muted-foreground">{dateStr}</p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">PSE pós-jogo</span>
      </div>

      {/* Duração */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Duração da partida (min)</label>
        <input
          type="number"
          value={duration}
          onChange={e => setDuration(e.target.value)}
          min={1}
          max={180}
          className="w-full rounded-lg border border-input bg-muted px-3 py-2.5 text-sm text-center font-semibold outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* PSE por atleta */}
      <div className="flex flex-col gap-6">
        {entries.map(entry => (
          <div key={entry.athleteId} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{entry.name}</span>
              <button
                type="button"
                onClick={() => toggleAttended(entry.athleteId)}
                className={cn(
                  'text-xs px-2 py-1 rounded border transition-colors',
                  entry.attended
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-muted text-muted-foreground border-border',
                )}
              >
                {entry.attended ? 'Jogou' : 'Não jogou'}
              </button>
            </div>
            {entry.attended && (
              <RPEGrid value={entry.pse} onChange={pse => setPse(entry.athleteId, pse)} />
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
      >
        {isPending ? 'Salvando…' : 'Salvar PSEs do Jogo'}
      </button>
    </div>
  )
}
