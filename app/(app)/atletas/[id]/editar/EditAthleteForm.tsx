'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateAthleteAction, deleteAthleteAction } from '@/lib/actions/athletes'
import type { Athlete } from '@/types'

const POSITIONS = ['Goleiro', 'Defensor', 'Lateral', 'Volante', 'Meia', 'Atacante', 'Ala', 'Pivô']

const ATTRS = [
  { key: 'attr_passe',       label: 'Passe' },
  { key: 'attr_dominio',     label: 'Domínio' },
  { key: 'attr_scan',        label: 'Visão' },
  { key: 'attr_decisao',     label: 'Decisão' },
  { key: 'attr_mobilidade',  label: 'Mobilidade' },
  { key: 'attr_finalizacao', label: 'Finalização' },
] as const

type AttrKey = (typeof ATTRS)[number]['key']

interface Props {
  athlete: Athlete
}

export default function EditAthleteForm({ athlete }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(athlete.name)
  const [birthDate, setBirthDate] = useState(athlete.birth_date ?? '')
  const [position, setPosition] = useState(athlete.position ?? '')
  const [modality, setModality] = useState<'football' | 'futsal'>(athlete.modality)
  const [turma, setTurma] = useState(athlete.turma ?? '')
  const [attrs, setAttrs] = useState<Record<AttrKey, number>>({
    attr_passe:       athlete.attr_passe       ?? 10,
    attr_dominio:     athlete.attr_dominio     ?? 10,
    attr_scan:        athlete.attr_scan        ?? 10,
    attr_decisao:     athlete.attr_decisao     ?? 10,
    attr_mobilidade:  athlete.attr_mobilidade  ?? 10,
    attr_finalizacao: athlete.attr_finalizacao ?? 10,
  })

  function setAttr(key: AttrKey, v: number) {
    setAttrs(prev => ({ ...prev, [key]: Math.min(20, Math.max(1, v)) }))
  }

  function handleSave() {
    if (!name.trim()) return
    startTransition(async () => {
      await updateAthleteAction(athlete.id, {
        name: name.trim(),
        birth_date: birthDate || null,
        position: (position as Athlete['position']) || null,
        modality,
        turma: turma || null,
        ...attrs,
      })
      router.push(`/atletas/${athlete.id}`)
    })
  }

  function handleDelete() {
    if (!confirm(`Excluir ${athlete.name}? Esta ação não pode ser desfeita.`)) return
    startTransition(async () => {
      await deleteAthleteAction(athlete.id)
      router.push('/atletas')
    })
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <section className="flex flex-col gap-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dados básicos</p>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Nome *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-lg border border-input bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Data de nasc.</label>
            <input
              type="date"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              className="w-full rounded-lg border border-input bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Turma</label>
            <input
              value={turma}
              onChange={e => setTurma(e.target.value)}
              className="w-full rounded-lg border border-input bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Posição</label>
          <div className="grid grid-cols-4 gap-1.5">
            {POSITIONS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPosition(p)}
                className={`py-1.5 rounded-md border text-xs font-medium transition-colors ${
                  position === p
                    ? 'border-primary/40 bg-primary/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Modalidade</label>
          <div className="grid grid-cols-2 gap-2">
            {(['football', 'futsal'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setModality(m)}
                className={`py-2 rounded-md border text-sm font-medium transition-colors ${
                  modality === m
                    ? 'border-primary/40 bg-primary/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground'
                }`}
              >
                {m === 'football' ? 'Futebol' : 'Futsal'}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Atributos FM (1–20)</p>
        {ATTRS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3">
            <span className="w-24 text-sm">{label}</span>
            <input
              type="range"
              min={1}
              max={20}
              value={attrs[key]}
              onChange={e => setAttr(key, Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="w-6 text-right text-sm font-bold tabular-nums">{attrs[key]}</span>
          </div>
        ))}
      </section>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending || !name.trim()}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
      >
        {isPending ? 'Salvando…' : 'Salvar alterações'}
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="w-full py-3 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 text-sm font-medium disabled:opacity-50"
      >
        Excluir atleta
      </button>
    </div>
  )
}
