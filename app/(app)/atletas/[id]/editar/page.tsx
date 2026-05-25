import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getAthlete } from '@/lib/queries/athletes'
import EditAthleteForm from './EditAthleteForm'

interface Props {
  params: { id: string }
}

export default async function EditarAtletaPage({ params }: Props) {
  const athlete = await getAthlete(params.id)
  if (!athlete) notFound()

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-border">
        <Link href={`/atletas/${params.id}`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Atleta</p>
          <h1 className="text-lg font-semibold">Editar</h1>
        </div>
      </header>
      <EditAthleteForm athlete={athlete} />
    </div>
  )
}
