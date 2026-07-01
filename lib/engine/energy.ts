import type { ReadinessStatus } from '@/types'

// Carga aguda (7-day average sRPE) que representa 100% de esgotamento
// Referência: RPE 8 × 90min × 5 sessões/semana = 3600 AU/semana → 514/dia
// Threshold conservador para alertar antes do limite absoluto
const MAX_ACUTE_LOAD = 350

export function computeEnergyPct(acuteLoad: number | null): number {
  if (acuteLoad === null) return 100
  return Math.max(0, Math.min(100, Math.round(100 - (acuteLoad / MAX_ACUTE_LOAD) * 100)))
}

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
