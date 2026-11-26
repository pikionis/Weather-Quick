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

  it('the source wins a small gain, a tie, a loss, or fewer than 10 days', () => {
    expect(decide(1.5, 1.45, 50)).toBe('source')
    expect(decide(1.5, 1.5, 50)).toBe('source')
    expect(decide(1.5, 1.8, 50)).toBe('source')
    expect(decide(1.5, 0.5, 9)).toBe('source')
  })
})

describe('band and range', () => {
  it('8 in 10 errors fall inside, and the range for the truth flips the sign', () => {
    const errors = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3]
    const b = band(errors)
    expect(b).toEqual({ p10: -1.5, p90: 2.5 })
    // Shown 20 °C, errors from −1.5 to +2.5: the truth was 17.5 to 21.5.
    expect(rangeFor(20, b)).toEqual({ low: 17.5, high: 21.5 })
  })
})
