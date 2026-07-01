import { getAthletes } from '@/lib/queries/athletes'
import { getExercises } from '@/lib/queries/exercises'
import { getExerciseGroups } from '@/lib/queries/exerciseGroups'
import { getAllACWR } from '@/lib/queries/analytics'
import { getAllTodayWellness } from '@/lib/queries/wellness'
import { getTemplates } from '@/lib/queries/sessionTemplates'
import { computeEnergyPct } from '@/lib/engine/energy'
import PageHeader from '@/components/layout/PageHeader'
import NewSessionForm from './NewSessionForm'

interface Props {
  searchParams: { weekId?: string; day?: string; sn?: string; date?: string }
}

export default async function NovaSessionPage({ searchParams }: Props) {
  const { weekId, day, sn, date } = searchParams

  if (!weekId || day === undefined || sn === undefined) {
    return (
      <div className="p-6 text-muted-foreground text-sm">Parâmetros inválidos.</div>
    )
  }

  const [athletes, exercises, groups, acwrRows, allWellness, templates] = await Promise.all([
    getAthletes(),
    getExercises(),
    getExerciseGroups(),
    getAllACWR(),
    getAllTodayWellness(),
    getTemplates(),
  ])

  const acwrMap = Object.fromEntries(acwrRows.map(r => [r.athlete_id, r]))
  const athleteEnergyMap = Object.fromEntries(
    athletes.map(a => [
      a.id,
      computeEnergyPct(acwrMap[a.id]?.acute_load ?? null, allWellness[a.id] ?? null),
    ]),
  )

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader
        title={`${date ?? 'Sem data'} · Sessão ${sn}`}
        subtitle="Nova sessão"
      />
      <NewSessionForm
        weekId={weekId}
        day={Number(day)}
        sn={Number(sn)}
        date={date ?? 'Sem data'}
        athletes={athletes}
        exercises={exercises}
        groups={groups}
        athleteEnergyMap={athleteEnergyMap}
        templates={templates}
      />
    </div>
  )
}
