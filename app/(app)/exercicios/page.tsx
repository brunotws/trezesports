import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getExercisesWithCategories, getCategories } from '@/lib/queries/categories'
import PageHeader from '@/components/layout/PageHeader'
import ExerciciosClient from './ExerciciosClient'

export default async function ExerciciosPage() {
  const [exercises, categories] = await Promise.all([
    getExercisesWithCategories(),
    getCategories(),
  ])

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
          href="/exercicios/categorias"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground"
        >
          Tags
        </Link>
        <Link
          href="/exercicios/novo"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
        >
          <Plus size={15} />
          Novo
        </Link>
      </PageHeader>
      <ExerciciosClient exercises={exercises} categories={categories} />
    </div>
  )
}
