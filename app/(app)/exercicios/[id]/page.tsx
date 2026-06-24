import { notFound } from 'next/navigation'
import { getExercise } from '@/lib/queries/exercises'
import PageHeader from '@/components/layout/PageHeader'
import EditExerciseForm from './EditExerciseForm'

interface Props {
  params: { id: string }
}

export default async function EditExercicioPage({ params }: Props) {
  const exercise = await getExercise(params.id)
  if (!exercise) notFound()

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader title="Editar exercício" subtitle={exercise.name} backHref="/exercicios" />
      <EditExerciseForm exercise={exercise} />
    </div>
  )
}
