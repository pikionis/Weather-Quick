import { lazy, Suspense, useRef, useState, type PointerEvent } from 'react'
import { dateLabel, extremes, type Day } from '../lib/days'
import { bandIndex, stepCursor } from '../lib/hours'
import type { ForecastResponse } from '../lib/openMeteo'
import { plotFraction } from './plot'
import { ChartFallback } from './Swatches'

const PastChart = lazy(() => import('./PastChart'))

interface Props {
  days: Day[]
  units: ForecastResponse['daily_units']
}

/** The past 28 days, with a day cursor of its own: hover, drag or arrow keys read one day. */
export function PastWeeks({ days, units: u }: Props) {
  const [active, setActive] = useState<number | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const { wettest, warmest } = extremes(days)
  const first = days.at(0)
  const last = days.at(-1)
  if (!first || !last || !warmest) return null

  const d = active === null ? null : days[active]
  const reading = d
    ? `${dateLabel(d.date)} · max ${d.max.toFixed(1)} ${u.temperature_2m_max} · min ${d.min.toFixed(1)} ${u.temperature_2m_min} · rain ${d.rain.toFixed(1)} ${u.precipitation_sum}`
    : `Warmest ${dateLabel(warmest.date)}, ${warmest.max.toFixed(1)} ${u.temperature_2m_max} · ${
        wettest ? `wettest ${dateLabel(wettest.date)}, ${wettest.rain.toFixed(1)} ${u.precipitation_sum}` : 'no rain'
      }`

  const follow = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' && e.buttons === 0) return
    const rect = box.current?.getBoundingClientRect()
    if (rect) setActive(bandIndex(plotFraction(e.clientX, rect), days.length))
  }

  return (
    <section className="past" aria-labelledby="past-h">
      <div className="section-head">
        <h2 id="past-h">
          Past 4 weeks
          <span>
            {dateLabel(first.date)} to {dateLabel(last.date)}
          </span>
        </h2>
        <p className="past-reading">{reading}</p>
      </div>
      <div
        ref={box}
        className="past-plot"
        role="slider"
        tabIndex={0}
        aria-label="Day cursor on the past 4 weeks"
        aria-valuemin={0}
        aria-valuemax={days.length - 1}
        aria-valuenow={active ?? days.length - 1}
        aria-valuetext={reading}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          follow(e)
        }}
        onPointerMove={follow}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)}
        onKeyDown={(e) => {
          const next = stepCursor(active, days.length - 1, days.length, e.key, false)
          if (next === undefined) return
          e.preventDefault()
          setActive(next)
        }}
      >
        <Suspense fallback={<ChartFallback height={350} />}>
          <PastChart
            days={days}
            active={active}
            warmest={days.indexOf(warmest)}
            wettest={wettest ? days.indexOf(wettest) : -1}
            tempUnit={u.temperature_2m_max}
            rainUnit={u.precipitation_sum}
          />
        </Suspense>
      </div>
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
              {days.map((day) => (
                <tr key={day.date}>
                  <th scope="row">{dateLabel(day.date)}</th>
                  <td>{day.max.toFixed(1)}</td>
                  <td>{day.min.toFixed(1)}</td>
                  <td>{day.rain.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  )
}
