'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteExerciseAction } from '@/lib/actions/exercises'

export default function DeleteExerciseButton({ id }: { id: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handle() {
    if (!confirm('Excluir este exercício?')) return
    startTransition(async () => {
      await deleteExerciseAction(id)
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={isPending}
      className="p-2 text-muted-foreground hover:text-red-400 disabled:opacity-40 transition-colors"
    >
      <Trash2 size={15} />
    </button>
  )
}
