import { describe, expect, it } from 'vitest'
import forecastJson from './fixtures/kos-forecast.json'
import { dateLabel, extremes, splitDays, todayOf, toDays, weekdayLabel, type Day } from './days'
import type { ForecastResponse } from './openMeteo'

const forecast = forecastJson satisfies ForecastResponse
const day = (date: string, max: number, rain: number): Day => ({
  date, max, min: max - 5, rain, rainChance: 0, windMax: 0, gustMax: 0, code: 0,
})

describe('days', () => {
  it('splits the fixture into 28 past days and the next 7, starting today', () => {
    const today = todayOf(forecast.current)
    const { past, next } = splitDays(toDays(forecast.daily), today)
    expect(today).toBe('2026-11-25')
    expect(past).toHaveLength(28)
    expect(next).toHaveLength(7)
    expect(next[0].date).toBe(today)
    expect(past.at(-1)?.date).toBe('2026-11-24')
  })

  it('keeps each field on its own day', () => {
    const d = toDays(forecast.daily)[28]
    expect(d).toEqual({
      date: '2026-11-25',
      max: forecast.daily.temperature_2m_max[28],
      min: forecast.daily.temperature_2m_min[28],
      rain: forecast.daily.precipitation_sum[28],
      rainChance: forecast.daily.precipitation_probability_max[28],
      windMax: forecast.daily.wind_speed_10m_max[28],
      gustMax: forecast.daily.wind_gusts_10m_max[28],
      code: forecast.daily.weather_code[28],
    })
  })

  it('finds the wettest and warmest day of the past weeks', () => {
    const { past } = splitDays(toDays(forecast.daily), todayOf(forecast.current))
    const { wettest, warmest } = extremes(past)
    expect(wettest?.date).toBe('2026-11-02')
    expect(wettest?.rain).toBe(66.8)
    expect(warmest?.date).toBe('2026-11-20')
    expect(warmest?.max).toBe(23.7)
  })

  it('has no wettest day when it never rained, and the first day wins a tie', () => {
    const { wettest, warmest } = extremes([day('2026-11-01', 20, 0), day('2026-11-02', 20, 0)])
    expect(wettest).toBeNull()
    expect(warmest?.date).toBe('2026-11-01')
  })

  it('labels local dates without shifting them', () => {
    expect(weekdayLabel('2026-11-26')).toBe('Thu 26')
    expect(dateLabel('2026-10-28')).toBe('28 Oct')
  })
})
