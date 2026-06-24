'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SESSION_TYPE_LABELS, SESSION_TYPE_COLORS } from '@/lib/engine/morphocycle'
import { deleteSessionAction } from '@/lib/actions/sessionTemplates'
import type { TemplateSession } from '@/lib/queries/sessionTemplates'

interface Props {
  templates: TemplateSession[]
}

export default function TemplatesClient({ templates }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteSessionAction(id)
      setConfirmDeleteId(null)
      router.refresh()
    })
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <span className="text-4xl">📋</span>
        <p className="text-sm font-medium text-foreground">Nenhum modelo salvo</p>
        <p className="text-xs text-muted-foreground max-w-[240px]">
          Acesse uma sessão e toque em "Salvar como Modelo" para reutilizá-la em treinos futuros.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {templates.map(t => {
          const typeColor = SESSION_TYPE_COLORS[t.session_type]
          const typeLabel = SESSION_TYPE_LABELS[t.session_type]
          return (
            <div
              key={t.id}
              className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{t.title ?? typeLabel}</p>
                  {t.objective && (
                    <p className="text-xs text-muted-foreground truncate">{t.objective}</p>
                  )}
                </div>
                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border leading-none shrink-0', typeColor)}>
                  {typeLabel}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {t.exerciseCount > 0 && (
                  <span>{t.exerciseCount} exercício{t.exerciseCount > 1 ? 's' : ''}</span>
                )}
                {t.category && <span>{t.category}</span>}
              </div>

              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => router.push(`/sessao/${t.id}`)}
                  className="flex-1 py-2.5 rounded-lg border border-border text-xs font-medium"
                >
                  Ver conteúdo
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(t.id)}
                  className="py-2.5 px-3 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-medium"
                >
                  🗑
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Delete confirm dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="rounded-2xl bg-card border border-border p-6 flex flex-col gap-4 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-base">Excluir este modelo?</h3>
            <p className="text-sm text-muted-foreground leading-snug">
              O modelo será removido permanentemente. Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleDelete(confirmDeleteId)}
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
