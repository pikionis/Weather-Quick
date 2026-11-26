import type { LeadDay, LocalDate } from '../openMeteo'
import type { ErrorDay } from './align'
import { addDays } from './dates'

/** ERA5 reaches a day about 7 days later (on 2026-11-26 the last full day was 19 November). */
export const ERA5_LAG_DAYS = 7
/** How many past errors the bias averages. */
export const BIAS_WINDOW_DAYS = 21

/**
 * The last date whose truth existed when the forecast for `target` at `lead` was issued.
 * That forecast was made on target − lead, and ERA5 was then 7 days behind.
 */
export function lastKnownDate(target: LocalDate, lead: LeadDay): LocalDate {
  return addDays(target, -(lead + ERA5_LAG_DAYS))
}

/**
 * Bias to subtract from the forecast for `target` at `lead`: the mean error of the latest 21 days
 * whose truth was known when that forecast was issued. Nothing later is read, so there is no look-ahead.
 * `null` until a full window exists.
 */
export function biasFor(errors: ErrorDay[], target: LocalDate, lead: LeadDay, window = BIAS_WINDOW_DAYS): number | null {
  const known = errors.filter((e) => e.date <= lastKnownDate(target, lead))
  if (known.length < window) return null
  const used = known.slice(-window)
  return used.reduce((sum, e) => sum + e.error, 0) / used.length
}
