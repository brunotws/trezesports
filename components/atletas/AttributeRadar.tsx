'use client'

import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts'
import type { Athlete } from '@/types'

const LINHA_ATTRS = [
  { key: 'attr_ball_control',     label: 'Ball Control' },
  { key: 'attr_dribbling',        label: 'Dribbling' },
  { key: 'attr_passing',          label: 'Passing' },
  { key: 'attr_finishing',        label: 'Finishing' },
  { key: 'attr_movement',         label: 'Movement' },
  { key: 'attr_body_positioning', label: 'Body Pos.' },
  { key: 'attr_scanning',         label: 'Scanning' },
  { key: 'attr_decisions',        label: 'Decisions' },
] as const

const GOLEIRO_ATTRS = [
  { key: 'attr_ball_handling', label: 'Ball Handling' },
  { key: 'attr_diving',        label: 'Diving' },
  { key: 'attr_distribution',  label: 'Distribution' },
  { key: 'attr_positioning',   label: 'Positioning' },
  { key: 'attr_mindset',       label: 'Mindset' },
] as const

interface Props {
  athlete: Athlete
  size?: number
}

export default function AttributeRadar({ athlete, size = 220 }: Props) {
  const isGoleiro = athlete.position === 'Goleiro'
  const attrList = isGoleiro ? GOLEIRO_ATTRS : LINHA_ATTRS

  const data = attrList.map(({ key, label }) => ({
    attribute: label,
    value: (athlete[key] as number | null) ?? 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={size}>
      <RadarChart data={data} cx="50%" cy="50%">
        <PolarGrid stroke="hsl(0,0%,20%)" />
        <PolarAngleAxis
          dataKey="attribute"
          tick={{ fontSize: 11, fill: 'hsl(0,0%,55%)' }}
        />
        <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
        <Radar
          name="Atributos"
          dataKey="value"
          stroke="hsl(210,80%,60%)"
          fill="hsl(210,80%,60%)"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{ background: 'hsl(0,0%,12%)', border: '1px solid hsl(0,0%,20%)', borderRadius: 8 }}
          labelStyle={{ color: 'hsl(0,0%,80%)' }}
          formatter={(v) => [v ?? 0, 'Nota']}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
