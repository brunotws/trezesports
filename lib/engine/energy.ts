import type { ReadinessStatus } from '@/types'

const MAX_ACUTE_LOAD = 350

// ── Wellness modifier ─────────────────────────────────────────────────────────
// Snake-case to match DailyWellness DB rows and WellnessValues from checkin sheet
export interface WellnessForEnergy {
  fatigue:       number  // 1–5 (5 = ótimo)
  sleep_quality: number
  doms:          number
  mood:          number
}

// Weighted deficit from ideal (5 = perfect). Max deficit = 4.0 → max 50% drain.
const W = { fatigue: 0.30, sleep: 0.30, doms: 0.25, mood: 0.15 } as const

export function computeWellnessModifier(w: WellnessForEnergy | null | undefined): number {
  if (!w) return 1.0
  const deficit =
    W.fatigue * Math.max(0, 5 - w.fatigue) +
    W.sleep   * Math.max(0, 5 - w.sleep_quality) +
    W.doms    * Math.max(0, 5 - w.doms) +
    W.mood    * Math.max(0, 5 - w.mood)
  return Math.max(0.50, 1.0 - (deficit / 4.0) * 0.50)
}

// ── Core computation ──────────────────────────────────────────────────────────

export function computeEnergyPct(
  acuteLoad: number | null,
  wellness?: WellnessForEnergy | null,
): number {
  const base = acuteLoad === null
    ? 100
    : Math.max(0, Math.min(100, Math.round(100 - (acuteLoad / MAX_ACUTE_LOAD) * 100)))
  const mod = computeWellnessModifier(wellness)
  return Math.max(0, Math.min(100, Math.round(base * mod)))
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export type EnergyLevel = 'full' | 'good' | 'moderate' | 'low' | 'critical'

const ENERGY_META: Array<{
  threshold: number
  level:     EnergyLevel
  label:     string
  bar:       string
  text:      string
  border:    string
}> = [
  { threshold: 80, level: 'full',     label: 'Cheio',    bar: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  { threshold: 60, level: 'good',     label: 'Bom',      bar: 'bg-green-500',   text: 'text-green-400',   border: 'border-green-500/30'   },
  { threshold: 40, level: 'moderate', label: 'Moderado', bar: 'bg-yellow-500',  text: 'text-yellow-400',  border: 'border-yellow-500/30'  },
  { threshold: 20, level: 'low',      label: 'Baixo',    bar: 'bg-orange-500',  text: 'text-orange-400',  border: 'border-orange-500/30'  },
  { threshold:  0, level: 'critical', label: 'Crítico',  bar: 'bg-red-500',     text: 'text-red-400',     border: 'border-red-500/30'     },
]

export function getEnergyMeta(pct: number) {
  return ENERGY_META.find(m => pct >= m.threshold) ?? ENERGY_META[ENERGY_META.length - 1]
}

export function energyToReadiness(pct: number): ReadinessStatus {
  if (pct >= 55) return 'green'
  if (pct >= 30) return 'yellow'
  return 'red'
}
