import { describe, expect, it } from 'vitest'
import error400 from './fixtures/error-400.json'
import era5Json from './fixtures/kos-era5.json'
import { lastDays } from './correction/dates'
import { era5Url, fetchEra5 } from './era5Client'
import { KOS } from './location'

const reply = (status: number, body: unknown) => async () => new Response(JSON.stringify(body), { status })

describe('era5Url', () => {
  it('asks the archive for ERA5 itself, over the same 90 days, in local time', () => {
    const url = new URL(era5Url(KOS, lastDays('2026-11-25', 90)))
    expect(url.host).toBe('archive-api.open-meteo.com')
    const p = url.searchParams
    expect(p.get('models')).toBe('era5')
    expect(p.get('hourly')?.split(',')).toEqual(['temperature_2m', 'dew_point_2m', 'wind_speed_10m'])
    expect(p.get('start_date')).toBe('2026-08-28')
    expect(p.get('end_date')).toBe('2026-11-25')
    expect(p.get('timezone')).toBe('Europe/Athens')
  })
})

describe('fetchEra5', () => {
  it('returns the response, a reason on HTTP 400, and a reason when offline', async () => {
    expect(await fetchEra5('u', reply(200, era5Json))).toEqual(era5Json)
    expect(await fetchEra5('u', reply(400, error400))).toEqual(error400)
    const offline = async () => {
      throw new TypeError('Failed to fetch')
    }
    expect(await fetchEra5('u', offline)).toEqual({ error: true, reason: 'Failed to fetch' })
  })
})
