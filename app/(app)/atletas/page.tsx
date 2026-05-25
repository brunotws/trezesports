import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getAthletes } from '@/lib/queries/athletes'
import { getAllACWR } from '@/lib/queries/analytics'
import AthleteCard from '@/components/atletas/AthleteCard'
import type { ACWRRow } from '@/types'

export default async function AtletasPage() {
  const [athletes, acwrRows] = await Promise.all([getAthletes(), getAllACWR()])

  const acwrMap = Object.fromEntries(acwrRows.map((r: ACWRRow) => [r.athlete_id, r]))

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center justify-between px-4 pt-6 pb-4 border-b border-border">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Treze Sports</p>
          <h1 className="text-lg font-semibold">Atletas</h1>
        </div>
        <Link
          href="/atletas/novo"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
        >
          <Plus size={15} />
          Novo
        </Link>
      </header>

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
            />
          ))
        )}
      </div>
    </div>
  )
}
