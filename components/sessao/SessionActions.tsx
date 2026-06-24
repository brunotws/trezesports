'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildMorphocycleContext, SESSION_TYPE_LABELS, SESSION_TYPE_COLORS } from '@/lib/engine/morphocycle'
import { buildPrescriptionAdaptations } from '@/lib/engine/prescriptions'
import { startSessionAction, updateSessionLogsAction } from '@/lib/actions/sessions'
import CloseSessionSheet from './CloseSessionSheet'
import WellnessCheckinSheet, { type WellnessValues } from './WellnessCheckinSheet'
import type { Session, SessionAthlete, SessionExercise, AthleteReadiness, BlockType, DailyWellness, PrescriptionAdaptation } from '@/types'

const BLOCKS: BlockType[] = ['Aquecimento', 'Parte Analítica', 'Jogo Condicionado']

const BLOCK_LABEL_COLORS: Record<string, string> = {
  'Aquecimento':       'text-orange-400',
  'Parte Analítica':   'text-blue-400',
  'Jogo Condicionado': 'text-green-400',
}

interface Props {
  session:      Session & { exercises: SessionExercise[] }
  athletes:     SessionAthlete[]
  readinessMap: AthleteReadiness[]
  plannedLoad:  number
  wellnessMap:  Record<string, DailyWellness | null>
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
  { key: 'fatigue',          short: 'E' },
  { key: 'sleep_quality',    short: 'S' },
  { key: 'doms',             short: 'D' },
  { key: 'mood',             short: 'H' },
  { key: 'nutrition_score',  short: 'N' },
] as const

function CalibrationBar({ label, value, max, color }: { label: string; value: number | null; max: number; color: string }) {
  if (value === null) return null
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground shrink-0" style={{ width: '5rem' }}>{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold w-6 text-right tabular-nums">
        {value % 1 === 0 ? value : value.toFixed(1)}
      </span>
    </div>
  )
}

function dotColor(v: number) {
  if (v >= 4) return 'bg-green-500'
  if (v === 3) return 'bg-yellow-500'
  return 'bg-red-500'
}

export default function SessionActions({ session, athletes, readinessMap, plannedLoad, wellnessMap }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [sheetOpen, setSheetOpen] = useState(false)

  // Diário de bordo
  const [notes, setNotes]         = useState(session.coach_notes ?? '')
  const [intensity, setIntensity] = useState<number | null>(session.team_intensity ?? null)
  const [savingLog, setSavingLog] = useState(false)

  // Check-in de wellness
  const [checkinAthleteId,   setCheckinAthleteId]   = useState<string | null>(null)
  const [checkinAthleteName, setCheckinAthleteName] = useState('')
  // Overrides pós check-in: atualização instantânea da UI sem esperar router.refresh()
  const [readinessOverrides, setReadinessOverrides] = useState<
    Record<string, { status: 'green' | 'yellow' | 'red'; prescriptions: PrescriptionAdaptation[] }>
  >({})
  const [checkedInIds, setCheckedInIds] = useState<Set<string>>(new Set())

  const morpho = session.status !== 'encerrada'
    ? buildMorphocycleContext(session.session_type, 'green')
    : null

  function handleStart() {
    startTransition(async () => {
      await startSessionAction(session.id)
      router.refresh()
    })
  }

  function handleCheckinSaved(athleteId: string, values: WellnessValues) {
    const prescriptions = buildPrescriptionAdaptations({
      fatigue:        values.fatigue,
      sleepQuality:   values.sleep_quality,
      doms:           values.doms,
      mood:           values.mood,
      nutritionScore: values.nutrition_score,
    })
    const metrics = [values.fatigue, values.sleep_quality, values.doms, values.mood, values.nutrition_score].filter((v): v is number => v != null)
    const avg = metrics.reduce((a, b) => a + b, 0) / metrics.length
    const status: 'green' | 'yellow' | 'red' = avg > 3.75 ? 'green' : avg >= 2.5 ? 'yellow' : 'red'
    setReadinessOverrides(prev => ({ ...prev, [athleteId]: { status, prescriptions } }))
    setCheckedInIds(prev => new Set(prev).add(athleteId))
    router.refresh()
  }

  async function handleSaveLog() {
    setSavingLog(true)
    await updateSessionLogsAction(session.id, {
      coach_notes:    notes.trim() || null,
      team_intensity: intensity,
    })
    setSavingLog(false)
    router.refresh()
  }

  const typeColor = SESSION_TYPE_COLORS[session.session_type]
  const typeLabel = SESSION_TYPE_LABELS[session.session_type]

  // Calibragem de Carga (only for encerrada sessions)
  const calibration = session.status === 'encerrada' ? (() => {
    const attending  = athletes.filter(sa => sa.attended !== false)
    const pseNums    = attending.map(sa => sa.pse).filter((p): p is number => p !== null)
    const avgPse     = pseNums.length > 0 ? pseNums.reduce((a, b) => a + b, 0) / pseNums.length : null
    const srpeNums   = attending.map(sa => sa.individual_srpe).filter((s): s is number => s !== null)
    const avgSrpe    = srpeNums.length > 0 ? srpeNums.reduce((a, b) => a + b, 0) / srpeNums.length : null
    const rpeCoach   = session.actual_rpe
    const diff       = avgPse !== null && rpeCoach !== null ? rpeCoach - avgPse : null
    const calibrated = diff !== null && Math.abs(diff) < 1
    return { avgPse, avgSrpe, rpeCoach, diff, calibrated, hasPse: pseNums.length > 0 }
  })() : null

  const allPrescriptions = [
    ...readinessMap.flatMap(r =>
      r.prescriptions.length > 0 && !readinessOverrides[r.athleteId]
        ? r.prescriptions.map(p => ({
            ...p,
            athleteName: athletes.find(a => a.athlete_id === r.athleteId)?.athlete?.name ?? '—',
          }))
        : [],
    ),
    ...Object.entries(readinessOverrides).flatMap(([athleteId, override]) =>
      override.prescriptions.map(p => ({
        ...p,
        athleteName: athletes.find(a => a.athlete_id === athleteId)?.athlete?.name ?? '—',
      })),
    ),
  ]

  // Dynamic stages (new) vs. legacy fixed blocks
  const dynamicStages = session.stages ?? []
  const useDynamic = dynamicStages.length > 0

  // Group exercises by block_type / stage name
  const exercisesByStage = session.exercises.reduce<Record<string, SessionExercise[]>>((acc, ex) => {
    const key = ex.block_type ?? '__ungrouped'
    acc[key] = [...(acc[key] ?? []), ex]
    return acc
  }, {})

  // Legacy: exercises that don't belong to any known stage
  const legacyBlocks = BLOCKS.reduce<Record<string, SessionExercise[]>>((acc, block) => {
    acc[block] = session.exercises.filter(e => e.block_type === block)
    return acc
  }, {})
  const unblocked = session.exercises.filter(e => !e.block_type || e.block_type === 'Geral')

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-10">

      {/* Session type badge */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={cn('text-xs font-semibold px-2 py-1 rounded border', typeColor)}>
          {typeLabel}
        </span>
        {session.scheduled_time && (
          <span className="text-xs text-muted-foreground">{session.scheduled_time}</span>
        )}
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

      {/* ═══ CALIBRAGEM DE CARGA ═══ */}
      {session.status === 'encerrada' && calibration && (
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Calibragem de Carga
            </p>
            {calibration.calibrated && (
              <span className="text-[10px] text-green-400 font-semibold">✓ Calibrado</span>
            )}
          </div>
          <div className="flex flex-col gap-2.5">
            <CalibrationBar
              label="Planejado"
              value={plannedLoad > 0 ? Math.min(plannedLoad, 10) : null}
              max={10}
              color="bg-muted-foreground/50"
            />
            <CalibrationBar
              label="RPE Coach"
              value={calibration.rpeCoach}
              max={10}
              color="bg-primary/80"
            />
            <CalibrationBar
              label="PSE Médio"
              value={calibration.avgPse}
              max={10}
              color={
                calibration.diff === null            ? 'bg-green-500' :
                Math.abs(calibration.diff) >= 2      ? 'bg-orange-500' :
                Math.abs(calibration.diff) >= 1      ? 'bg-yellow-500' :
                'bg-green-500'
              }
            />
          </div>
          {calibration.avgSrpe !== null && (
            <p className="text-[11px] text-muted-foreground">
              sRPE médio: <b className="text-foreground">{Math.round(calibration.avgSrpe)} UA</b>
              <span className="ml-1 opacity-60">(PSE × duração × superfície)</span>
            </p>
          )}
          {!calibration.hasPse && (
            <p className="text-[11px] text-muted-foreground">
              PSE não coletado — registre o PSE de cada atleta para ver a calibragem.
            </p>
          )}
          {calibration.diff !== null && Math.abs(calibration.diff) >= 1 && (
            <p className="text-[11px] text-orange-400">
              {calibration.diff > 0
                ? `Atletas sentiram menos esforço (−${Math.abs(calibration.diff).toFixed(1)}) — sessão pode ter sido menos exigente que o estimado.`
                : `Atletas sentiram mais esforço (+${Math.abs(calibration.diff).toFixed(1)}) — carga real acima da percepção do treinador.`
              }
            </p>
          )}
        </div>
      )}

      {/* ═══ READINESS INDIVIDUAL ═══ */}
      {athletes.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Readiness · {athletes.length} atletas
          </p>

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

          <div className="flex flex-col gap-2">
            {athletes.map(sa => {
              const r        = readinessMap.find(x => x.athleteId === sa.athlete_id)
              const override = readinessOverrides[sa.athlete_id]
              const status   = override?.status ?? r?.status ?? null
              const w        = !override ? (r?.wellness ?? null) : null
              const hasCheckedIn = checkedInIds.has(sa.athlete_id) || !!wellnessMap[sa.athlete_id]

              return (
                <div
                  key={sa.id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-card text-sm',
                    status ? STATUS_BORDER[status] : 'border-border',
                  )}
                >
                  <div className="shrink-0">
                    {status ? STATUS_ICON[status] : (
                      <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30" />
                    )}
                  </div>
                  <span className="flex-1 font-medium truncate">{sa.athlete?.name ?? '—'}</span>
                  {w ? (
                    <div className="flex items-center gap-1">
                      {WELLNESS_KEYS.map(({ key, short }) => {
                        const val = w[key as keyof typeof w] as number | null | undefined
                        if (val == null) return null
                        return (
                          <div key={key} className="flex flex-col items-center gap-0.5">
                            <div className={cn('w-2 h-2 rounded-full', dotColor(val))} />
                            <span className="text-[8px] text-muted-foreground/60">{short}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : !hasCheckedIn ? (
                    <span className="text-[10px] text-muted-foreground/50 italic">sem wellness</span>
                  ) : null}
                  {sa.pse !== null && (
                    <span className="text-xs text-muted-foreground ml-1">
                      PSE <b className="text-foreground">{sa.pse}</b>
                    </span>
                  )}
                  {sa.attended === false && (
                    <span className="text-[10px] text-red-400">Ausente</span>
                  )}
                  {/* Check-in button */}
                  {session.status !== 'encerrada' && !hasCheckedIn && (
                    <button
                      type="button"
                      onClick={() => {
                        setCheckinAthleteId(sa.athlete_id)
                        setCheckinAthleteName(sa.athlete?.name ?? '—')
                      }}
                      className="text-[10px] font-semibold px-2 py-1 rounded-full border border-primary/30 text-primary bg-primary/10 hover:bg-primary/20 transition-colors shrink-0"
                    >
                      Check-in
                    </button>
                  )}
                  {session.status !== 'encerrada' && hasCheckedIn && (
                    <span className="text-[10px] text-green-400 shrink-0">✓</span>
                  )}
                </div>
              )
            })}
          </div>

          {session.status === 'planejada' && readinessMap.some(r => !r.wellness) && (
            <p className="text-[11px] text-muted-foreground mt-2 pl-1">
              Atletas sem wellness hoje — acesse o perfil de cada atleta para preencher.
            </p>
          )}
        </div>
      )}

      {/* ═══ EXERCÍCIOS ═══ */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Exercícios
        </p>
        {session.exercises.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum exercício adicionado.</p>
        ) : useDynamic ? (
          /* Dynamic stages layout */
          <div className="flex flex-col gap-3">
            {dynamicStages.map(stage => {
              const exs = (exercisesByStage[stage.name] ?? []).sort((a, b) => a.position - b.position)
              if (exs.length === 0) return null
              const stageDur = exs.reduce((s, e) => s + (e.exercise?.duration_min ?? 0), 0)
              return (
                <div key={stage.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      {stage.name}
                    </p>
                    {stageDur > 0 && (
                      <span className="text-[10px] text-muted-foreground">{stageDur} min</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {exs.map((se, i) => (
                      <div key={se.id} className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-card">
                        <span className="text-[10px] text-muted-foreground w-4 shrink-0">{i + 1}</span>
                        {se.exercise?.diagram_url && (
                          <img src={se.exercise.diagram_url} alt="" className="w-7 h-7 rounded object-cover shrink-0" />
                        )}
                        <span className="text-xs flex-1 truncate">{se.exercise?.name ?? se.exercise_id}</span>
                        {se.exercise?.duration_min && (
                          <span className="text-[10px] text-muted-foreground shrink-0">{se.exercise.duration_min}m</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Legacy fixed-block layout */
          <div className="flex flex-col gap-3">
            {BLOCKS.map(block => {
              const exs = legacyBlocks[block]
              if (exs.length === 0) return null
              return (
                <div key={block}>
                  <p className={cn('text-[11px] font-semibold mb-1.5', BLOCK_LABEL_COLORS[block] ?? 'text-muted-foreground')}>
                    {block}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {exs.map((se, i) => (
                      <div key={se.id} className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-card text-sm">
                        <span className="text-[10px] text-muted-foreground w-4">{i + 1}</span>
                        <span className="flex-1 truncate">{se.exercise?.name ?? se.exercise_id}</span>
                        {se.exercise?.duration_min && (
                          <span className="text-[10px] text-muted-foreground">{se.exercise.duration_min} min</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {unblocked.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {unblocked.map(se => (
                  <div key={se.id} className="px-3 py-2 rounded-md border border-border bg-card text-sm">
                    {se.exercise?.name ?? se.exercise_id}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ DIÁRIO DE BORDO ═══ */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Diário de Bordo
        </p>

        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Anotações e ajustes…"
          rows={3}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
        />

        <div>
          <p className="text-[10px] text-muted-foreground mb-2">Percepção de intensidade da turma</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setIntensity(intensity === n ? null : n)}
                className={cn(
                  'flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all',
                  intensity === n
                    ? 'border-primary/50 bg-primary/15 text-primary'
                    : 'border-border text-muted-foreground',
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveLog}
          disabled={savingLog}
          className="w-full py-2 rounded-lg border border-border bg-muted text-xs font-medium disabled:opacity-50"
        >
          {savingLog ? 'Salvando…' : 'Salvar anotações'}
        </button>
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

      {/* Wellness check-in sheet */}
      {checkinAthleteId && (
        <WellnessCheckinSheet
          open={!!checkinAthleteId}
          onOpenChange={open => { if (!open) setCheckinAthleteId(null) }}
          athleteId={checkinAthleteId}
          athleteName={checkinAthleteName}
          initialValues={wellnessMap[checkinAthleteId]
            ? {
                fatigue:          wellnessMap[checkinAthleteId]!.fatigue,
                sleep_quality:    wellnessMap[checkinAthleteId]!.sleep_quality,
                doms:             wellnessMap[checkinAthleteId]!.doms,
                mood:             wellnessMap[checkinAthleteId]!.mood,
                nutrition_score:  wellnessMap[checkinAthleteId]!.nutrition_score ?? undefined,
              }
            : undefined
          }
          onSaved={values => handleCheckinSaved(checkinAthleteId, values)}
        />
      )}
    </div>
  )
}
