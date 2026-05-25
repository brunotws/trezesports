import { notFound } from 'next/navigation'
import { getAthlete } from '@/lib/queries/athletes'
import PageHeader from '@/components/layout/PageHeader'
import EditAthleteForm from './EditAthleteForm'

interface Props {
  params: { id: string }
}

export default async function EditarAtletaPage({ params }: Props) {
  const athlete = await getAthlete(params.id)
  if (!athlete) notFound()

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader title="Editar" subtitle="Atleta" backHref={`/atletas/${params.id}`} />
      <EditAthleteForm athlete={athlete} />
    </div>
  )
}
