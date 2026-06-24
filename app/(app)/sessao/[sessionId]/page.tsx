import { notFound } from 'next/navigation'
import { getSessionWithExercises, getSessionAthletes, getWeekPlannedLoads } from '@/lib/queries/sessions'
import { getTodayWellness } from '@/lib/queries/wellness'
import { buildPrescriptionAdaptations } from '@/lib/engine/prescriptions'
import PageHeader from '@/components/layout/PageHeader'
import SessionActions from '@/components/sessao/SessionActions'
import type { AthleteReadiness, DailyWellness } from '@/types'

interface Props {
  params: { sessionId: string }
}

function wellnessStatus(w: { fatigue: number; sleep_quality: number; doms: number; mood: number; nutrition_score?: number | null } | null): 'green' | 'yellow' | 'red' | null {
  if (!w) return null
  const metrics = [w.fatigue, w.sleep_quality, w.doms, w.mood, w.nutrition_score].filter((v): v is number => v != null)
  const avg = metrics.reduce((a, b) => a + b, 0) / metrics.length
  if (avg > 3.75) return 'green'
  if (avg >= 2.5) return 'yellow'
  return 'red'
}

export default async function SessionPage({ params }: Props) {
  const { sessionId } = params

  const session = await getSessionWithExercises(sessionId)
  if (!session) notFound()

  const [athletes, loads] = await Promise.all([
    getSessionAthletes(sessionId),
    getWeekPlannedLoads([sessionId]),
  ])

  const plannedLoad = loads[0]?.planned_load ?? 0

  // Buscar wellness de cada atleta para calcular readiness individual
  const wellnessResults = await Promise.all(
    athletes.map(sa => getTodayWellness(sa.athlete_id)),
  )

  const wellnessMap: Record<string, DailyWellness | null> = {}
  athletes.forEach((sa, i) => { wellnessMap[sa.athlete_id] = wellnessResults[i] })

  const readinessMap: AthleteReadiness[] = athletes.map((sa, i) => {
    const w = wellnessResults[i]
    const wellness = w
      ? { fatigue: w.fatigue, sleep_quality: w.sleep_quality, doms: w.doms, mood: w.mood, nutrition_score: w.nutrition_score }
      : null
    const prescriptions = wellness
      ? buildPrescriptionAdaptations({
          fatigue:        wellness.fatigue,
          sleepQuality:   wellness.sleep_quality,
          doms:           wellness.doms,
          mood:           wellness.mood,
          nutritionScore: wellness.nutrition_score ?? undefined,
        })
      : []
    return {
      athleteId:    sa.athlete_id,
      status:       wellnessStatus(wellness),
      wellness,
      prescriptions,
    }
  })

  const sessionTitle = session.title
    ?? `Sessão ${session.session_number} · Dia ${session.day_of_week + 1}`

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader
        title={sessionTitle}
        subtitle={[session.category, session.objective].filter(Boolean).join(' · ') || session.status.replace('_', ' ')}
        backHref="/planejador"
      />
      <SessionActions
        session={session}
        athletes={athletes}
        readinessMap={readinessMap}
        plannedLoad={plannedLoad}
        wellnessMap={wellnessMap}
      />
    </div>
  )
}
