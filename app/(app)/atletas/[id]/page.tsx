import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAthlete, getAthleteSessionHistory, getDailyLoadHistory, getAthleteCalendarSessions } from '@/lib/queries/athletes'
import { getAthleteACWR } from '@/lib/queries/analytics'
import { getTodayWellness, getWellnessForDates } from '@/lib/queries/wellness'
import type { Athlete, DailyWellness } from '@/types'
import AttributeRadar from '@/components/atletas/AttributeRadar'
import WellnessForm from '@/components/atletas/WellnessForm'
import AthleteCalendar from '@/components/atletas/AthleteCalendar'
import ACWRChart from '@/components/dashboard/ACWRChart'
import PageHeader from '@/components/layout/PageHeader'
import DeleteAthleteButton from '@/components/atletas/DeleteAthleteButton'
import { SESSION_TYPE_LABELS } from '@/lib/engine/morphocycle'
import { computeEnergyPct, getEnergyMeta } from '@/lib/engine/energy'

function hasEvaluation(athlete: Athlete): boolean {
  const keys: (keyof Athlete)[] = [
    'attr_ball_control', 'attr_dribbling', 'attr_passing', 'attr_finishing',
    'attr_movement', 'attr_body_positioning', 'attr_scanning', 'attr_decisions',
    'attr_ball_handling', 'attr_diving', 'attr_distribution', 'attr_positioning', 'attr_mindset',
  ]
  return keys.some(k => athlete[k] != null)
}

interface Props {
  params: { id: string }
}

const READINESS_BADGE: Record<string, string> = {
  green:  'bg-green-500/20 text-green-400 border-green-500/30',
  yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  red:    'bg-red-500/20 text-red-400 border-red-500/30',
}

function wellnessBadgeStatus(w: DailyWellness | null | undefined): 'green' | 'yellow' | 'red' | null {
  if (!w) return null
  const vals = [w.fatigue, w.sleep_quality, w.doms, w.mood, w.nutrition_score].filter((v): v is number => v != null)
  const avg  = vals.reduce((a, b) => a + b, 0) / vals.length
  return avg > 3.75 ? 'green' : avg >= 2.5 ? 'yellow' : 'red'
}

function acwrStatus(acwr: number | null): 'green' | 'yellow' | 'red' {
  if (acwr === null) return 'green'
  if (acwr <= 1.3) return 'green'
  if (acwr <= 1.49) return 'yellow'
  return 'red'
}

export default async function AtletaPerfilPage({ params }: Props) {
  const { id } = params
  const [athlete, acwrRow, todayWellness, loads, history, calendarSessions] = await Promise.all([
    getAthlete(id),
    getAthleteACWR(id),
    getTodayWellness(id),
    getDailyLoadHistory(id, 28),
    getAthleteSessionHistory(id, 8),
    getAthleteCalendarSessions(id),
  ])

  if (!athlete) notFound()

  // Fetch wellness for each session date to show badge in history
  const sessionDates = history.map(sa => {
    const s = sa.session
    const weekStart = new Date(s.week.start_date + 'T00:00:00')
    weekStart.setDate(weekStart.getDate() + s.day_of_week)
    return weekStart.toISOString().split('T')[0]
  })
  const wellnessHistory = await getWellnessForDates(id, sessionDates)

  const status = acwrStatus(acwrRow?.acwr ?? null)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader title={athlete.name} subtitle="Perfil" backHref="/atletas">
        {acwrRow?.acwr != null && (
          <span className={`text-xs font-semibold px-2 py-1 rounded border ${READINESS_BADGE[status]}`}>
            ACWR {acwrRow.acwr.toFixed(2)}
          </span>
        )}
      </PageHeader>

      <div className="flex flex-col gap-6 px-4 py-6">
        {/* Info row */}
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>{athlete.position ?? '—'}</span>
          <span>·</span>
          <span>{athlete.modality === 'futsal' ? 'Futsal' : 'Futebol'}</span>
          {athlete.turma && <><span>·</span><span>{athlete.turma}</span></>}
        </div>

        {/* Radar de atributos */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Atributos
            </p>
            <Link
              href={`/atletas/${id}/avaliacao`}
              className="text-xs text-primary font-medium"
            >
              {hasEvaluation(athlete) ? 'Re-avaliar' : 'Iniciar avaliação →'}
            </Link>
          </div>
          {hasEvaluation(athlete) ? (
            <div className="rounded-xl border border-border bg-card py-2">
              <AttributeRadar athlete={athlete} size={220} />
            </div>
          ) : (
            <Link
              href={`/atletas/${id}/avaliacao`}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/50 py-8 text-center"
            >
              <span className="text-2xl">📋</span>
              <p className="text-sm font-medium">Avaliação pendente</p>
              <p className="text-xs text-muted-foreground">Toque para iniciar a avaliação de atributos</p>
            </Link>
          )}
        </section>

        {/* Curva de carga 28 dias */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Carga — últimos 28 dias
          </p>
          <div className="rounded-xl border border-border bg-card px-2 py-3">
            <ACWRChart loads={loads} />
          </div>
          {acwrRow && (
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground px-1">
              <span>Aguda: <b className="text-foreground">{acwrRow.acute_load.toFixed(0)}</b></span>
              <span>Crônica: <b className="text-foreground">{acwrRow.chronic_load.toFixed(0)}</b></span>
            </div>
          )}
          {(() => {
            const energyPct  = computeEnergyPct(acwrRow?.acute_load ?? null, todayWellness)
            const energyMeta = getEnergyMeta(energyPct)
            return (
              <div className={`mt-3 rounded-lg border px-3 py-2.5 ${energyMeta.border}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Barra de Energia</span>
                  <span className={`text-xs font-semibold ${energyMeta.text}`}>
                    {energyMeta.label} — {energyPct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${energyMeta.bar}`}
                    style={{ width: `${energyPct}%` }}
                  />
                </div>
              </div>
            )
          })()}
        </section>

        {/* Wellness de hoje */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Wellness de hoje
          </p>
          <div className="rounded-xl border border-border bg-card p-4">
            <WellnessForm athleteId={id} initial={todayWellness} />
          </div>
        </section>

        {/* Calendário de treinos */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Calendário de Treinos
          </p>
          <div className="rounded-xl border border-border bg-card p-4">
            {calendarSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma sessão vinculada a este atleta.
              </p>
            ) : (
              <AthleteCalendar sessions={calendarSessions} />
            )}
          </div>
        </section>

        {/* Histórico de sessões */}
        {history.length > 0 && (
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Últimas sessões
            </p>
            <div className="flex flex-col gap-2">
              {history.map(sa => {
                const s = sa.session as typeof sa.session & { week: { start_date: string } }
                const weekStart = new Date(s.week.start_date + 'T00:00:00')
                weekStart.setDate(weekStart.getDate() + s.day_of_week)
                const dateIso = weekStart.toISOString().split('T')[0]
                const dateStr = weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                const wStatus = wellnessBadgeStatus(wellnessHistory[dateIso])
                return (
                  <div
                    key={sa.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-md border border-border bg-card text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-10">{dateStr}</span>
                      {wStatus && (
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            wStatus === 'green'  ? 'bg-green-500'  :
                            wStatus === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          title={
                            wStatus === 'green'  ? 'Wellness ok'          :
                            wStatus === 'yellow' ? 'Readiness moderada'  : 'Readiness baixa'
                          }
                        />
                      )}
                      <span className="text-xs font-medium">{SESSION_TYPE_LABELS[s.session_type as keyof typeof SESSION_TYPE_LABELS] ?? s.session_type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {sa.pse !== null && <span>PSE {sa.pse}</span>}
                      {sa.attended === false && <span className="text-red-400">Ausente</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Ações */}
        <div className="flex flex-col gap-2">
          <Link
            href={`/atletas/${id}/editar`}
            className="w-full py-3 rounded-xl border border-border bg-card text-sm font-medium text-center"
          >
            Editar atleta
          </Link>
          <DeleteAthleteButton athleteId={id} athleteName={athlete.name} />
        </div>
      </div>
    </div>
  )
}
