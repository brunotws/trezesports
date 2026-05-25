import Link from 'next/link'
import { Plus, Dumbbell } from 'lucide-react'
import { getExercises } from '@/lib/queries/exercises'
import DeleteExerciseButton from './DeleteExerciseButton'

const TYPE_LABELS: Record<string, string> = {
  tecnico:  'Técnico',
  cognitivo:'Cognitivo',
  fisico:   'Físico',
  misto:    'Misto',
}

const TYPE_COLORS: Record<string, string> = {
  tecnico:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cognitivo:'bg-purple-500/20 text-purple-400 border-purple-500/30',
  fisico:   'bg-orange-500/20 text-orange-400 border-orange-500/30',
  misto:    'bg-green-500/20 text-green-400 border-green-500/30',
}

export default async function ExerciciosPage() {
  const exercises = await getExercises()

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center justify-between px-4 pt-6 pb-4 border-b border-border">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Treze Sports</p>
          <h1 className="text-lg font-semibold">Exercícios</h1>
        </div>
        <Link
          href="/exercicios/novo"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
        >
          <Plus size={15} />
          Novo
        </Link>
      </header>

      <div className="flex flex-col gap-2 px-4 py-5">
        {exercises.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Dumbbell size={32} className="text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">Nenhum exercício cadastrado.</p>
            <Link
              href="/exercicios/novo"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              Adicionar exercício
            </Link>
          </div>
        ) : (
          exercises.map(ex => (
            <div
              key={ex.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium truncate">{ex.name}</span>
                  {ex.is_eccentric && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                      Excêntrico
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${TYPE_COLORS[ex.type] ?? 'bg-muted text-muted-foreground border-border'}`}>
                    {TYPE_LABELS[ex.type] ?? ex.type}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Fadiga {ex.fatigue_level}
                    {ex.attribute_target ? ` · ${ex.attribute_target}` : ''}
                  </span>
                </div>
              </div>
              <DeleteExerciseButton id={ex.id} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
