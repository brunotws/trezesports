import type { SessionType, MorphocycleContext, ReadinessStatus } from '@/types'

interface MorphocycleConfig {
  daysToMatch:  number | null
  focus:        string
  rpeTarget:    number
  durationMin:  number
}

const CONFIG: Record<SessionType, MorphocycleConfig> = {
  'MD+1': { daysToMatch: null, focus: 'Recuperação ativa — mobilidade, foam rolling, piscina',      rpeTarget: 3, durationMin: 30 },
  'MD+2': { daysToMatch: null, focus: 'Força máxima — levantamentos compostos, baixo volume',        rpeTarget: 6, durationMin: 60 },
  'MD-4': { daysToMatch: 4,   focus: 'Alta intensidade — sprints, posse com pressão',               rpeTarget: 8, durationMin: 90 },
  'MD-3': { daysToMatch: 3,   focus: 'Volume técnico-tático — organização, espaços, transições',     rpeTarget: 7, durationMin: 85 },
  'MD-2': { daysToMatch: 2,   focus: 'Moderado — técnica individual, finalização, bolas paradas',   rpeTarget: 6, durationMin: 70 },
  'MD-1': { daysToMatch: 1,   focus: 'Ativação — velocidade, potência, esquemas de bola parada',    rpeTarget: 4, durationMin: 45 },
  'MD':   { daysToMatch: 0,   focus: 'Jogo oficial',                                                 rpeTarget: 9, durationMin: 90 },
  'free': { daysToMatch: null, focus: 'Livre — calibrar pela leitura de readiness do dia',           rpeTarget: 6, durationMin: 60 },
}

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  'MD+1': 'MD+1', 'MD+2': 'MD+2', 'MD-4': 'MD-4',
  'MD-3': 'MD-3', 'MD-2': 'MD-2', 'MD-1': 'MD-1',
  'MD':   'MD',   'free': 'Livre',
}

export const SESSION_TYPE_COLORS: Record<SessionType, string> = {
  'MD+1': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'MD+2': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'MD-4': 'bg-red-500/20 text-red-400 border-red-500/30',
  'MD-3': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'MD-2': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'MD-1': 'bg-green-500/20 text-green-400 border-green-500/30',
  'MD':   'bg-red-600/30 text-red-400 border-red-600/40',
  'free': 'bg-muted text-muted-foreground border-border',
}

export function buildMorphocycleContext(
  sessionType: SessionType,
  status: ReadinessStatus,
): MorphocycleContext {
  const cfg = CONFIG[sessionType]
  let rpe      = cfg.rpeTarget
  let duration = cfg.durationMin
  let focus    = cfg.focus

  if (status === 'yellow') {
    rpe      = Math.max(1, rpe - 1)
    duration = Math.round(duration * 0.75)
  } else if (status === 'red') {
    rpe      = 2
    duration = 20
    focus    = 'RECUPERAÇÃO PASSIVA — suspender sessão planejada'
  }

  return {
    sessionType,
    daysToMatch:          cfg.daysToMatch,
    suggestedFocus:       focus,
    suggestedRpeTarget:   rpe,
    suggestedDurationMin: duration,
  }
}
