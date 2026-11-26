import { lazy, Suspense } from 'react'
import { weekdayLabel, type Day } from '../lib/days'
import type { ForecastResponse } from '../lib/openMeteo'
import { weatherText } from '../lib/weatherCode'
import { ChartFallback, LineSwatch } from './Swatches'

const ForecastChart = lazy(() => import('./ForecastChart'))

interface Props {
  days: Day[]
  units: ForecastResponse['daily_units']
}

export function ForecastView({ days, units: u }: Props) {
  return (
    <section className="card next" aria-labelledby="next-h">
      <div className="card-head">
        <h2 id="next-h">Next 7 days · {u.temperature_2m_max}</h2>
        {/* Step 6: the Source / Corrected / 80% band toggles go here. */}
      </div>
      {days.length === 0 ? (
        <p className="muted">The forecast came back without any days.</p>
      ) : (
        <>
          <Suspense fallback={<ChartFallback height={260} />}>
            <ForecastChart days={days} unit={u.temperature_2m_max} />
          </Suspense>
          <div className="legend">
            <span>
              <LineSwatch color="var(--source)" dashed />
              Source (Open-Meteo best match)
            </span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Day</th>
                  <th scope="col" className="left">
                    Sky
                  </th>
                  <th scope="col">Source max</th>
                  {/* Step 6: Ours max, 80% range and Gap go here. */}
                  <th scope="col">Min</th>
                  <th scope="col">Rain</th>
                </tr>
              </thead>
              <tbody>
                {days.map((d) => (
                  <tr key={d.date}>
                    <th scope="row">{weekdayLabel(d.date)}</th>
                    <td className="left muted">{weatherText(d.code)}</td>
                    <td>{d.max.toFixed(1)}</td>
                    <td>{d.min.toFixed(1)}</td>
                    <td>
                      {d.rain.toFixed(1)} {u.precipitation_sum}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
