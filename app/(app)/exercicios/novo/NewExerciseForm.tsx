'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createExerciseAction } from '@/lib/actions/exercises'
import { setExerciseCategoriesAction } from '@/lib/actions/categories'
import { createClient } from '@/lib/supabase/client'
import CategoryPicker from '@/components/exercicios/CategoryPicker'
import type { Category } from '@/types'

const TYPES = [
  { value: 'tecnico',   label: 'Técnico' },
  { value: 'cognitivo', label: 'Cognitivo' },
  { value: 'fisico',    label: 'Físico' },
  { value: 'misto',     label: 'Misto' },
]

const LINHA_ATTRS   = ['Ball Control', 'Dribbling', 'Passing', 'Finishing', 'Movement', 'Body Positioning', 'Scanning', 'Decisions']
const GOLEIRO_ATTRS = ['Ball Handling', 'Diving', 'Distribution', 'Positioning', 'Mindset']

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Muito fácil',
  2: 'Fácil',
  3: 'Moderado',
  4: 'Difícil',
  5: 'Muito difícil',
}

interface Props { categories: Category[] }

export default function NewExerciseForm({ categories }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [forGoalkeeper, setForGoalkeeper] = useState(false)
  const [type, setType]               = useState('tecnico')
  const [attrPrimary, setAttrPrimary] = useState('')
  const [attrSecondary, setAttrSecondary] = useState('')
  const [difficulty, setDifficulty]   = useState(3)
  const [durMin, setDurMin]           = useState(15)
  const [durSec, setDurSec]           = useState(0)
  const [diagramUrl, setDiagramUrl]   = useState<string | null>(null)
  const [uploading, setUploading]     = useState(false)
  const [progressao, setProgressao]   = useState('')
  const [regressao, setRegressao]     = useState('')
  const [espaco, setEspaco]           = useState('')
  const [numCones, setNumCones]       = useState(0)
  const [numColetes, setNumColetes]   = useState(0)
  const [coresColetes, setCoresColetes] = useState(1)
  const [numBolas, setNumBolas]       = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [categoryIds, setCategoryIds]   = useState<string[]>([])
  const [localCats, setLocalCats]       = useState<Category[]>(categories)

  async function handleImageUpload(file: File) {
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('exercise-diagrams')
        .upload(path, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('exercise-diagrams').getPublicUrl(path)
      setDiagramUrl(data.publicUrl)
    } catch (e) {
      alert('Erro ao fazer upload: ' + (e instanceof Error ? e.message : JSON.stringify(e)))
    } finally {
      setUploading(false)
    }
  }

  const availableAttrs = forGoalkeeper ? GOLEIRO_ATTRS : LINHA_ATTRS

  function handleSubmit() {
    if (!name.trim()) return
    startTransition(async () => {
      const { id } = await createExerciseAction({
        name: name.trim(),
        description: description || null,
        attribute_target: attrPrimary || null,
        attr_secondary: attrSecondary || null,
        type,
        fatigue_level: difficulty,
        for_goalkeeper: forGoalkeeper,
        duration_min: durMin + durSec / 60 || null,
        diagram_url: diagramUrl,
        progressao: progressao || null,
        regressao: regressao || null,
        espaco_necessario: espaco || null,
        num_cones: numCones || null,
        num_coletes: numColetes || null,
        cores_coletes: coresColetes,
        num_bolas: numBolas || null,
      })
      if (categoryIds.length > 0) {
        await setExerciseCategoriesAction(id, categoryIds)
      }
      router.push('/exercicios')
    })
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6">

      {/* Nome */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Nome *</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nome do exercício"
          className="w-full rounded-lg border border-input bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Descrição */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Descrição</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          placeholder="Detalhes opcionais…"
          className="w-full rounded-lg border border-input bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {/* Categorias */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Categorias <span className="text-muted-foreground font-normal">(opcional)</span></label>
        <CategoryPicker
          allCategories={localCats}
          selectedIds={categoryIds}
          onChange={setCategoryIds}
          onCategoryCreated={cat => setLocalCats(prev => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)))}
        />
      </div>

      {/* Diagrama */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Diagrama <span className="text-muted-foreground font-normal">(opcional)</span></label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleImageUpload(file)
          }}
        />
        {diagramUrl ? (
          <div className="flex items-center gap-3">
            <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-border bg-muted shrink-0">
              <Image src={diagramUrl} alt="Diagrama" fill className="object-cover" />
            </div>
            <button
              type="button"
              onClick={() => { setDiagramUrl(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
              className="text-xs text-red-400 border border-red-500/30 bg-red-500/5 px-3 py-1.5 rounded-lg"
            >
              Remover
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex flex-col items-center gap-2 py-8 rounded-xl border border-dashed border-border bg-card text-muted-foreground text-sm transition-colors hover:border-primary/40 disabled:opacity-50"
          >
            {uploading ? (
              <span>Enviando…</span>
            ) : (
              <>
                <span className="text-2xl">🖼️</span>
                <span>Toque para adicionar imagem</span>
                <span className="text-xs opacity-60">PNG, JPG, GIF</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Para quem */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Para quem?</label>
        <div className="grid grid-cols-2 gap-2">
          {([false, true] as const).map(gk => (
            <button
              key={String(gk)}
              type="button"
              onClick={() => {
                setForGoalkeeper(gk)
                setAttrPrimary('')
                setAttrSecondary('')
              }}
              className={`flex items-center gap-2 py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
                forGoalkeeper === gk
                  ? 'border-primary/40 bg-primary/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground'
              }`}
            >
              <span>{gk ? '🧤' : '⚽'}</span>
              <span>{gk ? 'Goleiro' : 'Linha'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tipo */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Tipo</label>
        <div className="grid grid-cols-4 gap-1.5">
          {TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`py-2 rounded-md border text-xs font-medium transition-colors ${
                type === t.value
                  ? 'border-primary/40 bg-primary/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Atributo primário */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Atributo primário</label>
        <div className="flex flex-wrap gap-1.5">
          {availableAttrs.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => setAttrPrimary(a === attrPrimary ? '' : a)}
              className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
                attrPrimary === a
                  ? 'border-primary/40 bg-primary/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Atributo secundário */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Atributo secundário <span className="text-muted-foreground font-normal">(opcional)</span></label>
        <div className="flex flex-wrap gap-1.5">
          {availableAttrs.filter(a => a !== attrPrimary).map(a => (
            <button
              key={a}
              type="button"
              onClick={() => setAttrSecondary(a === attrSecondary ? '' : a)}
              className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
                attrSecondary === a
                  ? 'border-primary/40 bg-primary/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Dificuldade */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Dificuldade</label>
          <span className="text-sm font-bold">{difficulty} <span className="text-xs text-muted-foreground font-normal">— {DIFFICULTY_LABELS[difficulty]}</span></span>
        </div>
        <input
          type="range"
          min={1}
          max={5}
          value={difficulty}
          onChange={e => setDifficulty(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>1 — Muito fácil</span><span>3 — Moderado</span><span>5 — Muito difícil</span>
        </div>
      </div>

      {/* Duração */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Duração <span className="text-muted-foreground font-normal">(opcional)</span></label>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-1.5 rounded-lg border border-input bg-muted px-3 py-2.5">
            <input
              type="number"
              min={0}
              value={durMin}
              onChange={e => setDurMin(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-transparent text-sm font-bold outline-none text-center tabular-nums"
            />
            <span className="text-sm text-muted-foreground shrink-0">min</span>
          </div>
          <div className="flex-1 flex items-center gap-1.5 rounded-lg border border-input bg-muted px-3 py-2.5">
            <input
              type="number"
              min={0}
              max={59}
              value={durSec}
              onChange={e => setDurSec(Math.min(59, Math.max(0, Number(e.target.value) || 0)))}
              className="w-full bg-transparent text-sm font-bold outline-none text-center tabular-nums"
            />
            <span className="text-sm text-muted-foreground shrink-0">seg</span>
          </div>
        </div>
      </div>

      {/* Bloco de Intervenção */}
      <section className="flex flex-col gap-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bloco de Intervenção</p>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Progressão <span className="text-muted-foreground font-normal text-xs">— como dificultar</span></label>
          <textarea
            value={progressao}
            onChange={e => setProgressao(e.target.value)}
            rows={2}
            placeholder="Ex: limitar para 2 toques, adicionar pressão defensiva…"
            className="w-full rounded-lg border border-input bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Regressão <span className="text-muted-foreground font-normal text-xs">— como facilitar</span></label>
          <textarea
            value={regressao}
            onChange={e => setRegressao(e.target.value)}
            rows={2}
            placeholder="Ex: adicionar jogador coringa, ampliar o espaço…"
            className="w-full rounded-lg border border-input bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
      </section>

      {/* Logística de Quadra */}
      <section className="flex flex-col gap-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Logística de Quadra</p>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Espaço necessário</label>
          <div className="grid grid-cols-3 gap-2">
            {['1/4 de Quadra', 'Meia Quadra', 'Quadra Inteira'].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setEspaco(espaco === s ? '' : s)}
                className={`py-2 px-1 rounded-lg border text-xs font-medium text-center transition-colors ${
                  espaco === s
                    ? 'border-primary/40 bg-primary/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium">Materiais</label>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">🔶 Cones</span>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setNumCones(v => Math.max(0, v - 1))}
                className="w-8 h-8 rounded-lg border border-border bg-card text-lg font-bold flex items-center justify-center">−</button>
              <span className="w-6 text-center text-sm font-bold tabular-nums">{numCones}</span>
              <button type="button" onClick={() => setNumCones(v => v + 1)}
                className="w-8 h-8 rounded-lg border border-border bg-card text-lg font-bold flex items-center justify-center">+</button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground shrink-0">🦺 Coletes</span>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">qtd</span>
                <button type="button" onClick={() => setNumColetes(v => Math.max(0, v - 1))}
                  className="w-8 h-8 rounded-lg border border-border bg-card text-lg font-bold flex items-center justify-center">−</button>
                <span className="w-6 text-center text-sm font-bold tabular-nums">{numColetes}</span>
                <button type="button" onClick={() => setNumColetes(v => v + 1)}
                  className="w-8 h-8 rounded-lg border border-border bg-card text-lg font-bold flex items-center justify-center">+</button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">cores</span>
                <button type="button" onClick={() => setCoresColetes(v => Math.max(1, v - 1))}
                  className="w-8 h-8 rounded-lg border border-border bg-card text-lg font-bold flex items-center justify-center">−</button>
                <span className="w-6 text-center text-sm font-bold tabular-nums">{coresColetes}</span>
                <button type="button" onClick={() => setCoresColetes(v => v + 1)}
                  className="w-8 h-8 rounded-lg border border-border bg-card text-lg font-bold flex items-center justify-center">+</button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">⚽ Bolas</span>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setNumBolas(v => Math.max(0, v - 1))}
                className="w-8 h-8 rounded-lg border border-border bg-card text-lg font-bold flex items-center justify-center">−</button>
              <span className="w-6 text-center text-sm font-bold tabular-nums">{numBolas}</span>
              <button type="button" onClick={() => setNumBolas(v => v + 1)}
                className="w-8 h-8 rounded-lg border border-border bg-card text-lg font-bold flex items-center justify-center">+</button>
            </div>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || !name.trim()}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
      >
        {isPending ? 'Salvando…' : 'Criar exercício'}
      </button>
    </div>
  )
}
