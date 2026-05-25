import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getSessionWithExercises, getSessionAthletes, getWeekPlannedLoads } from '@/lib/queries/sessions'
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
      <header className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-border">
        <Link href="/planejador" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Sessão {session.session_number} · Dia {session.day_of_week + 1}
          </p>
          <h1 className="text-lg font-semibold capitalize">
            {session.status.replace('_', ' ')}
          </h1>
        </div>
      </header>

      <SessionActions
        session={session}
        athletes={athletes}
        plannedLoad={plannedLoad}
      />
    </div>
  )
}
