import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAthlete, getAthleteSessionHistory, getDailyLoadHistory } from '@/lib/queries/athletes'
import { getAthleteACWR } from '@/lib/queries/analytics'
import { getTodayWellness } from '@/lib/queries/wellness'
import AttributeRadar from '@/components/atletas/AttributeRadar'
import WellnessForm from '@/components/atletas/WellnessForm'
import ACWRChart from '@/components/dashboard/ACWRChart'
import PageHeader from '@/components/layout/PageHeader'
import { SESSION_TYPE_LABELS } from '@/lib/engine/morphocycle'

interface Props {
  params: { id: string }
}

const READINESS_BADGE: Record<string, string> = {
  green:  'bg-green-500/20 text-green-400 border-green-500/30',
  yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  red:    'bg-red-500/20 text-red-400 border-red-500/30',
}

function acwrStatus(acwr: number | null): 'green' | 'yellow' | 'red' {
  if (acwr === null) return 'green'
  if (acwr <= 1.3) return 'green'
  if (acwr <= 1.49) return 'yellow'
  return 'red'
}

export default async function AtletaPerfilPage({ params }: Props) {
  const { id } = params
  const [athlete, acwrRow, todayWellness, loads, history] = await Promise.all([
    getAthlete(id),
    getAthleteACWR(id),
    getTodayWellness(id),
    getDailyLoadHistory(id, 28),
    getAthleteSessionHistory(id, 8),
  ])

  if (!athlete) notFound()

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
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Atributos FM
          </p>
          <div className="rounded-xl border border-border bg-card py-2">
            <AttributeRadar athlete={athlete} size={220} />
          </div>
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
                const dateStr = weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                return (
                  <div
                    key={sa.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-md border border-border bg-card text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-10">{dateStr}</span>
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
        <Link
          href={`/atletas/${id}/editar`}
          className="w-full py-3 rounded-xl border border-border bg-card text-sm font-medium text-center"
        >
          Editar atleta
        </Link>
      </div>
    </div>
  )
}
