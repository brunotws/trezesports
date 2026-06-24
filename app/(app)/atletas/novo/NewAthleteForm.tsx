'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createAthleteAction } from '@/lib/actions/athletes'

export default function NewAthleteForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [position, setPosition] = useState<'Goleiro' | 'Linha' | ''>('')
  const [modality, setModality] = useState<'football' | 'futsal'>('football')
  const [turma, setTurma] = useState('')

  function handleSubmit() {
    if (!name.trim()) return
    startTransition(async () => {
      const { id } = await createAthleteAction({
        name: name.trim(),
        birth_date: birthDate || null,
        position: position || null,
        modality,
        turma: turma || null,
      })
      router.push(`/atletas/${id}`)
    })
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <section className="flex flex-col gap-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dados pessoais</p>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Nome *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nome do atleta"
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
              placeholder="Sub-15, Sub-17…"
              className="w-full rounded-lg border border-input bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Posição</p>
        <div className="grid grid-cols-2 gap-3">
          {(['Linha', 'Goleiro'] as const).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPosition(p)}
              className={`flex flex-col items-center gap-1.5 py-4 rounded-xl border text-sm font-medium transition-colors ${
                position === p
                  ? 'border-primary/40 bg-primary/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground'
              }`}
            >
              <span className="text-2xl">{p === 'Goleiro' ? '🧤' : '⚽'}</span>
              <span>{p}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Modalidade</p>
        <div className="grid grid-cols-2 gap-2">
          {(['football', 'futsal'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setModality(m)}
              className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                modality === m
                  ? 'border-primary/40 bg-primary/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground'
              }`}
            >
              {m === 'football' ? 'Futebol' : 'Futsal'}
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || !name.trim()}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
      >
        {isPending ? 'Salvando…' : 'Criar atleta'}
      </button>
    </div>
  )
}
