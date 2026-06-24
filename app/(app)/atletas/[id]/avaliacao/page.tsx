import { notFound } from 'next/navigation'
import { getAthlete } from '@/lib/queries/athletes'
import PageHeader from '@/components/layout/PageHeader'
import AvaliacaoForm from './AvaliacaoForm'

interface Props {
  params: { id: string }
}

export default async function AvaliacaoPage({ params }: Props) {
  const athlete = await getAthlete(params.id)
  if (!athlete) notFound()

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader
        title="Avaliação"
        subtitle={athlete.name}
        backHref={`/atletas/${params.id}`}
      />
      <AvaliacaoForm athlete={athlete} />
    </div>
  )
}
