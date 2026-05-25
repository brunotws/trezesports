'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { buildMorphocycleContext, SESSION_TYPE_LABELS, SESSION_TYPE_COLORS } from '@/lib/engine/morphocycle'
import { startSessionAction } from '@/lib/actions/sessions'
import CloseSessionSheet from './CloseSessionSheet'
import FatigueBadge from '@/components/atletas/FatigueBadge'
import type { Session, SessionAthlete, SessionExercise } from '@/types'

interface Props {
  session:   Session & { exercises: SessionExercise[] }
  athletes:  SessionAthlete[]
  plannedLoad: number
}

export default function SessionActions({ session, athletes, plannedLoad }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [sheetOpen, setSheetOpen] = useState(false)

  const morpho = session.status !== 'encerrada'
    ? buildMorphocycleContext(session.session_type, 'green')
    : null

  function handleStart() {
    startTransition(async () => {
      await startSessionAction(session.id)
      router.refresh()
    })
  }

  const typeColor = SESSION_TYPE_COLORS[session.session_type]
  const typeLabel = SESSION_TYPE_LABELS[session.session_type]

  return (
    <div className="flex flex-col gap-6 px-4 pb-10">
      {/* Session type + status header */}
      <div className="flex items-center gap-3">
        <span className={cn('text-xs font-semibold px-2 py-1 rounded border', typeColor)}>
          {typeLabel}
        </span>
        <span className="text-xs text-muted-foreground capitalize">
          {session.status.replace('_', ' ')}
        </span>
      </div>

      {/* Morphocycle card — shown until session is closed */}
      {morpho && (
        <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2">
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
        </div>
      )}

      {/* Closed session summary */}
      {session.status === 'encerrada' && (
        <div className="rounded-lg border border-border bg-card p-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">RPE real</p>
            <p className="text-2xl font-bold">{session.actual_rpe ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Duração</p>
            <p className="text-2xl font-bold">{session.actual_duration_min ?? '—'} <span className="text-sm font-normal text-muted-foreground">min</span></p>
          </div>
        </div>
      )}

      {/* Exercises */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Exercícios
        </p>
        {session.exercises.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum exercício — Sprint 3.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {session.exercises.map(se => (
              <div key={se.id} className="px-3 py-2 rounded-md border border-border bg-card text-sm">
                {se.exercise?.name ?? se.exercise_id}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Athletes list */}
      {athletes.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Atletas ({athletes.length})
          </p>
          <div className="flex flex-col gap-2">
            {athletes.map(sa => (
              <div
                key={sa.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-md border border-border bg-card text-sm"
              >
                <span>{sa.athlete?.name ?? '—'}</span>
                <div className="flex items-center gap-2">
                  {sa.pse !== null && (
                    <span className="text-xs text-muted-foreground">PSE {sa.pse}</span>
                  )}
                  <FatigueBadge accumulated={0} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {session.status === 'planejada' && (
        <button
          type="button"
          onClick={handleStart}
          disabled={isPending}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
        >
          {isPending ? 'Iniciando…' : 'Iniciar Sessão'}
        </button>
      )}

      {session.status === 'em_andamento' && (
        <>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="w-full py-3.5 rounded-xl bg-red-600 text-white font-semibold text-sm"
          >
            Encerrar Sessão
          </button>
          <CloseSessionSheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            sessionId={session.id}
            athletes={athletes}
            plannedRpe={plannedLoad}
            suggestedDuration={morpho?.suggestedDurationMin ?? 60}
          />
        </>
      )}

      {session.status === 'encerrada' && athletes.some(sa => sa.pse === null && sa.attended) && (
        <a
          href={`/sessao/${session.id}/pse`}
          className="w-full py-3.5 rounded-xl border border-border bg-card text-sm font-medium text-center block"
        >
          Registrar PSEs pendentes
        </a>
      )}
    </div>
  )
}
