import { describe, expect, it } from 'vitest'
import error400 from './fixtures/error-400.json'
import forecastJson from './fixtures/kos-forecast.json'
import { fetchForecast, forecastUrl } from './forecastClient'
import { KOS } from './location'

const params = (url: string) => new URL(url).searchParams

describe('forecastUrl', () => {
  it('asks for exactly the fields of the brief, in local time', () => {
    const p = params(forecastUrl(KOS, { pastDays: 28, forecastDays: 7 }))
    expect(p.get('latitude')).toBe('36.893')
    expect(p.get('longitude')).toBe('27.288')
    expect(p.get('current')?.split(',')).toEqual([
      'temperature_2m', 'apparent_temperature', 'dew_point_2m', 'wind_speed_10m',
      'wind_gusts_10m', 'wind_direction_10m', 'precipitation', 'weather_code',
    ])
    expect(p.get('hourly')?.split(',')).toEqual([
      'temperature_2m', 'dew_point_2m', 'wind_speed_10m', 'wind_gusts_10m',
      'wind_direction_10m', 'precipitation', 'precipitation_probability',
    ])
    expect(p.get('daily')?.split(',')).toEqual([
      'temperature_2m_max', 'temperature_2m_min', 'wind_speed_10m_max', 'wind_gusts_10m_max',
      'precipitation_sum', 'precipitation_probability_max', 'weather_code',
    ])
    expect(p.get('past_days')).toBe('28')
    expect(p.get('forecast_days')).toBe('7')
    expect(p.get('timezone')).toBe('auto')
  })

  it('a refresh leaves the history out', () => {
    expect(params(forecastUrl(KOS, { pastDays: 0, forecastDays: 7 })).get('past_days')).toBe('0')
  })
})

describe('fetchForecast', () => {
  const reply = (status: number, body: unknown) => async () => new Response(JSON.stringify(body), { status })

  it('returns the response on success', async () => {
    expect(await fetchForecast('u', reply(200, forecastJson))).toEqual(forecastJson)
  })

  it('passes the API reason through on HTTP 400', async () => {
    expect(await fetchForecast('u', reply(400, error400))).toEqual(error400)
  })

  it('turns a body without a reason into an ApiError', async () => {
    expect(await fetchForecast('u', async () => new Response('busy', { status: 503 }))).toEqual({
      error: true,
      reason: 'HTTP 503 from Open-Meteo',
    })
  })

  it('turns a network failure into an ApiError', async () => {
    const offline = async () => {
      throw new TypeError('Failed to fetch')
    }
    expect(await fetchForecast('u', offline)).toEqual({ error: true, reason: 'Failed to fetch' })
  })
})
