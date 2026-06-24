import { getTemplates } from '@/lib/queries/sessionTemplates'
import PageHeader from '@/components/layout/PageHeader'
import TemplatesClient from './TemplatesClient'

export default async function ModelosPage() {
  const templates = await getTemplates()

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader title="Modelos Salvos" subtitle="Treinos reutilizáveis" backHref="/planejador" />
      <div className="px-4 py-6">
        <TemplatesClient templates={templates} />
      </div>
    </div>
  )
}
