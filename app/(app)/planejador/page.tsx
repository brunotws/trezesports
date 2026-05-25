import { redirect } from 'next/navigation'
import { currentWeekId } from '@/lib/utils/week'

export default function PlanejadorPage() {
  redirect(`/planejador/${currentWeekId()}`)
}
