'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalendarSession {
  sessionId:     string
  date:          string
  sessionNumber: number
  title:         string | null
  category:      string | null
}

interface Props {
  sessions: CalendarSession[]
}

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const MONTHS   = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

export default function AthleteCalendar({ sessions }: Props) {
  const today = new Date()

  const [year,  setYear]        = useState(today.getFullYear())
  const [month, setMonth]       = useState(today.getMonth())     // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const sessionMap = useMemo(() => {
    const map = new Map<string, CalendarSession[]>()
    for (const s of sessions) {
      map.set(s.date, [...(map.get(s.date) ?? []), s])
    }
    return map
  }, [sessions])

  const grid = useMemo(() => {
    const firstDay    = new Date(year, month, 1)
    const startOffset = (firstDay.getDay() + 6) % 7   // Mon = 0, Sun = 6
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (number | null)[] = []
    for (let i = 0; i < startOffset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [year, month])

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }

  function makeDate(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const todayStr    = today.toISOString().split('T')[0]
  const selectedExs = selectedDate ? (sessionMap.get(selectedDate) ?? []) : []

  return (
    <div className="flex flex-col gap-3">

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold">{MONTHS[month]} {year}</span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[10px] text-muted-foreground/50 font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {grid.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />
          const dateStr     = makeDate(day)
          const daySessions = sessionMap.get(dateStr) ?? []
          const isToday     = dateStr === todayStr
          const isSel       = dateStr === selectedDate
          const hasSessions = daySessions.length > 0

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => hasSessions && setSelectedDate(isSel ? null : dateStr)}
              className={cn(
                'flex flex-col items-center py-1.5 rounded-lg transition-colors',
                isSel  ? 'bg-primary text-primary-foreground' : '',
                isToday && !isSel ? 'text-primary' : (!isSel ? 'text-foreground' : ''),
                hasSessions && !isSel ? 'hover:bg-muted/60 cursor-pointer' : 'cursor-default',
              )}
            >
              <span className={cn('text-xs leading-none', isToday ? 'font-bold' : '')}>
                {day}
              </span>
              {hasSessions && (
                <div className="flex gap-0.5 mt-1">
                  {daySessions.slice(0, 3).map((_, j) => (
                    <div
                      key={j}
                      className={cn(
                        'w-1 h-1 rounded-full',
                        isSel ? 'bg-primary-foreground/70' : 'bg-primary',
                      )}
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Session detail panel */}
      {selectedDate && selectedExs.length > 0 && (
        <div className="flex flex-col gap-2 p-3 rounded-xl border border-primary/20 bg-primary/5 mt-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
              weekday: 'long', day: '2-digit', month: 'long',
            })}
          </p>
          {selectedExs.map(s => (
            <a
              key={s.sessionId}
              href={`/sessao/${s.sessionId}`}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  {s.title ?? `Sessão ${s.sessionNumber}`}
                </p>
                {s.category && (
                  <p className="text-[10px] text-muted-foreground">{s.category}</p>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">ver →</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
