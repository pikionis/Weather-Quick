import type { ForecastDay, Opinion } from '../lib/correction/forecast'
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
  /** The second opinion per day: the value we show, ours where ours won. */
  opinion: ForecastDay[]
  units: { temp: string; rain: string }
  onPick: (index: number) => void
}

/** The value we show: ours where ours won, else the source (from the hours, like the trace above). */
const shownValue = (o: Opinion | undefined, daily: number) => o?.ours ?? o?.source ?? daily

/** The next 7 days, each column standing exactly under its 24 hours of the trace, with the values the page shows. */
export function DayColumns({ days, starts, count, activeDate, opinion, units, onPick }: Props) {
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
          const f = opinion.find((o) => o.date === d.date)
          const max = shownValue(f?.max, d.max)
          const min = shownValue(f?.min, d.min)
          const oursMax = f?.max.shown === 'ours'
          const oursMin = f?.min.shown === 'ours'
          return (
            <li key={d.date} style={{ left: `${left}%`, width: `${width}%` }}>
              <button
                type="button"
                className={d.date === activeDate ? 'day active' : 'day'}
                onClick={() => onPick(Math.min(span, start + 14))}
                aria-label={`${weekday} ${date}: max ${max.toFixed(1)} ${units.temp}${oursMax ? ' (ours)' : ''}, min ${min.toFixed(1)} ${units.temp}${oursMin ? ' (ours)' : ''}, rain ${d.rain} ${units.rain}, ${weatherText(d.code)}. Read 14:00.`}
              >
                <span className="day-name">
                  <b>{weekday}</b> {date}
                </span>
                <span className="day-max">
                  {max.toFixed(1)}°{oursMax && <span className="ours-dot" />}
                </span>
                <span className="day-min">
                  {min.toFixed(1)}°{oursMin && <span className="ours-dot" />}
                </span>
                <span className="day-rain">{d.rain.toFixed(1)}</span>
                <span className="day-sky">{weatherText(d.code)}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
