'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { upsertWellnessAction } from '@/lib/actions/wellness'
import type { DailyWellness } from '@/types'

interface Props {
  athleteId: string
  initial:   DailyWellness | null
}

const METRICS = [
  { key: 'fatigue',          label: 'Energia',     description: '1 = Esgotado · 5 = Descansado' },
  { key: 'sleep_quality',    label: 'Sono',        description: '1 = Péssimo · 5 = Ótimo' },
  { key: 'doms',             label: 'Dores',       description: '1 = Muita dor · 5 = Sem dores' },
  { key: 'mood',             label: 'Humor',       description: '1 = Péssimo · 5 = Excelente' },
  { key: 'nutrition_score',  label: 'Combustível', description: '1 = Em jejum · 5 = Bem nutrido' },
] as const

const BTN_COLORS: Record<number, string> = {
  1: 'bg-red-500/20 text-red-300 border-red-500/30',
  2: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  3: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  4: 'bg-green-400/20 text-green-300 border-green-400/30',
  5: 'bg-green-500/20 text-green-300 border-green-500/30',
}

export default function WellnessForm({ athleteId, initial }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(!!initial)
  const [values, setValues] = useState({
    fatigue:          initial?.fatigue          ?? 3,
    sleep_quality:    initial?.sleep_quality    ?? 3,
    doms:             initial?.doms             ?? 3,
    mood:             initial?.mood             ?? 3,
    nutrition_score:  initial?.nutrition_score  ?? 3,
  })

  function set(key: keyof typeof values, v: number) {
    setSaved(false)
    setValues(prev => ({ ...prev, [key]: v }))
  }

  function handleSubmit() {
    startTransition(async () => {
      await upsertWellnessAction(athleteId, values)
      setSaved(true)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {METRICS.map(({ key, label, description }) => (
        <div key={key} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium">{label}</span>
            <span className="text-[10px] text-muted-foreground">{description}</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map(v => (
              <button
                key={v}
                type="button"
                onClick={() => set(key, v)}
                className={cn(
                  'py-2 rounded-md border text-sm font-bold transition-all',
                  BTN_COLORS[v],
                  values[key] === v ? 'ring-2 ring-white/50 scale-105' : 'opacity-50',
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || saved}
        className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm disabled:opacity-60"
      >
        {isPending ? 'Salvando…' : saved ? 'Wellness salvo ✓' : 'Salvar Wellness'}
      </button>
    </div>
  )
}
