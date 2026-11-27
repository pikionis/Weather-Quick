import { lazy, Suspense, useMemo, useRef, useState, type PointerEvent } from 'react'
import { dateTimeLabel, splitDays, todayOf, toDays, weekdayLabel } from '../lib/days'
import { dayStarts, nearestIndex, stepCursor, toHours, traceWindow } from '../lib/hours'
import type { ForecastResponse } from '../lib/openMeteo'
import { weatherText } from '../lib/weatherCode'
import { DayColumns } from './DayColumns'
import { plotFraction } from './plot'
import { Readout, type Reading } from './Readout'
import { ChartFallback, LineSwatch } from './Swatches'
import type { SecondOpinion } from './useSecondOpinion'

const TraceChart = lazy(() => import('./TraceChart'))

/**
 * The instrument: one time cursor over the hourly trace, one reading that follows it.
 * Hover, drag or use the arrow keys to move through time; leave (or Home) to go back to now.
 */
export function Instrument({ latest, showDew = true, second }: { latest: ForecastResponse; showDew?: boolean; second: SecondOpinion }) {
  const [cursor, setCursor] = useState<number | null>(null)
  const box = useRef<HTMLDivElement>(null)

  const trace = useMemo(
    () => traceWindow(toHours(latest.hourly), latest.current.time),
    [latest.hourly, latest.current.time],
  )
  const allDays = useMemo(() => toDays(latest.daily), [latest.daily])
  const hours = trace.hours
  const now = Math.max(0, trace.now)
  const starts = dayStarts(hours)
  const at = cursor ?? now
  const hour = hours[at]
  const date = hour.time.slice(0, 10)

  const c = latest.current
  const u = latest.hourly_units
  const units = { temp: u.temperature_2m, wind: u.wind_speed_10m, rain: u.precipitation }
  const day = allDays.find((d) => d.date === date)
  const reading: Reading =
    cursor === null
      ? {
          kind: 'Now',
          when: dateTimeLabel(c.time),
          temp: c.temperature_2m,
          sky: `${weatherText(c.weather_code)} · feels like ${c.apparent_temperature.toFixed(1)} ${units.temp}`,
          wind: c.wind_speed_10m,
          windDir: c.wind_direction_10m,
          gust: c.wind_gusts_10m,
          dew: c.dew_point_2m,
          rain: c.precipitation,
          rainChance: hour.rainChance,
        }
      : {
          kind: cursor < now ? 'Earlier' : cursor === now ? 'This hour' : 'Forecast',
          when: dateTimeLabel(hour.time),
          temp: hour.temp,
          sky: day ? `${weatherText(day.code)} on ${weekdayLabel(day.date)}` : '',
          wind: hour.wind,
          windDir: hour.windDir,
          gust: hour.gust,
          dew: hour.dew,
          rain: hour.rain,
          rainChance: hour.rainChance,
        }

  // A mouse moves the cursor on hover; a finger or pen only while pressed, so the page still scrolls.
  const follow = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' && e.buttons === 0) return
    const rect = box.current?.getBoundingClientRect()
    if (rect) setCursor(nearestIndex(plotFraction(e.clientX, rect), hours.length))
  }

  return (
    <section id="instrument" className="instrument" aria-label="Kos weather instrument">
      <Readout reading={reading} units={units} onBack={cursor === null ? undefined : () => setCursor(null)} verdict={second.verdict} />
      <div className="trace-area">
        <div className="trace-head">
          <span>
            Hourly · last 24 h and next 7 days
          </span>
          <span className="trace-legend">
            <span>
              <LineSwatch color="var(--ink)" /> air {units.temp}
            </span>
            {showDew && (
              <span>
                <LineSwatch color="var(--dew)" thin /> dew point {units.temp}
              </span>
            )}
            {second.days.some((f) => f.max.shown === 'ours' || f.min.shown === 'ours') && (
              <span>
                <span className="ours-dot" aria-hidden="true" /> ours in the day columns
              </span>
            )}
            <span className="hint">← → hour · Shift day · Home now</span>
          </span>
        </div>
        <div
          ref={box}
          className="trace"
          role="slider"
          tabIndex={0}
          aria-label="Time cursor on the hourly trace"
          aria-valuemin={0}
          aria-valuemax={hours.length - 1}
          aria-valuenow={at}
          aria-valuetext={`${reading.kind}, ${reading.when}: ${reading.temp.toFixed(1)} ${units.temp}`}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            follow(e)
          }}
          onPointerMove={follow}
          onPointerLeave={(e) => e.pointerType === 'mouse' && setCursor(null)}
          onKeyDown={(e) => {
            const next = stepCursor(cursor, now, hours.length, e.key, e.shiftKey)
            if (next === undefined) return
            e.preventDefault()
            setCursor(next)
          }}
        >
          <Suspense fallback={<ChartFallback height={240} />}>
            <TraceChart hours={hours} now={now} cursor={cursor} dayStarts={starts.map((s) => s.index)} showDew={showDew} />
          </Suspense>
        </div>
        <DayColumns
          days={splitDays(allDays, todayOf(c)).next}
          starts={new Map(starts.map((s) => [s.date, s.index]))}
          count={hours.length}
          activeDate={date}
          opinion={second.days}
          units={units}
          onPick={setCursor}
        />
      </div>
    </section>
  )
}

/** The instrument before the first reading, or when there is no signal. */
export function InstrumentEmpty({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <section className="instrument" aria-label="Kos weather instrument">
      <div className="readout">
        <p className="readout-when">
          <span className="kind">{error ? 'No signal' : 'Reading'}</span>
        </p>
        <p className="readout-temp readout-blank">
          --.-<span className="readout-unit">°C</span>
        </p>
        {error ? (
          <>
            <p className="readout-sky" role="alert">
              The forecast could not load: {error}
            </p>
            <button type="button" className="back" onClick={onRetry}>
              Try again
            </button>
          </>
        ) : (
          <p className="readout-sky muted">Asking Open-Meteo for Kos…</p>
        )}
      </div>
      <div className="trace-area">
        <div className="trace-blank" />
      </div>
    </section>
  )
}
