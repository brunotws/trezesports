'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/utils/duration'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Exercise, ExerciseGroup } from '@/types'

const TYPE_COLORS: Record<string, string> = {
  tecnico:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cognitivo: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  fisico:    'bg-orange-500/20 text-orange-400 border-orange-500/30',
  misto:     'bg-green-500/20 text-green-400 border-green-500/30',
}

interface Props {
  open:           boolean
  onOpenChange:   (open: boolean) => void
  exercises:      Exercise[]
  groups:         ExerciseGroup[]
  selectedIds:    Set<string>
  onAdd:          (exerciseId: string) => void
  onAddGroup:     (items: Array<{ exerciseId: string; customDuration: number | null }>) => void
}

export default function ExercisePickerSheet({
  open,
  onOpenChange,
  exercises,
  groups,
  selectedIds,
  onAdd,
  onAddGroup,
}: Props) {
  const [tab, setTab]       = useState<'exercises' | 'groups'>('exercises')
  const [search, setSearch] = useState('')

  const filtered = exercises.filter(e => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      e.name.toLowerCase().includes(q) ||
      (e.attribute_target ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <Sheet open={open} onOpenChange={v => { onOpenChange(v); if (!v) setSearch('') }}>
      <SheetContent side="right" className="w-full max-w-sm p-0 flex flex-col overflow-hidden">
        <SheetHeader className="px-4 pt-4 pb-2 shrink-0">
          <SheetTitle>Biblioteca</SheetTitle>
        </SheetHeader>

        {/* Tabs */}
        <div className="flex border-b border-border px-4 gap-5 shrink-0">
          {(['exercises', 'groups'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'pb-2.5 text-xs font-semibold border-b-2 transition-colors',
                tab === t
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground',
              )}
            >
              {t === 'exercises' ? 'Exercícios' : `Rotinas (${groups.length})`}
            </button>
          ))}
        </div>

        {/* Exercises tab */}
        {tab === 'exercises' && (
          <div className="flex flex-col gap-2 px-4 pt-3 flex-1 overflow-hidden">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar exercício…"
              className="w-full rounded-lg border border-input bg-muted px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-ring shrink-0"
              autoFocus
            />
            <div className="flex flex-col gap-1 overflow-y-auto flex-1 pb-4">
              {filtered.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">
                  {exercises.length === 0 ? 'Biblioteca vazia.' : 'Nenhum resultado.'}
                </p>
              )}
              {filtered.map(ex => {
                const isAdded = selectedIds.has(ex.id)
                return (
                  <button
                    key={ex.id}
                    type="button"
                    disabled={isAdded}
                    onClick={() => onAdd(ex.id)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-colors',
                      isAdded
                        ? 'border-primary/30 bg-primary/10 opacity-60 cursor-default'
                        : 'border-border bg-card hover:bg-muted',
                    )}
                  >
                    {ex.diagram_url ? (
                      <img
                        src={ex.diagram_url}
                        alt=""
                        className="w-9 h-9 rounded-md object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-md bg-muted-foreground/10 shrink-0 flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground/40">⚽</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{ex.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', TYPE_COLORS[ex.type] ?? 'bg-muted text-muted-foreground border-border')}>
                          {ex.type}
                        </span>
                        {ex.attribute_target && (
                          <span className="text-[10px] text-muted-foreground truncate">{ex.attribute_target}</span>
                        )}
                        {ex.duration_min && (
                          <span className="text-[10px] text-muted-foreground shrink-0">{formatDuration(ex.duration_min)}</span>
                        )}
                      </div>
                    </div>
                    {!isAdded && (
                      <span className="text-primary font-bold text-lg leading-none shrink-0">+</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Groups tab */}
        {tab === 'groups' && (
          <div className="flex flex-col gap-3 px-4 pt-3 pb-4 overflow-y-auto flex-1">
            {groups.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <p className="text-sm text-muted-foreground">Nenhuma rotina criada.</p>
                <p className="text-xs text-muted-foreground/60">
                  Crie rotinas em{' '}
                  <a href="/exercicios/rotinas" className="text-primary underline underline-offset-2">
                    Exercícios → Rotinas
                  </a>
                </p>
              </div>
            ) : (
              groups.map(g => {
                const itemCount = g.items?.length ?? 0
                const preview = (g.items ?? []).slice(0, 4)
                const extra = itemCount > 4 ? itemCount - 4 : 0
                return (
                  <div key={g.id} className="rounded-xl border border-border bg-card p-3 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{g.name}</span>
                      <span className="text-[10px] text-muted-foreground">{itemCount} exerc.</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {preview.map(item => (
                        <p key={item.id} className="text-[11px] text-muted-foreground truncate">
                          · {item.exercise?.name ?? item.exercise_id}
                        </p>
                      ))}
                      {extra > 0 && (
                        <p className="text-[11px] text-muted-foreground/50">+{extra} mais</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onAddGroup((g.items ?? []).map(i => ({ exerciseId: i.exercise_id, customDuration: i.custom_duration ?? null })))}
                      disabled={itemCount === 0}
                      className="w-full py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold border border-primary/20 hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-default"
                    >
                      Adicionar Rotina
                    </button>
                  </div>
                )
              })
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
