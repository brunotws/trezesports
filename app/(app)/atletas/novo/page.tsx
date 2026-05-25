import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import NewAthleteForm from './NewAthleteForm'

export default function NovoAtletaPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-border">
        <Link href="/atletas" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Atletas</p>
          <h1 className="text-lg font-semibold">Novo Atleta</h1>
        </div>
      </header>
      <NewAthleteForm />
    </div>
  )
}
