'use client'

import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts'
import type { Athlete } from '@/types'

const ATTRS = [
  { key: 'attr_passe',       label: 'Passe' },
  { key: 'attr_dominio',     label: 'Domínio' },
  { key: 'attr_scan',        label: 'Visão' },
  { key: 'attr_decisao',     label: 'Decisão' },
  { key: 'attr_mobilidade',  label: 'Mobilidade' },
  { key: 'attr_finalizacao', label: 'Finalização' },
] as const

interface Props {
  athlete: Athlete
  size?: number
}

export default function AttributeRadar({ athlete, size = 220 }: Props) {
  const data = ATTRS.map(({ key, label }) => ({
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
          formatter={(v) => [v ?? 0, 'Valor']}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
