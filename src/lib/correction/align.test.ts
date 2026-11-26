import { describe, expect, it } from 'vitest'
import era5Json from '../fixtures/kos-era5.json'
import previousJson from '../fixtures/kos-previous-runs.json'
import type { Era5Response, PreviousRunsResponse } from '../openMeteo'
import { align, errorsFor, toDaily } from './align'

const hoursOf = (date: string) => Array.from({ length: 24 }, (_, h) => `${date}T${String(h).padStart(2, '0')}:00`)

describe('toDaily', () => {
  it('takes max and min per local date, never across midnight', () => {
    const time = [...hoursOf('2026-11-01'), ...hoursOf('2026-11-02')]
    const values = time.map((_, i) => (i < 24 ? 10 + i / 10 : 30 - i / 10))
    const daily = toDaily(time, values)
    expect(daily.get('2026-11-01')).toEqual({ max: 12.3, min: 10 })
    expect(daily.get('2026-11-02')?.max).toBeCloseTo(27.6)
    expect(daily.get('2026-11-02')?.min).toBeCloseTo(25.3)
  })

  it('leaves out a day with a missing hour', () => {
    const time = hoursOf('2026-11-20')
    const values: (number | null)[] = time.map(() => 15)
    values[23] = null
    expect(toDaily(time, values).has('2026-11-20')).toBe(false)
  })
})

describe('align on the fixtures', () => {
  const aligned = align(previousJson as PreviousRunsResponse, era5Json as Era5Response)

  it('ERA5 has full days up to 19 November; 20 November (2 hours) stays out', () => {
    const dates = [...aligned.truth.keys()]
    expect(dates[0]).toBe('2026-08-28')
    expect(dates.at(-1)).toBe('2026-11-19')
    expect(aligned.truth.has('2026-11-20')).toBe(false)
  })

  it('the clock change on 25 October leaves a full day on both sides', () => {
    expect(aligned.truth.has('2026-10-25')).toBe(true)
    expect(aligned.forecast[1].has('2026-10-25')).toBe(true)
  })

  it('every lead day covers the 90 days', () => {
    for (const lead of [1, 7] as const) expect(aligned.forecast[lead].size).toBe(90)
  })

  it('errors are forecast minus truth, oldest first, only where both exist', () => {
    const errors = errorsFor(aligned, 'max', 1)
    expect(errors).toHaveLength(84)
    expect(errors[0].date).toBe('2026-08-28')
    expect(errors[0].error).toBeCloseTo(errors[0].forecast - errors[0].truth)
  })
})
