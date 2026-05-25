import { getAthletes } from '@/lib/queries/athletes'
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

  const athletes = await getAthletes()

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 pt-6 pb-4 border-b border-border">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Nova sessão
        </p>
        <h1 className="text-lg font-semibold">
          {date ?? 'Sem data'} · Sessão {sn}
        </h1>
      </header>

      <NewSessionForm
        weekId={weekId}
        day={Number(day)}
        sn={Number(sn)}
        athletes={athletes}
      />
    </div>
  )
}
