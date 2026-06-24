'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteAthleteAction } from '@/lib/actions/athletes'

interface Props {
  athleteId: string
  athleteName: string
}

export default function DeleteAthleteButton({ athleteId, athleteName }: Props) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteAthleteAction(athleteId)
      router.push('/atletas')
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="w-full py-3 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 text-sm font-medium"
      >
        Excluir atleta
      </button>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="rounded-2xl bg-card border border-border p-6 flex flex-col gap-4 w-full max-w-sm shadow-2xl">
            <div>
              <h3 className="font-bold text-base text-foreground">Excluir {athleteName}?</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-snug">
                Todo o histórico de wellness e cargas vinculado a este atleta será perdido permanentemente. Essa ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-50"
              >
                {isPending ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
