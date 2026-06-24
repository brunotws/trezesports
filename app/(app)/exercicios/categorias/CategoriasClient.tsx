'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORY_COLORS, getCategoryClasses } from '@/lib/utils/categoryColors'
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from '@/lib/actions/categories'
import type { Category } from '@/types'

interface Props { categories: Category[] }

export default function CategoriasClient({ categories: initial }: Props) {
  const [cats, setCats]           = useState<Category[]>(initial)
  const [isPending, start]        = useTransition()
  const [creating, setCreating]   = useState(false)
  const [newName, setNewName]     = useState('')
  const [newColor, setNewColor]   = useState('zinc')
  const [editId, setEditId]       = useState<string | null>(null)
  const [editName, setEditName]   = useState('')
  const [editColor, setEditColor] = useState('zinc')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  function handleCreate() {
    if (!newName.trim()) return
    start(async () => {
      const cat = await createCategoryAction(newName.trim(), newColor)
      setCats(prev => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)))
      setCreating(false)
      setNewName('')
      setNewColor('zinc')
    })
  }

  function startEdit(cat: Category) {
    setEditId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color)
  }

  function handleUpdate() {
    if (!editId || !editName.trim()) return
    start(async () => {
      await updateCategoryAction(editId, editName.trim(), editColor)
      setCats(prev => prev.map(c => c.id === editId ? { ...c, name: editName.trim(), color: editColor } : c))
      setEditId(null)
    })
  }

  function handleDelete(id: string) {
    start(async () => {
      await deleteCategoryAction(id)
      setCats(prev => prev.filter(c => c.id !== id))
      setConfirmDeleteId(null)
    })
  }

  return (
    <>
      <div className="flex flex-col gap-3">

        {/* Create form */}
        {creating ? (
          <div className="rounded-xl border border-primary/30 bg-card p-4 flex flex-col gap-3">
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Nome da categoria…"
              className="w-full rounded-lg border border-input bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORY_COLORS.map(c => (
                <button key={c.value} type="button" onClick={() => setNewColor(c.value)}
                  className={cn('px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all', c.classes,
                    newColor === c.value ? 'ring-2 ring-offset-1 ring-offset-card ring-current' : 'opacity-40'
                  )}>
                  {c.value}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setCreating(false); setNewName('') }}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium">
                Cancelar
              </button>
              <button type="button" onClick={handleCreate} disabled={isPending || !newName.trim()}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
                {isPending ? 'Salvando…' : 'Criar'}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setCreating(true)}
            className="flex items-center gap-2 w-full py-3 px-4 rounded-xl border border-dashed border-border bg-card text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
            <Plus size={16} />
            Nova Categoria
          </button>
        )}

        {/* Empty state */}
        {cats.length === 0 && !creating && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma categoria criada ainda.</p>
          </div>
        )}

        {/* Category list */}
        {cats.map(cat => (
          <div key={cat.id} className="rounded-xl border border-border bg-card p-3.5 flex items-center gap-3">
            {editId === cat.id ? (
              <div className="flex-1 flex flex-col gap-2">
                <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUpdate()}
                  className="w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                <div className="flex gap-1.5 flex-wrap">
                  {CATEGORY_COLORS.map(c => (
                    <button key={c.value} type="button" onClick={() => setEditColor(c.value)}
                      className={cn('px-2 py-0.5 rounded-full border text-[10px] font-medium', c.classes,
                        editColor === c.value ? 'ring-2 ring-offset-1 ring-offset-card ring-current' : 'opacity-40'
                      )}>{c.value}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditId(null)}
                    className="flex-1 py-2 rounded-lg border border-border text-xs font-medium">Cancelar</button>
                  <button type="button" onClick={handleUpdate} disabled={isPending}
                    className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50">
                    {isPending ? '…' : 'Salvar'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <span className={cn('text-[11px] px-2.5 py-1 rounded-full border font-medium', getCategoryClasses(cat.color))}>
                  {cat.name}
                </span>
                <div className="ml-auto flex items-center gap-1">
                  <button type="button" onClick={() => startEdit(cat)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => setConfirmDeleteId(cat.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Delete confirm */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="rounded-2xl bg-card border border-border p-6 flex flex-col gap-4 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-base">Excluir categoria?</h3>
            <p className="text-sm text-muted-foreground leading-snug">
              Os exercícios vinculados não serão apagados — apenas o relacionamento com esta categoria será removido.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-medium">Cancelar</button>
              <button type="button" disabled={isPending} onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-50">
                {isPending ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
