'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteGameAction } from '@/lib/actions/games'

interface Props {
  id: string
}

export default function DeleteGameButton({ id }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('Excluir este jogo?')) return
    startTransition(async () => {
      await deleteGameAction(id)
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="p-2 text-muted-foreground hover:text-red-400 disabled:opacity-40 transition-colors"
    >
      <Trash2 size={15} />
    </button>
  )
}
