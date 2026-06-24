'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Copy, X, Check, RotateCcw } from 'lucide-react'
import { formatDuration } from '@/lib/utils/duration'
import { cn } from '@/lib/utils'
import type { Exercise } from '@/types'

const TYPE_COLORS: Record<string, string> = {
  tecnico:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cognitivo: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  fisico:    'bg-orange-500/20 text-orange-400 border-orange-500/30',
  misto:     'bg-green-500/20 text-green-400 border-green-500/30',
}

interface DurationEditorProps {
  initialValue:  number | null
  hasCustom:     boolean
  onConfirm:     (min: string, sec: string) => void
  onReset:       () => void
  onCancel:      () => void
}

function DurationEditor({ initialValue, hasCustom, onConfirm, onReset, onCancel }: DurationEditorProps) {
  const initMin = Math.floor(initialValue ?? 0)
  const initSec = Math.round(((initialValue ?? 0) - initMin) * 60)
  const [editMin, setEditMin] = useState(initMin.toString())
  const [editSec, setEditSec] = useState(initSec.toString())

  return (
    <div className="border-t border-border/50 px-3 py-2 flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground shrink-0">Duração:</span>
      <input
        type="number"
        min="0"
        value={editMin}
        onChange={e => setEditMin(e.target.value)}
        autoFocus
        className="w-11 rounded border border-input bg-background px-1.5 py-1 text-xs text-center outline-none focus:ring-1 focus:ring-ring"
      />
      <span className="text-[10px] text-muted-foreground">min</span>
      <input
        type="number"
        min="0"
        max="59"
        value={editSec}
        onChange={e => setEditSec(e.target.value)}
        className="w-11 rounded border border-input bg-background px-1.5 py-1 text-xs text-center outline-none focus:ring-1 focus:ring-ring"
      />
      <span className="text-[10px] text-muted-foreground">seg</span>
      <button
        type="button"
        onClick={() => onConfirm(editMin, editSec)}
        className="ml-1 p-1 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
      >
        <Check size={12} />
      </button>
      {hasCustom && (
        <button
          type="button"
          onClick={onReset}
          title="Restaurar padrão"
          className="p-1 rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          <RotateCcw size={11} />
        </button>
      )}
      <button
        type="button"
        onClick={onCancel}
        className="p-1 rounded text-muted-foreground/30 hover:text-muted-foreground transition-colors"
      >
        <X size={11} />
      </button>
    </div>
  )
}

interface Props {
  instanceId:     string
  exercise:       Exercise | undefined
  customDuration: number | null
  onRemove:       () => void
  onDuplicate:    () => void
  onEditDuration: (value: number | null) => void
}

export default function ExerciseInstanceCard({
  instanceId,
  exercise,
  customDuration,
  onRemove,
  onDuplicate,
  onEditDuration,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: instanceId })

  const [editing, setEditing] = useState(false)

  const defaultDuration = exercise?.duration_min ?? null
  const displayDuration = customDuration ?? defaultDuration
  const isCustom = customDuration !== null

  function handleConfirmEdit(editMin: string, editSec: string) {
    const min = Math.max(0, parseInt(editMin) || 0)
    const sec = Math.max(0, Math.min(59, parseInt(editSec) || 0))
    const total = min + sec / 60
    onEditDuration(total > 0 ? total : null)
    setEditing(false)
  }

  if (!exercise) return null

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="rounded-lg border border-border bg-card"
    >
      {/* Main row */}
      <div className="flex items-center gap-2 h-12 px-2">
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
            {displayDuration ? (
              <span className={cn('text-[10px] shrink-0', isCustom ? 'text-primary font-semibold' : 'text-muted-foreground')}>
                {formatDuration(displayDuration)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setEditing(v => !v)}
            className={cn('p-1.5 transition-colors', editing ? 'text-primary' : 'text-muted-foreground/30 hover:text-primary')}
          >
            <Pencil size={11} />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1.5 text-muted-foreground/30 hover:text-primary transition-colors"
          >
            <Copy size={11} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 text-muted-foreground/30 hover:text-red-400 transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Inline duration editor */}
      {editing && (
        <DurationEditor
          initialValue={customDuration ?? defaultDuration}
          hasCustom={isCustom}
          onConfirm={handleConfirmEdit}
          onReset={() => { onEditDuration(null); setEditing(false) }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  )
}
