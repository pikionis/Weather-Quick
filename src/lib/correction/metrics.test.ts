import { describe, expect, it } from 'vitest'
import { band, decide, mae, percentile, rangeFor } from './metrics'

describe('mae', () => {
  it('averages absolute errors', () => {
    expect(mae([1, -3, 2])).toBe(2)
  })
})

describe('percentile', () => {
  it('interpolates between the nearest values', () => {
    const xs = [5, 1, 4, 2, 3, 10, 6, 9, 7, 8, 0]
    expect(percentile(xs, 10)).toBe(1)
    expect(percentile(xs, 90)).toBe(9)
    expect(percentile([0, 10], 25)).toBe(2.5)
  })
})

describe('decide', () => {
  it('ours wins with a gain of at least 0.1 °C over at least 10 days', () => {
    expect(decide(1.5, 1.4, 10)).toBe('ours')
    expect(decide(1.5, 1.2, 50)).toBe('ours')
  })

  it('a gain of exactly 0.1 °C counts, despite floating point (0.3 − 0.1 is 0.19999…)', () => {
    expect(decide(0.3, 0.2, 10)).toBe('ours')
  })

  it('the source wins a small gain, a tie, a loss, or fewer than 10 days', () => {
    expect(decide(1.5, 1.45, 50)).toBe('source')
    expect(decide(1.5, 1.5, 50)).toBe('source')
    expect(decide(1.5, 1.8, 50)).toBe('source')
    expect(decide(1.5, 0.5, 9)).toBe('source')
  })
})

describe('band and range', () => {
  it('adds the 10th and 90th percentile of truth − shown to the shown value', () => {
    const b = band([-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3])
    expect(b).toEqual({ p10: -1.5, p90: 2.5 })
    expect(rangeFor(20, b)).toEqual({ low: 18.5, high: 22.5 })
  })

  it('with lopsided errors the range leans the right way', () => {
    // Usually the truth was 0 to 2 °C below the shown value (a warm forecast), once 3 °C above it.
    const truthMinusShown = [-2, -2, -1.5, -1.5, -1, -1, -1, -0.5, -0.5, 0, 3]
    expect(rangeFor(20, band(truthMinusShown))).toEqual({ low: 18, high: 20 })
    // The same days taken as shown − truth and added to the value give the mirror image, 20 to 22: wrong.
    expect(rangeFor(20, band(truthMinusShown.map((r) => -r)))).toEqual({ low: 20, high: 22 })
  })
})
