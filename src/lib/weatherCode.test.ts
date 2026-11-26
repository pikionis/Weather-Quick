import { describe, expect, it } from 'vitest'
import forecastJson from './fixtures/kos-forecast.json'
import { compassPoint, compassPoint16, weatherText } from './weatherCode'

describe('weatherText', () => {
  it('uses the wording of the Open-Meteo docs', () => {
    expect(weatherText(0)).toBe('Clear sky')
    expect(weatherText(3)).toBe('Overcast')
    expect(weatherText(81)).toBe('Moderate rain showers')
    expect(weatherText(95)).toBe('Thunderstorm')
  })

  it('knows every code in the Kos fixture', () => {
    const codes = [...forecastJson.daily.weather_code, forecastJson.current.weather_code]
    for (const c of codes) expect(weatherText(c)).not.toMatch(/^Weather code/)
  })

  it('names an unknown code instead of guessing', () => {
    expect(weatherText(42)).toBe('Weather code 42')
  })
})

describe('compassPoint16', () => {
  it('rounds to the nearest of 16 points', () => {
    expect(compassPoint16(327)).toBe('NNW')
    expect(compassPoint16(0)).toBe('N')
    expect(compassPoint16(11)).toBe('N')
    expect(compassPoint16(12)).toBe('NNE')
    expect(compassPoint16(355)).toBe('N')
    expect(compassPoint16(-22.5)).toBe('NNW')
  })
})

describe('compassPoint', () => {
  it('rounds to the nearest of 8 points', () => {
    expect(compassPoint(0)).toBe('N')
    expect(compassPoint(327)).toBe('NW')
    expect(compassPoint(22)).toBe('N')
    expect(compassPoint(23)).toBe('NE')
    expect(compassPoint(359)).toBe('N')
    expect(compassPoint(360)).toBe('N')
    expect(compassPoint(-90)).toBe('W')
  })
})
