import { describe, expect, it } from 'vitest'
import { countdown, forecastQuery, localDate, localTime, nextRequestAt, REFRESH_MS, RETRY_MS } from './refresh'

describe('forecastQuery', () => {
  it('the first load asks for 28 past days and 7 ahead', () => {
    expect(forecastQuery(null, '2026-11-26')).toEqual({ pastDays: 28, forecastDays: 7 })
  })

  it('a refresh on the same local day asks for one past day, for the trace, and 7 ahead', () => {
    expect(forecastQuery('2026-11-26', '2026-11-26')).toEqual({ pastDays: 1, forecastDays: 7 })
  })

  it('the first refresh after local midnight asks for the history again', () => {
    expect(forecastQuery('2026-11-26', '2026-11-27')).toEqual({ pastDays: 28, forecastDays: 7 })
  })
})

describe('nextRequestAt', () => {
  it('waits 10 minutes after a good request and 1 minute after a failed one', () => {
    expect(nextRequestAt(1000, false)).toBe(1000 + REFRESH_MS)
    expect(nextRequestAt(1000, true)).toBe(1000 + RETRY_MS)
  })
})

describe('countdown', () => {
  it('shows minutes and seconds, rounding up, never below zero', () => {
    expect(countdown(461_000)).toBe('7:41')
    expect(countdown(59_001)).toBe('1:00')
    expect(countdown(-5)).toBe('0:00')
  })
})

describe('local date and time in Kos', () => {
  it('turns midnight in Athens into the next date, in winter time (UTC+2)', () => {
    const t = new Date('2026-11-25T22:30:05Z')
    expect(localDate(t, 'Europe/Athens')).toBe('2026-11-26')
    expect(localTime(t, 'Europe/Athens')).toBe('00:30')
    expect(localTime(t, 'Europe/Athens', true)).toBe('00:30:05')
  })

  it('follows summer time (UTC+3)', () => {
    const t = new Date('2026-07-01T21:15:00Z')
    expect(localDate(t, 'Europe/Athens')).toBe('2026-07-02')
    expect(localTime(t, 'Europe/Athens')).toBe('00:15')
  })
})
