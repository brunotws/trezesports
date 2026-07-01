import { notFound, redirect } from 'next/navigation'
import { getSessionWithExercises, getSessionAthletes } from '@/lib/queries/sessions'
import { getTodayWellness } from '@/lib/queries/wellness'
import { buildPrescriptionAdaptations } from '@/lib/engine/prescriptions'
import LiveMode from './LiveMode'
import type { AthleteReadiness, DailyWellness } from '@/types'

interface Props {
  params: { sessionId: string }
}

function wellnessToStatus(w: DailyWellness | null): 'green' | 'yellow' | 'red' | null {
  if (!w) return null
  const vals = [w.fatigue, w.sleep_quality, w.doms, w.mood, w.nutrition_score].filter((v): v is number => v != null)
  const avg  = vals.reduce((a, b) => a + b, 0) / vals.length
  return avg > 3.75 ? 'green' : avg >= 2.5 ? 'yellow' : 'red'
}

export default async function LivePage({ params }: Props) {
  const { sessionId } = params

  const [session, athletes] = await Promise.all([
    getSessionWithExercises(sessionId),
    getSessionAthletes(sessionId),
  ])

  if (!session) notFound()
  if (session.exercises.length === 0) redirect(`/sessao/${sessionId}`)

  const wellnessResults = await Promise.all(
    athletes.map(sa => getTodayWellness(sa.athlete_id)),
  )

  const readinessMap: AthleteReadiness[] = athletes.map((sa, i) => {
    const w = wellnessResults[i]
    return {
      athleteId:     sa.athlete_id,
      status:        wellnessToStatus(w),
      wellness:      w ? { fatigue: w.fatigue, sleep_quality: w.sleep_quality, doms: w.doms, mood: w.mood, nutrition_score: w.nutrition_score } : null,
      prescriptions: w
        ? buildPrescriptionAdaptations({
            fatigue:        w.fatigue,
            sleepQuality:   w.sleep_quality,
            doms:           w.doms,
            mood:           w.mood,
            nutritionScore: w.nutrition_score ?? undefined,
          })
        : [],
    }
  })

  const orderedExercises = [...session.exercises].sort((a, b) => a.position - b.position)

  return (
    <LiveMode
      session={session}
      orderedExercises={orderedExercises}
      athletes={athletes}
      readinessMap={readinessMap}
    />
  )
}
