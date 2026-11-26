import type { ForecastQuery } from './forecastClient'
import type { LocalDate } from './openMeteo'

export const PAST_DAYS = 28
export const FORECAST_DAYS = 7
export const REFRESH_MS = 10 * 60 * 1000

/**
 * What the next Forecast request asks for. The history comes once, with the first load, and again only after
 * local midnight (so yesterday joins it). Every other refresh asks for the 7 days alone, which weighs 2.2 calls instead of 5.5.
 */
export function forecastQuery(historyAsOf: LocalDate | null, today: LocalDate): ForecastQuery {
  return { pastDays: historyAsOf === today ? 0 : PAST_DAYS, forecastDays: FORECAST_DAYS }
}

/** True when the last request is at least 10 minutes old. */
export function isDue(lastMs: number, nowMs: number): boolean {
  return nowMs - lastMs >= REFRESH_MS
}

/** The date in the place's time zone, e.g. "2026-11-26". */
export function localDate(now: Date, timeZone: string): LocalDate {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

/** The time in the place's time zone, e.g. "23:45". */
export function localTime(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now)
}
