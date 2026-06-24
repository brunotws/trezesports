'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { X, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCategoryClasses } from '@/lib/utils/categoryColors'
import { createCategoryAction } from '@/lib/actions/categories'
import type { Category } from '@/types'

interface Props {
  allCategories:      Category[]
  selectedIds:        string[]
  onChange:           (ids: string[]) => void
  onCategoryCreated?: (cat: Category) => void
}

export default function CategoryPicker({ allCategories, selectedIds, onChange, onCategoryCreated }: Props) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const [isPending, start]  = useTransition()
  const containerRef        = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const selected = allCategories.filter(c => selectedIds.includes(c.id))
  const filtered = allCategories.filter(
    c => c.name.toLowerCase().includes(search.toLowerCase()) && !selectedIds.includes(c.id)
  )
  const canCreate = search.trim().length > 0 &&
    !allCategories.some(c => c.name.toLowerCase() === search.trim().toLowerCase())

  function toggle(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id])
  }

  function handleCreate() {
    if (!search.trim()) return
    start(async () => {
      const cat = await createCategoryAction(search.trim(), 'zinc')
      onChange([...selectedIds, cat.id])
      onCategoryCreated?.(cat)
      setSearch('')
    })
  }

  return (
    <div className="flex flex-col gap-2" ref={containerRef}>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(cat => (
            <span key={cat.id}
              className={cn('flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium', getCategoryClasses(cat.color))}>
              {cat.name}
              <button type="button" onClick={() => toggle(cat.id)} className="opacity-60 hover:opacity-100">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <div className="flex items-center gap-2 w-full rounded-lg border border-input bg-muted px-3 py-2.5">
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Buscar ou criar categoria…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
        </div>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 z-30 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
            {filtered.length > 0 && (
              <div className="max-h-48 overflow-y-auto">
                {filtered.map(cat => (
                  <button key={cat.id} type="button"
                    onClick={() => { toggle(cat.id); setSearch('') }}
                    className="w-full px-3 py-2.5 text-left hover:bg-muted/50 flex items-center gap-2">
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border font-medium', getCategoryClasses(cat.color))}>
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {canCreate && (
              <button type="button" disabled={isPending} onClick={handleCreate}
                className="w-full px-3 py-3 text-left text-sm flex items-center gap-2 border-t border-border hover:bg-muted/40 text-primary font-medium disabled:opacity-50">
                <Plus size={14} />
                Criar "{search.trim()}"
              </button>
            )}

            {filtered.length === 0 && !canCreate && (
              <p className="px-3 py-3 text-xs text-muted-foreground">
                {search ? 'Nenhuma categoria encontrada.' : 'Nenhuma categoria cadastrada ainda.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
