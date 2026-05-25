'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SESSION_TYPE_LABELS, SESSION_TYPE_COLORS, buildMorphocycleContext } from '@/lib/engine/morphocycle'
import { createSessionAction, addAthletesToSessionAction } from '@/lib/actions/sessions'
import type { Athlete, SessionType } from '@/types'

const SESSION_TYPES: SessionType[] = ['MD+1', 'MD+2', 'MD-4', 'MD-3', 'MD-2', 'MD-1', 'MD', 'free']

interface Props {
  weekId:   string
  day:      number
  sn:       number
  athletes: Athlete[]
}

export default function NewSessionForm({ weekId, day, sn, athletes }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [sessionType, setSessionType] = useState<SessionType>('MD-3')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const morpho = buildMorphocycleContext(sessionType, 'green')

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

  function handleSubmit() {
    startTransition(async () => {
      const { id } = await createSessionAction(weekId, day, sn, sessionType)
      if (selectedIds.size > 0) {
        await addAthletesToSessionAction(id, Array.from(selectedIds))
      }
      router.push(`/sessao/${id}`)
    })
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      {/* Session type picker */}
      <section>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Tipo de sessão
        </p>
        <div className="grid grid-cols-4 gap-2">
          {SESSION_TYPES.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setSessionType(type)}
              className={cn(
                'py-2 px-1 rounded-md border text-xs font-semibold transition-all',
                SESSION_TYPE_COLORS[type],
                sessionType === type ? 'ring-2 ring-white/40 scale-105' : 'opacity-60',
              )}
            >
              {SESSION_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </section>

      {/* Morphocycle card */}
      <section className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Morfociclo
          </span>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span>RPE {morpho.suggestedRpeTarget}</span>
            <span>{morpho.suggestedDurationMin} min</span>
          </div>
        </div>
        <p className="text-sm text-foreground leading-snug">{morpho.suggestedFocus}</p>
      </section>

      {/* Athletes */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Atletas ({selectedIds.size}/{athletes.length})
          </p>
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-primary underline-offset-2 hover:underline"
          >
            Todos
          </button>
        </div>

        {athletes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum atleta cadastrado. Crie atletas no Sprint 3.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {athletes.map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleAthlete(a.id)}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-md border text-sm transition-colors',
                  selectedIds.has(a.id)
                    ? 'border-primary/40 bg-primary/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground',
                )}
              >
                <span>{a.name}</span>
                <span className="text-[10px] opacity-60">{a.position ?? '—'}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 mt-auto"
      >
        {isPending ? 'Criando…' : 'Criar sessão'}
      </button>
    </div>
  )
}
