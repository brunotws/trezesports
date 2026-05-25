'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import PSEForm from '@/components/sessao/PSEForm'
import { submitPseAction } from '@/lib/actions/sessions'
import type { SessionAthlete } from '@/types'

interface Props {
  sessionId:  string
  athletes:   SessionAthlete[]
  plannedRpe: number
}

export default function PSEPageClient({ sessionId, athletes, plannedRpe }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSubmit(pses: Array<{ athleteId: string; pse: number | null; attended: boolean }>) {
    startTransition(async () => {
      await submitPseAction(sessionId, pses)
      router.push(`/sessao/${sessionId}`)
    })
  }

  if (athletes.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum atleta nesta sessão.</p>
  }

  return (
    <PSEForm
      athletes={athletes}
      plannedRpe={plannedRpe}
      onSubmit={handleSubmit}
      isLoading={isPending}
    />
  )
}
