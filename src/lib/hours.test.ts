import { describe, expect, it } from 'vitest'
import forecastJson from './fixtures/kos-forecast.json'
import {
  bandIndex,
  dayStarts,
  joinHours,
  maxRainChance,
  nearestIndex,
  nextHours,
  rainLevel,
  stepCursor,
  toHours,
  traceWindow,
} from './hours'
import type { ForecastResponse } from './openMeteo'

const forecast = forecastJson satisfies ForecastResponse
const hours = toHours(forecast.hourly)

describe('hours', () => {
  it('keeps each field on its own hour', () => {
    expect(hours).toHaveLength(840)
    expect(hours[694]).toEqual({
      time: '2026-11-25T22:00',
      temp: forecast.hourly.temperature_2m[694],
      dew: forecast.hourly.dew_point_2m[694],
      wind: forecast.hourly.wind_speed_10m[694],
      gust: forecast.hourly.wind_gusts_10m[694],
      windDir: forecast.hourly.wind_direction_10m[694],
      rain: forecast.hourly.precipitation[694],
      rainChance: forecast.hourly.precipitation_probability[694],
    })
  })

  it('the trace starts 24 hours before the current hour and runs to the last forecast hour', () => {
    const trace = traceWindow(hours, forecast.current.time)
    expect(trace.now).toBe(24)
    expect(trace.hours[trace.now].time).toBe('2026-11-25T22:00')
    expect(trace.hours[0].time).toBe('2026-11-24T22:00')
    expect(trace.hours.at(-1)?.time).toBe('2026-12-01T23:00')
  })

  it('a short history keeps what there is', () => {
    expect(traceWindow(hours.slice(690), forecast.current.time).now).toBe(4)
    expect(traceWindow(hours, '2030-01-01T00:00').now).toBe(-1)
  })

  it('finds where each day starts in the trace', () => {
    const { hours: trace } = traceWindow(hours, forecast.current.time)
    const starts = dayStarts(trace)
    expect(starts[0]).toEqual({ date: '2026-11-25', index: 2 })
    expect(starts).toHaveLength(7)
    expect(starts.at(-1)?.date).toBe('2026-12-01')
  })
})

describe('the next 48 hours', () => {
  it('start with the hour after the current reading', () => {
    const next = nextHours(hours, forecast.current.time)
    expect(next).toHaveLength(48)
    expect(next[0].time).toBe('2026-11-25T23:00')
    expect(next.at(-1)?.time).toBe('2026-11-27T22:00')
  })

  it('know their highest rain chance, and are empty when the current hour is missing', () => {
    expect(maxRainChance(nextHours(hours, forecast.current.time))).toBe(0)
    expect(maxRainChance([{ ...hours[0], rainChance: 12 }, { ...hours[1], rainChance: 71 }])).toBe(71)
    expect(nextHours(hours, '2030-01-01T00:00')).toEqual([])
    expect(maxRainChance([])).toBe(0)
  })
})

describe('joining and grading hours', () => {
  it('keeps the older hours before the newer response, and the newer where they overlap', () => {
    const older = hours.slice(0, 700)
    const newer = hours.slice(690).map((h) => ({ ...h, temp: h.temp + 100 }))
    const joined = joinHours(older, newer)
    expect(joined).toHaveLength(840)
    expect(joined[689].temp).toBe(hours[689].temp)
    expect(joined[690].temp).toBe(hours[690].temp + 100)
    expect(joinHours(older, [])).toBe(older)
  })

  it('grades rain per hour as dry, light, moderate or heavy', () => {
    expect(rainLevel(0)).toBe('dry')
    expect(rainLevel(0.1)).toBe('light')
    expect(rainLevel(2.5)).toBe('light')
    expect(rainLevel(2.6)).toBe('moderate')
    expect(rainLevel(7.6)).toBe('moderate')
    expect(rainLevel(7.7)).toBe('heavy')
  })
})

describe('the time cursor', () => {
  it('maps a pointer to the nearest point or the bar under it, inside the chart', () => {
    expect(nearestIndex(0, 192)).toBe(0)
    expect(nearestIndex(0.5, 3)).toBe(1)
    expect(nearestIndex(1.2, 192)).toBe(191)
    expect(bandIndex(0.99, 28)).toBe(27)
    expect(bandIndex(-0.1, 28)).toBe(0)
  })

  it('moves by an hour, a day with Shift, back to now with Home', () => {
    expect(stepCursor(null, 24, 192, 'ArrowRight', false)).toBe(25)
    expect(stepCursor(30, 24, 192, 'ArrowLeft', true)).toBe(6)
    expect(stepCursor(2, 24, 192, 'ArrowLeft', true)).toBe(0)
    expect(stepCursor(190, 24, 192, 'ArrowRight', true)).toBe(191)
    expect(stepCursor(100, 24, 192, 'Home', false)).toBeNull()
    expect(stepCursor(100, 24, 192, 'End', false)).toBe(191)
    expect(stepCursor(100, 24, 192, 'a', false)).toBeUndefined()
  })
})
