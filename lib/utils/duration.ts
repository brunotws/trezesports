export function formatDuration(min: number | null | undefined): string {
  if (!min) return ''
  const m = Math.floor(min)
  const s = Math.round((min % 1) * 60)
  if (m === 0) return `${s}s`
  if (s === 0) return `${m}min`
  return `${m}min ${s}s`
}
