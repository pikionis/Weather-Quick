import type { LocalDate } from '../openMeteo'

/** `date` plus `days` (negative goes back). Calendar arithmetic in UTC, so no clock change can shift it. */
export function addDays(date: LocalDate, days: number): LocalDate {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** The `days` local dates that end on `today`, as the API's `start_date` and `end_date`. */
export function lastDays(today: LocalDate, days: number): { start: LocalDate; end: LocalDate } {
  return { start: addDays(today, -(days - 1)), end: today }
}

/** Whole days from `from` to `to`: 1 for tomorrow, negative for the past. */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)
}
