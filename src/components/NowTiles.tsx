import type { CSSProperties, ReactNode } from 'react'
import type { Day } from '../lib/days'
import type { ForecastResponse } from '../lib/openMeteo'
import { compassPoint16, weatherText } from '../lib/weatherCode'

interface Props {
  current: ForecastResponse['current']
  units: ForecastResponse['current_units']
  today: Day | undefined
  /** The highest hourly rain chance in the next 48 hours, %. */
  rainChance48: number
}

function Tile({ label, value, note, children }: { label: string; value: ReactNode; note: ReactNode; children?: ReactNode }) {
  return (
    <li className="tile">
      <p className="tile-label">{label}</p>
      <p className="tile-value">{value}</p>
      <p className="tile-note">{note}</p>
      {children}
    </li>
  )
}

/** The four "now" boxes, and the place where step 6 puts the second opinion. */
export function NowTiles({ current: c, units: u, today, rainChance48 }: Props) {
  return (
    <ul id="overview" className="tiles" aria-label="Right now">
      <Tile
        label="Now"
        value={`${c.temperature_2m.toFixed(1)} ${u.temperature_2m}`}
        note={`${weatherText(c.weather_code)} · feels like ${c.apparent_temperature.toFixed(1)} ${u.apparent_temperature}`}
      >
        {today && <TempRange now={c.temperature_2m} min={today.min} max={today.max} unit={u.temperature_2m} />}
      </Tile>
      <Tile
        label="Wind"
        value={
          <>
            {Math.round(c.wind_speed_10m)} <small>{u.wind_speed_10m}</small>
          </>
        }
        note={`From ${compassPoint16(c.wind_direction_10m)} (${c.wind_direction_10m}°) · gusts ${Math.round(c.wind_gusts_10m)} ${u.wind_gusts_10m}`}
      >
        <WindVane degrees={c.wind_direction_10m} speed={c.wind_speed_10m} />
      </Tile>
      <Tile
        label="Dew point"
        value={`${c.dew_point_2m.toFixed(1)} ${u.dew_point_2m}`}
        note={`At ${c.time.slice(11, 16)} local`}
      />
      <Tile
        label="Rain"
        value={
          <>
            {c.precipitation.toFixed(1)} <small>{u.precipitation}</small>
          </>
        }
        note={`Next 48 h: at most ${rainChance48} % chance`}
      />
      <li className="tile tile-second">
        <p className="tile-label">Second opinion</p>
        <p className="tile-pending">Arrives with the backtest</p>
        <p className="tile-note">Our corrected max and min next to the source, with the gap and how sure we are.</p>
      </li>
    </ul>
  )
}

/** Where now sits between today's min and max. The marker glides when a new reading lands. */
function TempRange({ now, min, max, unit }: { now: number; min: number; max: number; unit: string }) {
  const span = max - min
  const pos = span > 0 ? Math.min(1, Math.max(0, (now - min) / span)) : 0.5
  return (
    <div className="trange" role="img" aria-label={`Now ${now} ${unit}, between today's min ${min} and max ${max} ${unit}`}>
      <div className="trange-track">
        <div className="trange-pos" style={{ '--pos': `${pos * 100}%` } as CSSProperties}>
          <span className="trange-dot" />
        </div>
      </div>
      <div className="trange-labels" aria-hidden="true">
        <span>min {min.toFixed(1)}</span>
        <span>today</span>
        <span>max {max.toFixed(1)}</span>
      </div>
    </div>
  )
}

/**
 * A vane pointing where the wind blows to (it comes from `degrees`), with streaks that run
 * faster the stronger the wind. Calm air (under 2 km/h) does not move. No motion under reduced motion.
 */
function WindVane({ degrees, speed }: { degrees: number; speed: number }) {
  const calm = speed < 2
  const seconds = Math.min(4, Math.max(0.5, 24 / Math.max(speed, 1)))
  return (
    <svg className="vane" viewBox="-30 -30 60 60" aria-hidden="true">
      <circle r="27" />
      <g className="vane-turn" style={{ transform: `rotate(${degrees + 180}deg)` }}>
        {!calm &&
          [-12, 0, 12].map((x) => (
            <line
              key={x}
              className="streak"
              x1={x}
              y1="22"
              x2={x}
              y2="-22"
              style={{ animationDuration: `${seconds}s`, animationDelay: `${x * -0.04}s` }}
            />
          ))}
        <path className="vane-arrow" d="M0 -20 L6 -6 L1.5 -8 L1.5 14 L-1.5 14 L-1.5 -8 L-6 -6 Z" />
      </g>
    </svg>
  )
}
