import { lazy, Suspense, useState } from 'react'
import { BIAS_WINDOW_DAYS } from '../lib/correction/bias'
import type { Opinion } from '../lib/correction/forecast'
import { signed } from '../lib/correction/summary'
import { weekdayLabel, type Day } from '../lib/days'
import type { ForecastResponse } from '../lib/openMeteo'
import { weatherText } from '../lib/weatherCode'
import type { Lines } from './layers'
import { ADR_URL } from './OpinionHead'
import { Section } from './Section'
import { ChartFallback } from './Swatches'
import type { SecondOpinion } from './useSecondOpinion'

const Next7Chart = lazy(() => import('./Next7Chart'))

export type Metric = 'max' | 'min'

interface Props {
  days: Day[]
  today: string
  units: ForecastResponse['daily_units']
  second: SecondOpinion
  lines: Lines
}

const NAME = { max: 'maximum', min: 'minimum' } as const

/** The next 7 days: the source and our second opinion, the gap and the 80% range, max or min. */
export function Next7Days({ days, today, units: u, second, lines }: Props) {
  const [metric, setMetric] = useState<Metric>('max')
  const unit = metric === 'max' ? u.temperature_2m_max : u.temperature_2m_min
  const label = (date: string) => (date === today ? 'Today' : weekdayLabel(date))
  const opinionOf = (date: string): Opinion | undefined => second.days.find((f) => f.date === date)?.[metric]
  const anyOurs = second.ready && second.days.some((f) => f[metric].shown === 'ours')
  const caption = !second.ready
    ? 'The source alone for now: the Second opinion box says why.'
    : anyOurs
      ? 'Gap = ours minus source.'
      : `The source won the backtest, so the ${NAME[metric]} is shown as the source gives it.`

  return (
    <Section
      id="next7"
      title="Next 7 days"
      subtitle="The source forecast and our second opinion, with how far apart they are and how sure we are."
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
          <Suspense fallback={<ChartFallback height={232} />}>
            <Next7Chart days={second.days} metric={metric} unit={unit} label={label} lines={lines} ready={second.ready} />
          </Suspense>
          <p className="legend">
            {anyOurs && (
              <span>
                <span className="key key-line" style={{ color: 'var(--ours)' }} />
                Ours
              </span>
            )}
            <span>
              <span className="key key-dash" style={{ color: 'var(--source)' }} />
              Source (Open-Meteo best match, from its hours)
            </span>
            {second.ready && (
              <span>
                {anyOurs && <span className="key key-band" style={{ color: 'var(--ours)' }} />}
                {second.days.some((f) => f.lead > 0 && f[metric].shown === 'source') && (
                  <span className="key key-band" style={{ color: 'var(--source)' }} />
                )}
                80% band of the line shown: 8 in 10 past errors fell inside
              </span>
            )}
          </p>
        </div>
        <div className="split-table">
          <table>
            <caption>
              Daily {NAME[metric]}, {unit}. {caption} Rain = highest hourly chance; wind = daily maximum.
            </caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Sky</th>
                <th scope="col" className="num">
                  Source
                </th>
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
              {days.map((d) => {
                const o = opinionOf(d.date)
                const source = o?.source ?? (metric === 'max' ? d.max : d.min)
                const oursShown = second.ready && o?.shown === 'ours'
                return (
                  <tr key={d.date}>
                    <th scope="row">{label(d.date)}</th>
                    <td>{weatherText(d.code)}</td>
                    <td className="num">
                      {oursShown ? (
                        `${source.toFixed(1)} ${unit}`
                      ) : (
                        <strong>
                          {source.toFixed(1)} {unit}
                        </strong>
                      )}
                    </td>
                    <td className="num">
                      {d.date === today ? (
                        <span className="muted">no correction</span>
                      ) : !second.ready || !o ? (
                        <span className="muted">—</span>
                      ) : oursShown && o.ours !== null ? (
                        <strong>
                          {o.ours.toFixed(1)} {unit}
                        </strong>
                      ) : (
                        <span className="muted">= source</span>
                      )}
                    </td>
                    <td className="num">{second.ready && o?.range ? `${o.range.low.toFixed(1)} to ${o.range.high.toFixed(1)}` : '—'}</td>
                    <td className="num">{second.ready && o?.gap != null ? signed(o.gap) : '—'}</td>
                    <td className="num">
                      {d.rainChance} {u.precipitation_probability_max}
                    </td>
                    <td className="num">
                      {Math.round(d.windMax)} {u.wind_speed_10m_max}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="note">
        Today has no correction: our lead days start tomorrow. Ours is the source minus its average miss at that lead over
        the latest {BIAS_WINDOW_DAYS} days we can score (<a href={ADR_URL}>method: ADR 0002</a>).
      </p>
    </Section>
  )
}
