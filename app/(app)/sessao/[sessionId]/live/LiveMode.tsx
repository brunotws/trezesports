'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Pause, ArrowRight, Flag, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Session, SessionExercise } from '@/types'

interface Props {
  session: Session & { exercises: SessionExercise[] }
  orderedExercises: SessionExercise[]
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function CoachSection({ title, content, defaultOpen = false }: {
  title: string
  content: string | null | undefined
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  if (!content) return null
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium text-left gap-2"
      >
        <span>{title}</span>
        {open
          ? <ChevronUp size={14} className="text-muted-foreground shrink-0" />
          : <ChevronDown size={14} className="text-muted-foreground shrink-0" />
        }
      </button>
      {open && (
        <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{content}</p>
      )}
    </div>
  )
}

export default function LiveMode({ session, orderedExercises }: Props) {
  const router = useRouter()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [running, setRunning] = useState(false)
  const [imageExpanded, setImageExpanded] = useState(false)
  const [fading, setFading] = useState(false)

  const current = orderedExercises[currentIndex]
  const ex = current?.exercise
  const isLast = currentIndex === orderedExercises.length - 1
  const progress = ((currentIndex + 1) / orderedExercises.length) * 100
  const stageName = current?.block_type ?? null
  const hasDuration = (ex?.duration_min ?? 0) > 0
  const isAlert = secondsLeft > 0 && secondsLeft <= 30

  // Reset timer when exercise changes
  useEffect(() => {
    stopTimer()
    setSecondsLeft((ex?.duration_min ?? 0) * 60)
    setRunning(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex])

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  function stopTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  function startTimer() {
    if (intervalRef.current || secondsLeft === 0) return
    setRunning(true)
    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          stopTimer()
          setRunning(false)
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  function pauseTimer() {
    stopTimer()
    setRunning(false)
  }

  function handleNext() {
    stopTimer()
    if (isLast) {
      router.push(`/sessao/${session.id}/pse`)
      return
    }
    setFading(true)
    setTimeout(() => setCurrentIndex(i => i + 1), 200)
    setTimeout(() => setFading(false), 320)
  }

  return (
    <>
      {/* ── FULLSCREEN OVERLAY (covers BottomNav + PageHeader) ── */}
      <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">

        {/* ── HEADER: progress bar ── */}
        <div className="shrink-0 px-4 pt-safe pt-4 pb-3 flex flex-col gap-2 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push(`/sessao/${session.id}`)}
              className="text-xs text-muted-foreground border border-border rounded-md px-3 py-1.5 active:bg-muted transition-colors"
            >
              ← Sair
            </button>
            <div className="text-center">
              <span className="text-xs font-semibold text-foreground">
                {currentIndex + 1} / {orderedExercises.length}
              </span>
              {stageName && (
                <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{stageName}</p>
              )}
            </div>
            {/* spacer to center the count */}
            <div className="w-16" />
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* ── CONTENT (scrollable) ── */}
        <div
          className={cn(
            'flex-1 overflow-y-auto transition-opacity duration-150',
            fading ? 'opacity-0' : 'opacity-100',
          )}
        >
          {/* Exercise name */}
          <div className="px-4 pt-4 pb-2">
            <h1 className="text-2xl font-bold leading-tight tracking-tight">{ex?.name ?? '—'}</h1>
            {hasDuration && (
              <p className="text-xs text-muted-foreground mt-1">{ex!.duration_min} min</p>
            )}
          </div>

          {/* Diagram */}
          {ex?.diagram_url ? (
            <div className="px-4 mt-2">
              <button
                type="button"
                onClick={() => setImageExpanded(true)}
                className="w-full"
                aria-label="Ampliar diagrama"
              >
                <img
                  src={ex.diagram_url}
                  alt={ex.name}
                  className="w-full rounded-xl object-contain max-h-64 bg-card border border-border"
                />
              </button>
              <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                Toque para ampliar
              </p>
            </div>
          ) : (
            <div className="mx-4 mt-2 h-40 rounded-xl border border-dashed border-border bg-card flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Sem diagrama</span>
            </div>
          )}

          {/* ── TIMER ── */}
          <div className="flex flex-col items-center py-7 gap-4">
            <span
              className={cn(
                'text-7xl font-bold tabular-nums tracking-tight transition-colors duration-300',
                secondsLeft === 0
                  ? 'text-muted-foreground/40'
                  : isAlert
                    ? 'text-orange-400 animate-pulse'
                    : 'text-foreground',
              )}
            >
              {formatTime(secondsLeft)}
            </span>
            {hasDuration && (
              <button
                type="button"
                onClick={running ? pauseTimer : startTimer}
                disabled={secondsLeft === 0}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all active:scale-95',
                  running
                    ? 'bg-muted text-foreground'
                    : 'bg-primary text-primary-foreground',
                  secondsLeft === 0 && 'opacity-30 pointer-events-none',
                )}
              >
                {running
                  ? <><Pause size={16} /> Pausar</>
                  : <><Play size={16} /> Iniciar</>
                }
              </button>
            )}
            {isAlert && !running && secondsLeft > 0 && (
              <p className="text-xs text-orange-400 font-medium">
                ⚠ Menos de 30 segundos
              </p>
            )}
          </div>

          {/* ── COACHING POINTS ── */}
          {(ex?.description || ex?.progressao || ex?.regressao) && (
            <div className="mx-4 mb-4 rounded-xl border border-border bg-card overflow-hidden">
              <CoachSection
                title="📋 Pontos de Correção"
                content={ex?.description}
                defaultOpen
              />
              <CoachSection title="↑ Progressão" content={ex?.progressao} />
              <CoachSection title="↓ Regressão" content={ex?.regressao} />
            </div>
          )}

          {/* Spacer for FAB */}
          <div className="h-28" />
        </div>

        {/* ── FAB (sticky bottom) ── */}
        <div className="shrink-0 absolute bottom-0 left-0 right-0 px-4 pb-8 pt-6 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
          <button
            type="button"
            onClick={handleNext}
            className={cn(
              'pointer-events-auto w-full py-5 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] shadow-lg',
              isLast
                ? 'bg-green-600 text-white shadow-green-900/30'
                : 'bg-primary text-primary-foreground shadow-primary/20',
            )}
          >
            {isLast
              ? <><Flag size={19} /> Encerrar Sessão</>
              : <>Feito! Próximo exercício <ArrowRight size={19} /></>
            }
          </button>
        </div>
      </div>

      {/* ── FULLSCREEN DIAGRAM ── */}
      {imageExpanded && ex?.diagram_url && (
        <div
          className="fixed inset-0 z-[60] bg-black flex items-center justify-center"
          onClick={() => setImageExpanded(false)}
        >
          <img
            src={ex.diagram_url}
            alt={ex.name}
            className="max-w-full max-h-full object-contain p-6"
          />
          <button
            type="button"
            onClick={() => setImageExpanded(false)}
            className="absolute top-5 right-5 text-white/60 text-sm font-medium"
          >
            ✕ Fechar
          </button>
        </div>
      )}
    </>
  )
}
