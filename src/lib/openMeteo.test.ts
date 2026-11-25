import { describe, expect, it } from 'vitest'
import error400 from './fixtures/error-400.json'
import era5Json from './fixtures/kos-era5.json'
import forecastJson from './fixtures/kos-forecast.json'
import modelsJson from './fixtures/kos-forecast-models.json'
import geocodingJson from './fixtures/kos-geocoding.json'
import previousJson from './fixtures/kos-previous-runs.json'
import { KOS } from './location'
import {
  isApiError,
  misalignedFields,
  MODELS,
  type Era5Response,
  type ForecastResponse,
  type GeocodingResponse,
  type MultiModelDailyResponse,
  type PreviousRunsResponse,
} from './openMeteo'

// The `satisfies` checks make tsc fail if a real response stops matching the contract.
const forecast = forecastJson satisfies ForecastResponse
const models = modelsJson satisfies MultiModelDailyResponse
const previous = previousJson satisfies PreviousRunsResponse
const era5 = era5Json satisfies Era5Response
const geocoding = geocodingJson satisfies GeocodingResponse

describe('Open-Meteo contract on real Kos samples', () => {
  it('forecast: 28 past days + 7 days ahead, aligned, local time zone', () => {
    expect(forecast.timezone).toBe('Europe/Athens')
    expect(forecast.daily.time).toHaveLength(35)
    expect(forecast.hourly.time).toHaveLength(35 * 24)
    expect(misalignedFields(forecast.daily)).toEqual([])
    expect(misalignedFields(forecast.hourly)).toEqual([])
    expect(forecast.daily_units.temperature_2m_max).toBe('°C')
    expect(forecast.current_units.wind_speed_10m).toBe('km/h')
  })

  it('multi-model forecast suffixes each variable with the model id', () => {
    for (const m of MODELS) expect(models.daily).toHaveProperty(`temperature_2m_max_${m}`)
    expect(misalignedFields(models.daily)).toEqual([])
  })

  it('previous runs: hourly, with one column per lead day', () => {
    expect(previous.hourly.temperature_2m_previous_day1).toHaveLength(previous.hourly.time.length)
    expect(misalignedFields(previous.hourly)).toEqual([])
  })

  it('ERA5: hourly truth on its own grid cell, aligned', () => {
    expect(misalignedFields(era5.hourly)).toEqual([])
    expect(era5.hourly.time.length % 24).toBe(0)
    expect(era5.longitude).not.toBe(forecast.longitude)
  })

  it('geocoding with countryCode=GR puts Kos town first', () => {
    const first = geocoding.results?.[0]
    expect(first?.name).toBe('Kos')
    expect(first?.country).toBe('Greece')
    expect(first?.admin1).toBe(KOS.admin1)
    expect(first?.latitude).toBeCloseTo(KOS.latitude, 2)
    expect(first?.longitude).toBeCloseTo(KOS.longitude, 2)
  })

  it('recognises the error shape', () => {
    expect(isApiError(error400)).toBe(true)
    expect(isApiError(forecast)).toBe(false)
  })
})
