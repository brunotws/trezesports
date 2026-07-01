'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { upsertWellnessAction } from '@/lib/actions/wellness'

const METRICS = [
  {
    key:   'sleep_quality' as const,
    label: 'Qualidade do Sono',
    low:   'Péssimo',
    high:  'Excelente',
    emoji: '😴',
  },
  {
    key:   'doms' as const,
    label: 'Dor Muscular',
    low:   'Muito dolorido',
    high:  'Sem dores',
    emoji: '💪',
  },
  {
    key:   'fatigue' as const,
    label: 'Energia / Fadiga',
    low:   'Exausto',
    high:  'Cheio de energia',
    emoji: '⚡',
  },
  {
    key:   'mood' as const,
    label: 'Estresse / Humor',
    low:   'Muito estressado',
    high:  'Relaxado',
    emoji: '🧠',
  },
  {
    key:   'nutrition_score' as const,
    label: 'Combustível / Nutrição',
    low:   'Em jejum / mal nutrido',
    high:  'Bem alimentado',
    emoji: '🥗',
  },
] as const

type MetricKey = 'sleep_quality' | 'doms' | 'fatigue' | 'mood' | 'nutrition_score'
export type WellnessValues = Record<MetricKey, number>

function sliderColor(v: number) {
  if (v <= 2) return 'accent-red-500'
  if (v === 3) return 'accent-yellow-500'
  return 'accent-green-500'
}

interface Props {
  open:           boolean
  onOpenChange:   (open: boolean) => void
  athleteId:      string
  athleteName:    string
  initialValues?: Partial<WellnessValues>
  onSaved:        (values: WellnessValues) => void
}

export default function WellnessCheckinSheet({
  open, onOpenChange, athleteId, athleteName, initialValues, onSaved,
}: Props) {
  const isEditing = !!initialValues?.fatigue  // true = editando registro já existente de hoje
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState<WellnessValues>({
    sleep_quality:   initialValues?.sleep_quality   ?? 3,
    doms:            initialValues?.doms            ?? 3,
    fatigue:         initialValues?.fatigue         ?? 3,
    mood:            initialValues?.mood            ?? 3,
    nutrition_score: initialValues?.nutrition_score ?? 3,
  })

  function set(key: MetricKey, v: number) {
    setValues(prev => ({ ...prev, [key]: v }))
  }

  function handleSubmit() {
    startTransition(async () => {
      await upsertWellnessAction(athleteId, values)
      onSaved(values)
      onOpenChange(false)
    })
  }

  const total  = values.fatigue + values.sleep_quality + values.doms + values.mood + values.nutrition_score
  const avg    = total / 5
  const status = avg > 3.75 ? 'green' : avg >= 2.5 ? 'yellow' : 'red'

  const statusStyle = {
    green:  { border: 'border-green-500/30 bg-green-500/5',   text: 'text-green-400',  label: 'Boa readiness' },
    yellow: { border: 'border-yellow-500/30 bg-yellow-500/5', text: 'text-yellow-400', label: 'Readiness moderada' },
    red:    { border: 'border-red-500/30 bg-red-500/5',       text: 'text-red-400',    label: 'Readiness baixa' },
  }[status]

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onOpenChange(false) }}>
      <SheetContent side="bottom" className="max-h-[92svh] overflow-y-auto rounded-t-2xl px-4 pb-10">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-left">
            {isEditing ? 'Editar check-in de hoje' : 'Check-in'} · {athleteName}
          </SheetTitle>
          {isEditing && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              ✏ Você está editando a avaliação já registrada hoje.
            </p>
          )}
        </SheetHeader>

        <div className="flex flex-col gap-6">
          {METRICS.map(({ key, label, low, high, emoji }) => (
            <div key={key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{emoji} {label}</span>
                <span className={cn(
                  'text-lg font-bold w-6 text-center tabular-nums',
                  values[key] <= 2 ? 'text-red-400' : values[key] === 3 ? 'text-yellow-400' : 'text-green-400',
                )}>
                  {values[key]}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={values[key]}
                onChange={e => set(key, Number(e.target.value))}
                className={cn('w-full h-2 rounded-full appearance-none bg-muted cursor-pointer', sliderColor(values[key]))}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
                <span>1 · {low}</span>
                <span>5 · {high}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Readiness preview */}
        <div className={cn(
          'mt-6 px-4 py-3 rounded-xl border flex items-center justify-between',
          statusStyle.border,
        )}>
          <span className="text-sm text-muted-foreground">Score de readiness</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{total}/25</span>
            <span className={cn('text-xs font-medium', statusStyle.text)}>{statusStyle.label}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="mt-4 w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
        >
          {isPending ? 'Salvando…' : isEditing ? 'Atualizar Check-in' : 'Salvar Check-in'}
        </button>
      </SheetContent>
    </Sheet>
  )
}
