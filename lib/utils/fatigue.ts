export const FATIGUE_THRESHOLDS = {
  low: 5,
  moderate: 10,
  high: 15,
} as const

export type FatigueLevel = 'low' | 'moderate' | 'high' | 'critical'

export function getFatigueLevel(accumulated: number): FatigueLevel {
  if (accumulated <= FATIGUE_THRESHOLDS.low) return 'low'
  if (accumulated <= FATIGUE_THRESHOLDS.moderate) return 'moderate'
  if (accumulated <= FATIGUE_THRESHOLDS.high) return 'high'
  return 'critical'
}

export const FATIGUE_LABELS: Record<FatigueLevel, string> = {
  low: 'Leve',
  moderate: 'Moderado',
  high: 'Alto',
  critical: 'Crítico',
}

export const FATIGUE_COLORS: Record<FatigueLevel, string> = {
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
  moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
}
