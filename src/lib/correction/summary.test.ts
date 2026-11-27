import { describe, expect, it } from 'vitest'
import era5Json from '../fixtures/kos-era5.json'
import previousJson from '../fixtures/kos-previous-runs.json'
import type { ApiError, Era5Response, PreviousRunsResponse } from '../openMeteo'
import type { LeadResult } from './backtest'
import { daysAhead, missSentence, NO_ANSWER, opinionFrom, signed, trackSentence, UNREACHABLE, verdict, type OpinionState } from './summary'

const previous = previousJson as unknown as PreviousRunsResponse
const era5 = era5Json as unknown as Era5Response
const limit: ApiError = { error: true, reason: 'Daily API request limit exceeded' }

// The fixtures end on 25 November; ERA5's last full day is 19 November.
const fixtures = opinionFrom(previous, era5, '2026-11-25')
const results = fixtures.kind === 'ready' ? fixtures.results : []

const row = (over: Partial<LeadResult>): LeadResult => ({
  variable: 'max',
  lead: 1,
  n: 50,
  maeSource: 1,
  maeOurs: 1,
  winner: 'source',
  band: { p10: -1, p90: 1 },
  biasToday: 0.3,
  ...over,
})

describe('opinionFrom', () => {
  it('on the fixtures: every variable and lead, scored up to 19 November', () => {
    expect(fixtures).toMatchObject({ kind: 'ready', truthUntil: '2026-11-19' })
    expect(results).toHaveLength(14)
  })

  it('a failed Previous Runs or ERA5 comes back as the reason, Previous Runs first', () => {
    expect(opinionFrom(limit, era5, '2026-11-25')).toEqual({ kind: 'missing', source: 'Previous Runs', reason: limit.reason })
    expect(opinionFrom(limit, limit, '2026-11-25')).toMatchObject({ source: 'Previous Runs' })
    expect(opinionFrom(previous, limit, '2026-11-25')).toEqual({ kind: 'missing', source: 'ERA5', reason: limit.reason })
  })
})

describe('the texts on the fixtures', () => {
  it('tile: ours on the min, 2 to 6 days ahead; the source on the max', () => {
    expect(verdict(fixtures)).toEqual({
      kind: 'ours',
      pill: 'Ours',
      headline: 'Closer on the min, 2 to 6 days ahead',
      note: 'Up to 0.8 °C closer, over 51 to 55 days of backtest. For the max the source wins at every lead, so we show the source.',
    })
  })

  it('track record: the source wins the max at every lead', () => {
    expect(trackSentence(results, 'max')).toBe('Ours is not 0.1 °C better at any lead, so the maximum stays as the source gives it.')
  })

  it('track record: ours wins the min from 2 to 6 days ahead', () => {
    // Gains from the unrounded MAEs: 0.149, 0.156, 0.122, 0.781 and 0.814 °C.
    expect(trackSentence(results, 'min')).toBe(
      'Ours is closer from 2 to 6 days ahead, by 0.12 to 0.81 °C. At 1 and 7 days ahead it is not 0.1 °C better, so there we show the source.',
    )
  })

  it('why: how cold the source ran where ours is shown', () => {
    expect(missSentence(results)).toBe(
      "In the latest 21 days we can score, the source's minimum ran 0.7 to 2.4 °C too cold, 2 to 6 days ahead.",
    )
  })
})

describe('verdict, the other states', () => {
  it('loading', () => {
    expect(verdict({ kind: 'loading' })).toMatchObject({ kind: 'loading', pill: null, headline: 'Working out…' })
  })

  it('data missing: says which source and what it answered', () => {
    expect(verdict(opinionFrom(limit, era5, '2026-11-25'))).toEqual({
      kind: 'missing',
      pill: 'Unavailable',
      headline: 'Not available now',
      note: 'Previous Runs answered "Daily API request limit exceeded". The source is shown alone.',
    })
  })

  it('data missing: a source that did not answer in time, or could not be reached', () => {
    expect(verdict({ kind: 'missing', source: 'ERA5', reason: NO_ANSWER }).note).toBe(
      'ERA5 gave no answer within 45 seconds. The source is shown alone.',
    )
    expect(verdict({ kind: 'missing', source: 'Previous Runs', reason: UNREACHABLE }).note).toBe(
      'Previous Runs could not be reached. The source is shown alone.',
    )
  })

  it('too few days: the most days any lead has, against the 10 needed', () => {
    const few: OpinionState = { kind: 'ready', truthUntil: null, results: [row({ n: 6 }), row({ lead: 2, n: 5 }), row({ variable: 'min', n: 6 })] }
    expect(verdict(few)).toMatchObject({
      kind: 'few',
      pill: 'Waiting',
      note: 'The backtest has 6 days at 1 day ahead and needs 10. The source is shown until then.',
    })
    expect(verdict({ kind: 'ready', truthUntil: null, results: [] })).toMatchObject({ kind: 'few' })
  })

  it('the source wins everywhere', () => {
    const state: OpinionState = { kind: 'ready', truthUntil: null, results: [row({}), row({ variable: 'min' })] }
    expect(verdict(state)).toMatchObject({ kind: 'source', pill: 'Source', headline: 'The source wins' })
  })

  it('ours wins on both', () => {
    const state: OpinionState = {
      kind: 'ready',
      truthUntil: null,
      results: [row({ winner: 'ours', maeOurs: 0.6 }), row({ variable: 'min', lead: 3, winner: 'ours', maeOurs: 0.8, n: 48 })],
    }
    expect(verdict(state)).toEqual({
      kind: 'ours',
      pill: 'Ours',
      headline: 'Closer on the max and the min',
      note: 'Up to 0.4 °C closer, over 48 to 50 days of backtest. Max: 1 day ahead; min: 3 days ahead.',
    })
  })
})

describe('missSentence', () => {
  it('without a win it reports every lead, and mixed signs as a signed range', () => {
    const rs = [row({ biasToday: -0.3 }), row({ lead: 2, biasToday: 0.5 }), row({ lead: 3, biasToday: null })]
    expect(missSentence(rs)).toBe("In the latest 21 days we can score, the source's maximum ran −0.3 to +0.5 °C off, 1 and 2 days ahead.")
  })

  it('both variables, too warm and too cold', () => {
    const rs = [row({ biasToday: 0.5 }), row({ variable: 'min', biasToday: -1.2 })]
    expect(missSentence(rs)).toBe(
      "In the latest 21 days we can score, the source's maximum ran 0.5 °C too warm, 1 day ahead and its minimum ran 1.2 °C too cold, 1 day ahead.",
    )
  })

  it('no bias at all: nothing to say', () => {
    expect(missSentence([row({ biasToday: null })])).toBeNull()
  })
})

describe('daysAhead', () => {
  it.each([
    [[2, 3, 4, 5, 6], '2 to 6 days ahead'],
    [[1], '1 day ahead'],
    [[3], '3 days ahead'],
    [[7, 1], '1 and 7 days ahead'],
    [[1, 2], '1 and 2 days ahead'],
    [[1, 2, 3, 5], '1 to 3 and 5 days ahead'],
    [[1, 3, 5], '1, 3 and 5 days ahead'],
  ])('%j → %s', (leads, text) => {
    expect(daysAhead(leads)).toBe(text)
  })
})

describe('signed', () => {
  it('a sign on every value but zero, and a true minus', () => {
    expect(signed(0.73)).toBe('+0.7')
    expect(signed(-0.5)).toBe('−0.5')
    expect(signed(-0.04)).toBe('0.0')
    expect(signed(0)).toBe('0.0')
  })
})
