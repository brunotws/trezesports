import { getAthletes } from '@/lib/queries/athletes'
import PageHeader from '@/components/layout/PageHeader'
import NewGameForm from './NewGameForm'

export default async function NovoJogoPage() {
  const athletes = await getAthletes()
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader title="Registrar Jogo" subtitle="Jogos" backHref="/jogos" />
      <NewGameForm athletes={athletes} />
    </div>
  )
}
