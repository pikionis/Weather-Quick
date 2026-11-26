import { describe, expect, it } from 'vitest'
import era5Json from '../fixtures/kos-era5.json'
import forecastJson from '../fixtures/kos-forecast.json'
import previousJson from '../fixtures/kos-previous-runs.json'
import { todayOf } from '../days'
import type { Era5Response, ForecastResponse, PreviousRunsResponse } from '../openMeteo'
import { align } from './align'
import { secondOpinion, type LeadResult } from './backtest'
import { addDays } from './dates'
import { correctedForecast, opinionFor, sourceDays } from './forecast'

const forecast = forecastJson as unknown as ForecastResponse

describe('sourceDays', () => {
  it('takes max and min of the hourly forecast, like the backtest, not the daily fields', () => {
    const days = sourceDays(forecast.hourly)
    const i = forecast.daily.time.indexOf('2026-11-28')
    const day = days.find((d) => d.date === '2026-11-28')!
    // On 28 November the daily field says a minimum 0.4 °C below the coldest hour.
    expect(day.min).toBeCloseTo(forecast.daily.temperature_2m_min[i] + 0.4)
    expect(day.max).toBe(forecast.daily.temperature_2m_max[i])
  })
})

describe('opinionFor', () => {
  const result = (over: Partial<LeadResult> = {}): LeadResult => ({
    variable: 'max',
    lead: 1,
    n: 50,
    maeSource: 2,
    maeOurs: 1,
    winner: 'ours',
    band: { p10: -1, p90: 0.5 },
    biasToday: 1.5,
    ...over,
  })

  it('where ours won: source − bias, the gap, and our band around our value', () => {
    expect(opinionFor(20, 1, result())).toEqual({ source: 20, bias: 1.5, shown: 'ours', ours: 18.5, gap: -1.5, range: { low: 17.5, high: 19 } })
  })

  it('where the source won: the source unchanged, gap 0, and the band of its own errors', () => {
    expect(opinionFor(20, 1, result({ winner: 'source', band: { p10: -2, p90: 0.5 } }))).toEqual({
      source: 20,
      bias: 1.5,
      shown: 'source',
      ours: 20,
      gap: 0,
      range: { low: 18, high: 20.5 },
    })
  })

  it('ours won but has no bias today: the source is shown, without our band', () => {
    expect(opinionFor(20, 1, result({ biasToday: null }))).toMatchObject({ shown: 'source', ours: 20, gap: 0, range: null })
  })

  it('under 10 backtest days: the source, with no band', () => {
    expect(opinionFor(20, 1, result({ n: 6, winner: 'source', band: null }))).toMatchObject({ shown: 'source', ours: 20, range: null })
  })

  it('data missing (no result): the source alone', () => {
    expect(opinionFor(20, 3, undefined)).toEqual({ source: 20, bias: null, shown: 'source', ours: 20, gap: 0, range: null })
  })

  it('today has no correction', () => {
    expect(opinionFor(20, 0, result())).toEqual({ source: 20, bias: null, shown: null, ours: null, gap: null, range: null })
  })
})

describe('correctedForecast', () => {
  it('keeps today and up to 7 days ahead', () => {
    const days = Array.from({ length: 10 }, (_, i) => ({ date: addDays('2026-11-24', i), max: 20, min: 10 }))
    expect(correctedForecast([], days, '2026-11-25').map((d) => d.lead)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
  })
})

describe('correctedForecast on the fixtures (today = 25 November)', () => {
  const today = todayOf(forecast.current)
  const results = secondOpinion(align(previousJson as PreviousRunsResponse, era5Json as Era5Response), today)
  const days = correctedForecast(results, sourceDays(forecast.hourly), today)

  it('covers today and the next 6 days, as far as the Forecast API reaches', () => {
    expect(today).toBe('2026-11-25')
    expect(days.map((d) => d.lead)).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it('the max shows the source at every lead, with a band from its own errors', () => {
    for (const d of days.slice(1)) expect(d.max).toMatchObject({ shown: 'source', gap: 0 })
    // Thu 26: the source says 17.8 °C, and runs warm: the truth fell from 2.45 below to 0.25 above.
    const thu = days[1].max
    expect(thu.source).toBe(17.8)
    expect(thu.range!.low).toBeCloseTo(15.35)
    expect(thu.range!.high).toBeCloseTo(18.05)
  })

  it('the min shows the source at lead 1 (gain under 0.1 °C) and ours at lead 2', () => {
    expect(days[1].min.shown).toBe('source')
    // Fri 27: the source says 14.9 °C and runs 0.73 °C cold at 2 days ahead.
    const fri = days[2].min
    expect(fri.shown).toBe('ours')
    expect(fri.source).toBe(14.9)
    expect(fri.ours).toBeCloseTo(15.63)
    expect(fri.gap).toBeCloseTo(0.73)
    expect(fri.range!.low).toBeCloseTo(14.43)
    expect(fri.range!.high).toBeCloseTo(17.44)
  })
})
