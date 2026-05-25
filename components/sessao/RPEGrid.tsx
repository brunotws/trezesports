'use client'

import { cn } from '@/lib/utils'
import { getPseLabel } from '@/lib/utils/pse'

interface Props {
  value: number | null
  onChange: (v: number) => void
}

const RPE_COLORS: Record<number, string> = {
  0:  'bg-slate-500/20 text-slate-300 border-slate-500/30 hover:bg-slate-500/40',
  1:  'bg-green-600/20 text-green-300 border-green-600/30 hover:bg-green-600/40',
  2:  'bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/40',
  3:  'bg-green-400/20 text-green-300 border-green-400/30 hover:bg-green-400/40',
  4:  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/40',
  5:  'bg-yellow-400/20 text-yellow-300 border-yellow-400/30 hover:bg-yellow-400/40',
  6:  'bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/40',
  7:  'bg-orange-600/20 text-orange-300 border-orange-600/30 hover:bg-orange-600/40',
  8:  'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/40',
  9:  'bg-red-600/20 text-red-300 border-red-600/30 hover:bg-red-600/40',
  10: 'bg-red-700/20 text-red-300 border-red-700/30 hover:bg-red-700/40',
}

export default function RPEGrid({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {Array.from({ length: 11 }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={cn(
            'flex flex-col items-center justify-center min-h-[56px] rounded-md border transition-all font-semibold',
            RPE_COLORS[i],
            value === i && 'ring-2 ring-white/60 scale-105',
          )}
        >
          <span className="text-lg leading-none">{i}</span>
          <span className="text-[9px] opacity-70 mt-0.5 leading-none">
            {getPseLabel(i)}
          </span>
        </button>
      ))}
    </div>
  )
}
