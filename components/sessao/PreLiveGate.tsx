'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import WellnessCheckinSheet, { type WellnessValues } from './WellnessCheckinSheet'
import { computeWellnessModifier, getEnergyMeta } from '@/lib/engine/energy'
import type { SessionAthlete, SessionExercise, DailyWellness } from '@/types'

type Status = 'green' | 'yellow' | 'red'

interface Incompatibility {
  athleteName:  string
  exerciseName: string
  reason:       string
}

function computeStatus(v: WellnessValues): Status {
  const vals = [v.fatigue, v.sleep_quality, v.doms, v.mood, v.nutrition_score]
  const avg  = vals.reduce((a, b) => a + b, 0) / vals.length
  return avg > 3.75 ? 'green' : avg >= 2.5 ? 'yellow' : 'red'
}

function computeIncompatibilities(
  athletesDoms: Array<{ name: string; doms: number }>,
  exercises: SessionExercise[],
): Incompatibility[] {
  const result: Incompatibility[] = []
  for (const se of exercises) {
    const ex = se.exercise
    if (!ex) continue
    for (const ath of athletesDoms) {
      if (ex.is_eccentric && ath.doms <= 2) {
        result.push({
          athleteName:  ath.name,
          exerciseName: ex.name,
          reason:       `DOMS severa (${ath.doms}/5) + exercício excêntrico`,
        })
      } else if (ex.contraindicated_doms_below !== null && ath.doms < ex.contraindicated_doms_below) {
        result.push({
          athleteName:  ath.name,
          exerciseName: ex.name,
          reason:       `DOMS ${ath.doms}/5 abaixo do limiar mínimo (${ex.contraindicated_doms_below})`,
        })
      }
    }
  }
  return result
}

const STATUS_STYLE: Record<Status, { dot: string; badge: string; label: string }> = {
  green:  { dot: 'bg-green-500',  badge: 'border-green-500/30 bg-green-500/5 text-green-400',   label: 'VERDE'    },
  yellow: { dot: 'bg-yellow-500', badge: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400', label: 'AMARELO' },
  red:    { dot: 'bg-red-500',    badge: 'border-red-500/30 bg-red-500/5 text-red-400',           label: 'VERMELHO' },
}

interface Props {
  sessionId:      string
  athletes:       SessionAthlete[]
  exercises:      SessionExercise[]
  wellnessMap:    Record<string, DailyWellness | null>
  baseEnergyMap?: Record<string, number>
  onCancel:       () => void
}

export default function PreLiveGate({ sessionId, athletes, exercises, wellnessMap, baseEnergyMap, onCancel }: Props) {
  const router = useRouter()

  const [wellnessValues, setWellnessValues] = useState<Record<string, WellnessValues>>(() => {
    const init: Record<string, WellnessValues> = {}
    for (const sa of athletes) {
      const w = wellnessMap[sa.athlete_id]
      if (w) init[sa.athlete_id] = {
        fatigue:         w.fatigue,
        sleep_quality:   w.sleep_quality,
        doms:            w.doms,
        mood:            w.mood,
        nutrition_score: w.nutrition_score ?? 3,
      }
    }
    return init
  })

  const [step, setStep]                         = useState<'checkin' | 'summary'>('checkin')
  const [currentCheckinId, setCurrentCheckinId] = useState<string | null>(null)

  function effectiveEnergy(athleteId: string): number | null {
    const base = baseEnergyMap?.[athleteId]
    if (base === undefined) return null
    const w = wellnessValues[athleteId]
    if (!w) return base
    return Math.round(base * computeWellnessModifier(w))
  }

  const athletesWithStatus = athletes.map(sa => ({
    athleteId: sa.athlete_id,
    name:      sa.athlete?.name ?? '—',
    status:    wellnessValues[sa.athlete_id] ? computeStatus(wellnessValues[sa.athlete_id]) : null,
    doms:      wellnessValues[sa.athlete_id]?.doms ?? null,
  }))

  const pendingCount  = athletesWithStatus.filter(a => !a.status).length
  const alertAthletes = athletesWithStatus.filter(a => a.status === 'yellow' || a.status === 'red')

  const incompatibilities = step === 'summary'
    ? computeIncompatibilities(
        athletesWithStatus.filter(a => a.doms !== null).map(a => ({ name: a.name, doms: a.doms! })),
        exercises,
      )
    : []

  const hasAlert = incompatibilities.length > 0 || alertAthletes.length > 0
  const checkinAthlete = athletes.find(sa => sa.athlete_id === currentCheckinId)

  // ── SUMMARY ─────────────────────────────────────────────────────────────
  if (step === 'summary') {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-y-auto px-4 pt-10 pb-10">
        <div className="flex items-center gap-3 mb-6">
          <button type="button" onClick={() => setStep('checkin')} className="text-xs text-muted-foreground border border-border rounded-md px-3 py-1.5">
            ← Voltar
          </button>
          <h2 className="text-base font-bold">Pré-Treino · Resumo</h2>
        </div>

        {incompatibilities.length > 0 && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 mb-4 flex flex-col gap-2">
            <span className="text-sm font-bold text-red-400">
              🚨 {incompatibilities.length} incompatibilidade{incompatibilities.length > 1 ? 's' : ''} detectada{incompatibilities.length > 1 ? 's' : ''}
            </span>
            {incompatibilities.map((inc, i) => (
              <div key={i} className="pl-2 flex flex-col gap-0.5">
                <p className="text-xs text-red-300 font-medium">{inc.athleteName} × {inc.exerciseName}</p>
                <p className="text-[11px] text-muted-foreground">{inc.reason}</p>
              </div>
            ))}
          </div>
        )}

        {alertAthletes.length > 0 && (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 mb-4 flex flex-col gap-2">
            <span className="text-sm font-semibold text-yellow-400">
              ⚠ {alertAthletes.length} atleta{alertAthletes.length > 1 ? 's' : ''} em alerta — regressões destacadas no Live
            </span>
            {alertAthletes.map(a => (
              <div key={a.athleteId} className="flex items-center justify-between pl-2">
                <span className="text-xs text-foreground">{a.name}</span>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded border', STATUS_STYLE[a.status as Status].badge)}>
                  {STATUS_STYLE[a.status as Status].label}
                </span>
              </div>
            ))}
          </div>
        )}

        {!hasAlert && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 mb-4">
            <p className="text-sm text-green-400 font-semibold">✅ Todos em boa readiness — carga total liberada.</p>
          </div>
        )}

        <div className="flex flex-col gap-2 mb-6">
          {athletesWithStatus.map(a => {
            const energy = effectiveEnergy(a.athleteId)
            const eMeta  = energy !== null ? getEnergyMeta(energy) : null
            return (
              <div key={a.athleteId} className="flex flex-col gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{a.name}</span>
                  {a.status ? (
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded border', STATUS_STYLE[a.status].badge)}>
                      {STATUS_STYLE[a.status].label}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">sem check-in</span>
                  )}
                </div>
                {eMeta && energy !== null && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${eMeta.bar}`} style={{ width: `${energy}%` }} />
                    </div>
                    <span className={`text-[10px] font-semibold tabular-nums shrink-0 ${eMeta.text}`}>
                      ⚡{energy}%
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => router.push(`/sessao/${sessionId}/live`)}
          className={cn(
            'w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] shadow-lg',
            hasAlert
              ? 'bg-orange-600 text-white shadow-orange-900/30'
              : 'bg-primary text-primary-foreground shadow-primary/20',
          )}
        >
          {hasAlert ? '⚠ Entrar no Live com alertas' : '🎯 Entrar no Live'}
        </button>
      </div>
    )
  }

  // ── CHECK-IN ─────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-y-auto px-4 pt-10 pb-10">
      <div className="flex items-center gap-3 mb-2">
        <button type="button" onClick={onCancel} className="text-xs text-muted-foreground border border-border rounded-md px-3 py-1.5">
          ← Cancelar
        </button>
        <h2 className="text-base font-bold">Check-in Pré-Treino</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-5">
        Registre o wellness de cada atleta antes de iniciar. Atletas com check-in hoje já aparecem confirmados.
      </p>

      <div className="flex flex-col gap-2 mb-6">
        {athletes.map(sa => {
          const vals   = wellnessValues[sa.athlete_id]
          const status = vals ? computeStatus(vals) : null
          const flags: string[] = []
          if (vals && vals.doms <= 2)          flags.push('DOMS')
          if (vals && vals.fatigue <= 2)       flags.push('Fadiga')
          if (vals && vals.sleep_quality <= 2) flags.push('Sono')
          const energy = effectiveEnergy(sa.athlete_id)
          const eMeta  = energy !== null ? getEnergyMeta(energy) : null

          return (
            <div
              key={sa.id}
              className={cn(
                'flex items-center justify-between px-3 py-3 rounded-xl border bg-card',
                status === 'green'  ? 'border-green-500/20'  :
                status === 'yellow' ? 'border-yellow-500/20' :
                status === 'red'    ? 'border-red-500/30'    : 'border-border',
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  'w-2.5 h-2.5 rounded-full shrink-0',
                  status ? STATUS_STYLE[status].dot : 'border border-muted-foreground/40',
                )} />
                <div>
                  <span className="text-sm font-medium">{sa.athlete?.name ?? '—'}</span>
                  {flags.length > 0 && (
                    <p className="text-[10px] text-orange-400 leading-none mt-0.5">{flags.join(' · ')}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {eMeta && energy !== null && (
                  <span className={`text-[10px] font-bold tabular-nums ${eMeta.text}`}>
                    ⚡{energy}%
                  </span>
                )}
                {status ? (
                  <button
                    type="button"
                    onClick={() => setCurrentCheckinId(sa.athlete_id)}
                    className="text-[10px] text-primary/70 underline"
                  >
                    Editar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentCheckinId(sa.athlete_id)}
                    className="text-[10px] font-semibold px-2.5 py-1.5 rounded-full border border-primary/30 text-primary bg-primary/10"
                  >
                    Check-in
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => setStep('summary')}
        className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-sm transition-all active:scale-[0.98]"
      >
        Ver Resumo →
      </button>
      {pendingCount > 0 && (
        <p className="text-[11px] text-muted-foreground text-center mt-2">
          {pendingCount} atleta{pendingCount > 1 ? 's' : ''} sem check-in — você pode continuar assim mesmo
        </p>
      )}

      {currentCheckinId && checkinAthlete && (
        <WellnessCheckinSheet
          open
          onOpenChange={open => { if (!open) setCurrentCheckinId(null) }}
          athleteId={currentCheckinId}
          athleteName={checkinAthlete.athlete?.name ?? '—'}
          initialValues={wellnessValues[currentCheckinId]}
          onSaved={values => {
            setWellnessValues(prev => ({ ...prev, [currentCheckinId]: values }))
            setCurrentCheckinId(null)
          }}
        />
      )}
    </div>
  )
}
