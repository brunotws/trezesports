import { getCategories } from '@/lib/queries/categories'
import PageHeader from '@/components/layout/PageHeader'
import NewExerciseForm from './NewExerciseForm'

export default async function NovoExercicioPage() {
  const categories = await getCategories()
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader title="Novo Exercício" subtitle="Exercícios" backHref="/exercicios" />
      <NewExerciseForm categories={categories} />
    </div>
  )
}
