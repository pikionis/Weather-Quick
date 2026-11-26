import { fetchJson } from './fetchJson'
import type { Place } from './location'
import { LEAD_DAYS, type ApiError, type LocalDate, type PreviousRunsResponse } from './openMeteo'

const BASE = 'https://previous-runs-api.open-meteo.com/v1/forecast'

/** Hourly temperature as forecast 1 to 7 days earlier, default model (best_match), in the place's local time. */
export function previousRunsUrl(place: Place, range: { start: LocalDate; end: LocalDate }): string {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    hourly: ['temperature_2m', ...LEAD_DAYS.map((l) => `temperature_2m_previous_day${l}`)].join(','),
    timezone: place.timezone,
    start_date: range.start,
    end_date: range.end,
  })
  return `${BASE}?${params}`
}

export function fetchPreviousRuns(url: string, fetchFn?: typeof fetch): Promise<PreviousRunsResponse | ApiError> {
  return fetchJson<PreviousRunsResponse>(url, fetchFn)
}
