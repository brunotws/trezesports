import { cn } from '@/lib/utils'

interface Props {
  totalSessions:  number
  closedSessions: number
  redAlerts:      number
  yellowAlerts:   number
}

export default function WeekSummaryCard({
  totalSessions, closedSessions, redAlerts, yellowAlerts,
}: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Semana atual
      </p>
      <div className="grid grid-cols-4 gap-3 text-center">
        <Stat label="Sessões" value={totalSessions} />
        <Stat label="Encerradas" value={closedSessions} />
        <Stat label="Alertas" value={redAlerts} color="text-red-400" />
        <Stat label="Atenção" value={yellowAlerts} color="text-yellow-400" />
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={cn('text-2xl font-bold', color ?? 'text-foreground')}>{value}</span>
      <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
    </div>
  )
}
