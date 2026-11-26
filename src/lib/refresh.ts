import type { ForecastQuery } from './forecastClient'
import type { LocalDate } from './openMeteo'

export const PAST_DAYS = 28
export const FORECAST_DAYS = 7
export const REFRESH_MS = 10 * 60 * 1000
/** After a failed request, try again sooner. */
export const RETRY_MS = 60 * 1000

/**
 * What the next Forecast request asks for. The 28-day history comes with the first load, and again only after
 * local midnight (so yesterday joins it). Every other refresh asks for one past day, which keeps the last 24 hours
 * of the instrument's trace, and the next 7 days. It weighs 2.2 calls instead of 5.5.
 */
export function forecastQuery(historyAsOf: LocalDate | null, today: LocalDate): ForecastQuery {
  return { pastDays: historyAsOf === today ? 1 : PAST_DAYS, forecastDays: FORECAST_DAYS }
}

/** When the next request is due: 10 minutes after a good one, 1 minute after a failed one. */
export function nextRequestAt(lastMs: number, failed: boolean): number {
  return lastMs + (failed ? RETRY_MS : REFRESH_MS)
}

/** The date in the place's time zone, e.g. "2026-11-26". */
export function localDate(now: Date, timeZone: string): LocalDate {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

/** The time in the place's time zone, e.g. "23:45", or "23:45:09" with seconds. */
export function localTime(now: Date, timeZone: string, seconds = false): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: seconds ? '2-digit' : undefined,
    hourCycle: 'h23',
  }).format(now)
}

/** A countdown such as "7:41". Never negative. */
export function countdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
