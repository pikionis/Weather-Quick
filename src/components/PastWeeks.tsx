import { lazy, Suspense } from 'react'
import { dateLabel, extremes, type Day } from '../lib/days'
import type { ForecastResponse } from '../lib/openMeteo'
import { BarSwatch, ChartFallback, LineSwatch } from './Swatches'

const HistoryChart = lazy(() => import('./HistoryChart'))

interface Props {
  days: Day[]
  units: ForecastResponse['daily_units']
}

export function PastWeeks({ days, units: u }: Props) {
  const first = days.at(0)
  const last = days.at(-1)
  const { wettest, warmest } = extremes(days)
  return (
    <section className="card" aria-labelledby="past-h">
      <div className="card-head">
        <h2 id="past-h">
          Past 4 weeks{first && last ? ` · ${dateLabel(first.date)} to ${dateLabel(last.date)}` : ''}
        </h2>
        <div className="legend">
          <span>
            <LineSwatch color="var(--max)" />
            Daily max {u.temperature_2m_max}
          </span>
          <span>
            <LineSwatch color="var(--min)" />
            Daily min {u.temperature_2m_min}
          </span>
          <span>
            <BarSwatch color="var(--rain)" />
            Rain {u.precipitation_sum}
          </span>
        </div>
      </div>
      {days.length === 0 ? (
        <p className="muted">The forecast came back without past days.</p>
      ) : (
        <>
          <Suspense fallback={<ChartFallback height={394} />}>
            <HistoryChart days={days} tempUnit={u.temperature_2m_max} rainUnit={u.precipitation_sum} />
          </Suspense>
          <p className="note">
            {wettest ? `Wettest day: ${dateLabel(wettest.date)}, ${wettest.rain.toFixed(1)} ${u.precipitation_sum}. ` : 'No rain. '}
            {warmest && `Warmest: ${dateLabel(warmest.date)}, ${warmest.max.toFixed(1)} ${u.temperature_2m_max}.`}
          </p>
          <details>
            <summary>Show the {days.length} days as a table</summary>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Day</th>
                    <th scope="col">Max {u.temperature_2m_max}</th>
                    <th scope="col">Min {u.temperature_2m_min}</th>
                    <th scope="col">Rain {u.precipitation_sum}</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((d) => (
                    <tr key={d.date}>
                      <th scope="row">{dateLabel(d.date)}</th>
                      <td>{d.max.toFixed(1)}</td>
                      <td>{d.min.toFixed(1)}</td>
                      <td>{d.rain.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  )
}
