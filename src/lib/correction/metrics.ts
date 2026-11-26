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

/**
 * The 80% band, as offsets from the shown value: on 8 of 10 past days the truth fell between shown + p10 and
 * shown + p90. It is built from truth − shown, so it is simply added to the value and cannot come out mirrored
 * when the errors lean one way.
 */
export interface Band {
  p10: number
  p90: number
}

export interface Range {
  low: number
  high: number
}

/** `residuals` are truth − shown, one per backtest day. */
export function band(residuals: number[]): Band {
  return { p10: percentile(residuals, 10), p90: percentile(residuals, 90) }
}

/** Where the truth should fall for a shown value. */
export function rangeFor(shown: number, b: Band): Range {
  return { low: shown + b.p10, high: shown + b.p90 }
}
