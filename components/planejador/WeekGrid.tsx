'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { DAY_LABELS, sessionDate as computeSessionDate } from '@/lib/utils/week'
import { bulkArchiveAction, bulkDeleteAction } from '@/lib/actions/sessionTemplates'
import SessionCell from './SessionCell'
import type { GridCell } from '@/types'

interface Props {
  weekId:         string
  weekStartDate:  string
  cells:          GridCell[]
}

const SESSION_LABELS = ['Manhã', 'Tarde', 'Noite']

export default function WeekGrid({ weekId, weekStartDate, cells }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const cellFor = (day: number, sn: number) =>
    cells.find(c => c.dayOfWeek === day && c.sessionNumber === sn)

  const today = new Date().toISOString().split('T')[0]

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function exitSelectionMode() {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  function handleBulkArchive() {
    startTransition(async () => {
      await bulkArchiveAction(Array.from(selectedIds))
      exitSelectionMode()
      router.refresh()
    })
  }

  function handleBulkDelete() {
    startTransition(async () => {
      await bulkDeleteAction(Array.from(selectedIds))
      exitSelectionMode()
      setDeleteConfirm(false)
      router.refresh()
    })
  }

  const hasCompletedSelected = Array.from(selectedIds).some(id => {
    const cell = cells.find(c => c.session?.id === id)
    return cell?.session?.status === 'encerrada'
  })

  return (
    <>
      <div className="flex-1 overflow-x-auto p-3">
        <div className="min-w-[580px]">

          {/* Toolbar: Selecionar + Modelos */}
          <div className="flex items-center justify-between mb-2">
            <a
              href="/planejador/modelos"
              className="text-[11px] text-muted-foreground px-2 py-1 rounded border border-border/50 hover:bg-muted/30 transition-colors"
            >
              📋 Modelos
            </a>
            {selectionMode ? (
              <button
                type="button"
                onClick={exitSelectionMode}
                className="text-[11px] text-primary px-2 py-1 rounded border border-primary/30"
              >
                Cancelar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSelectionMode(true)}
                className="text-[11px] text-muted-foreground px-2 py-1 rounded border border-border/50 hover:bg-muted/30 transition-colors"
              >
                Selecionar
              </button>
            )}
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-[52px_repeat(7,1fr)] gap-1.5 mb-2">
            <div />
            {DAY_LABELS.map((label, day) => {
              const dateStr = computeSessionDate(weekStartDate, day)
              const isToday = dateStr === today
              return (
                <div key={label} className="flex flex-col items-center gap-0.5 pb-1 border-b border-border/50">
                  <span className={`text-[11px] font-semibold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                  <span className={`text-[10px] ${isToday ? 'text-primary' : 'text-muted-foreground/60'}`}>
                    {dateStr.slice(8)}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Session rows: 3 × 7 cells */}
          {([1, 2, 3] as const).map(sn => (
            <div key={sn} className="grid grid-cols-[52px_repeat(7,1fr)] gap-1.5 mb-1.5">
              <div className="flex items-center justify-end pr-2">
                <span className="text-[10px] text-muted-foreground/60 text-right leading-tight">
                  {SESSION_LABELS[sn - 1]}
                </span>
              </div>
              {Array.from({ length: 7 }, (_, day) => {
                const cell = cellFor(day, sn)
                const dateStr = computeSessionDate(weekStartDate, day)
                if (!cell) return <div key={day} className="min-h-[72px]" />
                return (
                  <SessionCell
                    key={`${day}-${sn}`}
                    cell={cell}
                    weekId={weekId}
                    date={dateStr}
                    isSelectionMode={selectionMode}
                    isSelected={!!cell.session && selectedIds.has(cell.session.id)}
                    onSelect={toggleSelect}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── FLOATING ACTION BAR (selection mode) ── */}
      {selectionMode && selectedIds.size > 0 && (
        <div className="fixed bottom-20 left-3 right-3 z-40 rounded-xl border border-border bg-card p-3 flex items-center gap-2 shadow-2xl">
          <span className="text-xs text-muted-foreground flex-1">
            {selectedIds.size} selecionado{selectedIds.size > 1 ? 's' : ''}
          </span>
          <button
            type="button"
            disabled={isPending}
            onClick={handleBulkArchive}
            className="px-3 py-2 rounded-lg text-xs font-semibold border border-border bg-muted disabled:opacity-50"
          >
            📦 Arquivar
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setDeleteConfirm(true)}
            className="px-3 py-2 rounded-lg text-xs font-semibold border border-red-500/30 bg-red-500/10 text-red-400 disabled:opacity-50"
          >
            🗑 Excluir
          </button>
        </div>
      )}

      {/* ── ALERT DIALOG (bulk delete confirmation) ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="rounded-2xl bg-card border border-border p-6 flex flex-col gap-4 w-full max-w-sm shadow-2xl">
            <div>
              <h3 className="font-bold text-base text-foreground">
                Excluir {selectedIds.size} sessão{selectedIds.size > 1 ? 'ões' : ''}?
              </h3>
              {hasCompletedSelected && (
                <p className="text-sm text-orange-400 mt-2 leading-snug">
                  ⚠ Atenção: excluir treinos finalizados apagará a carga física registrada para os atletas presentes. Para limpar a tela sem perder dados, prefira <b>Arquivar</b>.
                </p>
              )}
              {!hasCompletedSelected && (
                <p className="text-sm text-muted-foreground mt-2 leading-snug">
                  Essa ação não pode ser desfeita.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleBulkDelete}
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
