import { notFound } from 'next/navigation'
import { getSessionWithExercises, getSessionAthletes, getWeekPlannedLoads } from '@/lib/queries/sessions'
import PageHeader from '@/components/layout/PageHeader'
import SessionActions from '@/components/sessao/SessionActions'

interface Props {
  params: { sessionId: string }
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
        plannedLoad={plannedLoad}
      />
    </div>
  )
}
