'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateAthleteAction } from '@/lib/actions/athletes'
import type { Athlete } from '@/types'

const LINHA_ATTRS = [
  { key: 'attr_ball_control',     label: 'Ball Control',     desc: 'Controle de bola' },
  { key: 'attr_dribbling',        label: 'Dribbling',        desc: 'Condução e dribles' },
  { key: 'attr_passing',          label: 'Passing',          desc: 'Qualidade do passe' },
  { key: 'attr_finishing',        label: 'Finishing',        desc: 'Finalização' },
  { key: 'attr_movement',         label: 'Movement',         desc: 'Movimentação sem bola' },
  { key: 'attr_body_positioning', label: 'Body Positioning', desc: 'Posicionamento corporal' },
  { key: 'attr_scanning',         label: 'Scanning',         desc: 'Leitura do jogo' },
  { key: 'attr_decisions',        label: 'Decisions',        desc: 'Tomada de decisão' },
] as const

const GOLEIRO_ATTRS = [
  { key: 'attr_ball_handling', label: 'Ball Handling', desc: 'Trato de bola' },
  { key: 'attr_diving',        label: 'Diving',        desc: 'Quedas e pontes' },
  { key: 'attr_distribution',  label: 'Distribution',  desc: 'Saída de bola' },
  { key: 'attr_positioning',   label: 'Positioning',   desc: 'Posicionamento' },
  { key: 'attr_mindset',       label: 'Mindset',       desc: 'Mentalidade' },
] as const

type LinhaKey = (typeof LINHA_ATTRS)[number]['key']
type GoleiroKey = (typeof GOLEIRO_ATTRS)[number]['key']
type AttrKey = LinhaKey | GoleiroKey

interface Props {
  athlete: Athlete
}

function initAttrs(athlete: Athlete, isGoleiro: boolean): Record<AttrKey, number> {
  if (isGoleiro) {
    return {
      attr_ball_handling: athlete.attr_ball_handling ?? 5,
      attr_diving:        athlete.attr_diving        ?? 5,
      attr_distribution:  athlete.attr_distribution  ?? 5,
      attr_positioning:   athlete.attr_positioning   ?? 5,
      attr_mindset:       athlete.attr_mindset       ?? 5,
    } as Record<AttrKey, number>
  }
  return {
    attr_ball_control:     athlete.attr_ball_control     ?? 5,
    attr_dribbling:        athlete.attr_dribbling        ?? 5,
    attr_passing:          athlete.attr_passing          ?? 5,
    attr_finishing:        athlete.attr_finishing        ?? 5,
    attr_movement:         athlete.attr_movement         ?? 5,
    attr_body_positioning: athlete.attr_body_positioning ?? 5,
    attr_scanning:         athlete.attr_scanning         ?? 5,
    attr_decisions:        athlete.attr_decisions        ?? 5,
  } as Record<AttrKey, number>
}

export default function AvaliacaoForm({ athlete }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const isGoleiro = athlete.position === 'Goleiro'
  const attrs_list = isGoleiro ? GOLEIRO_ATTRS : LINHA_ATTRS
  const [attrs, setAttrs] = useState<Record<AttrKey, number>>(() => initAttrs(athlete, isGoleiro))

  function setAttr(key: AttrKey, v: number) {
    setAttrs(prev => ({ ...prev, [key]: Math.min(10, Math.max(0, v)) }))
  }

  function handleSubmit() {
    startTransition(async () => {
      await updateAthleteAction(athlete.id, attrs as Partial<Omit<Athlete, 'id' | 'created_at'>>)
      router.push(`/atletas/${athlete.id}`)
    })
  }

  function getRatingLabel(v: number): string {
    if (v <= 2) return 'Fraco'
    if (v <= 4) return 'Abaixo da média'
    if (v <= 6) return 'Médio'
    if (v <= 8) return 'Bom'
    return 'Excelente'
  }

  function getRatingColor(v: number): string {
    if (v <= 2) return 'text-red-400'
    if (v <= 4) return 'text-orange-400'
    if (v <= 6) return 'text-yellow-400'
    if (v <= 8) return 'text-blue-400'
    return 'text-green-400'
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <div className="rounded-xl border border-border bg-card px-4 py-3">
        <p className="text-xs text-muted-foreground">
          {isGoleiro ? '🧤 Goleiro' : '⚽ Jogador de Linha'} · Atributos de 0 a 10
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {attrs_list.map(({ key, label, desc }) => {
          const v = attrs[key as AttrKey]
          return (
            <div key={key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{desc}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${getRatingColor(v)}`}>{getRatingLabel(v)}</span>
                  <span className="w-6 text-right text-base font-bold tabular-nums">{v}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-3">0</span>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={v}
                  onChange={e => setAttr(key as AttrKey, Number(e.target.value))}
                  className="flex-1 accent-primary h-2"
                />
                <span className="text-xs text-muted-foreground w-4 text-right">10</span>
              </div>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
      >
        {isPending ? 'Salvando…' : 'Salvar avaliação'}
      </button>
    </div>
  )
}
