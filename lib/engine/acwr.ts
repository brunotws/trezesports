// Pure ACWR / Monotony / Strain calculations.
// All functions accept an array of 28 daily sRPE values (index 0 = oldest).
// Rest days MUST be included as 0 — never filter them out.

function mean(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

function stddevPop(arr: number[]): number {
  const m = mean(arr)
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length)
}

/** Pad array to exactly 28 values with leading zeros if shorter. */
export function padTo28(loads: number[]): number[] {
  const tail = loads.slice(-28)
  return [...Array(28 - tail.length).fill(0), ...tail]
}

export function computeAcuteLoad(padded28: number[]): number {
  return mean(padded28.slice(-7))
}

export function computeChronicLoad(padded28: number[]): number {
  return mean(padded28)
}

/**
 * Returns null when chronic load = 0 (insufficient baseline).
 * Never divides by zero.
 */
export function computeACWR(acuteLoad: number, chronicLoad: number): number | null {
  if (chronicLoad === 0) return null
  return parseFloat((acuteLoad / chronicLoad).toFixed(3))
}

/**
 * Monotony = weekly_mean / weekly_std_dev.
 * Capped at 10 when std dev = 0 (every day identical = maximum monotony).
 * Returns null when weekly mean = 0 (no training at all).
 */
export function computeMonotony(padded28: number[]): number | null {
  const week7 = padded28.slice(-7)
  const avg   = mean(week7)
  if (avg === 0) return null
  const std = stddevPop(week7)
  if (std === 0) return 10
  return parseFloat((avg / std).toFixed(3))
}

export function computeStrain(weeklyTotal: number, monotony: number | null): number | null {
  if (monotony === null) return null
  return parseFloat((weeklyTotal * monotony).toFixed(2))
}

export function computeWeeklyTotal(padded28: number[]): number {
  return padded28.slice(-7).reduce((s, v) => s + v, 0)
}
