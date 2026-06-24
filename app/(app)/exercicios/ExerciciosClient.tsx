'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Dumbbell, Trash2, CheckSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCategoryClasses } from '@/lib/utils/categoryColors'
import { deleteExerciseAction } from '@/lib/actions/exercises'
import { bulkAssignCategoryAction } from '@/lib/actions/categories'
import type { ExerciseWithCategories, Category } from '@/types'

const TYPE_LABELS: Record<string, string> = {
  tecnico: 'Técnico', cognitivo: 'Cognitivo', fisico: 'Físico', misto: 'Misto',
}
const TYPE_COLORS: Record<string, string> = {
  tecnico:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cognitivo: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  fisico:    'bg-orange-500/20 text-orange-400 border-orange-500/30',
  misto:     'bg-green-500/20 text-green-400 border-green-500/30',
}

interface Props {
  exercises:  ExerciseWithCategories[]
  categories: Category[]
}

export default function ExerciciosClient({ exercises, categories }: Props) {
  const router = useRouter()
  const [isPending, start] = useTransition()

  const [activeCatIds, setActiveCatIds] = useState<string[]>([])
  const [bulkMode, setBulkMode]         = useState(false)
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set())
  const [bulkCatId, setBulkCatId]       = useState('')

  const filtered = activeCatIds.length === 0
    ? exercises
    : exercises.filter(ex =>
        activeCatIds.every(cid => ex.categories.some(c => c.id === cid))
      )

  function toggleFilter(catId: string) {
    setActiveCatIds(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    )
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function exitBulk() {
    setBulkMode(false)
    setSelectedIds(new Set())
    setBulkCatId('')
  }

  function handleBulkAssign() {
    if (!bulkCatId || selectedIds.size === 0) return
    start(async () => {
      await bulkAssignCategoryAction(Array.from(selectedIds), bulkCatId)
      exitBulk()
      router.refresh()
    })
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir "${name}"? Esta ação não pode ser desfeita.`)) return
    start(async () => {
      await deleteExerciseAction(id)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Category filter chips */}
      {categories.length > 0 && (
        <div className="px-4 pt-3 pb-1 flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button key={cat.id} type="button" onClick={() => toggleFilter(cat.id)}
              className={cn(
                'shrink-0 text-[11px] px-2.5 py-1 rounded-full border font-medium transition-all',
                activeCatIds.includes(cat.id)
                  ? getCategoryClasses(cat.color)
                  : 'border-border text-muted-foreground bg-card opacity-60 hover:opacity-100',
              )}>
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="px-4 py-2 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {filtered.length} exercício{filtered.length !== 1 ? 's' : ''}
          {activeCatIds.length > 0 ? ' filtrados' : ''}
        </span>
        {bulkMode ? (
          <button type="button" onClick={exitBulk}
            className="text-xs text-primary px-2 py-1 rounded border border-primary/30">
            Cancelar
          </button>
        ) : (
          exercises.length > 0 && (
            <button type="button" onClick={() => setBulkMode(true)}
              className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 rounded border border-border/50 hover:bg-muted/30 transition-colors">
              <CheckSquare size={12} />
              Em lote
            </button>
          )
        )}
      </div>

      {/* List */}
      <div className="flex flex-col gap-2 px-4 pb-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Dumbbell size={32} className="text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">
              {exercises.length === 0 ? 'Nenhum exercício cadastrado.' : 'Nenhum exercício nesta categoria.'}
            </p>
            {exercises.length === 0 && (
              <Link href="/exercicios/novo"
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                Adicionar exercício
              </Link>
            )}
          </div>
        ) : (
          filtered.map(ex => {
            const isSelected = selectedIds.has(ex.id)
            return (
              <div key={ex.id}
                className={cn(
                  'flex items-start justify-between px-4 py-3 rounded-xl border bg-card gap-3 transition-all',
                  bulkMode && isSelected ? 'border-primary bg-primary/5' : 'border-border',
                )}>
                {/* Bulk checkbox */}
                {bulkMode && (
                  <button type="button" onClick={() => toggleSelect(ex.id)}
                    className={cn(
                      'shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center',
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40',
                    )}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                  </button>
                )}

                {/* Thumbnail */}
                {ex.diagram_url && !bulkMode && (
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-border shrink-0">
                    <Image src={ex.diagram_url} alt={ex.name} fill className="object-cover" />
                  </div>
                )}

                {/* Info */}
                <Link
                  href={bulkMode ? '#' : `/exercicios/${ex.id}`}
                  onClick={bulkMode ? e => { e.preventDefault(); toggleSelect(ex.id) } : undefined}
                  className="flex flex-col gap-1.5 min-w-0 flex-1"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{ex.name}</span>
                    {ex.for_goalkeeper && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">🧤</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', TYPE_COLORS[ex.type] ?? 'bg-muted text-muted-foreground border-border')}>
                      {TYPE_LABELS[ex.type] ?? ex.type}
                    </span>
                    {ex.categories.map(cat => (
                      <span key={cat.id} className={cn('text-[10px] px-1.5 py-0.5 rounded-full border font-medium', getCategoryClasses(cat.color))}>
                        {cat.name}
                      </span>
                    ))}
                  </div>
                  {ex.attribute_target && (
                    <span className="text-[10px] text-muted-foreground">{ex.attribute_target}</span>
                  )}
                </Link>

                {/* Delete (non-bulk) */}
                {!bulkMode && (
                  <button type="button" onClick={() => handleDelete(ex.id, ex.name)} disabled={isPending}
                    className="p-1.5 text-muted-foreground/40 hover:text-red-400 transition-colors shrink-0 mt-0.5">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Bulk floating bar */}
      {bulkMode && selectedIds.size > 0 && (
        <div className="fixed bottom-20 left-3 right-3 z-40 rounded-xl border border-border bg-card p-3 flex flex-col gap-2 shadow-2xl">
          <span className="text-xs text-muted-foreground">
            {selectedIds.size} selecionado{selectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <select value={bulkCatId} onChange={e => setBulkCatId(e.target.value)}
              className="flex-1 rounded-lg border border-input bg-muted px-3 py-2 text-sm outline-none">
              <option value="">Escolher categoria…</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <button type="button" disabled={!bulkCatId || isPending} onClick={handleBulkAssign}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
              {isPending ? '…' : 'Aplicar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
