'use client'

import { useRouter } from 'next/navigation'
import { Plus, Lock, Trophy, Swords } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SESSION_TYPE_LABELS, SESSION_TYPE_COLORS } from '@/lib/engine/morphocycle'
import type { GridCell } from '@/types'

interface Props {
  cell:    GridCell
  weekId:  string
  date:    string
}

export default function SessionCell({ cell, weekId, date }: Props) {
  const router = useRouter()
  const { session, plannedLoad, game, isVespera } = cell

  // --- BLOCKED: game day ---
  if (game) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 h-full min-h-[72px] rounded-md border border-red-500/30 bg-red-500/10 px-2 py-2">
        <Trophy size={14} className="text-red-400" />
        <span className="text-[10px] font-medium text-red-400 text-center leading-tight">
          {game.opponent}
        </span>
        <span className="text-[9px] text-red-400/70 capitalize">{game.type}</span>
      </div>
    )
  }

  // --- BLOCKED: véspera de jogo ---
  if (isVespera) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 h-full min-h-[72px] rounded-md border border-orange-500/20 bg-orange-500/5 px-2 py-2">
        <Swords size={14} className="text-orange-400/60" />
        <span className="text-[10px] text-orange-400/70 text-center">Véspera</span>
      </div>
    )
  }

  // --- BLOCKED: manually blocked session ---
  if (session?.blocked) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 h-full min-h-[72px] rounded-md border border-border bg-muted/30 px-2 py-2">
        <Lock size={14} className="text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground text-center">
          {session.blocked_reason ?? 'Bloqueado'}
        </span>
      </div>
    )
  }

  // --- EMPTY: no session created yet ---
  if (!session) {
    return (
      <button
        onClick={() => router.push(`/sessao/novo?weekId=${weekId}&day=${cell.dayOfWeek}&sn=${cell.sessionNumber}&date=${date}`)}
        className="flex flex-col items-center justify-center gap-1 h-full min-h-[72px] w-full rounded-md border border-dashed border-border/50 bg-transparent hover:border-border hover:bg-muted/30 transition-colors"
      >
        <Plus size={16} className="text-muted-foreground/50" />
      </button>
    )
  }

  // --- STATUS COLORS ---
  const statusBorder =
    session.status === 'encerrada'   ? 'border-muted bg-muted/20' :
    session.status === 'em_andamento'? 'border-primary bg-primary/5 animate-pulse' :
    'border-border bg-card'

  // --- LOAD BAR ---
  const loadPct   = Math.min((plannedLoad / 20) * 100, 100)
  const loadColor =
    plannedLoad <= 5  ? 'bg-green-500' :
    plannedLoad <= 10 ? 'bg-yellow-500' :
    plannedLoad <= 15 ? 'bg-orange-500' : 'bg-red-500'

  const typeColor = SESSION_TYPE_COLORS[session.session_type]
  const typeLabel = SESSION_TYPE_LABELS[session.session_type]

  return (
    <button
      onClick={() => router.push(`/sessao/${session.id}`)}
      className={cn(
        'flex flex-col justify-between h-full min-h-[72px] w-full rounded-md border px-2 py-2 text-left transition-colors hover:brightness-110',
        statusBorder,
      )}
    >
      {/* Header: session type badge */}
      <div className="flex items-center justify-between gap-1">
        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border', typeColor)}>
          {typeLabel}
        </span>
        {session.status === 'encerrada' && (
          <span className="text-[10px] text-muted-foreground">
            RPE {session.actual_rpe}
          </span>
        )}
      </div>

      {/* Load bar */}
      <div className="mt-1.5">
        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', loadColor)}
            style={{ width: `${loadPct}%` }}
          />
        </div>
        <span className="text-[9px] text-muted-foreground mt-0.5 block">
          Carga {plannedLoad}
        </span>
      </div>
    </button>
  )
}
