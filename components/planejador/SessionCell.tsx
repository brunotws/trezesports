'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Lock, Trophy, Swords, Users, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SESSION_TYPE_LABELS, SESSION_TYPE_COLORS } from '@/lib/engine/morphocycle'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { archiveSessionAction, deleteSessionAction, cloneAsTemplateAction } from '@/lib/actions/sessionTemplates'
import type { GridCell } from '@/types'

interface Props {
  cell:            GridCell
  weekId:          string
  date:            string
  isSelectionMode: boolean
  isSelected:      boolean
  onSelect:        (id: string) => void
}

export default function SessionCell({ cell, weekId, date, isSelectionMode, isSelected, onSelect }: Props) {
  const router = useRouter()
  const [kebabOpen, setKebabOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { session, plannedLoad, game, isVespera, athleteCount } = cell

  // --- JOGO ---
  if (game) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 h-full min-h-[80px] rounded-lg border border-red-500/40 bg-red-500/10 px-2 py-2">
        <Trophy size={14} className="text-red-400" />
        <span className="text-[10px] font-semibold text-red-400 text-center leading-tight">{game.opponent}</span>
        <span className="text-[9px] text-red-400/70 capitalize">{game.type}</span>
      </div>
    )
  }

  // --- VÉSPERA ---
  if (isVespera) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 h-full min-h-[80px] rounded-lg border border-orange-500/20 bg-orange-500/5 px-2 py-2">
        <Swords size={14} className="text-orange-400/60" />
        <span className="text-[10px] text-orange-400/70 text-center font-medium">Véspera</span>
        <span className="text-[9px] text-orange-400/50">MD-1</span>
      </div>
    )
  }

  // --- BLOQUEADA ---
  if (session?.blocked) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 h-full min-h-[80px] rounded-lg border border-border bg-muted/20 px-2 py-2">
        <Lock size={14} className="text-muted-foreground/50" />
        <span className="text-[10px] text-muted-foreground/70 text-center leading-tight">
          {session.blocked_reason ?? 'Bloqueada'}
        </span>
      </div>
    )
  }

  // --- VAZIA ---
  if (!session) {
    if (isSelectionMode) return <div className="min-h-[80px]" />
    return (
      <button
        onClick={() => router.push(`/sessao/novo?weekId=${weekId}&day=${cell.dayOfWeek}&sn=${cell.sessionNumber}&date=${date}`)}
        className="flex flex-col items-center justify-center gap-1 h-full min-h-[80px] w-full rounded-lg border-2 border-dashed border-border/40 bg-transparent hover:border-primary/40 hover:bg-primary/5 transition-all group"
      >
        <Plus size={18} className="text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
        <span className="text-[9px] text-muted-foreground/30 group-hover:text-primary/50">Sessão</span>
      </button>
    )
  }

  // session is guaranteed non-null past this point
  const nonNullSession = session

  const statusBorder =
    session.status === 'encerrada'    ? 'border-border/50 bg-muted/10' :
    session.status === 'em_andamento' ? 'border-primary/60 bg-primary/5 shadow-sm shadow-primary/20' :
    'border-border bg-card'

  const statusPulse = session.status === 'em_andamento' ? 'animate-pulse' : ''
  const loadPct   = Math.min((plannedLoad / 20) * 100, 100)
  const loadColor =
    plannedLoad === 0 ? 'bg-muted-foreground/20' :
    plannedLoad <= 5  ? 'bg-green-500' :
    plannedLoad <= 10 ? 'bg-yellow-500' :
    plannedLoad <= 15 ? 'bg-orange-500' : 'bg-red-500'

  const typeColor = SESSION_TYPE_COLORS[session.session_type]
  const typeLabel = SESSION_TYPE_LABELS[session.session_type]

  function handleArchive() {
    setKebabOpen(false)
    startTransition(async () => {
      await archiveSessionAction(nonNullSession.id)
      router.refresh()
    })
  }

  function handleDelete() {
    setKebabOpen(false)
    startTransition(async () => {
      await deleteSessionAction(nonNullSession.id)
      router.refresh()
    })
  }

  function handleSaveTemplate() {
    setKebabOpen(false)
    startTransition(async () => {
      await cloneAsTemplateAction(nonNullSession.id)
    })
  }

  // --- SELECTION MODE ---
  if (isSelectionMode) {
    return (
      <button
        type="button"
        onClick={() => onSelect(session.id)}
        className={cn(
          'flex flex-col justify-between h-full min-h-[80px] w-full rounded-lg border-2 px-2 py-2 text-left transition-all relative',
          isSelected
            ? 'border-primary bg-primary/10'
            : cn(statusBorder, 'opacity-70'),
        )}
      >
        {/* Checkbox indicator */}
        <div className={cn(
          'absolute top-1.5 right-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center',
          isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40',
        )}>
          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
        </div>
        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-md border leading-none', typeColor)}>
          {typeLabel}
        </span>
        <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden mt-auto">
          <div className={cn('h-full rounded-full', loadColor)} style={{ width: `${loadPct}%` }} />
        </div>
      </button>
    )
  }

  // --- NORMAL MODE ---
  return (
    <>
      <div
        className={cn(
          'relative flex flex-col justify-between h-full min-h-[80px] w-full rounded-lg border-2 px-2 py-2 transition-all',
          statusBorder,
          statusPulse,
          isPending && 'opacity-50',
        )}
      >
        {/* Main clickable area */}
        <button
          type="button"
          onClick={() => router.push(`/sessao/${session.id}`)}
          className="absolute inset-0 rounded-lg"
          aria-label={`Abrir sessão ${typeLabel}`}
        />

        {/* Topo: tipo + kebab */}
        <div className="flex items-start justify-between gap-1 relative z-10 pointer-events-none">
          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-md border leading-none', typeColor)}>
            {typeLabel}
          </span>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); setKebabOpen(true) }}
            className="pointer-events-auto w-5 h-5 flex items-center justify-center rounded text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors -mr-0.5 -mt-0.5"
          >
            <MoreVertical size={11} />
          </button>
        </div>

        {/* Estado e atletas */}
        <div className="relative z-10 pointer-events-none">
          {session.status === 'encerrada' && session.actual_rpe !== null && (
            <span className="text-[9px] text-muted-foreground font-medium">{session.actual_rpe}/10</span>
          )}
          {session.status === 'em_andamento' && (
            <span className="text-[9px] text-primary font-medium">⬤</span>
          )}
          {athleteCount > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Users size={9} className="text-muted-foreground/50" />
              <span className="text-[9px] text-muted-foreground/60">{athleteCount}</span>
            </div>
          )}
        </div>

        {/* Barra de carga */}
        <div className="mt-auto relative z-10 pointer-events-none">
          <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', loadColor)} style={{ width: `${loadPct}%` }} />
          </div>
          {plannedLoad > 0 && (
            <span className="text-[9px] text-muted-foreground/60 mt-0.5 block">carga {plannedLoad}</span>
          )}
        </div>
      </div>

      {/* Kebab Sheet */}
      <Sheet open={kebabOpen} onOpenChange={setKebabOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-10">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-left text-sm">
              {session.title ?? typeLabel}
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={handleSaveTemplate}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-medium text-left border border-border bg-card"
            >
              📋 Salvar como Modelo
            </button>
            <button
              type="button"
              onClick={handleArchive}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-medium text-left border border-border bg-card"
            >
              📦 Arquivar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-medium text-left border border-red-500/30 bg-red-500/5 text-red-400 mt-2"
            >
              🗑 Excluir sessão
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
