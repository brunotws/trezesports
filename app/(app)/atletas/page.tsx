import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getAthletes } from '@/lib/queries/athletes'
import { getAllACWR } from '@/lib/queries/analytics'
import { getAllTodayWellness } from '@/lib/queries/wellness'
import { computeEnergyPct } from '@/lib/engine/energy'
import AthleteCard from '@/components/atletas/AthleteCard'
import PageHeader from '@/components/layout/PageHeader'
import type { ACWRRow } from '@/types'

export default async function AtletasPage() {
  const [athletes, acwrRows, allWellness] = await Promise.all([
    getAthletes(),
    getAllACWR(),
    getAllTodayWellness(),
  ])

  const acwrMap = Object.fromEntries(acwrRows.map((r: ACWRRow) => [r.athlete_id, r]))

  const energyMap = Object.fromEntries(
    athletes.map(a => [
      a.id,
      computeEnergyPct(acwrMap[a.id]?.acute_load ?? null, allWellness[a.id] ?? null),
    ]),
  )

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader title="Atletas" subtitle="Treze Sports" backHref="/dashboard">
        <Link
          href="/atletas/novo"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
        >
          <Plus size={15} />
          Novo
        </Link>
      </PageHeader>

      <div className="flex flex-col gap-3 px-4 py-5">
        {athletes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-muted-foreground text-sm">Nenhum atleta cadastrado.</p>
            <Link
              href="/atletas/novo"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              Cadastrar primeiro atleta
            </Link>
          </div>
        ) : (
          athletes.map(athlete => (
            <AthleteCard
              key={athlete.id}
              athlete={athlete}
              acwr={acwrMap[athlete.id] ?? null}
              energyPct={energyMap[athlete.id]}
            />
          ))
        )}
      </div>
    </div>
  )
}
