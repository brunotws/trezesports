'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import RPEGrid from './RPEGrid'
import PSEForm from './PSEForm'
import { closeSessionAction, submitPseAction } from '@/lib/actions/sessions'
import type { SessionAthlete } from '@/types'

type Step = 'rpe' | 'duration' | 'pse'

interface Props {
  open:               boolean
  onOpenChange:       (v: boolean) => void
  sessionId:          string
  athletes:           SessionAthlete[]
  plannedRpe:         number
  suggestedDuration:  number
}

const STEP_LABELS: Record<Step, string> = {
  rpe:      'RPE da Sessão',
  duration: 'Duração',
  pse:      'PSE por Atleta',
}

const STEPS: Step[] = ['rpe', 'duration', 'pse']

export default function CloseSessionSheet({
  open, onOpenChange, sessionId, athletes, plannedRpe, suggestedDuration,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [step, setStep] = useState<Step>('rpe')
  const [rpe, setRpe] = useState<number | null>(null)
  const [duration, setDuration] = useState<string>(String(suggestedDuration))

  const stepIndex = STEPS.indexOf(step)

  function handleRpeSelect(v: number) {
    setRpe(v)
    setStep('duration')
  }

  function handleDurationConfirm() {
    const d = Number(duration)
    if (!d || d <= 0) return
    setStep('pse')
  }

  function handlePseSubmit(pses: Array<{ athleteId: string; pse: number | null; attended: boolean }>) {
    if (rpe === null) return
    const d = Number(duration)
    startTransition(async () => {
      await closeSessionAction(sessionId, rpe, d)
      await submitPseAction(sessionId, pses)
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90svh] overflow-y-auto rounded-t-2xl px-4 pb-10">
        <SheetHeader className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= stepIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <SheetTitle className="text-left text-base">{STEP_LABELS[step]}</SheetTitle>
        </SheetHeader>

        {step === 'rpe' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Qual foi a intensidade geral da sessão?
            </p>
            <RPEGrid value={rpe} onChange={handleRpeSelect} />
          </div>
        )}

        {step === 'duration' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Duração real da sessão (minutos)
            </p>
            <input
              type="number"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              min={1}
              max={240}
              className="w-full rounded-lg border border-input bg-muted px-4 py-3 text-lg text-center font-semibold outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={handleDurationConfirm}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm"
            >
              Confirmar
            </button>
          </div>
        )}

        {step === 'pse' && (
          <PSEForm
            athletes={athletes}
            plannedRpe={plannedRpe}
            onSubmit={handlePseSubmit}
            isLoading={isPending}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
