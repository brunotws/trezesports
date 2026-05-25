'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { checkPseAlert } from '@/lib/utils/pse'
import RPEGrid from './RPEGrid'
import type { SessionAthlete } from '@/types'

interface AthleteEntry {
  athleteId: string
  name: string
  attended: boolean
  pse: number | null
}

interface Props {
  athletes: SessionAthlete[]
  plannedRpe: number
  onSubmit: (pses: Array<{ athleteId: string; pse: number | null; attended: boolean }>) => void
  isLoading: boolean
}

export default function PSEForm({ athletes, plannedRpe, onSubmit, isLoading }: Props) {
  const [entries, setEntries] = useState<AthleteEntry[]>(
    athletes.map(sa => ({
      athleteId: sa.athlete_id,
      name: sa.athlete?.name ?? '—',
      attended: sa.attended ?? true,
      pse: sa.pse,
    })),
  )

  function toggleAttended(athleteId: string) {
    setEntries(prev =>
      prev.map(e =>
        e.athleteId === athleteId
          ? { ...e, attended: !e.attended, pse: !e.attended ? e.pse : null }
          : e,
      ),
    )
  }

  function setPse(athleteId: string, pse: number) {
    setEntries(prev =>
      prev.map(e => (e.athleteId === athleteId ? { ...e, pse } : e)),
    )
  }

  function handleSubmit() {
    onSubmit(entries.map(e => ({ athleteId: e.athleteId, pse: e.pse, attended: e.attended })))
  }

  return (
    <div className="flex flex-col gap-6">
      {entries.map(entry => (
        <div key={entry.athleteId} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{entry.name}</span>
            <button
              type="button"
              onClick={() => toggleAttended(entry.athleteId)}
              className={cn(
                'text-xs px-2 py-1 rounded border transition-colors',
                entry.attended
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-muted text-muted-foreground border-border',
              )}
            >
              {entry.attended ? 'Presente' : 'Ausente'}
            </button>
          </div>

          {entry.attended && (
            <div className="flex flex-col gap-1">
              <RPEGrid value={entry.pse} onChange={pse => setPse(entry.athleteId, pse)} />
              {entry.pse !== null && checkPseAlert(entry.pse, plannedRpe) && (
                <p className="text-[11px] text-orange-400 mt-1">
                  PSE acima do planejado — considere reduzir carga na próxima sessão.
                </p>
              )}
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50"
      >
        {isLoading ? 'Salvando…' : 'Salvar PSEs'}
      </button>
    </div>
  )
}
