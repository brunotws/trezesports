'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createGameAction } from '@/lib/actions/games'
import type { Athlete } from '@/types'

interface Props {
  athletes: Athlete[]
}

export default function NewGameForm({ athletes }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [opponent, setOpponent] = useState('')
  const [type, setType] = useState<'amistoso' | 'campeonato'>('campeonato')
  const [blocksVespera, setBlocksVespera] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  function toggleAthlete(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelectedIds(new Set(athletes.map(a => a.id)))
  }

  function clearAll() {
    setSelectedIds(new Set())
  }

  function handleSubmit() {
    if (!opponent.trim() || !date) return
    startTransition(async () => {
      await createGameAction(
        { date, opponent: opponent.trim(), type, blocks_day_before: blocksVespera },
        Array.from(selectedIds),
      )
      router.push('/jogos')
    })
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      {/* Adversário */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Adversário *</label>
        <input
          value={opponent}
          onChange={e => setOpponent(e.target.value)}
          placeholder="Nome do time adversário"
          className="w-full rounded-lg border border-input bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Data */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Data *</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full rounded-lg border border-input bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Tipo */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Tipo</label>
        <div className="grid grid-cols-2 gap-2">
          {(['campeonato', 'amistoso'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                'py-2.5 rounded-md border text-sm font-medium capitalize transition-colors',
                type === t
                  ? 'border-primary/40 bg-primary/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Bloquear véspera */}
      <button
        type="button"
        onClick={() => setBlocksVespera(v => !v)}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-colors',
          blocksVespera
            ? 'border-orange-500/30 bg-orange-500/5 text-foreground'
            : 'border-border bg-card text-muted-foreground',
        )}
      >
        <div className={cn(
          'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0',
          blocksVespera ? 'border-orange-400 bg-orange-400' : 'border-muted-foreground',
        )}>
          {blocksVespera && <span className="text-black text-xs font-bold">✓</span>}
        </div>
        <div className="flex flex-col text-left">
          <span className="font-medium">Bloquear véspera (MD-1)</span>
          <span className="text-[11px] text-muted-foreground">
            Marca o dia anterior como ativação
          </span>
        </div>
      </button>

      {/* Convocados */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            Convocados ({selectedIds.size}{athletes.length > 0 ? `/${athletes.length}` : ''})
          </label>
          <div className="flex gap-3">
            <button type="button" onClick={selectAll} className="text-xs text-primary hover:underline">
              Todos
            </button>
            <button type="button" onClick={clearAll} className="text-xs text-muted-foreground hover:underline">
              Limpar
            </button>
          </div>
        </div>

        {athletes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            Nenhum atleta cadastrado ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {athletes.map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleAthlete(a.id)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-colors text-left',
                  selectedIds.has(a.id)
                    ? 'border-primary/40 bg-primary/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground',
                )}
              >
                <div className={cn(
                  'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0',
                  selectedIds.has(a.id) ? 'border-primary bg-primary' : 'border-muted-foreground/40',
                )}>
                  {selectedIds.has(a.id) && <span className="text-primary-foreground text-[10px] font-bold leading-none">✓</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{a.name}</span>
                  <span className="text-muted-foreground text-[11px] ml-2">
                    {a.position ?? '—'} · {a.modality === 'futsal' ? 'Futsal' : 'Futebol'}
                    {a.turma ? ` · ${a.turma}` : ''}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || !opponent.trim() || !date}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
      >
        {isPending ? 'Salvando…' : `Registrar jogo${selectedIds.size > 0 ? ` (${selectedIds.size} convocados)` : ''}`}
      </button>
    </div>
  )
}
