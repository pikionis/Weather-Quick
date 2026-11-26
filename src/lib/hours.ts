import type { ForecastResponse, LocalDate, LocalDateTime } from './openMeteo'

/** One hour of the Forecast API's `hourly` block. */
export interface Hour {
  time: LocalDateTime
  temp: number
  dew: number
  wind: number
  gust: number
  windDir: number
  rain: number
  rainChance: number
}

export function toHours(hourly: ForecastResponse['hourly']): Hour[] {
  return hourly.time.map((time, i) => ({
    time,
    temp: hourly.temperature_2m[i],
    dew: hourly.dew_point_2m[i],
    wind: hourly.wind_speed_10m[i],
    gust: hourly.wind_gusts_10m[i],
    windDir: hourly.wind_direction_10m[i],
    rain: hourly.precipitation[i],
    rainChance: hourly.precipitation_probability[i],
  }))
}

/**
 * The instrument's trace: from `back` hours before now to the last forecast hour.
 * `now` is the index of the hour that holds the current reading ("22:45" is in the "22:00" hour), or -1.
 */
export function traceWindow(hours: Hour[], current: LocalDateTime, back = 24): { hours: Hour[]; now: number } {
  const nowIndex = hours.findIndex((h) => h.time === `${current.slice(0, 13)}:00`)
  if (nowIndex < 0) return { hours, now: -1 }
  const start = Math.max(0, nowIndex - back)
  return { hours: hours.slice(start), now: nowIndex - start }
}

/** Where each local day starts in the trace (its 00:00 hour), so day columns line up with it. */
export function dayStarts(hours: Hour[]): { date: LocalDate; index: number }[] {
  return hours.flatMap((h, index) => (h.time.endsWith('T00:00') ? [{ date: h.time.slice(0, 10), index }] : []))
}

const clamp = (i: number, count: number) => Math.min(count - 1, Math.max(0, i))

/** The point nearest to a pointer at `fraction` (0 to 1) of a line chart's width. */
export function nearestIndex(fraction: number, count: number): number {
  return clamp(Math.round(fraction * (count - 1)), count)
}

/** The bar under a pointer at `fraction` (0 to 1) of a bar chart's width. */
export function bandIndex(fraction: number, count: number): number {
  return clamp(Math.floor(fraction * count), count)
}

/**
 * The time cursor's next position for a key: arrows move one hour, Shift + arrows one day,
 * Home goes back to now (null), End to the last hour. Returns undefined for keys it does not handle.
 */
export function stepCursor(
  cursor: number | null,
  now: number,
  count: number,
  key: string,
  shift: boolean,
): number | null | undefined {
  const from = cursor ?? now
  const step = shift ? 24 : 1
  if (key === 'ArrowRight') return clamp(from + step, count)
  if (key === 'ArrowLeft') return clamp(from - step, count)
  if (key === 'Home') return null
  if (key === 'End') return count - 1
  return undefined
}
