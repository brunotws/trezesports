import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import NewExerciseForm from './NewExerciseForm'

export default function NovoExercicioPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-border">
        <Link href="/exercicios" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Exercícios</p>
          <h1 className="text-lg font-semibold">Novo Exercício</h1>
        </div>
      </header>
      <NewExerciseForm />
    </div>
  )
}
