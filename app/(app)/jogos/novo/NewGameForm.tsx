'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createGameAction } from '@/lib/actions/games'

export default function NewGameForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [opponent, setOpponent] = useState('')
  const [type, setType] = useState<'amistoso' | 'campeonato'>('campeonato')
  const [blocksVespera, setBlocksVespera] = useState(true)

  function handleSubmit() {
    if (!opponent.trim() || !date) return
    startTransition(async () => {
      await createGameAction({
        date,
        opponent: opponent.trim(),
        type,
        blocks_day_before: blocksVespera,
      })
      router.push('/jogos')
    })
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Adversário *</label>
        <input
          value={opponent}
          onChange={e => setOpponent(e.target.value)}
          placeholder="Nome do time adversário"
          className="w-full rounded-lg border border-input bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Data *</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full rounded-lg border border-input bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Tipo</label>
        <div className="grid grid-cols-2 gap-2">
          {(['campeonato', 'amistoso'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`py-2.5 rounded-md border text-sm font-medium capitalize transition-colors ${
                type === t
                  ? 'border-primary/40 bg-primary/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setBlocksVespera(v => !v)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-colors ${
          blocksVespera
            ? 'border-orange-500/30 bg-orange-500/5 text-foreground'
            : 'border-border bg-card text-muted-foreground'
        }`}
      >
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
          blocksVespera ? 'border-orange-400 bg-orange-400' : 'border-muted-foreground'
        }`}>
          {blocksVespera && <span className="text-black text-xs font-bold">✓</span>}
        </div>
        <div className="flex flex-col text-left">
          <span className="font-medium">Bloquear véspera</span>
          <span className="text-[11px] text-muted-foreground">
            Marca o dia anterior como dia de ativação (MD-1)
          </span>
        </div>
      </button>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || !opponent.trim() || !date}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
      >
        {isPending ? 'Salvando…' : 'Registrar jogo'}
      </button>
    </div>
  )
}
