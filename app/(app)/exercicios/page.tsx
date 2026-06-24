import Link from 'next/link'
import Image from 'next/image'
import { Plus, Dumbbell } from 'lucide-react'
import { getExercises } from '@/lib/queries/exercises'
import DeleteExerciseButton from './DeleteExerciseButton'
import PageHeader from '@/components/layout/PageHeader'

const TYPE_LABELS: Record<string, string> = {
  tecnico:   'Técnico',
  cognitivo: 'Cognitivo',
  fisico:    'Físico',
  misto:     'Misto',
}

const TYPE_COLORS: Record<string, string> = {
  tecnico:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cognitivo: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  fisico:    'bg-orange-500/20 text-orange-400 border-orange-500/30',
  misto:     'bg-green-500/20 text-green-400 border-green-500/30',
}

const DIFFICULTY_DOTS = (level: number) =>
  Array.from({ length: 5 }, (_, i) => (
    <span
      key={i}
      className={`inline-block w-1.5 h-1.5 rounded-full ${i < level ? 'bg-foreground' : 'bg-muted-foreground/20'}`}
    />
  ))

export default async function ExerciciosPage() {
  const exercises = await getExercises()

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader title="Biblioteca" subtitle="Exercícios" backHref="/dashboard">
        <Link
          href="/exercicios/rotinas"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground"
        >
          Rotinas
        </Link>
        <Link
          href="/exercicios/novo"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
        >
          <Plus size={15} />
          Novo
        </Link>
      </PageHeader>

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
            <Link
              key={ex.id}
              href={`/exercicios/${ex.id}`}
              className="flex items-start justify-between px-4 py-3 rounded-xl border border-border bg-card gap-3"
            >
              {/* Thumbnail */}
              {ex.diagram_url && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border shrink-0">
                  <Image src={ex.diagram_url} alt={ex.name} fill className="object-cover" />
                </div>
              )}
              <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                {/* Nome + badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{ex.name}</span>
                  {ex.for_goalkeeper && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      🧤 Goleiro
                    </span>
                  )}
                  {ex.is_eccentric && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                      Excêntrico
                    </span>
                  )}
                </div>

                {/* Tipo + atributos */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${TYPE_COLORS[ex.type] ?? 'bg-muted text-muted-foreground border-border'}`}>
                    {TYPE_LABELS[ex.type] ?? ex.type}
                  </span>
                  {ex.attribute_target && (
                    <span className="text-[10px] text-muted-foreground">{ex.attribute_target}</span>
                  )}
                  {ex.attr_secondary && (
                    <span className="text-[10px] text-muted-foreground/60">· {ex.attr_secondary}</span>
                  )}
                </div>

                {/* Dificuldade + duração */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-0.5">
                    {DIFFICULTY_DOTS(ex.fatigue_level)}
                  </div>
                  {ex.duration_min && (
                    <span className="text-[10px] text-muted-foreground">{ex.duration_min} min</span>
                  )}
                </div>
              </div>

              <DeleteExerciseButton id={ex.id} />
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
