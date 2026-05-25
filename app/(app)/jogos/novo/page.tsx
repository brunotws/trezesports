import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import NewGameForm from './NewGameForm'

export default function NovoJogoPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-border">
        <Link href="/jogos" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Jogos</p>
          <h1 className="text-lg font-semibold">Registrar Jogo</h1>
        </div>
      </header>
      <NewGameForm />
    </div>
  )
}
