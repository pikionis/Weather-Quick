import { LEAD_DAYS, type Era5Response, type LeadDay, type LocalDate, type PreviousRunsResponse } from '../openMeteo'

export type Variable = 'max' | 'min'
export const VARIABLES: readonly Variable[] = ['max', 'min']

/** Daily max and min temperature, by local date. */
export type Daily = Map<LocalDate, Record<Variable, number>>

/** Forecast and truth for one date. `error` is forecast minus truth: positive means the forecast was too warm. */
export interface ErrorDay {
  date: LocalDate
  forecast: number
  truth: number
  error: number
}

/** Both sources, daily, ready to compare: truth from ERA5 and one forecast series per lead day. */
export interface Aligned {
  truth: Daily
  forecast: Record<LeadDay, Daily>
}

/**
 * Hourly to daily max and min. Times are local (`YYYY-MM-DDTHH:mm`), so the first 10 characters are the local date.
 * A day counts only with all 24 hours present: ERA5 ends in `null` while it catches up, and a partial day
 * would give a false max or min.
 */
export function toDaily(time: string[], values: (number | null)[]): Daily {
  const hours = new Map<LocalDate, number[]>()
  time.forEach((t, i) => {
    const v = values[i]
    if (v === null || v === undefined) return
    const date = t.slice(0, 10)
    hours.set(date, [...(hours.get(date) ?? []), v])
  })
  const daily: Daily = new Map()
  for (const [date, vs] of hours) {
    if (vs.length === 24) daily.set(date, { max: Math.max(...vs), min: Math.min(...vs) })
  }
  return daily
}

export function align(previous: PreviousRunsResponse, era5: Era5Response): Aligned {
  const forecast = {} as Record<LeadDay, Daily>
  for (const lead of LEAD_DAYS) {
    forecast[lead] = toDaily(previous.hourly.time, previous.hourly[`temperature_2m_previous_day${lead}`] ?? [])
  }
  return { truth: toDaily(era5.hourly.time, era5.hourly.temperature_2m), forecast }
}

/** Every date that has both a forecast at `lead` and the truth, oldest first. */
export function errorsFor(aligned: Aligned, variable: Variable, lead: LeadDay): ErrorDay[] {
  const days: ErrorDay[] = []
  for (const [date, f] of aligned.forecast[lead]) {
    const t = aligned.truth.get(date)
    if (t) days.push({ date, forecast: f[variable], truth: t[variable], error: f[variable] - t[variable] })
  }
  return days.sort((a, b) => (a.date < b.date ? -1 : 1))
}
