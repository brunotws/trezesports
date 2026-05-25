import PageHeader from '@/components/layout/PageHeader'
import NewAthleteForm from './NewAthleteForm'

export default function NovoAtletaPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader title="Novo Atleta" subtitle="Atletas" backHref="/atletas" />
      <NewAthleteForm />
    </div>
  )
}
