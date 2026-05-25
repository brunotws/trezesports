'use client'

import { useRouter } from 'next/navigation'
import { Plus, Lock, Trophy, Swords, Users } from 'lucide-react'
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
  const { session, plannedLoad, game, isVespera, athleteCount } = cell

  // --- JOGO ---
  if (game) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 h-full min-h-[80px] rounded-lg border border-red-500/40 bg-red-500/10 px-2 py-2">
        <Trophy size={14} className="text-red-400" />
        <span className="text-[10px] font-semibold text-red-400 text-center leading-tight">
          {game.opponent}
        </span>
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

  // --- STATUS ---
  const statusBorder =
    session.status === 'encerrada'    ? 'border-border/50 bg-muted/10' :
    session.status === 'em_andamento' ? 'border-primary/60 bg-primary/5 shadow-sm shadow-primary/20' :
    'border-border bg-card'

  const statusPulse = session.status === 'em_andamento' ? 'animate-pulse' : ''

  // --- CARGA ---
  const loadPct   = Math.min((plannedLoad / 20) * 100, 100)
  const loadColor =
    plannedLoad === 0 ? 'bg-muted-foreground/20' :
    plannedLoad <= 5  ? 'bg-green-500' :
    plannedLoad <= 10 ? 'bg-yellow-500' :
    plannedLoad <= 15 ? 'bg-orange-500' : 'bg-red-500'

  const typeColor = SESSION_TYPE_COLORS[session.session_type]
  const typeLabel = SESSION_TYPE_LABELS[session.session_type]

  return (
    <button
      onClick={() => router.push(`/sessao/${session.id}`)}
      className={cn(
        'flex flex-col justify-between h-full min-h-[80px] w-full rounded-lg border-2 px-2 py-2 text-left transition-all hover:brightness-110 active:scale-95',
        statusBorder,
        statusPulse,
      )}
    >
      {/* Topo: tipo + RPE */}
      <div className="flex items-start justify-between gap-1">
        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-md border leading-none', typeColor)}>
          {typeLabel}
        </span>
        {session.status === 'encerrada' && session.actual_rpe !== null && (
          <span className="text-[9px] text-muted-foreground font-medium">
            {session.actual_rpe}/10
          </span>
        )}
        {session.status === 'em_andamento' && (
          <span className="text-[9px] text-primary font-medium">⬤</span>
        )}
      </div>

      {/* Atletas */}
      {athleteCount > 0 && (
        <div className="flex items-center gap-1 mt-1">
          <Users size={9} className="text-muted-foreground/50" />
          <span className="text-[9px] text-muted-foreground/60">{athleteCount}</span>
        </div>
      )}

      {/* Barra de carga */}
      <div className="mt-auto">
        <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', loadColor)}
            style={{ width: `${loadPct}%` }}
          />
        </div>
        {plannedLoad > 0 && (
          <span className="text-[9px] text-muted-foreground/60 mt-0.5 block">
            carga {plannedLoad}
          </span>
        )}
      </div>
    </button>
  )
}
