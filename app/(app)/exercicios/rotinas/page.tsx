import { getExercises } from '@/lib/queries/exercises'
import { getExerciseGroups } from '@/lib/queries/exerciseGroups'
import PageHeader from '@/components/layout/PageHeader'
import RotinasClient from './RotinasClient'

export default async function RotinasPage() {
  const [exercises, groups] = await Promise.all([
    getExercises(),
    getExerciseGroups(),
  ])

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader title="Rotinas" subtitle="Exercícios" backHref="/exercicios" />
      <RotinasClient exercises={exercises} initialGroups={groups} />
    </div>
  )
}
