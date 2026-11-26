import type { ForecastResponse, LocalDate, LocalDateTime } from './openMeteo'

/** One local day of the Forecast API's `daily` block. */
export interface Day {
  date: LocalDate
  max: number
  min: number
  rain: number
  rainChance: number
  windMax: number
  gustMax: number
  code: number
}

export function toDays(daily: ForecastResponse['daily']): Day[] {
  return daily.time.map((date, i) => ({
    date,
    max: daily.temperature_2m_max[i],
    min: daily.temperature_2m_min[i],
    rain: daily.precipitation_sum[i],
    rainChance: daily.precipitation_probability_max[i],
    windMax: daily.wind_speed_10m_max[i],
    gustMax: daily.wind_gusts_10m_max[i],
    code: daily.weather_code[i],
  }))
}

/** "Today" is the place's local date, as the API reports it, not the visitor's clock. */
export function todayOf(current: ForecastResponse['current']): LocalDate {
  return current.time.slice(0, 10)
}

/** Days before today are the past; today and after are the next days. ISO dates sort as strings. */
export function splitDays(days: Day[], today: LocalDate): { past: Day[]; next: Day[] } {
  return { past: days.filter((d) => d.date < today), next: days.filter((d) => d.date >= today) }
}

/** The wettest and the warmest day; the first one wins a tie. No rain at all means no wettest day. */
export function extremes(days: Day[]): { wettest: Day | null; warmest: Day | null } {
  let wettest: Day | null = null
  let warmest: Day | null = null
  for (const d of days) {
    if (d.rain > 0 && (wettest === null || d.rain > wettest.rain)) wettest = d
    if (warmest === null || d.max > warmest.max) warmest = d
  }
  return { wettest, warmest }
}

// Local dates have no time zone: read and format them as UTC so they never shift by a day.
const asUtc = (date: LocalDate) => new Date(`${date}T00:00:00Z`)
const weekdayDay = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', timeZone: 'UTC' })
const dayMonth = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })

const weekdayOnly = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' })
const weekdayDayMonth = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })

/** "Thu 26" */
export const weekdayLabel = (date: LocalDate) => weekdayDay.format(asUtc(date))
/** "28 Oct" */
export const dateLabel = (date: LocalDate) => dayMonth.format(asUtc(date))
/** ["Thu", "26"], for a label set on two lines. */
export const weekdayAndDay = (date: LocalDate): [string, string] => [weekdayOnly.format(asUtc(date)), String(Number(date.slice(8, 10)))]
/** "Thu 26 Nov, 14:00" for a local date-time such as "2026-11-26T14:00". */
export const dateTimeLabel = (time: LocalDateTime) => `${weekdayDayMonth.format(asUtc(time.slice(0, 10)))}, ${time.slice(11, 16)}`
