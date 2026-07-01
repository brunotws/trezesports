'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Pause, ArrowRight, Flag, ChevronDown, ChevronUp, RotateCcw, SkipForward } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/utils/duration'
import { markSessionExerciseSkippedAction } from '@/lib/actions/sessions'
import type { Session, SessionExercise, SessionAthlete, AthleteReadiness } from '@/types'

interface Props {
  session:          Session & { exercises: SessionExercise[] }
  orderedExercises: SessionExercise[]
  athletes:         SessionAthlete[]
  readinessMap:     AthleteReadiness[]
}

function formatTime(s: number) {
  const m   = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function CoachSection({ title, content, defaultOpen = false }: {
  title:        string
  content:      string | null | undefined
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
          ? <ChevronUp   size={14} className="text-muted-foreground shrink-0" />
          : <ChevronDown size={14} className="text-muted-foreground shrink-0" />
        }
      </button>
      {open && (
        <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{content}</p>
      )}
    </div>
  )
}

export default function LiveMode({ session, orderedExercises, athletes, readinessMap }: Props) {
  const router = useRouter()
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const initialSecsRef = useRef(0)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [secondsLeft, setSecondsLeft]   = useState(0)
  const [running, setRunning]           = useState(false)
  const [imageExpanded, setImageExpanded] = useState(false)
  const [fading, setFading]             = useState(false)

  const current   = orderedExercises[currentIndex]
  const ex        = current?.exercise
  const isLast    = currentIndex === orderedExercises.length - 1
  const progress  = ((currentIndex + 1) / orderedExercises.length) * 100
  const stageName = current?.block_type ?? null
  const initialSecs = Math.round((current?.custom_duration ?? ex?.duration_min ?? 0) * 60)
  const hasDuration = initialSecs > 0
  const isAlert   = secondsLeft > 0 && secondsLeft <= 30

  // ── Compute per-exercise athlete alerts ───────────────────────────────
  const alertAthletes = readinessMap
    .filter(r => r.status === 'yellow' || r.status === 'red')
    .map(r => {
      const name         = athletes.find(sa => sa.athlete_id === r.athleteId)?.athlete?.name ?? '—'
      const doms         = r.wellness?.doms ?? 5
      const isIncompat   = !!(
        (ex?.is_eccentric && doms <= 2) ||
        (ex?.contraindicated_doms_below != null && doms < ex.contraindicated_doms_below)
      )
      return { name, status: r.status as 'yellow' | 'red', isIncompat }
    })

  const hasAlerts        = alertAthletes.length > 0
  const hasIncompat      = alertAthletes.some(a => a.isIncompat)

  // Reset timer when exercise changes
  useEffect(() => {
    stopTimer()
    const secs = Math.round((current?.custom_duration ?? ex?.duration_min ?? 0) * 60)
    initialSecsRef.current = secs
    setSecondsLeft(secs)
    setRunning(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex])

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  function stopTimer() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }

  function startTimer() {
    if (intervalRef.current || secondsLeft === 0) return
    setRunning(true)
    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { stopTimer(); setRunning(false); return 0 }
        return s - 1
      })
    }, 1000)
  }

  function pauseTimer() { stopTimer(); setRunning(false) }

  function resetTimer() { stopTimer(); setSecondsLeft(initialSecsRef.current); setRunning(false) }

  function addTime(seconds: number) { setSecondsLeft(s => s + seconds) }

  function advance() {
    stopTimer()
    if (isLast) { router.push(`/sessao/${session.id}/pse`); return }
    setFading(true)
    setTimeout(() => setCurrentIndex(i => i + 1), 200)
    setTimeout(() => setFading(false), 320)
  }

  function handleSkip() {
    void markSessionExerciseSkippedAction(current.id, session.id)
    advance()
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">

        {/* ── HEADER ── */}
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
          {/* Exercise name + duration */}
          <div className="px-4 pt-4 pb-2">
            <h1 className="text-2xl font-bold leading-tight tracking-tight">{ex?.name ?? '—'}</h1>
            {hasDuration && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatDuration(current?.custom_duration ?? ex?.duration_min ?? 0)}
              </p>
            )}
          </div>

          {/* ── ATHLETE ALERT BANNER ── */}
          {hasAlerts && (
            <div
              key={`alert-${currentIndex}`}
              className={cn(
                'mx-4 mt-2 rounded-xl border p-3 flex flex-col gap-2',
                hasIncompat
                  ? 'border-red-500/40 bg-red-500/5'
                  : 'border-orange-500/30 bg-orange-500/5',
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-xs font-semibold',
                  hasIncompat ? 'text-red-400' : 'text-orange-400',
                )}>
                  {hasIncompat ? '🚨' : '⚠'}{' '}
                  {alertAthletes.length} atleta{alertAthletes.length > 1 ? 's' : ''} em alerta
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {alertAthletes.map((a, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-foreground">{a.name}</span>
                    <div className="flex items-center gap-1.5">
                      {a.isIncompat && (
                        <span className="text-[10px] font-bold text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded leading-none">
                          INCOMPAT.
                        </span>
                      )}
                      <span className={cn(
                        'text-[10px] font-bold leading-none',
                        a.status === 'yellow' ? 'text-yellow-400' : 'text-red-400',
                      )}>
                        {a.status === 'yellow' ? '⚠' : '🛑'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {ex?.regressao && (
                <p className="text-[11px] text-muted-foreground">
                  💡 <b className="text-foreground">Regressão</b> disponível abaixo
                </p>
              )}
            </div>
          )}

          {/* Diagram */}
          {ex?.diagram_url ? (
            <div className="px-4 mt-3">
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
            <div className="mx-4 mt-3 h-40 rounded-xl border border-dashed border-border bg-card flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Sem diagrama</span>
            </div>
          )}

          {/* ── TIMER ── */}
          <div className="flex flex-col items-center py-7 gap-5">
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
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={resetTimer}
                  className="w-11 h-11 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 active:scale-95 transition-all"
                >
                  <RotateCcw size={18} />
                </button>
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
                  {running ? <><Pause size={16} /> Pausar</> : <><Play size={16} /> Iniciar</>}
                </button>
                <button
                  type="button"
                  onClick={() => addTime(30)}
                  className="w-11 h-11 rounded-full border border-border bg-card flex items-center justify-center text-xs font-bold text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 active:scale-95 transition-all"
                >
                  +30s
                </button>
              </div>
            )}

            {isAlert && !running && secondsLeft > 0 && (
              <p className="text-xs text-orange-400 font-medium">⚠ Menos de 30 segundos</p>
            )}
          </div>

          {/* ── COACHING POINTS ── */}
          {(ex?.description || ex?.progressao || ex?.regressao) && (
            <div key={currentIndex} className="mx-4 mb-4 rounded-xl border border-border bg-card overflow-hidden">
              <CoachSection title="📋 Pontos de Correção" content={ex?.description} defaultOpen />
              <CoachSection title="↑ Progressão"          content={ex?.progressao} />
              <CoachSection
                title="↓ Regressão"
                content={ex?.regressao}
                defaultOpen={hasAlerts && !!ex?.regressao}
              />
            </div>
          )}

          <div className="h-36" />
        </div>

        {/* ── FAB ── */}
        <div className="shrink-0 absolute bottom-0 left-0 right-0 px-4 pb-8 pt-6 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
          <div className="flex flex-col gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={advance}
              className={cn(
                'w-full py-5 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] shadow-lg',
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
            {!isLast && (
              <button
                type="button"
                onClick={handleSkip}
                className="w-full py-2.5 rounded-xl border border-border/60 text-xs font-medium text-muted-foreground flex items-center justify-center gap-1.5 active:bg-muted transition-colors"
              >
                <SkipForward size={13} />
                Pular exercício
              </button>
            )}
          </div>
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
