'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/utils/duration'
import { Plus, Trash2, ChevronDown, ChevronUp, X, BookMarked } from 'lucide-react'
import { createExerciseGroupAction, deleteExerciseGroupAction } from '@/lib/actions/exerciseGroups'
import type { Exercise, ExerciseGroup } from '@/types'

const TYPE_COLORS: Record<string, string> = {
  tecnico:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cognitivo: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  fisico:    'bg-orange-500/20 text-orange-400 border-orange-500/30',
  misto:     'bg-green-500/20 text-green-400 border-green-500/30',
}

interface Props {
  exercises:     Exercise[]
  initialGroups: ExerciseGroup[]
}

export default function RotinasClient({ exercises, initialGroups }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [groups, setGroups]           = useState<ExerciseGroup[]>(initialGroups)
  const [creating, setCreating]       = useState(false)
  const [groupName, setGroupName]     = useState('')
  const [selected, setSelected]       = useState<Set<string>>(new Set())
  const [search, setSearch]           = useState('')
  const [expandedId, setExpandedId]   = useState<string | null>(null)
  const [deletingId, setDeletingId]   = useState<string | null>(null)

  const exerciseMap = useMemo(
    () => new Map(exercises.map(e => [e.id, e])),
    [exercises],
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return exercises
    const q = search.toLowerCase()
    return exercises.filter(e =>
      e.name.toLowerCase().includes(q) ||
      (e.attribute_target ?? '').toLowerCase().includes(q),
    )
  }, [exercises, search])

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function cancelCreate() {
    setCreating(false)
    setGroupName('')
    setSelected(new Set())
    setSearch('')
  }

  function handleCreate() {
    if (!groupName.trim()) return
    const exerciseIds = Array.from(selected)

    startTransition(async () => {
      const group = await createExerciseGroupAction(groupName.trim(), exerciseIds)
      // Rebuild group with exercise objects for immediate UI update
      const withItems: ExerciseGroup = {
        ...group,
        items: exerciseIds.map((eid, i) => ({
          id:          `${group.id}-${i}`,
          group_id:    group.id,
          exercise_id: eid,
          position:    i,
          exercise:    exerciseMap.get(eid),
        })),
      }
      setGroups(prev => [...prev, withItems])
      cancelCreate()
    })
  }

  function handleDelete(groupId: string) {
    setDeletingId(groupId)
    startTransition(async () => {
      await deleteExerciseGroupAction(groupId)
      setGroups(prev => prev.filter(g => g.id !== groupId))
      setDeletingId(null)
    })
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-5 pb-24">

      {/* Creation form */}
      {creating ? (
        <div className="rounded-xl border border-primary/30 bg-card p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Nova Rotina</p>
            <button type="button" onClick={cancelCreate} className="p-1 text-muted-foreground/50 hover:text-foreground">
              <X size={15} />
            </button>
          </div>

          {/* Name */}
          <input
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="Nome da rotina (ex: Aquecimento Articular)"
            autoFocus
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />

          {/* Exercise picker */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                Exercícios {selected.size > 0 && <span className="text-primary">({selected.size} selecionados)</span>}
              </p>
              {selected.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  Limpar
                </button>
              )}
            </div>

            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar exercício…"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-ring"
            />

            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
              {filtered.map(ex => {
                const isSelected = selected.has(ex.id)
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => toggleSelect(ex.id)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-colors',
                      isSelected
                        ? 'border-primary/40 bg-primary/10'
                        : 'border-border bg-background hover:bg-muted',
                    )}
                  >
                    {/* Checkbox visual */}
                    <div className={cn(
                      'w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors',
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30',
                    )}>
                      {isSelected && (
                        <svg viewBox="0 0 10 8" className="w-2.5 h-2 fill-primary-foreground">
                          <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>

                    {ex.diagram_url ? (
                      <img src={ex.diagram_url} alt="" className="w-7 h-7 rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded bg-muted shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{ex.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={cn('text-[10px] px-1 py-0.5 rounded border', TYPE_COLORS[ex.type] ?? 'bg-muted text-muted-foreground border-border')}>
                          {ex.type}
                        </span>
                        {ex.duration_min && (
                          <span className="text-[10px] text-muted-foreground">{formatDuration(ex.duration_min)}</span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected preview (order) */}
          {selected.size > 0 && (
            <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Ordem na rotina
              </p>
              {Array.from(selected).map((id, i) => {
                const ex = exerciseMap.get(id)
                return ex ? (
                  <div key={id} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-4 shrink-0">{i + 1}</span>
                    <span className="text-xs truncate">{ex.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleSelect(id)}
                      className="ml-auto p-0.5 text-muted-foreground/40 hover:text-red-400 shrink-0"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ) : null
              })}
            </div>
          )}

          <button
            type="button"
            onClick={handleCreate}
            disabled={!groupName.trim() || isPending}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40"
          >
            {isPending ? 'Criando…' : 'Criar Rotina'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
        >
          <Plus size={15} />
          Nova Rotina
        </button>
      )}

      {/* Groups list */}
      {groups.length === 0 && !creating ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <BookMarked size={32} className="text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhuma rotina criada.</p>
          <p className="text-xs text-muted-foreground/60">
            Agrupe exercícios para inserir em lote nas suas sessões.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map(group => {
            const isExpanded = expandedId === group.id
            const isDeleting = deletingId === group.id
            const items = group.items ?? []

            return (
              <div
                key={group.id}
                className={cn(
                  'rounded-xl border bg-card transition-colors',
                  isDeleting ? 'opacity-40 border-border' : 'border-border',
                )}
              >
                {/* Group header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{group.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {items.length} exerc.
                      {items.reduce((s, i) => s + (i.exercise?.duration_min ?? 0), 0) > 0 &&
                        ` · ${items.reduce((s, i) => s + (i.exercise?.duration_min ?? 0), 0)} min`
                      }
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(group.id)}
                    disabled={isDeleting || isPending}
                    className="p-1.5 text-muted-foreground/30 hover:text-red-400 transition-colors disabled:pointer-events-none"
                  >
                    <Trash2 size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : group.id)}
                    className="p-1.5 text-muted-foreground/50 hover:text-foreground transition-colors"
                  >
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>

                {/* Exercise list (expanded) */}
                {isExpanded && items.length > 0 && (
                  <div className="border-t border-border/50 px-4 py-3 flex flex-col gap-1.5">
                    {items.map((item, i) => {
                      const ex = item.exercise ?? exerciseMap.get(item.exercise_id)
                      return (
                        <div key={item.id} className="flex items-center gap-2.5">
                          <span className="text-[10px] text-muted-foreground w-4 shrink-0">{i + 1}</span>
                          {ex?.diagram_url ? (
                            <img src={ex.diagram_url} alt="" className="w-7 h-7 rounded object-cover shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded bg-muted shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{ex?.name ?? item.exercise_id}</p>
                            {ex && (
                              <span className={cn('text-[10px] px-1 py-0.5 rounded border', TYPE_COLORS[ex.type] ?? 'bg-muted text-muted-foreground border-border')}>
                                {ex.type}
                              </span>
                            )}
                          </div>
                          {ex?.duration_min && (
                            <span className="text-[10px] text-muted-foreground shrink-0">{formatDuration(ex.duration_min)}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {isExpanded && items.length === 0 && (
                  <div className="border-t border-border/50 px-4 py-3">
                    <p className="text-xs text-muted-foreground">Nenhum exercício nesta rotina.</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
