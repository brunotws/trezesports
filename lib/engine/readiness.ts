import type {
  WellnessInput, ReadinessResult, ReadinessStatus, SessionType, ModalityType,
} from '@/types'
import {
  padTo28, computeAcuteLoad, computeChronicLoad,
  computeACWR, computeMonotony, computeStrain, computeWeeklyTotal,
} from './acwr'
import { buildPrescriptionAdaptations } from './prescriptions'
import { buildMorphocycleContext } from './morphocycle'
import { computeEnergyPct, energyToReadiness } from './energy'

// ─── Thresholds ─────────────────────────────────────────────
const ACWR_GREEN_MIN  = 0.8
const ACWR_GREEN_MAX  = 1.3
const ACWR_YELLOW_MAX = 1.49
const WELLNESS_GREEN  = 15
const WELLNESS_YELLOW = 10
const HIGH_MONOTONY   = 2.0

// ─── Validation ─────────────────────────────────────────────

export function validateRPE(rpe: number): void {
  if (!Number.isInteger(rpe) || rpe < 0 || rpe > 10) {
    throw new Error(`RPE inválido: "${rpe}". Escala CR-10 aceita inteiros de 0 a 10.`)
  }
}

export function validateWellness(w: WellnessInput): void {
  const fields = ['fatigue', 'sleepQuality', 'doms', 'mood'] as const
  for (const field of fields) {
    const val = w[field]
    if (!Number.isInteger(val) || val < 1 || val > 5) {
      throw new Error(`Wellness inválido para "${field}": ${val}. Aceita inteiros de 1 a 5.`)
    }
  }
}

// ─── Status evaluation ──────────────────────────────────────

function evalWellnessStatus(total: number): ReadinessStatus {
  if (total > WELLNESS_GREEN)  return 'green'
  if (total >= WELLNESS_YELLOW) return 'yellow'
  return 'red'
}

function evalACWRStatus(acwr: number | null): ReadinessStatus {
  if (acwr === null) return 'green'  // no baseline → no penalty
  if (acwr >= ACWR_GREEN_MIN && acwr <= ACWR_GREEN_MAX) return 'green'
  if (acwr > ACWR_GREEN_MAX && acwr <= ACWR_YELLOW_MAX) return 'yellow'
  if (acwr < ACWR_GREEN_MIN) return 'yellow'  // undertrained is also risky
  return 'red'  // ≥ 1.5
}

function worstOf(a: ReadinessStatus, b: ReadinessStatus): ReadinessStatus {
  if (a === 'red'    || b === 'red')    return 'red'
  if (a === 'yellow' || b === 'yellow') return 'yellow'
  return 'green'
}

// ─── Recommendations ────────────────────────────────────────

function buildRecommendations(params: {
  status:        ReadinessStatus
  acwr:          number | null
  wellnessTotal: number
  monotony:      number | null
  modality:      ModalityType
  wellness:      WellnessInput
}): string[] {
  const { status, acwr, monotony, modality, wellness } = params
  const recs: string[] = []

  if (status === 'green') {
    recs.push('✅ VERDE — Carga total liberada.')
  } else if (status === 'yellow') {
    recs.push('⚠️ AMARELO — Reduzir volume em 25%. Monitorar sinais de fadiga intra-sessão.')
    recs.push('→ Se RPE pós-sessão > 7: antecipar dia de recuperação amanhã.')
  } else {
    recs.push('🛑 VERMELHO — Treino bloqueado. Recuperação passiva obrigatória.')
    recs.push('→ Protocolo: 8–9h de sono, hidratação ≥ 35 ml/kg, crioterapia se DOMS crítica.')
  }

  if (acwr !== null) {
    if (acwr >= 1.5) {
      recs.push(`⚡ ACWR crítico (${acwr.toFixed(2)}) — carga aguda 50%+ acima da crônica. Risco de overuse.`)
    } else if (acwr < ACWR_GREEN_MIN) {
      recs.push(`📉 ACWR baixo (${acwr.toFixed(2)}) — atleta relativo à baseline. Progressão gradual (≤10%/semana).`)
    }
  }

  if (monotony !== null && monotony > HIGH_MONOTONY) {
    recs.push(`🔄 Monotonia alta (${monotony.toFixed(1)}) — variar tipos de sessão para prevenir sobretreinamento.`)
  }

  if (modality === 'futsal' && wellness.doms <= 3) {
    recs.push('🦵 Futsal — incluir Copenhagen Plank no aquecimento (84% das lesões = entorses de tornozelo).')
  }

  return recs
}

// ─── Main function ───────────────────────────────────────────

export interface ReadinessInput {
  last28DaysSrpe:     number[]      // 0 for rest days, ordered oldest→newest
  todayWellness:      WellnessInput
  plannedSessionType?: SessionType
  modality:           ModalityType
}

export function calculateReadinessScore(input: ReadinessInput): ReadinessResult {
  const { last28DaysSrpe, todayWellness, plannedSessionType, modality } = input

  validateWellness(todayWellness)
  if (last28DaysSrpe.length < 7) {
    throw new Error('São necessários pelo menos 7 dias de histórico.')
  }

  const padded = padTo28(last28DaysSrpe)
  padded.forEach(v => { if (v < 0) throw new Error(`sRPE negativo detectado: ${v}`) })

  const acuteLoad   = computeAcuteLoad(padded)
  const chronicLoad = computeChronicLoad(padded)
  const acwr        = computeACWR(acuteLoad, chronicLoad)
  const monotony    = computeMonotony(padded)
  const weeklyTotal = computeWeeklyTotal(padded)
  const strain      = computeStrain(weeklyTotal, monotony)

  const wellnessTotal  = todayWellness.fatigue + todayWellness.sleepQuality
                       + todayWellness.doms    + todayWellness.mood
  const wellnessStatus = evalWellnessStatus(wellnessTotal)
  const acwrStatus     = evalACWRStatus(acwr)
  const energyPct      = computeEnergyPct(acuteLoad)
  const energyStatus   = energyToReadiness(energyPct)
  const status         = worstOf(worstOf(acwrStatus, wellnessStatus), energyStatus)

  const volumeAdjustmentFactor = status === 'green' ? 1.0 : status === 'yellow' ? 0.75 : 0.0

  const prescriptionAdaptations = status === 'red'
    ? [{
        trigger:          'Status VERMELHO',
        originalExercise: 'Sessão planejada',
        replacement:      'Recuperação passiva — 15 min foam rolling + hidratação',
        reason:           'Risco extremo. Qualquer carga produtiva é impossível.',
      }]
    : buildPrescriptionAdaptations(todayWellness)

  const recommendations = buildRecommendations({
    status, acwr, wellnessTotal, monotony, modality, wellness: todayWellness,
  })

  const morphocycleContext = plannedSessionType
    ? buildMorphocycleContext(plannedSessionType, status)
    : null

  return {
    status,
    acwr,
    acwrStatus,
    acuteLoad:  parseFloat(acuteLoad.toFixed(2)),
    chronicLoad: parseFloat(chronicLoad.toFixed(2)),
    wellnessTotal,
    wellnessStatus,
    monotony,
    strain,
    volumeAdjustmentFactor,
    energyPct,
    energyStatus,
    recommendations,
    prescriptionAdaptations,
    morphocycleContext,
  }
}
