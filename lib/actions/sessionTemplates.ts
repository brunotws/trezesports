'use server'

import { revalidatePath } from 'next/cache'
import {
  cloneAsTemplate,
  archiveSession,
  deleteSession,
  bulkArchiveSessions,
  bulkDeleteSessions,
  getTemplateWithExercises,
  type TemplateData,
} from '@/lib/queries/sessionTemplates'

export async function cloneAsTemplateAction(sessionId: string): Promise<{ id: string }> {
  const template = await cloneAsTemplate(sessionId)
  revalidatePath('/planejador', 'layout')
  revalidatePath('/planejador/modelos')
  return { id: template.id }
}

export async function archiveSessionAction(sessionId: string): Promise<void> {
  await archiveSession(sessionId)
  revalidatePath('/planejador', 'layout')
}

export async function deleteSessionAction(sessionId: string): Promise<void> {
  await deleteSession(sessionId)
  revalidatePath('/planejador', 'layout')
  revalidatePath('/sessao', 'layout')
}

export async function bulkArchiveAction(ids: string[]): Promise<void> {
  await bulkArchiveSessions(ids)
  revalidatePath('/planejador', 'layout')
}

export async function bulkDeleteAction(ids: string[]): Promise<void> {
  await bulkDeleteSessions(ids)
  revalidatePath('/planejador', 'layout')
}

export async function loadTemplateAction(templateId: string): Promise<TemplateData | null> {
  return getTemplateWithExercises(templateId)
}
