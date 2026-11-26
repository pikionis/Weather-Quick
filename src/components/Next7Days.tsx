import { lazy, Suspense, useState } from 'react'
import { weekdayLabel, type Day } from '../lib/days'
import type { ForecastResponse } from '../lib/openMeteo'
import { weatherText } from '../lib/weatherCode'
import { Section } from './Section'
import { ChartFallback } from './Swatches'

const Next7Chart = lazy(() => import('./Next7Chart'))

export type Metric = 'max' | 'min'

interface Props {
  days: Day[]
  today: string
  units: ForecastResponse['daily_units']
}

/** The next 7 days from the source, max or min. Step 6 adds our correction, its band and the gap. */
export function Next7Days({ days, today, units: u }: Props) {
  const [metric, setMetric] = useState<Metric>('max')
  const unit = metric === 'max' ? u.temperature_2m_max : u.temperature_2m_min
  const label = (date: string) => (date === today ? 'Today' : weekdayLabel(date))

  return (
    <Section
      id="next7"
      title="Next 7 days"
      subtitle="The source forecast. Our second opinion, its 80% band and the gap join it once the backtest runs."
      actions={
        <div role="group" aria-label="Variable" className="segs">
          {(['max', 'min'] as const).map((m) => (
            <button key={m} type="button" className="seg" aria-pressed={metric === m} onClick={() => setMetric(m)}>
              {m === 'max' ? 'Max temp' : 'Min temp'}
            </button>
          ))}
        </div>
      }
    >
      <div className="split">
        <div className="split-chart">
          <Suspense fallback={<ChartFallback height={224} />}>
            <Next7Chart days={days} metric={metric} unit={unit} label={label} />
          </Suspense>
          <p className="chart-label">
            <span className="key key-line" style={{ color: 'var(--source)' }} />
            Source (Open-Meteo best match)
          </p>
        </div>
        <div className="split-table">
          <table>
            <caption>
              Daily {metric === 'max' ? 'maximum' : 'minimum'}, {unit}. Rain = highest hourly chance; wind = daily maximum.
            </caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Sky</th>
                <th scope="col" className="num">
                  Source
                </th>
                {/* Step 6 fills these three from the correction. */}
                <th scope="col" className="num">
                  Ours
                </th>
                <th scope="col" className="num">
                  80% range
                </th>
                <th scope="col" className="num">
                  Gap
                </th>
                <th scope="col" className="num">
                  Rain
                </th>
                <th scope="col" className="num">
                  Wind
                </th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.date}>
                  <th scope="row">{label(d.date)}</th>
                  <td>{weatherText(d.code)}</td>
                  <td className="num">
                    <strong>
                      {(metric === 'max' ? d.max : d.min).toFixed(1)} {unit}
                    </strong>
                  </td>
                  <td className="num muted">—</td>
                  <td className="num muted">—</td>
                  <td className="num muted">—</td>
                  <td className="num">
                    {d.rainChance} {u.precipitation_probability_max}
                  </td>
                  <td className="num">
                    {Math.round(d.windMax)} {u.wind_speed_10m_max}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="note">— : arrives with the backtest. Today has no correction, because our lead days start tomorrow.</p>
    </Section>
  )
}
