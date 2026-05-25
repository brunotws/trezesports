'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createExerciseAction } from '@/lib/actions/exercises'

const TYPES = [
  { value: 'fisico',    label: 'Físico' },
  { value: 'tecnico',   label: 'Técnico' },
  { value: 'cognitivo', label: 'Cognitivo' },
  { value: 'misto',     label: 'Misto' },
]

const ATTR_TARGETS = ['Passe', 'Domínio', 'Visão', 'Decisão', 'Mobilidade', 'Finalização', 'Força', 'Velocidade', 'Resistência']

export default function NewExerciseForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [type, setType]               = useState('fisico')
  const [attrTarget, setAttrTarget]   = useState('')
  const [fatigueLevel, setFatigue]    = useState(5)
  const [isEccentric, setEccentric]   = useState(false)
  const [domsBelow, setDomsBelow]     = useState<string>('')

  function handleSubmit() {
    if (!name.trim()) return
    startTransition(async () => {
      await createExerciseAction({
        name: name.trim(),
        description: description || null,
        attribute_target: attrTarget || null,
        type,
        fatigue_level: fatigueLevel,
        is_eccentric: isEccentric,
        contraindicated_doms_below: domsBelow ? Number(domsBelow) : null,
      })
      router.push('/exercicios')
    })
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Nome *</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nome do exercício"
          className="w-full rounded-lg border border-input bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

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

      <div className="flex flex-col gap-1.5">
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

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Atributo alvo</label>
        <div className="flex flex-wrap gap-1.5">
          {ATTR_TARGETS.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => setAttrTarget(a === attrTarget ? '' : a)}
              className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
                attrTarget === a
                  ? 'border-primary/40 bg-primary/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">
          Nível de fadiga: <span className="font-bold">{fatigueLevel}</span>
        </label>
        <input
          type="range"
          min={1}
          max={20}
          value={fatigueLevel}
          onChange={e => setFatigue(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>1 — Baixo</span><span>10 — Médio</span><span>20 — Alto</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setEccentric(v => !v)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-colors ${
          isEccentric
            ? 'border-red-500/30 bg-red-500/5 text-foreground'
            : 'border-border bg-card text-muted-foreground'
        }`}
      >
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
          isEccentric ? 'border-red-400 bg-red-400' : 'border-muted-foreground'
        }`}>
          {isEccentric && <span className="text-black text-xs font-bold">✓</span>}
        </div>
        <div className="flex flex-col text-left">
          <span className="font-medium">Exercício excêntrico</span>
          <span className="text-[11px] text-muted-foreground">Contraindica com DOMS alto</span>
        </div>
      </button>

      {isEccentric && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Contraindicado se DOMS ≤</label>
          <input
            type="number"
            min={1}
            max={5}
            value={domsBelow}
            onChange={e => setDomsBelow(e.target.value)}
            placeholder="Ex: 2"
            className="w-full rounded-lg border border-input bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}

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
