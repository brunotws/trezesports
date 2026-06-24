import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { getAthletes } from '@/lib/queries/athletes'
import { getAllACWR } from '@/lib/queries/analytics'
import { getWeekSessions } from '@/lib/queries/sessions'
import { getOrCreateWeek } from '@/lib/queries/weeks'
import { currentWeekId } from '@/lib/utils/week'
import AthleteCard from '@/components/atletas/AthleteCard'
import WeekSummaryCard from '@/components/dashboard/WeekSummaryCard'
import type { ACWRRow } from '@/types'

function acwrStatus(acwr: number | null): 'green' | 'yellow' | 'red' {
  if (acwr === null) return 'green'
  if (acwr <= 1.3) return 'green'
  if (acwr <= 1.49) return 'yellow'
  return 'red'
}

export default async function DashboardPage() {
  const weekId = currentWeekId()

  const [athletes, acwrRows, week] = await Promise.all([
    getAthletes(),
    getAllACWR(),
    getOrCreateWeek(weekId),
  ])

  const sessions = await getWeekSessions(week.id)
  const acwrMap = Object.fromEntries(acwrRows.map((r: ACWRRow) => [r.athlete_id, r]))

  const redAlerts    = acwrRows.filter(r => acwrStatus(r.acwr) === 'red').length
  const yellowAlerts = acwrRows.filter(r => acwrStatus(r.acwr) === 'yellow').length

  const alertAthletes = athletes.filter(a => {
    const s = acwrStatus(acwrMap[a.id]?.acwr ?? null)
    return s === 'red' || s === 'yellow'
  })

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 pt-6 pb-4 border-b border-border">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Treze Sports</p>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </header>

      <div className="flex flex-col gap-6 px-4 py-5">
        {/* Week summary */}
        <WeekSummaryCard
          totalSessions={sessions.length}
          closedSessions={sessions.filter(s => s.status === 'encerrada').length}
          redAlerts={redAlerts}
          yellowAlerts={yellowAlerts}
        />

        {/* Red alerts */}
        {alertAthletes.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} className="text-red-400" />
              <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
                Alertas de carga ({alertAthletes.length})
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {alertAthletes.map(a => (
                <AthleteCard key={a.id} athlete={a} acwr={acwrMap[a.id] ?? null} />
              ))}
            </div>
          </section>
        )}

        {/* All athletes */}
        {athletes.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Atletas ({athletes.length})
              </p>
              <Link href="/atletas" className="text-xs text-primary">
                Ver todos
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {athletes.map(a => (
                <AthleteCard key={a.id} athlete={a} acwr={acwrMap[a.id] ?? null} />
              ))}
            </div>
          </section>
        )}

        {athletes.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-muted-foreground text-sm">
              Adicione atletas para ver os dados de readiness aqui.
            </p>
            <Link
              href="/atletas/novo"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              Cadastrar atleta
            </Link>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/planejador"
            className="flex flex-col gap-1 px-4 py-3 rounded-xl border border-border bg-card text-sm"
          >
            <span className="font-medium">Planejador</span>
            <span className="text-[11px] text-muted-foreground">Grade FM semanal</span>
          </Link>
          <Link
            href="/exercicios"
            className="flex flex-col gap-1 px-4 py-3 rounded-xl border border-border bg-card text-sm"
          >
            <span className="font-medium">Biblioteca</span>
            <span className="text-[11px] text-muted-foreground">Treinos e exercícios</span>
          </Link>
          <Link
            href="/atletas/novo"
            className="flex flex-col gap-1 px-4 py-3 rounded-xl border border-border bg-card text-sm"
          >
            <span className="font-medium">Novo atleta</span>
            <span className="text-[11px] text-muted-foreground">Cadastrar aluno</span>
          </Link>
          <Link
            href="/jogos/novo"
            className="flex flex-col gap-1 px-4 py-3 rounded-xl border border-border bg-card text-sm"
          >
            <span className="font-medium">Registrar jogo</span>
            <span className="text-[11px] text-muted-foreground">Bloqueia véspera auto</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
