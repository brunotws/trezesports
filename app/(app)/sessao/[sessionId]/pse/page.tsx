import { redirect, notFound } from 'next/navigation'
import { getSessionWithExercises, getSessionAthletes, getWeekPlannedLoads } from '@/lib/queries/sessions'
import PageHeader from '@/components/layout/PageHeader'
import PSEPageClient from './PSEPageClient'

interface Props {
  params: { sessionId: string }
}

export default async function PSEPage({ params }: Props) {
  const { sessionId } = params

  const session = await getSessionWithExercises(sessionId)
  if (!session) notFound()
  if (session.status !== 'encerrada') redirect(`/sessao/${sessionId}`)

  const [athletes, loads] = await Promise.all([
    getSessionAthletes(sessionId),
    getWeekPlannedLoads([sessionId]),
  ])

  const plannedLoad = loads[0]?.planned_load ?? 0

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader title="PSE por Atleta" subtitle="Sessão" backHref={`/sessao/${sessionId}`} />

      <div className="px-4 py-6">
        <PSEPageClient
          sessionId={sessionId}
          athletes={athletes}
          plannedRpe={plannedLoad}
        />
      </div>
    </div>
  )
}
