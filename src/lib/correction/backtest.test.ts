import { describe, expect, it } from 'vitest'
import era5Json from '../fixtures/kos-era5.json'
import previousJson from '../fixtures/kos-previous-runs.json'
import type { Era5Response, PreviousRunsResponse } from '../openMeteo'
import { align, type ErrorDay } from './align'
import { backtest, evaluate, secondOpinion } from './backtest'
import { addDays } from './dates'

/** 60 days from 1 September; truth 20 °C, forecast 20 + error. */
const series = (error: (i: number) => number): ErrorDay[] =>
  Array.from({ length: 60 }, (_, i) => ({ date: addDays('2026-09-01', i), forecast: 20 + error(i), truth: 20, error: error(i) }))

describe('backtest', () => {
  it('replays only dates with a full bias window behind them', () => {
    // Lead 1: the first date with 21 known days is 1 Sep + 20 + 8 = 29 Sep, so 60 − 28 = 32 days.
    const days = backtest(series(() => 2), 1)
    expect(days).toHaveLength(32)
    expect(days[0].date).toBe('2026-09-29')
  })

  it('a steady bias is removed completely', () => {
    const days = backtest(series(() => 2), 1)
    expect(days.every((d) => d.corrected === 20)).toBe(true)
  })
})

describe('evaluate', () => {
  it('ours wins against a steady warm bias, with the band from our errors', () => {
    const r = evaluate(series((i) => 2 + (i % 2 ? 0.5 : -0.5)), 'max', 1, '2026-10-30')
    expect(r.winner).toBe('ours')
    expect(r.maeSource).toBeCloseTo(2)
    expect(r.maeOurs).toBeLessThan(1)
    expect(r.band!.p90 - r.band!.p10).toBeLessThan(1.5)
  })

  it('the source wins against pure noise, and the band comes from its errors', () => {
    const r = evaluate(series((i) => (i % 2 ? 1 : -1)), 'min', 1, '2026-10-30')
    expect(r.winner).toBe('source')
    expect(r.band).toEqual({ p10: -1, p90: 1 })
  })

  it('lopsided errors give a band on the right side: truth − source, not source − truth', () => {
    // Three days 1 °C too warm, then one 3 °C too cold; the mean is 0, so a correction cannot help.
    const r = evaluate(series((i) => (i % 4 === 3 ? -3 : 1)), 'max', 1, '2026-10-30')
    expect(r.winner).toBe('source')
    // The truth fell 1 °C below the source to 3 °C above it, never 3 °C below.
    expect(r.band!.p10).toBeCloseTo(-1)
    expect(r.band!.p90).toBeCloseTo(3)
  })

  it('today’s bias uses only what is known today', () => {
    // Today 30 Oct (day 59); lead 1 targets 31 Oct, known up to 23 Oct = day 52; window = days 32..52.
    const r = evaluate(series((i) => i), 'max', 1, '2026-10-30')
    expect(r.biasToday).toBeCloseTo(42)
  })
})

describe('secondOpinion on the fixtures', () => {
  const results = secondOpinion(align(previousJson as PreviousRunsResponse, era5Json as Era5Response), '2026-11-25')

  it('gives max and min for lead days 1 to 7', () => {
    expect(results).toHaveLength(14)
  })

  it('has 56 backtest days at lead 1 and 50 at lead 7', () => {
    expect(results.find((r) => r.variable === 'max' && r.lead === 1)!.n).toBe(56)
    expect(results.find((r) => r.variable === 'max' && r.lead === 7)!.n).toBe(50)
  })
})
