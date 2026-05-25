import PageHeader from '@/components/layout/PageHeader'
import NewGameForm from './NewGameForm'

export default function NovoJogoPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader title="Registrar Jogo" subtitle="Jogos" backHref="/jogos" />
      <NewGameForm />
    </div>
  )
}
