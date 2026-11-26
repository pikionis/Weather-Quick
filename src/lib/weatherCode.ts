/** WMO weather interpretation codes, as listed in the Open-Meteo docs (open-meteo.com/en/docs). */
const WMO: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snowfall',
  73: 'Moderate snowfall',
  75: 'Heavy snowfall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  97: 'Heavy thunderstorm',
  99: 'Thunderstorm with heavy hail',
}

export function weatherText(code: number): string {
  return WMO[code] ?? `Weather code ${code}`
}

const POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
const POINTS_16 = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
const turn = (degrees: number) => ((degrees % 360) + 360) % 360

/** Wind direction in degrees (where the wind comes from) to one of 8 compass points. */
export function compassPoint(degrees: number): string {
  return POINTS[Math.round(turn(degrees) / 45) % 8]
}

/** The same on 16 points, e.g. 327° → "NNW". */
export function compassPoint16(degrees: number): string {
  return POINTS_16[Math.round(turn(degrees) / 22.5) % 16]
}
