import { notFound, redirect } from 'next/navigation'
import { getSessionWithExercises } from '@/lib/queries/sessions'
import LiveMode from './LiveMode'

interface Props {
  params: { sessionId: string }
}

export default async function LivePage({ params }: Props) {
  const { sessionId } = params

  const session = await getSessionWithExercises(sessionId)
  if (!session) notFound()
  if (session.exercises.length === 0) redirect(`/sessao/${sessionId}`)

  const orderedExercises = [...session.exercises].sort((a, b) => a.position - b.position)

  return <LiveMode session={session} orderedExercises={orderedExercises} />
}
