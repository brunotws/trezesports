'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'

interface Props {
  loads: number[]
}

export default function ACWRChart({ loads }: Props) {
  const data = loads.map((load, i) => ({
    day: i + 1,
    carga: load,
  }))

  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,16%)" />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 9, fill: 'hsl(0,0%,45%)' }}
          tickLine={false}
          axisLine={false}
          interval={6}
        />
        <YAxis
          tick={{ fontSize: 9, fill: 'hsl(0,0%,45%)' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{ background: 'hsl(0,0%,12%)', border: '1px solid hsl(0,0%,20%)', borderRadius: 8, fontSize: 11 }}
          labelFormatter={v => `Dia ${v}`}
          formatter={(v) => [typeof v === 'number' ? v.toFixed(0) : v, 'sRPE']}
        />
        <Line
          type="monotone"
          dataKey="carga"
          stroke="hsl(210,80%,60%)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: 'hsl(210,80%,60%)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
