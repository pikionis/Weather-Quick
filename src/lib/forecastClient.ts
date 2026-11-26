import type { Place } from './location'
import { isApiError, type ApiError, type CurrentField, type DailyField, type ForecastResponse, type HourlyField } from './openMeteo'

const BASE = 'https://api.open-meteo.com/v1/forecast'

// The fields of docs/open-meteo-brief.md section 1. `Record<Field, true>` makes tsc fail if one is missing or unknown.
const CURRENT: Record<CurrentField, true> = {
  temperature_2m: true,
  apparent_temperature: true,
  dew_point_2m: true,
  wind_speed_10m: true,
  wind_gusts_10m: true,
  wind_direction_10m: true,
  precipitation: true,
  weather_code: true,
}
const HOURLY: Record<HourlyField, true> = {
  temperature_2m: true,
  dew_point_2m: true,
  wind_speed_10m: true,
  wind_gusts_10m: true,
  wind_direction_10m: true,
  precipitation: true,
  precipitation_probability: true,
}
const DAILY: Record<DailyField, true> = {
  temperature_2m_max: true,
  temperature_2m_min: true,
  wind_speed_10m_max: true,
  wind_gusts_10m_max: true,
  precipitation_sum: true,
  precipitation_probability_max: true,
  weather_code: true,
}

export interface ForecastQuery {
  pastDays: number
  forecastDays: number
}

export function forecastUrl(place: Place, query: ForecastQuery): string {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: Object.keys(CURRENT).join(','),
    hourly: Object.keys(HOURLY).join(','),
    daily: Object.keys(DAILY).join(','),
    past_days: String(query.pastDays),
    forecast_days: String(query.forecastDays),
    timezone: 'auto',
  })
  return `${BASE}?${params}`
}

/** Never throws: a failed call, a rate limit or a network error all come back as an `ApiError` with a reason. */
export async function fetchForecast(url: string, fetchFn: typeof fetch = fetch): Promise<ForecastResponse | ApiError> {
  try {
    const res = await fetchFn(url)
    const body: unknown = await res.json().catch(() => null)
    if (isApiError(body)) return body
    if (!res.ok || body === null) return { error: true, reason: `HTTP ${res.status} from Open-Meteo` }
    return body as ForecastResponse
  } catch (e) {
    return { error: true, reason: e instanceof Error ? e.message : String(e) }
  }
}
