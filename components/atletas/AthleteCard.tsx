import Link from 'next/link'
import { cn } from '@/lib/utils'
import FatigueBadge from './FatigueBadge'
import { getEnergyMeta } from '@/lib/engine/energy'
import type { Athlete, ACWRRow } from '@/types'

interface Props {
  athlete:    Athlete
  acwr?:      ACWRRow | null
  energyPct?: number | null
}

const STATUS_RING: Record<string, string> = {
  green:  'border-green-500/30',
  yellow: 'border-yellow-500/30',
  red:    'border-red-500/40',
}

function acwrFatigue(acwr: number | null): number {
  if (acwr === null) return 0
  if (acwr <= 5)  return 0
  if (acwr <= 10) return 5
  if (acwr <= 15) return 11
  return 16
}

function acwrStatus(acwr: number | null): string {
  if (acwr === null || acwr < 0.8) return 'green'
  if (acwr <= 1.3) return 'green'
  if (acwr <= 1.49) return 'yellow'
  return 'red'
}

export default function AthleteCard({ athlete, acwr, energyPct }: Props) {
  const status    = acwrStatus(acwr?.acwr ?? null)
  const eMeta     = energyPct != null ? getEnergyMeta(energyPct) : null
  return (
    <Link
      href={`/atletas/${athlete.id}`}
      className={cn(
        'flex items-center justify-between px-4 py-3 rounded-xl border bg-card transition-colors hover:brightness-110',
        STATUS_RING[status],
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-sm">{athlete.name}</span>
        <span className="text-[11px] text-muted-foreground">
          {athlete.position ?? '—'} · {athlete.modality === 'futsal' ? 'Futsal' : 'Futebol'}
          {athlete.turma ? ` · ${athlete.turma}` : ''}
        </span>
        {eMeta && energyPct != null && (
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-14 h-1 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${eMeta.bar}`}
                style={{ width: `${energyPct}%` }}
              />
            </div>
            <span className={`text-[10px] font-semibold ${eMeta.text}`}>
              ⚡{energyPct}%
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        <FatigueBadge accumulated={acwrFatigue(acwr?.acwr ?? null)} />
        {acwr?.acwr != null && (
          <span className="text-[10px] text-muted-foreground">
            ACWR {acwr.acwr.toFixed(2)}
          </span>
        )}
      </div>
    </Link>
  )
}
