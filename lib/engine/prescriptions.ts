import type { WellnessInput, PrescriptionAdaptation } from '@/types'

interface AdaptationRule {
  condition:        (w: WellnessInput) => boolean
  trigger:          string
  originalExercise: string
  replacement:      string
  reason:           string
}

// Priority order matters: DOMS > Fadiga > Sono > Humor
const RULES: AdaptationRule[] = [
  {
    condition: w => w.doms <= 2,
    trigger:          'DOMS ≤ 2 — dor muscular severa',
    originalExercise: 'Nordic Hamstring Curl (excêntrico)',
    replacement:      'Isometria de Isquiotibiais a 30° — 3×45s',
    reason:           'Microlesões ativas + excêntrico = dano miofibrilar adicional. Isometria mantém ativação sem sobrecarga tecidual.',
  },
  {
    condition: w => w.doms <= 2,
    trigger:          'DOMS ≤ 2 — dor muscular severa',
    originalExercise: 'Agachamento Unilateral Excêntrico',
    replacement:      'Wall Sit estático (isometria de quadríceps) — 3×30s',
    reason:           'Mesmo princípio: respeitar a janela inflamatória com isometria estática.',
  },
  {
    condition: w => w.fatigue <= 2,
    trigger:          'Fadiga ≤ 2 — fadiga severa do SNC',
    originalExercise: 'Sprint Interval 6×30m',
    replacement:      'Foam Rolling + Mobilidade Ativa — 15 min',
    reason:           'SNC comprometido não recruta fibras tipo II. Sprint com fadiga alta degrada o padrão motor e aumenta risco de lesão.',
  },
  {
    condition: w => w.sleepQuality <= 2,
    trigger:          'Sono ≤ 2 — privação de sono',
    originalExercise: 'Treino técnico-cognitivo de alta demanda (rondos com pressão)',
    replacement:      'Técnica individual simples — passes 2-toques sem marcação',
    reason:           'Consolidação de memória motora exige sono REM. Sem sono, novo gesto técnico não consolida. Reduzir complexidade preserva qualidade.',
  },
  {
    condition: w => w.mood <= 2,
    trigger:          'Humor ≤ 2 — estresse psicológico elevado',
    originalExercise: 'Jogo coletivo 4×4 competitivo',
    replacement:      'Jogo lúdico 3×3 sem placar, livre',
    reason:           'Cortisol alto + carga intensa = catabolismo e risco de lesão por falta de foco.',
  },
]

export function buildPrescriptionAdaptations(wellness: WellnessInput): PrescriptionAdaptation[] {
  return RULES
    .filter(r => r.condition(wellness))
    .map(({ trigger, originalExercise, replacement, reason }) => ({
      trigger,
      originalExercise,
      replacement,
      reason,
    }))
}
