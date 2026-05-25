// Pure date utilities — no Supabase imports here.
// day_of_week in the DB schema: 0 = Monday … 6 = Sunday

export const DAY_LABELS      = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
export const DAY_LABELS_FULL = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

/** Monday of the week containing `date` (defaults to today). */
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date)
  const day = d.getDay()           // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day  // rewind to Monday
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

/** 'YYYY-MM-DD' string from a Date object. */
export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/** Monday of the current week as 'YYYY-MM-DD' — used as the route [weekId] param. */
export function currentWeekId(): string {
  return toISODate(getWeekStart())
}

/** Parse a route weekId ('YYYY-MM-DD') back to a Date safely. */
export function weekIdToDate(weekId: string): Date {
  return new Date(weekId + 'T00:00:00')
}

/** All 7 dates (Mon–Sun) for a given week. */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

/** "18 – 24 mai 2026" */
export function formatWeekRange(weekStart: Date): string {
  const end = addDays(weekStart, 6)
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  return `${fmt(weekStart)} – ${fmt(end)} ${end.getFullYear()}`
}

export function prevWeekId(weekId: string): string {
  return toISODate(addDays(weekIdToDate(weekId), -7))
}

export function nextWeekId(weekId: string): string {
  return toISODate(addDays(weekIdToDate(weekId), 7))
}

export function isCurrentWeek(weekId: string): boolean {
  return weekId === currentWeekId()
}

/** Compute the calendar date for a given week + day_of_week (0=Mon). */
export function sessionDate(weekId: string, dayOfWeek: number): string {
  return toISODate(addDays(weekIdToDate(weekId), dayOfWeek))
}
