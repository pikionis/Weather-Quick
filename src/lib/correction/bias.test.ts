import { describe, expect, it } from 'vitest'
import era5Json from '../fixtures/kos-era5.json'
import previousJson from '../fixtures/kos-previous-runs.json'
import type { Era5Response, LeadDay, PreviousRunsResponse } from '../openMeteo'
import { align, errorsFor, type ErrorDay } from './align'
import { biasFor, lastKnownDate } from './bias'
import { addDays } from './dates'

/** `count` consecutive days from 1 September, each with the given error. */
const series = (count: number, error: (i: number) => number): ErrorDay[] =>
  Array.from({ length: count }, (_, i) => ({ date: addDays('2026-09-01', i), forecast: 20 + error(i), truth: 20, error: error(i) }))

describe('lastKnownDate', () => {
  it('is target − lead − 7: the forecast was issued on target − lead, ERA5 was 7 days behind', () => {
    expect(lastKnownDate('2026-11-26', 1)).toBe('2026-11-18')
    expect(lastKnownDate('2026-11-26', 7)).toBe('2026-11-12')
  })
})

describe('biasFor', () => {
  it('is the mean error of the latest 21 known days', () => {
    // Errors 0..29; target 30 Sep at lead 1 knows up to 22 Sep = day 21, so it averages days 1..21.
    const errors = series(30, (i) => i)
    expect(biasFor(errors, '2026-09-30', 1)).toBeCloseTo(11)
  })

  it('is null until 21 known days exist', () => {
    expect(biasFor(series(30, () => 1), '2026-09-28', 1)).toBeNull()
    expect(biasFor(series(30, () => 1), '2026-09-29', 1)).toBe(1)
  })
})

describe('no look-ahead', () => {
  const previous = previousJson as PreviousRunsResponse
  const era5 = era5Json as Era5Response

  /** ERA5 with every hour after `after` (a local date) moved by +10 °C. */
  const changedAfter = (after: string): Era5Response => ({
    ...era5,
    hourly: {
      ...era5.hourly,
      temperature_2m: era5.hourly.temperature_2m.map((v, i) => (v !== null && era5.hourly.time[i].slice(0, 10) > after ? v + 10 : v)),
    },
  })

  for (const lead of [1, 4, 7] as LeadDay[]) {
    it(`lead ${lead}: changing the truth after D − L − 7 leaves the correction for D unchanged`, () => {
      const target = '2026-11-10'
      const before = biasFor(errorsFor(align(previous, era5), 'max', lead), target, lead)
      const after = biasFor(errorsFor(align(previous, changedAfter(lastKnownDate(target, lead))), 'max', lead), target, lead)
      expect(before).not.toBeNull()
      expect(after).toBe(before)
    })

    it(`lead ${lead}: changing the truth on D − L − 7 itself does change it (the test can fail)`, () => {
      const target = '2026-11-10'
      const before = biasFor(errorsFor(align(previous, era5), 'max', lead), target, lead)
      const after = biasFor(errorsFor(align(previous, changedAfter(addDays(lastKnownDate(target, lead), -1))), 'max', lead), target, lead)
      expect(after).not.toBe(before)
    })
  }
})
