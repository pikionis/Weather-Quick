/**
 * Data contract with Open-Meteo, typed from real responses for Kos
 * (src/lib/fixtures, fetched 2026-11-25). Field names follow docs/open-meteo-brief.md.
 * Shared types: change them only in the architect window.
 */

/** Local date-time without offset, e.g. "2026-11-25T22:15". */
export type LocalDateTime = string
/** Local date, e.g. "2026-11-25". */
export type LocalDate = string

/** Every failed call: HTTP 400 with a reason, e.g. "Invalid value: ...". Also the daily rate-limit reply. */
export interface ApiError {
  error: true
  reason: string
}

/** Fields shared by every weather response. The grid cell can differ from the requested point. */
export interface ResponseMeta {
  latitude: number
  longitude: number
  elevation: number
  generationtime_ms: number
  /** One fixed offset for the whole range, even across a daylight-saving change. */
  utc_offset_seconds: number
  timezone: string
  timezone_abbreviation: string
}

/** Column-oriented series: `time` and every listed field have the same length. */
export type Series<K extends string, T extends string = LocalDateTime> = { time: T[] } & Record<K, number[]>
export type Units<K extends string> = { time: string } & Record<K, string>

// --- Forecast API (api.open-meteo.com/v1/forecast) ---

export type CurrentField =
  | 'temperature_2m'
  | 'apparent_temperature'
  | 'dew_point_2m'
  | 'wind_speed_10m'
  | 'wind_gusts_10m'
  | 'wind_direction_10m'
  | 'precipitation'
  | 'weather_code'

export type HourlyField =
  | 'temperature_2m'
  | 'dew_point_2m'
  | 'wind_speed_10m'
  | 'wind_gusts_10m'
  | 'wind_direction_10m'
  | 'precipitation'
  | 'precipitation_probability'

export type DailyField =
  | 'temperature_2m_max'
  | 'temperature_2m_min'
  | 'wind_speed_10m_max'
  | 'wind_gusts_10m_max'
  | 'precipitation_sum'
  | 'precipitation_probability_max'
  | 'weather_code'

/** One call: `past_days=28`, `forecast_days=7`, `timezone=auto`. */
export interface ForecastResponse extends ResponseMeta {
  current_units: Units<CurrentField | 'interval'>
  current: { time: LocalDateTime; interval: number } & Record<CurrentField, number>
  hourly_units: Units<HourlyField>
  hourly: Series<HourlyField>
  daily_units: Units<DailyField>
  daily: Series<DailyField, LocalDate>
}

/** Model ids confirmed on a real response; an unknown id returns ApiError. */
export const MODELS = ['ecmwf_ifs025', 'gfs_seamless', 'icon_seamless'] as const
export type Model = (typeof MODELS)[number]

/** With `models=a,b,c` each variable is suffixed with the model id: `temperature_2m_max_ecmwf_ifs025`. */
export type PerModel<F extends string> = `${F}_${Model}`
export interface MultiModelDailyResponse extends ResponseMeta {
  daily_units: Units<PerModel<'temperature_2m_max' | 'temperature_2m_min'>>
  daily: Series<PerModel<'temperature_2m_max' | 'temperature_2m_min'>, LocalDate>
}

// --- Previous Runs API (previous-runs-api.open-meteo.com/v1/forecast) ---

/** How many days before the target day the forecast was made. */
export type LeadDay = 1 | 2 | 3 | 4 | 5 | 6 | 7
export const LEAD_DAYS: readonly LeadDay[] = [1, 2, 3, 4, 5, 6, 7]

/** `temperature_2m_previous_day3` = the forecast for that hour as it stood 3 days earlier. */
export type PreviousField<F extends string = 'temperature_2m'> = `${F}_previous_day${LeadDay}`

/** Hourly only. Request the lead days you need; the sample has 1, 3 and 7. */
export interface PreviousRunsResponse extends ResponseMeta {
  hourly_units: Units<'temperature_2m'> & Partial<Record<PreviousField, string>>
  hourly: Series<'temperature_2m'> & Partial<Record<PreviousField, number[]>>
}

// --- Historical Weather API, ERA5 (archive-api.open-meteo.com/v1/archive) ---

export type Era5HourlyField = 'temperature_2m' | 'dew_point_2m' | 'wind_speed_10m'

/** The "truth" for the backtest. Reanalysis, a few days late, on its own grid cell. */
export interface Era5Response extends ResponseMeta {
  hourly_units: Units<Era5HourlyField>
  hourly: Series<Era5HourlyField>
}

// --- Geocoding API (geocoding-api.open-meteo.com/v1/search) ---

export interface GeocodingResult {
  id: number
  name: string
  latitude: number
  longitude: number
  elevation?: number
  feature_code?: string
  country_code: string
  country?: string
  admin1?: string
  admin2?: string
  timezone: string
  population?: number
}

/** `results` is missing when nothing matches. */
export interface GeocodingResponse {
  results?: GeocodingResult[]
  generationtime_ms: number
}

export function isApiError(body: unknown): body is ApiError {
  return typeof body === 'object' && body !== null && (body as ApiError).error === true
}

/** Names of series in `s` whose length differs from `s.time`. Empty means aligned. */
export function misalignedFields(s: { time: unknown[] } & Record<string, unknown[]>): string[] {
  return Object.keys(s).filter((k) => k !== 'time' && s[k].length !== s.time.length)
}
