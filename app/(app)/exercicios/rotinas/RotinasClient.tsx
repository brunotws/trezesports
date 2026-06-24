'use client'

import { useState, useTransition, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/utils/duration'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { Plus, Trash2, ChevronDown, ChevronUp, X, BookMarked } from 'lucide-react'
import { createExerciseGroupAction, deleteExerciseGroupAction } from '@/lib/actions/exerciseGroups'
import ExercisePickerSheet from '@/components/sessao/ExercisePickerSheet'
import ExerciseInstanceCard from '@/components/shared/ExerciseInstanceCard'
import type { Exercise, ExerciseGroup, ExerciseInstance } from '@/types'

const TYPE_COLORS: Record<string, string> = {
  tecnico:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cognitivo: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  fisico:    'bg-orange-500/20 text-orange-400 border-orange-500/30',
  misto:     'bg-green-500/20 text-green-400 border-green-500/30',
}

// ── Drag ghost ────────────────────────────────────────────────────────────────
function ExerciseDragGhost({ exercise }: { exercise: Exercise }) {
  return (
    <div className="flex items-center gap-2 h-12 px-2 rounded-lg border border-primary/30 bg-card shadow-lg shadow-black/20">
      {exercise.diagram_url ? (
        <img src={exercise.diagram_url} alt="" className="w-8 h-8 rounded-md object-cover shrink-0" />
      ) : (
        <div className="w-8 h-8 rounded-md bg-muted shrink-0" />
      )}
      <p className="text-xs font-medium truncate flex-1">{exercise.name}</p>
    </div>
  )
}

interface Props {
  exercises:     Exercise[]
  initialGroups: ExerciseGroup[]
}

export default function RotinasClient({ exercises, initialGroups }: Props) {
  const [isPending, startTransition] = useTransition()

  const [groups, setGroups]         = useState<ExerciseGroup[]>(initialGroups)
  const [creating, setCreating]     = useState(false)
  const [groupName, setGroupName]   = useState('')
  const [instances, setInstances]   = useState<ExerciseInstance[]>([])
  const [sheetOpen, setSheetOpen]   = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // DnD
  const [dragActiveId, setDragActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const exerciseMap = useMemo(
    () => new Map(exercises.map(e => [e.id, e])),
    [exercises],
  )

  // ── Instance actions ───────────────────────────────────────────────────────
  function addInstance(exerciseId: string, customDuration: number | null = null) {
    setInstances(prev => [...prev, { instanceId: crypto.randomUUID(), exerciseId, customDuration }])
  }

  function removeInstance(instanceId: string) {
    setInstances(prev => prev.filter(i => i.instanceId !== instanceId))
  }

  function duplicateInstance(instanceId: string) {
    setInstances(prev => {
      const idx = prev.findIndex(i => i.instanceId === instanceId)
      if (idx === -1) return prev
      const copy: ExerciseInstance = { ...prev[idx], instanceId: crypto.randomUUID() }
      const next = [...prev]
      next.splice(idx + 1, 0, copy)
      return next
    })
  }

  function editInstanceDuration(instanceId: string, value: number | null) {
    setInstances(prev => prev.map(i =>
      i.instanceId === instanceId ? { ...i, customDuration: value } : i,
    ))
  }

  // ── DnD ───────────────────────────────────────────────────────────────────
  function handleDragStart({ active }: DragStartEvent) {
    setDragActiveId(active.id as string)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setDragActiveId(null)
    if (!over || active.id === over.id) return
    setInstances(prev => {
      const oldIdx = prev.findIndex(i => i.instanceId === active.id)
      const newIdx = prev.findIndex(i => i.instanceId === over.id)
      if (oldIdx === -1 || newIdx === -1) return prev
      return arrayMove(prev, oldIdx, newIdx)
    })
  }

  const dragActiveExercise = dragActiveId
    ? exerciseMap.get(instances.find(i => i.instanceId === dragActiveId)?.exerciseId ?? '')
    : undefined

  // ── Creation form actions ──────────────────────────────────────────────────
  function cancelCreate() {
    setCreating(false)
    setGroupName('')
    setInstances([])
  }

  function handleCreate() {
    if (!groupName.trim() || instances.length === 0) return
    const items = instances.map(i => ({ exerciseId: i.exerciseId, customDuration: i.customDuration }))

    startTransition(async () => {
      const group = await createExerciseGroupAction(groupName.trim(), items)
      const withItems: ExerciseGroup = {
        ...group,
        items: instances.map((inst, idx) => ({
          id:              `${group.id}-${idx}`,
          group_id:        group.id,
          exercise_id:     inst.exerciseId,
          position:        idx,
          custom_duration: inst.customDuration,
          exercise:        exerciseMap.get(inst.exerciseId),
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

  const instanceIds = instances.map(i => i.instanceId)

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

          {/* Exercise builder */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              Exercícios{' '}
              {instances.length > 0 && <span className="text-primary">({instances.length})</span>}
            </p>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={instanceIds} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-1.5">
                  {instances.map(inst => (
                    <ExerciseInstanceCard
                      key={inst.instanceId}
                      instanceId={inst.instanceId}
                      exercise={exerciseMap.get(inst.exerciseId)}
                      customDuration={inst.customDuration}
                      onRemove={() => removeInstance(inst.instanceId)}
                      onDuplicate={() => duplicateInstance(inst.instanceId)}
                      onEditDuration={val => editInstanceDuration(inst.instanceId, val)}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay dropAnimation={null}>
                {dragActiveExercise && <ExerciseDragGhost exercise={dragActiveExercise} />}
              </DragOverlay>
            </DndContext>

            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className={cn(
                'w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed text-xs transition-colors',
                instances.length > 0 ? 'mt-1' : '',
                'border-border text-muted-foreground hover:border-primary/50 hover:text-primary',
              )}
            >
              <Plus size={12} />
              Exercício
            </button>
          </div>

          <button
            type="button"
            onClick={handleCreate}
            disabled={!groupName.trim() || instances.length === 0 || isPending}
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
            const totalDur = items.reduce((s, i) => s + (i.custom_duration ?? i.exercise?.duration_min ?? 0), 0)

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
                      {totalDur > 0 && ` · ${totalDur.toFixed(0)} min`}
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
                      const dur = item.custom_duration ?? ex?.duration_min
                      const isCustomDur = item.custom_duration !== null && item.custom_duration !== ex?.duration_min
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
                          {dur ? (
                            <span className={cn('text-[10px] shrink-0', isCustomDur ? 'text-primary font-semibold' : 'text-muted-foreground')}>
                              {formatDuration(dur)}
                            </span>
                          ) : null}
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

      {/* Exercise picker sheet */}
      <ExercisePickerSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        exercises={exercises}
        groups={[]}
        selectedIds={new Set<string>()}
        onAdd={exerciseId => addInstance(exerciseId, null)}
        onAddGroup={() => {}}
      />
    </div>
  )
}
