// =============================================================
// Treze Sports — Types v2
// =============================================================

export type ExerciseType    = 'tecnico' | 'cognitivo' | 'fisico' | 'misto'
export type SessionStatus   = 'planejada' | 'em_andamento' | 'encerrada' | 'draft' | 'archived'
export type SessionType     = 'MD+1' | 'MD+2' | 'MD-4' | 'MD-3' | 'MD-2' | 'MD-1' | 'MD' | 'free'
export type BlockType       = 'Aquecimento' | 'Parte Analítica' | 'Jogo Condicionado'

export interface Stage {
  id:   string
  name: string
}
export type GameType        = 'amistoso' | 'campeonato'
export type PositionType    = 'Goleiro' | 'Linha'
export type ModalityType    = 'football' | 'futsal'
export type SurfaceType     = 'grass' | 'synthetic' | 'futsal_court' | 'gym'
export type ReadinessStatus = 'green' | 'yellow' | 'red'

// -------------------------------------------------------------
// Database rows
// -------------------------------------------------------------

export interface Athlete {
  id:                    string
  name:                  string
  birth_date:            string | null
  position:              PositionType | null
  modality:              ModalityType
  turma:                 string | null
  resting_hr:            number | null
  // Linha attributes
  attr_ball_control:     number | null
  attr_dribbling:        number | null
  attr_passing:          number | null
  attr_finishing:        number | null
  attr_movement:         number | null
  attr_body_positioning: number | null
  attr_scanning:         number | null
  attr_decisions:        number | null
  // Goleiro attributes
  attr_ball_handling:    number | null
  attr_diving:           number | null
  attr_distribution:     number | null
  attr_positioning:      number | null
  attr_mindset:          number | null
  created_at:            string
}

export interface DailyWellness {
  id:              string
  athlete_id:      string
  date:            string
  fatigue:         number  // 1–5 (5 = ótimo)
  sleep_quality:   number
  doms:            number
  mood:            number
  nutrition_score: number | null
  resting_hr:      number | null
  wellness_total:  number
  created_at:      string
}

export interface Exercise {
  id:                         string
  name:                       string
  description:                string | null
  attribute_target:           string | null
  attr_secondary:             string | null
  type:                       ExerciseType
  fatigue_level:              number
  for_goalkeeper:             boolean
  duration_min:               number | null
  diagram_url:                string | null
  // Intervenção
  progressao:                 string | null
  regressao:                  string | null
  // Logística
  espaco_necessario:          string | null
  num_cones:                  number | null
  num_coletes:                number | null
  cores_coletes:              number | null
  num_bolas:                  number | null
  is_eccentric:               boolean
  contraindicated_doms_below: number | null
  substitute_exercise_id:     string | null
  created_at:                 string
}

export interface Week {
  id:         string
  start_date: string
  created_at: string
}

export interface Session {
  id:                   string
  week_id:              string | null
  day_of_week:          number   // 0=Seg … 6=Dom
  session_number:       number   // 1 | 2 | 3
  session_type:         SessionType
  surface_type:         SurfaceType | null
  status:               SessionStatus
  blocked:              boolean
  blocked_reason:       string | null
  actual_rpe:           number | null
  actual_duration_min:  number | null
  // Planejamento
  title:                string | null
  scheduled_time:       string | null
  category:             string | null
  objective:            string | null
  // Diário de bordo
  coach_notes:          string | null
  team_intensity:       number | null
  // Dynamic stages (new — requires migration 0002)
  stages:               Stage[] | undefined
  created_at:           string
}

export interface SessionExercise {
  id:          string
  session_id:  string
  exercise_id: string
  position:    number
  block_type:  string | null
  exercise?:   Exercise
}

export interface SessionAthlete {
  id:              string
  session_id:      string
  athlete_id:      string
  attended:        boolean | null
  pse:             number | null
  individual_srpe: number | null
  created_at:      string
  athlete?:        Athlete
}

export interface Game {
  id:                string
  date:              string
  opponent:          string
  type:              GameType
  blocks_day_before: boolean
  created_at:        string
}

export interface GameAthlete {
  game_id:    string
  athlete_id: string
  athlete?:   Athlete
}

export interface SessionTemplate {
  id:          string
  name:        string
  description: string | null
  created_at:  string
  exercises?:  SessionTemplateExercise[]
}

export interface TemplateSession extends Session {
  exerciseCount: number
}

export interface ExerciseGroup {
  id:         string
  name:       string
  created_at: string
  items?:     ExerciseGroupItem[]
}

export interface ExerciseGroupItem {
  id:          string
  group_id:    string
  exercise_id: string
  position:    number
  exercise?:   Exercise
}

export interface SessionTemplateExercise {
  id:          string
  template_id: string
  exercise_id: string
  position:    number
  exercise?:   Exercise
}

export interface LoadAnalytics {
  id:                       string
  athlete_id:               string
  date:                     string
  acute_load:               number | null
  chronic_load:             number | null
  acwr:                     number | null
  weekly_monotony:          number | null
  weekly_strain:            number | null
  readiness_status:         ReadinessStatus | null
  volume_adjustment_factor: number | null
  calculated_at:            string
}

// -------------------------------------------------------------
// View results
// -------------------------------------------------------------

export interface SessionPlannedLoad {
  session_id:   string
  planned_load: number
}

export interface AthleteWeekFatigue {
  athlete_id:          string
  week_id:             string
  accumulated_fatigue: number
}

export interface ACWRRow {
  athlete_id:   string
  acute_load:   number
  chronic_load: number
  acwr:         number | null
}

export interface WeeklyStats {
  athlete_id:        string
  weekly_total_load: number
  weekly_avg_load:   number
  weekly_std_dev:    number
  monotony:          number
  strain:            number
}

// -------------------------------------------------------------
// Engine types
// -------------------------------------------------------------

export interface WellnessInput {
  fatigue:        number  // 1–5
  sleepQuality:   number
  doms:           number
  mood:           number
  nutritionScore?: number
}

export interface PrescriptionAdaptation {
  trigger:          string
  originalExercise: string
  replacement:      string
  reason:           string
}

export interface MorphocycleContext {
  sessionType:          SessionType
  daysToMatch:          number | null
  suggestedFocus:       string
  suggestedRpeTarget:   number
  suggestedDurationMin: number
}

export interface ReadinessResult {
  status:                  ReadinessStatus
  acwr:                    number | null
  acwrStatus:              ReadinessStatus
  acuteLoad:               number
  chronicLoad:             number
  wellnessTotal:           number
  wellnessStatus:          ReadinessStatus
  monotony:                number | null
  strain:                  number | null
  volumeAdjustmentFactor:  number
  recommendations:         string[]
  prescriptionAdaptations: PrescriptionAdaptation[]
  morphocycleContext:      MorphocycleContext | null
}

// -------------------------------------------------------------
// UI grid types
// -------------------------------------------------------------

export interface GridCell {
  dayOfWeek:     number
  sessionNumber: number
  session:       Session | null
  plannedLoad:   number
  game:          Game | null
  isVespera:     boolean
  athleteCount:  number
}

export interface AthleteReadiness {
  athleteId:   string
  status:      'green' | 'yellow' | 'red' | null
  wellness:    { fatigue: number; sleep_quality: number; doms: number; mood: number; nutrition_score?: number | null } | null
  prescriptions: PrescriptionAdaptation[]
}
