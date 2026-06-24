export const CATEGORY_COLORS = [
  { value: 'zinc',   classes: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30' },
  { value: 'red',    classes: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { value: 'orange', classes: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { value: 'yellow', classes: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'green',  classes: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'cyan',   classes: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { value: 'blue',   classes: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'violet', classes: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
  { value: 'pink',   classes: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
] as const

export type CategoryColorValue = typeof CATEGORY_COLORS[number]['value']

export function getCategoryClasses(color: string): string {
  return CATEGORY_COLORS.find(c => c.value === color)?.classes ?? CATEGORY_COLORS[0].classes
}
