import { getCategories } from '@/lib/queries/categories'
import PageHeader from '@/components/layout/PageHeader'
import CategoriasClient from './CategoriasClient'

export default async function CategoriasPage() {
  const categories = await getCategories()
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader title="Categorias" subtitle="Exercícios" backHref="/exercicios" />
      <div className="px-4 py-6">
        <CategoriasClient categories={categories} />
      </div>
    </div>
  )
}
