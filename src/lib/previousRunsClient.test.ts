import { describe, expect, it } from 'vitest'
import error400 from './fixtures/error-400.json'
import previousJson from './fixtures/kos-previous-runs.json'
import { lastDays } from './correction/dates'
import { KOS } from './location'
import { fetchPreviousRuns, previousRunsUrl } from './previousRunsClient'

const reply = (status: number, body: unknown) => async () => new Response(JSON.stringify(body), { status })

describe('previousRunsUrl', () => {
  it('asks for lead days 1 to 7 over the last 90 days, default model, local time', () => {
    const p = new URL(previousRunsUrl(KOS, lastDays('2026-11-25', 90))).searchParams
    expect(p.get('hourly')?.split(',')).toEqual([
      'temperature_2m',
      ...[1, 2, 3, 4, 5, 6, 7].map((l) => `temperature_2m_previous_day${l}`),
    ])
    expect(p.get('start_date')).toBe('2026-08-28')
    expect(p.get('end_date')).toBe('2026-11-25')
    expect(p.get('timezone')).toBe('Europe/Athens')
    expect(p.has('models')).toBe(false)
  })
})

describe('fetchPreviousRuns', () => {
  it('returns the response, or the API reason on HTTP 400', async () => {
    expect(await fetchPreviousRuns('u', reply(200, previousJson))).toEqual(previousJson)
    expect(await fetchPreviousRuns('u', reply(400, error400))).toEqual(error400)
  })
})
