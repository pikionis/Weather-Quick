import type { ForecastResponse } from '../lib/openMeteo'
import { compassPoint, weatherText } from '../lib/weatherCode'

interface Props {
  current: ForecastResponse['current']
  units: ForecastResponse['current_units']
}

export function CurrentPanel({ current: c, units: u }: Props) {
  return (
    <section className="card now" aria-labelledby="now-h">
      <h2 id="now-h">Now</h2>
      <p className="big">
        {c.temperature_2m.toFixed(1)}
        <small> {u.temperature_2m}</small>
      </p>
      <p className="sky">
        {weatherText(c.weather_code)} · feels like {c.apparent_temperature.toFixed(1)} {u.apparent_temperature}
      </p>
      <dl className="facts">
        <div>
          <dt>Wind</dt>
          <dd>
            {Math.round(c.wind_speed_10m)} {u.wind_speed_10m} {compassPoint(c.wind_direction_10m)}
          </dd>
        </div>
        <div>
          <dt>Gusts</dt>
          <dd>
            {Math.round(c.wind_gusts_10m)} {u.wind_gusts_10m}
          </dd>
        </div>
        <div>
          <dt>Dew point</dt>
          <dd>
            {c.dew_point_2m.toFixed(1)} {u.dew_point_2m}
          </dd>
        </div>
        <div>
          <dt>Precipitation</dt>
          <dd>
            {c.precipitation.toFixed(1)} {u.precipitation}
          </dd>
        </div>
      </dl>
      {/* Step 6: the second-opinion badge goes here. */}
    </section>
  )
}
