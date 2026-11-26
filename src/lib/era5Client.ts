import { fetchJson } from './fetchJson'
import type { Place } from './location'
import type { ApiError, Era5HourlyField, Era5Response, LocalDate } from './openMeteo'

const BASE = 'https://archive-api.open-meteo.com/v1/archive'

// `Record<Field, true>` makes tsc fail if a field of the type is missing or unknown.
const HOURLY: Record<Era5HourlyField, true> = { temperature_2m: true, dew_point_2m: true, wind_speed_10m: true }

/** The truth for the backtest. `models=era5` matters: without it the archive answers with ECMWF IFS. */
export function era5Url(place: Place, range: { start: LocalDate; end: LocalDate }): string {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    hourly: Object.keys(HOURLY).join(','),
    models: 'era5',
    timezone: place.timezone,
    start_date: range.start,
    end_date: range.end,
  })
  return `${BASE}?${params}`
}

export function fetchEra5(url: string, fetchFn?: typeof fetch): Promise<Era5Response | ApiError> {
  return fetchJson<Era5Response>(url, fetchFn)
}
