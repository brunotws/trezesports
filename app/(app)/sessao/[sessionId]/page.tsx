import { notFound } from 'next/navigation'
import { getSessionWithExercises, getSessionAthletes, getWeekPlannedLoads } from '@/lib/queries/sessions'
import { getTodayWellness } from '@/lib/queries/wellness'
import { buildPrescriptionAdaptations } from '@/lib/engine/prescriptions'
import PageHeader from '@/components/layout/PageHeader'
import SessionActions from '@/components/sessao/SessionActions'
import type { AthleteReadiness } from '@/types'

interface Props {
  params: { sessionId: string }
}

function wellnessStatus(w: { fatigue: number; sleep_quality: number; doms: number; mood: number } | null): 'green' | 'yellow' | 'red' | null {
  if (!w) return null
  const total = w.fatigue + w.sleep_quality + w.doms + w.mood
  if (total > 15) return 'green'
  if (total >= 10) return 'yellow'
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

  const readinessMap: AthleteReadiness[] = athletes.map((sa, i) => {
    const w = wellnessResults[i]
    const wellness = w
      ? { fatigue: w.fatigue, sleep_quality: w.sleep_quality, doms: w.doms, mood: w.mood }
      : null
    const prescriptions = wellness
      ? buildPrescriptionAdaptations({
          fatigue:      wellness.fatigue,
          sleepQuality: wellness.sleep_quality,
          doms:         wellness.doms,
          mood:         wellness.mood,
        })
      : []
    return {
      athleteId:    sa.athlete_id,
      status:       wellnessStatus(wellness),
      wellness,
      prescriptions,
    }
  })

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader
        title={session.status.replace('_', ' ')}
        subtitle={`Sessão ${session.session_number} · Dia ${session.day_of_week + 1}`}
        backHref="/planejador"
      />
      <SessionActions
        session={session}
        athletes={athletes}
        readinessMap={readinessMap}
        plannedLoad={plannedLoad}
      />
    </div>
  )
}
