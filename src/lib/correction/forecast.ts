import { LEAD_DAYS, type ForecastResponse, type LocalDate } from '../openMeteo'
import { toDaily, type Variable } from './align'
import type { LeadResult } from './backtest'
import { daysBetween } from './dates'
import { rangeFor, type Range, type Winner } from './metrics'

/** One variable on one forecast day: everything the Next 7 days table and chart show. */
export interface Opinion {
  /** The source forecast, °C. */
  source: number
  /** What the correction subtracts at this lead today (mean of forecast − ERA5). `null` for today or without a full window. */
  bias: number | null
  /** The line we show: ours only where ours won the backtest at this lead. `null` for today, which has no correction. */
  shown: Winner | null
  /** The value we show: source − bias where ours is shown, the source itself where the source is. `null` for today. */
  ours: number | null
  /** ours − source: 0 where the source is shown. `null` for today. */
  gap: number | null
  /** On 8 of 10 backtest days the truth fell in this range around `ours`. `null` for today and under 10 backtest days. */
  range: Range | null
}

export interface ForecastDay {
  date: LocalDate
  /** Days ahead: 0 is today. */
  lead: number
  max: Opinion
  min: Opinion
}

/** A day of the source forecast. */
export interface SourceDay {
  date: LocalDate
  max: number
  min: number
}

/**
 * The source days the correction applies to: the Forecast API's hourly temperature, as max and min of the 24 hours
 * of each local date, the same way the backtest measured the bias. Its daily max and min fields are not used: on the
 * fixture they differ on 9 of 35 days (max up to 0.4 °C higher, min up to 0.6 °C lower), and no bias was measured on them.
 */
export function sourceDays(hourly: Pick<ForecastResponse['hourly'], 'time' | 'temperature_2m'>): SourceDay[] {
  return [...toDaily(hourly.time, hourly.temperature_2m)].map(([date, v]) => ({ date, ...v }))
}

/** The second opinion for one source value `lead` days ahead, from that lead's backtest result (none when data is missing). */
export function opinionFor(source: number, lead: number, result: LeadResult | undefined): Opinion {
  if (lead === 0) return { source, bias: null, shown: null, ours: null, gap: null, range: null }
  const bias = result?.biasToday ?? null
  const b = result?.band ?? null
  if (result?.winner === 'ours' && bias !== null) {
    const ours = source - bias
    return { source, bias, shown: 'ours', ours, gap: -bias, range: b && rangeFor(ours, b) }
  }
  // The source is shown. The band is the backtest winner's, so the source has one only where it won.
  const range = result?.winner === 'source' && b ? rangeFor(source, b) : null
  return { source, bias, shown: 'source', ours: source, gap: 0, range }
}

/**
 * Today's forecast with the second opinion, per day and variable. Today has no correction: our lead days start
 * tomorrow. Days before today, or more than 7 days ahead, are left out.
 */
export function correctedForecast(results: LeadResult[], days: SourceDay[], today: LocalDate): ForecastDay[] {
  const resultFor = (variable: Variable, lead: number) => results.find((r) => r.variable === variable && r.lead === lead)
  return days.flatMap((d) => {
    const lead = daysBetween(today, d.date)
    if (lead < 0 || lead > LEAD_DAYS.length) return []
    return [{ date: d.date, lead, max: opinionFor(d.max, lead, resultFor('max', lead)), min: opinionFor(d.min, lead, resultFor('min', lead)) }]
  })
}
