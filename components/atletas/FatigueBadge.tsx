import { cn } from '@/lib/utils'
import { getFatigueLevel, FATIGUE_LABELS, FATIGUE_COLORS } from '@/lib/utils/fatigue'

interface Props {
  accumulated: number
  className?: string
}

export default function FatigueBadge({ accumulated, className }: Props) {
  const level = getFatigueLevel(accumulated)
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium',
        FATIGUE_COLORS[level],
        className,
      )}
    >
      {FATIGUE_LABELS[level]}
    </span>
  )
}
