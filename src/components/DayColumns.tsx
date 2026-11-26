import { weekdayAndDay, type Day } from '../lib/days'
import { weatherText } from '../lib/weatherCode'
import { PLOT } from './plot'

interface Props {
  days: Day[]
  /** Index in the trace where each day starts, by date. */
  starts: Map<string, number>
  /** Number of hours on the trace. */
  count: number
  activeDate: string
  units: { temp: string; rain: string }
  onPick: (index: number) => void
}

/** The next 7 days, each column standing exactly under its 24 hours of the trace. */
export function DayColumns({ days, starts, count, activeDate, units, onPick }: Props) {
  const span = count - 1
  return (
    <div className="days" style={{ paddingLeft: PLOT.left, paddingRight: PLOT.right }}>
      <div className="days-scale" aria-hidden="true" style={{ width: PLOT.left }}>
        <span>max {units.temp}</span>
        <span>min {units.temp}</span>
        <span>rain {units.rain}</span>
      </div>
      <ol className="days-track">
        {days.map((d) => {
          const start = starts.get(d.date)
          if (start === undefined) return null
          const left = (start / span) * 100
          const width = (Math.min(24, span - start) / span) * 100
          const [weekday, date] = weekdayAndDay(d.date)
          return (
            <li key={d.date} style={{ left: `${left}%`, width: `${width}%` }}>
              <button
                type="button"
                className={d.date === activeDate ? 'day active' : 'day'}
                onClick={() => onPick(Math.min(span, start + 14))}
                aria-label={`${weekday} ${date}: max ${d.max} ${units.temp}, min ${d.min} ${units.temp}, rain ${d.rain} ${units.rain}, ${weatherText(d.code)}. Read 14:00.`}
              >
                <span className="day-name">
                  <b>{weekday}</b> {date}
                </span>
                <span className="day-max">{d.max.toFixed(1)}°</span>
                <span className="day-min">{d.min.toFixed(1)}°</span>
                <span className="day-rain">{d.rain.toFixed(1)}</span>
                <span className="day-sky">{weatherText(d.code)}</span>
                {/* Step 6: our corrected max and the gap go here. */}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
