import { describe, expect, it } from 'vitest'
import { forecastQuery, isDue, localDate, localTime, REFRESH_MS } from './refresh'

describe('forecastQuery', () => {
  it('the first load asks for 28 past days and 7 ahead', () => {
    expect(forecastQuery(null, '2026-11-26')).toEqual({ pastDays: 28, forecastDays: 7 })
  })

  it('a refresh on the same local day asks for the 7 days only', () => {
    expect(forecastQuery('2026-11-26', '2026-11-26')).toEqual({ pastDays: 0, forecastDays: 7 })
  })

  it('the first refresh after local midnight asks for the history again', () => {
    expect(forecastQuery('2026-11-26', '2026-11-27')).toEqual({ pastDays: 28, forecastDays: 7 })
  })
})

describe('isDue', () => {
  it('waits 10 minutes between requests', () => {
    expect(isDue(0, REFRESH_MS - 1)).toBe(false)
    expect(isDue(0, REFRESH_MS)).toBe(true)
  })
})

describe('local date and time in Kos', () => {
  it('turns midnight in Athens into the next date, in winter time (UTC+2)', () => {
    const t = new Date('2026-11-25T22:30:00Z')
    expect(localDate(t, 'Europe/Athens')).toBe('2026-11-26')
    expect(localTime(t, 'Europe/Athens')).toBe('00:30')
  })

  it('follows summer time (UTC+3)', () => {
    const t = new Date('2026-07-01T21:15:00Z')
    expect(localDate(t, 'Europe/Athens')).toBe('2026-07-02')
    expect(localTime(t, 'Europe/Athens')).toBe('00:15')
  })
})
