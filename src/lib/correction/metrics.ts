/** The correction must beat the source by this much (°C of MAE)... */
export const MIN_GAIN = 0.1
/** ...over at least this many backtest days. */
export const MIN_DAYS = 10
/** Room for floating-point rounding, so that a gain of exactly 0.1 °C counts (0.3 − 0.1 is 0.19999…). */
const ROUNDING = 1e-9

export type Winner = 'ours' | 'source'

/** Mean absolute error. `NaN` for no values. */
export function mae(errors: number[]): number {
  return errors.reduce((sum, e) => sum + Math.abs(e), 0) / errors.length
}

/** Percentile `p` (0 to 100) with linear interpolation between the two nearest values. */
export function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  const pos = ((sorted.length - 1) * p) / 100
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

/** Ours wins only with enough days and a gain of at least 0.1 °C; a tie or a smaller gain goes to the source. */
export function decide(maeSource: number, maeOurs: number, n: number): Winner {
  return n >= MIN_DAYS && maeSource - maeOurs >= MIN_GAIN - ROUNDING ? 'ours' : 'source'
}

/** 8 in 10 past errors fell between `p10` and `p90` (error = shown − truth). */
export interface Band {
  p10: number
  p90: number
}

export function band(errors: number[]): Band {
  return { p10: percentile(errors, 10), p90: percentile(errors, 90) }
}

/** Where the truth should fall for a shown value: truth = shown − error, so the range flips the band. */
export function rangeFor(shown: number, b: Band): { low: number; high: number } {
  return { low: shown - b.p90, high: shown - b.p10 }
}
