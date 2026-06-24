'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
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
import ExercisePickerSheet from '@/components/sessao/ExercisePickerSheet'
import {
  deleteSessionExerciseAction,
  reorderSessionExercisesAction,
  updateSessionExerciseDurationAction,
  insertDuplicateSessionExerciseAction,
  addExercisesToSessionEditorAction,
} from '@/lib/actions/sessions'
import type { SessionExercise, Stage, Exercise, ExerciseGroup } from '@/types'

interface Props {
  sessionId:        string
  stages:           Stage[] | undefined
  initialExercises: SessionExercise[]
  exercises?:       Exercise[]
  groups?:          ExerciseGroup[]
}

export default function SessionExerciseEditor({ sessionId, stages, initialExercises, exercises, groups }: Props) {
  const [, startTransition] = useTransition()
  const [items, setItems]   = useState<SessionExercise[]>(
    [...initialExercises].sort((a, b) => a.position - b.position),
  )
  const [dragActiveId, setDragActiveId] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen]     = useState(false)
  const [pickerStage, setPickerStage]   = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const dynamicStages = stages ?? []
  const useDynamic    = dynamicStages.length > 0
  const hasLibrary    = (exercises?.length ?? 0) > 0

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
    if (activeStageName !== stageNameOf(over.id as string)) return

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
      // Use 9999 as temp position (integer — never fractional)
      const newSe = await insertDuplicateSessionExerciseAction(
        sessionId, se.exercise_id, se.block_type, 9999, se.custom_duration,
      )
      setItems(prev => {
        const next = prev.map(i => i.id === tempId ? { ...newSe, exercise: se.exercise } : i)
        const renumbered = renumber(next)
        void reorderSessionExercisesAction(sessionId, renumbered.map(i => ({ id: i.id, position: i.position })))
        return renumbered
      })
    })
  }

  function handleEditDuration(id: string, value: number | null) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, custom_duration: value } : i))
    startTransition(async () => { await updateSessionExerciseDurationAction(id, value, sessionId) })
  }

  // ── Add exercises from library ────────────────────────────────────────────
  function handleAddExercise(exerciseId: string) {
    const exercise = exercises?.find(e => e.id === exerciseId)
    const blockType = pickerStage === '__legacy' ? null : pickerStage
    const tempId = `temp-${crypto.randomUUID()}`
    const tempSe: SessionExercise = {
      id: tempId,
      session_id: sessionId,
      exercise_id: exerciseId,
      position: 0,
      block_type: blockType,
      custom_duration: null,
      skipped: false,
      exercise,
    }

    setItems(prev => renumber([...prev, tempSe]))

    startTransition(async () => {
      const [newSe] = await addExercisesToSessionEditorAction(sessionId, [
        { exerciseId, blockType, position: 9999, customDuration: null },
      ])
      if (!newSe) return
      setItems(prev => {
        const next = prev.map(i => i.id === tempId ? { ...newSe, exercise: exercise ?? newSe.exercise } : i)
        const renumbered = renumber(next)
        void reorderSessionExercisesAction(sessionId, renumbered.map(i => ({ id: i.id, position: i.position })))
        return renumbered
      })
    })
  }

  function handleAddGroup(groupItems: Array<{ exerciseId: string; customDuration: number | null }>) {
    const blockType = pickerStage === '__legacy' ? null : pickerStage
    setPickerOpen(false)

    startTransition(async () => {
      const newSes = await addExercisesToSessionEditorAction(
        sessionId,
        groupItems.map(({ exerciseId, customDuration }, idx) => ({
          exerciseId,
          blockType,
          position: 9999 + idx,
          customDuration,
        })),
      )
      setItems(prev => {
        const enriched = newSes.map(se => ({
          ...se,
          exercise: exercises?.find(e => e.id === se.exercise_id) ?? se.exercise,
        }))
        const merged = [...prev, ...enriched]
        const renumbered = renumber(merged)
        void reorderSessionExercisesAction(sessionId, renumbered.map(i => ({ id: i.id, position: i.position })))
        return renumbered
      })
    })
  }

  const dragActiveExercise = items.find(i => i.id === dragActiveId)?.exercise

  // ── Render a single stage ─────────────────────────────────────────────────
  function renderStage(stageName: string, label?: string) {
    const stageItems = itemsForStage(stageName)
    if (stageItems.length === 0 && !hasLibrary) return null

    const ids    = stageItems.map(i => i.id)
    const durMin = stageItems.reduce((s, i) => s + (i.custom_duration ?? i.exercise?.duration_min ?? 0), 0)

    return (
      <div key={stageName}>
        {label && (
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <div className="flex items-center gap-2">
              {durMin > 0 && (
                <span className="text-[10px] text-muted-foreground">{durMin.toFixed(0)} min</span>
              )}
              {hasLibrary && (
                <button
                  type="button"
                  onClick={() => { setPickerStage(stageName); setPickerOpen(true) }}
                  className="flex items-center gap-0.5 text-[10px] font-semibold text-primary px-1.5 py-0.5 rounded border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-colors"
                >
                  <Plus size={10} /> Add
                </button>
              )}
            </div>
          </div>
        )}
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5">
            {stageItems.length === 0 && (
              <div className="h-10 rounded-lg border border-dashed border-border/40 flex items-center justify-center">
                <span className="text-[11px] text-muted-foreground/40">Vazio — toque em Add</span>
              </div>
            )}
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
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col gap-3">
          {useDynamic
            ? dynamicStages.map(s => renderStage(s.name, s.name))
            : (
              <div className="flex flex-col gap-3">
                {renderStage('__legacy')}
                {hasLibrary && (
                  <button
                    type="button"
                    onClick={() => { setPickerStage('__legacy'); setPickerOpen(true) }}
                    className="w-full py-2.5 rounded-xl border border-dashed border-primary/30 text-primary text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-primary/5 transition-colors"
                  >
                    <Plus size={13} /> Adicionar exercício
                  </button>
                )}
              </div>
            )
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

      {hasLibrary && (
        <ExercisePickerSheet
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          exercises={exercises ?? []}
          groups={groups ?? []}
          selectedIds={new Set<string>()}
          onAdd={handleAddExercise}
          onAddGroup={handleAddGroup}
        />
      )}
    </>
  )
}
