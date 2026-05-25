'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle, AlertCircle, XCircle, Link as LinkIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildMorphocycleContext, SESSION_TYPE_LABELS, SESSION_TYPE_COLORS } from '@/lib/engine/morphocycle'
import { startSessionAction } from '@/lib/actions/sessions'
import CloseSessionSheet from './CloseSessionSheet'
import type { Session, SessionAthlete, SessionExercise, AthleteReadiness } from '@/types'

interface Props {
  session:      Session & { exercises: SessionExercise[] }
  athletes:     SessionAthlete[]
  readinessMap: AthleteReadiness[]
  plannedLoad:  number
}

const STATUS_ICON = {
  green:  <CheckCircle size={14} className="text-green-400 shrink-0" />,
  yellow: <AlertCircle size={14} className="text-yellow-400 shrink-0" />,
  red:    <XCircle    size={14} className="text-red-400 shrink-0" />,
}

const STATUS_BORDER: Record<string, string> = {
  green:  'border-green-500/20',
  yellow: 'border-yellow-500/20',
  red:    'border-red-500/30 bg-red-500/5',
}

const WELLNESS_KEYS = [
  { key: 'fatigue',       short: 'E' },
  { key: 'sleep_quality', short: 'S' },
  { key: 'doms',          short: 'D' },
  { key: 'mood',          short: 'H' },
] as const

function dotColor(v: number) {
  if (v >= 4) return 'bg-green-500'
  if (v === 3) return 'bg-yellow-500'
  return 'bg-red-500'
}

export default function SessionActions({ session, athletes, readinessMap, plannedLoad }: Props) {
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

  // Coletar todas as prescrições de todos os atletas com wellness crítico
  const allPrescriptions = readinessMap.flatMap(r =>
    r.prescriptions.length > 0
      ? r.prescriptions.map(p => ({
          ...p,
          athleteName: athletes.find(a => a.athlete_id === r.athleteId)?.athlete?.name ?? '—',
        }))
      : [],
  )

  const hasAlerts = readinessMap.some(r => r.status === 'red' || r.status === 'yellow')

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-10">

      {/* Session type badge */}
      <div className="flex items-center gap-3">
        <span className={cn('text-xs font-semibold px-2 py-1 rounded border', typeColor)}>
          {typeLabel}
        </span>
        <span className="text-xs text-muted-foreground capitalize">
          {session.status.replace('_', ' ')}
        </span>
      </div>

      {/* Morphocycle card */}
      {morpho && (
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Morfociclo — {typeLabel}
            </span>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>RPE alvo: <b className="text-foreground">{morpho.suggestedRpeTarget}</b></span>
              <span><b className="text-foreground">{morpho.suggestedDurationMin}</b> min</span>
            </div>
          </div>
          <p className="text-sm text-foreground leading-snug">{morpho.suggestedFocus}</p>
        </div>
      )}

      {/* Closed session summary */}
      {session.status === 'encerrada' && (
        <div className="rounded-xl border border-border bg-card p-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">RPE real</p>
            <p className="text-2xl font-bold">{session.actual_rpe ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Duração</p>
            <p className="text-2xl font-bold">
              {session.actual_duration_min ?? '—'}
              <span className="text-sm font-normal text-muted-foreground"> min</span>
            </p>
          </div>
        </div>
      )}

      {/* ═══ READINESS INDIVIDUAL POR ATLETA ═══ */}
      {athletes.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Readiness · {athletes.length} atletas
          </p>

          {/* Alerta coletivo de prescrições */}
          {allPrescriptions.length > 0 && session.status !== 'encerrada' && (
            <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-3 mb-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-orange-400 shrink-0" />
                <span className="text-xs font-semibold text-orange-400">
                  Adaptações prescritas — {allPrescriptions.length} alerta{allPrescriptions.length > 1 ? 's' : ''}
                </span>
              </div>
              {allPrescriptions.map((p, i) => (
                <div key={i} className="flex flex-col gap-0.5 pl-5">
                  <p className="text-[11px] text-orange-300 font-medium">{p.athleteName} · {p.trigger}</p>
                  <p className="text-[11px] text-muted-foreground">
                    <span className="line-through opacity-60">{p.originalExercise}</span>
                    {' → '}{p.replacement}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Lista de atletas com readiness */}
          <div className="flex flex-col gap-2">
            {athletes.map(sa => {
              const r = readinessMap.find(x => x.athleteId === sa.athlete_id)
              const status = r?.status ?? null
              const w = r?.wellness ?? null

              return (
                <div
                  key={sa.id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-card text-sm',
                    status ? STATUS_BORDER[status] : 'border-border',
                  )}
                >
                  {/* Status icon */}
                  <div className="shrink-0">
                    {status ? STATUS_ICON[status] : (
                      <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30" />
                    )}
                  </div>

                  {/* Name */}
                  <span className="flex-1 font-medium truncate">{sa.athlete?.name ?? '—'}</span>

                  {/* Wellness dots */}
                  {w ? (
                    <div className="flex items-center gap-1">
                      {WELLNESS_KEYS.map(({ key, short }) => (
                        <div key={key} className="flex flex-col items-center gap-0.5">
                          <div className={cn('w-2 h-2 rounded-full', dotColor(w[key]))} />
                          <span className="text-[8px] text-muted-foreground/60">{short}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/50 italic">sem wellness</span>
                  )}

                  {/* PSE pós-sessão */}
                  {sa.pse !== null && (
                    <span className="text-xs text-muted-foreground ml-1">
                      PSE <b className="text-foreground">{sa.pse}</b>
                    </span>
                  )}
                  {sa.attended === false && (
                    <span className="text-[10px] text-red-400">Ausente</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Wellness não preenchido: link para preencher */}
          {session.status === 'planejada' && readinessMap.some(r => !r.wellness) && (
            <p className="text-[11px] text-muted-foreground mt-2 pl-1">
              Atletas sem wellness hoje — acesse o perfil de cada atleta para preencher.
            </p>
          )}
        </div>
      )}

      {/* Exercícios */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Exercícios
        </p>
        {session.exercises.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum exercício adicionado.</p>
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

      {/* ═══ BOTÕES DE AÇÃO ═══ */}
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

      {session.status === 'encerrada' && athletes.some(sa => sa.pse === null && sa.attended !== false) && (
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
