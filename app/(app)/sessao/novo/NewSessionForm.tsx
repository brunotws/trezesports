'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, X, Trash2 } from 'lucide-react'
import { createSessionAction, addAthletesToSessionAction, addExercisesToSessionAction } from '@/lib/actions/sessions'
import ExercisePickerSheet from '@/components/sessao/ExercisePickerSheet'
import type { Athlete, Exercise, ExerciseGroup, Stage } from '@/types'

const CATEGORIES = ['Sub-7','Sub-8','Sub-9','Sub-10','Sub-11','Sub-12','Sub-13','Sub-14','Sub-15']
const OBJECTIVES = ['Técnico', 'Tático', 'Cognitivo', 'Misto']
const TYPE_COLORS: Record<string, string> = {
  tecnico:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cognitivo: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  fisico:    'bg-orange-500/20 text-orange-400 border-orange-500/30',
  misto:     'bg-green-500/20 text-green-400 border-green-500/30',
}

// ── Sortable exercise card ────────────────────────────────────────────────────
function SortableExerciseCard({
  id,
  exercise,
  onRemove,
}: {
  id: string
  exercise: Exercise | undefined
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  if (!exercise) return null

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex items-center gap-2 h-12 px-2 rounded-lg border border-border bg-card"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="p-1 touch-none cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
      >
        <GripVertical size={14} />
      </button>

      {exercise.diagram_url ? (
        <img src={exercise.diagram_url} alt="" className="w-8 h-8 rounded-md object-cover shrink-0" />
      ) : (
        <div className="w-8 h-8 rounded-md bg-muted shrink-0 flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground/40">⚽</span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{exercise.name}</p>
        <div className="flex items-center gap-1.5">
          <span className={cn('text-[10px] px-1 py-0.5 rounded border shrink-0', TYPE_COLORS[exercise.type] ?? 'bg-muted text-muted-foreground border-border')}>
            {exercise.type}
          </span>
          {exercise.attribute_target && (
            <span className="text-[10px] text-muted-foreground truncate">{exercise.attribute_target}</span>
          )}
        </div>
      </div>

      {exercise.duration_min && (
        <span className="text-[10px] text-muted-foreground shrink-0">{formatDuration(exercise.duration_min)}</span>
      )}

      <button
        type="button"
        onClick={onRemove}
        className="p-1 shrink-0 text-muted-foreground/30 hover:text-red-400 transition-colors"
      >
        <X size={13} />
      </button>
    </div>
  )
}

// ── DragOverlay card (ghost while dragging) ───────────────────────────────────
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

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  weekId:    string
  day:       number
  sn:        number
  date:      string
  athletes:  Athlete[]
  exercises: Exercise[]
  groups:    ExerciseGroup[]
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NewSessionForm({ weekId, day, sn, date, athletes, exercises, groups }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Header
  const [title, setTitle]               = useState('')
  const [scheduledTime, setScheduledTime] = useState('09:00')
  const [category, setCategory]         = useState('')
  const [objective, setObjective]       = useState('')

  // Athletes
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<Set<string>>(new Set())

  // Stages: each stage has an id (UUID) and a name
  const initId = () => crypto.randomUUID()
  const [stages, setStages] = useState<Stage[]>(() => [
    { id: initId(), name: 'Nova Etapa' },
  ])
  // stageExercises: stageId → exerciseId[]
  const [stageExercises, setStageExercises] = useState<Record<string, string[]>>({})

  // Sheet (exercise picker)
  const [sheetOpen, setSheetOpen]       = useState(false)
  const [activeStageId, setActiveStageId] = useState<string | null>(null)

  // DnD
  const [dragActiveId, setDragActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  // Coach log
  const [coachNotes, setCoachNotes]       = useState('')
  const [teamIntensity, setTeamIntensity] = useState<number | null>(null)

  // ── Helpers ────────────────────────────────────────────────────────────────
  const exerciseMap = useMemo(
    () => new Map(exercises.map(e => [e.id, e])),
    [exercises],
  )

  function stageDuration(stageId: string): number {
    return (stageExercises[stageId] ?? []).reduce(
      (sum, eid) => sum + (exerciseMap.get(eid)?.duration_min ?? 0),
      0,
    )
  }

  const totalDuration = useMemo(
    () => stages.reduce((sum, s) => sum + stageDuration(s.id), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stages, stageExercises],
  )

  function findStageIdByExerciseId(exerciseId: string): string | null {
    for (const stage of stages) {
      if ((stageExercises[stage.id] ?? []).includes(exerciseId)) return stage.id
    }
    return null
  }

  // ── Stage actions ──────────────────────────────────────────────────────────
  function addStage() {
    const id = crypto.randomUUID()
    setStages(prev => [...prev, { id, name: 'Nova Etapa' }])
    // no need to pre-populate stageExercises; it defaults to [] via ?? []
  }

  function removeStage(stageId: string) {
    setStages(prev => prev.filter(s => s.id !== stageId))
    setStageExercises(prev => {
      const next = { ...prev }
      delete next[stageId]
      return next
    })
  }

  function renameStage(stageId: string, name: string) {
    setStages(prev => prev.map(s => s.id === stageId ? { ...s, name } : s))
  }

  // ── Exercise actions ───────────────────────────────────────────────────────
  function addExerciseToStage(stageId: string, exerciseId: string) {
    setStageExercises(prev => ({
      ...prev,
      [stageId]: [...(prev[stageId] ?? []), exerciseId],
    }))
  }

  function addMultipleToStage(stageId: string, exerciseIds: string[]) {
    setStageExercises(prev => {
      const current = prev[stageId] ?? []
      const toAdd = exerciseIds.filter(id => !current.includes(id))
      if (toAdd.length === 0) return prev
      return { ...prev, [stageId]: [...current, ...toAdd] }
    })
  }

  function removeExerciseFromStage(stageId: string, exerciseId: string) {
    setStageExercises(prev => ({
      ...prev,
      [stageId]: (prev[stageId] ?? []).filter(id => id !== exerciseId),
    }))
  }

  function openSheet(stageId: string) {
    setActiveStageId(stageId)
    setSheetOpen(true)
  }

  // ── DnD ───────────────────────────────────────────────────────────────────
  function handleDragStart({ active }: DragStartEvent) {
    setDragActiveId(active.id as string)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setDragActiveId(null)
    if (!over || active.id === over.id) return

    const stageId = findStageIdByExerciseId(active.id as string)
    if (!stageId) return

    setStageExercises(prev => {
      const items = [...(prev[stageId] ?? [])]
      const oldIdx = items.indexOf(active.id as string)
      const newIdx = items.indexOf(over.id as string)
      if (oldIdx === -1 || newIdx === -1) return prev
      return { ...prev, [stageId]: arrayMove(items, oldIdx, newIdx) }
    })
  }

  // ── Athletes ───────────────────────────────────────────────────────────────
  function toggleAthlete(id: string) {
    setSelectedAthleteIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  function handleSubmit() {
    startTransition(async () => {
      const { id } = await createSessionAction(weekId, day, sn, 'free', {
        title:         title.trim() || null,
        scheduledTime: scheduledTime || null,
        category:      category || null,
        objective:     objective || null,
        coachNotes:    coachNotes.trim() || null,
        teamIntensity: teamIntensity,
        stages,
      })

      if (selectedAthleteIds.size > 0) {
        await addAthletesToSessionAction(id, Array.from(selectedAthleteIds))
      }

      let pos = 0
      const flatExercises = stages.flatMap(stage =>
        (stageExercises[stage.id] ?? []).map(exerciseId => ({
          exerciseId,
          blockType: stage.name,
          position:  pos++,
        })),
      )

      if (flatExercises.length > 0) {
        await addExercisesToSessionAction(id, flatExercises)
      }

      router.push(`/sessao/${id}`)
    })
  }

  const dragActiveExercise = dragActiveId ? exerciseMap.get(dragActiveId) : undefined

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 px-4 py-6 pb-24">

      {/* ═══ 1. CABEÇALHO ═══ */}
      <section className="flex flex-col gap-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Cabeçalho da Sessão
        </p>

        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Título da sessão (opcional)"
          className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />

        <div>
          <p className="text-[10px] text-muted-foreground mb-1">Horário</p>
          <input
            type="time"
            value={scheduledTime}
            onChange={e => setScheduledTime(e.target.value)}
            className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <p className="text-[10px] text-muted-foreground mb-2">Categoria</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(category === cat ? '' : cat)}
                className={cn(
                  'px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
                  category === cat
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border text-muted-foreground',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] text-muted-foreground mb-2">Objetivo Principal</p>
          <div className="grid grid-cols-4 gap-2">
            {OBJECTIVES.map(obj => (
              <button
                key={obj}
                type="button"
                onClick={() => setObjective(objective === obj ? '' : obj)}
                className={cn(
                  'py-2 rounded-lg border text-xs font-semibold transition-all',
                  objective === obj
                    ? 'border-primary/50 bg-primary/15 text-primary'
                    : 'border-border text-muted-foreground',
                )}
              >
                {obj}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 2. ATLETAS ═══ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Atletas ({selectedAthleteIds.size}/{athletes.length})
          </p>
          <button
            type="button"
            onClick={() => setSelectedAthleteIds(new Set(athletes.map(a => a.id)))}
            className="text-xs text-primary underline-offset-2 hover:underline"
          >
            Todos
          </button>
        </div>
        {athletes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum atleta cadastrado.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {athletes.map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleAthlete(a.id)}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-md border text-sm transition-colors',
                  selectedAthleteIds.has(a.id)
                    ? 'border-primary/40 bg-primary/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground',
                )}
              >
                <span>{a.name}</span>
                <span className="text-[10px] opacity-60">{a.position ?? '—'}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ═══ 3. LINHA DO TEMPO ═══ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Linha do Tempo
          </p>
          {totalDuration > 0 && (
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
              {totalDuration} min
            </span>
          )}
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-col gap-3">
            {stages.map(stage => {
              const exerciseIds = stageExercises[stage.id] ?? []
              const dur = stageDuration(stage.id)

              return (
                <div key={stage.id} className="rounded-xl border border-border bg-card/40 p-3">

                  {/* Stage header */}
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      value={stage.name}
                      onChange={e => renameStage(stage.id, e.target.value)}
                      placeholder="Nome da etapa"
                      className="flex-1 bg-transparent text-sm font-semibold outline-none focus:underline underline-offset-2 min-w-0"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      {dur > 0 && (
                        <span className="text-[10px] text-muted-foreground">{dur} min</span>
                      )}
                      {stages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStage(stage.id)}
                          className="p-1 text-muted-foreground/30 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Exercises */}
                  <SortableContext items={exerciseIds} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-1.5">
                      {exerciseIds.map(eid => (
                        <SortableExerciseCard
                          key={eid}
                          id={eid}
                          exercise={exerciseMap.get(eid)}
                          onRemove={() => removeExerciseFromStage(stage.id, eid)}
                        />
                      ))}
                    </div>
                  </SortableContext>

                  {/* Add exercise button — always at bottom */}
                  <button
                    type="button"
                    onClick={() => openSheet(stage.id)}
                    className={cn(
                      'w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed text-xs transition-colors',
                      exerciseIds.length > 0 ? 'mt-2' : '',
                      'border-border text-muted-foreground hover:border-primary/50 hover:text-primary',
                    )}
                  >
                    <Plus size={12} />
                    Exercício
                  </button>
                </div>
              )
            })}
          </div>

          <DragOverlay dropAnimation={null}>
            {dragActiveExercise && (
              <ExerciseDragGhost exercise={dragActiveExercise} />
            )}
          </DragOverlay>
        </DndContext>

        {/* Add stage */}
        <button
          type="button"
          onClick={addStage}
          className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border/50 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Plus size={13} />
          Adicionar Etapa
        </button>
      </section>

      {/* ═══ 4. DIÁRIO DE BORDO ═══ */}
      <section className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Diário de Bordo{' '}
          <span className="font-normal normal-case tracking-normal text-muted-foreground/50">(opcional)</span>
        </p>

        <textarea
          value={coachNotes}
          onChange={e => setCoachNotes(e.target.value)}
          placeholder="Anotações e ajustes do treinador…"
          rows={3}
          className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
        />

        <div>
          <p className="text-[10px] text-muted-foreground mb-2">Percepção de intensidade da turma</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setTeamIntensity(teamIntensity === n ? null : n)}
                className={cn(
                  'flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all',
                  teamIntensity === n
                    ? 'border-primary/50 bg-primary/15 text-primary'
                    : 'border-border text-muted-foreground',
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-1 px-0.5">
            <span className="text-[10px] text-muted-foreground">Muito leve</span>
            <span className="text-[10px] text-muted-foreground">Máximo</span>
          </div>
        </div>
      </section>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
      >
        {isPending ? 'Criando…' : 'Criar Sessão'}
      </button>

      {/* Exercise picker drawer */}
      <ExercisePickerSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        exercises={exercises}
        groups={groups}
        selectedIds={new Set(activeStageId ? (stageExercises[activeStageId] ?? []) : [])}
        onAdd={exerciseId => {
          if (activeStageId) addExerciseToStage(activeStageId, exerciseId)
        }}
        onAddGroup={exerciseIds => {
          if (activeStageId) addMultipleToStage(activeStageId, exerciseIds)
        }}
      />
    </div>
  )
}
