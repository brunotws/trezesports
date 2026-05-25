'use client'

import { DAY_LABELS } from '@/lib/utils/week'
import { sessionDate as computeSessionDate } from '@/lib/utils/week'
import SessionCell from './SessionCell'
import type { GridCell } from '@/types'

interface Props {
  weekId:         string  // DB id (uuid)
  weekStartDate:  string  // 'YYYY-MM-DD' — Monday of this week
  cells:          GridCell[]
}

const SESSION_LABELS = ['Manhã', 'Tarde', 'Noite']

export default function WeekGrid({ weekId, weekStartDate, cells }: Props) {
  const cellFor = (day: number, sn: number): GridCell | undefined =>
    cells.find(c => c.dayOfWeek === day && c.sessionNumber === sn)

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="flex-1 overflow-x-auto p-3">
      <div className="min-w-[580px]">

        {/* Day headers */}
        <div className="grid grid-cols-[52px_repeat(7,1fr)] gap-1.5 mb-2">
          <div />
          {DAY_LABELS.map((label, day) => {
            const dateStr = computeSessionDate(weekStartDate, day)
            const isToday = dateStr === today
            return (
              <div key={label} className="flex flex-col items-center gap-0.5 pb-1 border-b border-border/50">
                <span className={`text-[11px] font-semibold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {label}
                </span>
                <span className={`text-[10px] ${isToday ? 'text-primary' : 'text-muted-foreground/60'}`}>
                  {dateStr.slice(8)}
                </span>
              </div>
            )
          })}
        </div>

        {/* Session rows: 3 × 7 cells */}
        {([1, 2, 3] as const).map(sn => (
          <div key={sn} className="grid grid-cols-[52px_repeat(7,1fr)] gap-1.5 mb-1.5">
            <div className="flex items-center justify-end pr-2">
              <span className="text-[10px] text-muted-foreground/60 text-right leading-tight">
                {SESSION_LABELS[sn - 1]}
              </span>
            </div>

            {Array.from({ length: 7 }, (_, day) => {
              const cell = cellFor(day, sn)
              const dateStr = computeSessionDate(weekStartDate, day)

              if (!cell) return <div key={day} className="min-h-[72px]" />

              return (
                <SessionCell
                  key={`${day}-${sn}`}
                  cell={cell}
                  weekId={weekId}
                  date={dateStr}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
