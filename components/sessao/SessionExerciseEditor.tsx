'use client'

import { useState, useTransition } from 'react'
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
import ExerciseInstanceCard from '@/components/shared/ExerciseInstanceCard'
import {
  deleteSessionExerciseAction,
  reorderSessionExercisesAction,
  updateSessionExerciseDurationAction,
  insertDuplicateSessionExerciseAction,
} from '@/lib/actions/sessions'
import type { SessionExercise, Stage } from '@/types'

interface Props {
  sessionId:        string
  stages:           Stage[] | undefined
  initialExercises: SessionExercise[]
}

export default function SessionExerciseEditor({ sessionId, stages, initialExercises }: Props) {
  const [, startTransition] = useTransition()
  const [items, setItems]   = useState<SessionExercise[]>(
    [...initialExercises].sort((a, b) => a.position - b.position),
  )
  const [dragActiveId, setDragActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const dynamicStages = stages ?? []
  const useDynamic    = dynamicStages.length > 0

  function itemsForStage(stageName: string): SessionExercise[] {
    return items.filter(i =>
      stageName === '__legacy'
        ? true
        : i.block_type === stageName,
    )
  }

  function stageNameOf(id: string): string {
    const item = items.find(i => i.id === id)
    if (!item) return '__legacy'
    return item.block_type ?? '__legacy'
  }

  // Renumber all items in stage order, return new list
  function renumber(newItems: SessionExercise[]): SessionExercise[] {
    const stageOrder = useDynamic ? dynamicStages.map(s => s.name) : ['__legacy']
    let pos = 0
    const result = [...newItems]
    for (const sn of stageOrder) {
      const filtered = result.filter(i =>
        sn === '__legacy' ? !i.block_type : i.block_type === sn,
      )
      filtered.forEach(item => {
        const idx = result.findIndex(r => r.id === item.id)
        result[idx] = { ...item, position: pos++ }
      })
    }
    return result
  }

  // ── Drag ──────────────────────────────────────────────────────────────────
  function handleDragStart({ active }: DragStartEvent) {
    setDragActiveId(active.id as string)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setDragActiveId(null)
    if (!over || active.id === over.id) return

    const activeStageName = stageNameOf(active.id as string)
    if (activeStageName !== stageNameOf(over.id as string)) return // no cross-stage

    const stageItems = itemsForStage(activeStageName)
    const oldIdx = stageItems.findIndex(i => i.id === active.id)
    const newIdx = stageItems.findIndex(i => i.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return

    const reorderedStage = arrayMove(stageItems, oldIdx, newIdx)
    const otherItems     = items.filter(i =>
      activeStageName === '__legacy' ? false : i.block_type !== activeStageName,
    )
    const merged  = activeStageName === '__legacy' ? reorderedStage : [...otherItems, ...reorderedStage]
    const updated = renumber(merged)
    setItems(updated)

    startTransition(async () => {
      await reorderSessionExercisesAction(sessionId, updated.map(i => ({ id: i.id, position: i.position })))
    })
  }

  // ── Exercise mutations ────────────────────────────────────────────────────
  function handleRemove(id: string) {
    setItems(prev => renumber(prev.filter(i => i.id !== id)))
    startTransition(async () => { await deleteSessionExerciseAction(id, sessionId) })
  }

  function handleDuplicate(se: SessionExercise) {
    const tempId = `temp-${crypto.randomUUID()}`
    const tempSe: SessionExercise = { ...se, id: tempId }

    setItems(prev => {
      const idx = prev.findIndex(i => i.id === se.id)
      const next = [...prev]
      next.splice(idx + 1, 0, tempSe)
      return renumber(next)
    })

    startTransition(async () => {
      const newSe = await insertDuplicateSessionExerciseAction(
        sessionId, se.exercise_id, se.block_type, se.position + 0.5, se.custom_duration,
      )
      setItems(prev => {
        const next = prev.map(i => i.id === tempId ? { ...newSe, exercise: se.exercise } : i)
        return renumber(next)
      })
    })
  }

  function handleEditDuration(id: string, value: number | null) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, custom_duration: value } : i))
    startTransition(async () => { await updateSessionExerciseDurationAction(id, value, sessionId) })
  }

  const dragActiveExercise = items.find(i => i.id === dragActiveId)?.exercise

  // ── Render a single stage ─────────────────────────────────────────────────
  function renderStage(stageName: string, label?: string) {
    const stageItems = itemsForStage(stageName)
    if (stageItems.length === 0) return null
    const ids    = stageItems.map(i => i.id)
    const durMin = stageItems.reduce((s, i) => s + (i.custom_duration ?? i.exercise?.duration_min ?? 0), 0)

    return (
      <div key={stageName}>
        {label && (
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            {durMin > 0 && (
              <span className="text-[10px] text-muted-foreground">{durMin.toFixed(0)} min</span>
            )}
          </div>
        )}
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5">
            {stageItems.map(se => (
              <ExerciseInstanceCard
                key={se.id}
                instanceId={se.id}
                exercise={se.exercise}
                customDuration={se.custom_duration}
                onRemove={() => handleRemove(se.id)}
                onDuplicate={() => handleDuplicate(se)}
                onEditDuration={val => handleEditDuration(se.id, val)}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-3">
        {useDynamic
          ? dynamicStages.map(s => renderStage(s.name, s.name))
          : renderStage('__legacy')
        }
      </div>

      <DragOverlay dropAnimation={null}>
        {dragActiveExercise && (
          <div className="flex items-center gap-2 h-12 px-2 rounded-lg border border-primary/30 bg-card shadow-lg shadow-black/20">
            <p className="text-xs font-medium truncate flex-1">{dragActiveExercise.name}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
