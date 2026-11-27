import type { Verdict } from '../lib/correction/summary'
import { compassPoint } from '../lib/weatherCode'
import { OpinionHead } from './OpinionHead'

export interface Reading {
  /** "Now", "Earlier" or "Forecast" */
  kind: string
  /** "Thu 26 Nov, 14:00" */
  when: string
  temp: number
  /** "Mainly clear · feels like 10.3 °C", or the day's sky for an hour on the trace. */
  sky: string
  wind: number
  windDir: number
  gust: number
  dew: number
  rain: number
  rainChance: number | null
}

export interface Units {
  temp: string
  wind: string
  rain: string
}

interface Props {
  reading: Reading
  units: Units
  /** Shown when the cursor has left "now". */
  onBack?: () => void
  /** The second opinion's state, the same as the Now tile's. */
  verdict: Verdict
}

/** The instrument's reading for the hour under the cursor, or now. */
export function Readout({ reading: r, units: u, onBack, verdict }: Props) {
  return (
    <div className="readout">
      <p className="readout-when">
        <span className={r.kind === 'Now' ? 'kind kind-now' : 'kind'}>{r.kind}</span> {r.when}
      </p>
      <p className="readout-temp">
        {r.temp.toFixed(1)}
        <span className="readout-unit">{u.temp}</span>
      </p>
      <p className="readout-sky">{r.sky}</p>
      <dl className="readings">
        <div>
          <dt>Wind</dt>
          <dd>
            <WindNeedle degrees={r.windDir} />
            {Math.round(r.wind)} {u.wind} {compassPoint(r.windDir)}
          </dd>
        </div>
        <div>
          <dt>Gusts</dt>
          <dd>
            {Math.round(r.gust)} {u.wind}
          </dd>
        </div>
        <div>
          <dt>Dew point</dt>
          <dd>
            {r.dew.toFixed(1)} {u.temp}
          </dd>
        </div>
        <div>
          <dt>Rain</dt>
          <dd>
            {r.rain.toFixed(1)} {u.rain}
            {r.rainChance !== null && <span className="muted"> · {r.rainChance} %</span>}
          </dd>
        </div>
      </dl>
      {onBack && (
        <button type="button" className="back" onClick={onBack}>
          Back to now
        </button>
      )}
      <div className="readout-opinion" aria-live="polite">
        <p className="readout-opinion-label">Second opinion</p>
        <OpinionHead verdict={verdict} />
        <p className="note">{verdict.note}</p>
      </div>
    </div>
  )
}

/** Points where the wind blows to: it comes from `degrees`. */
function WindNeedle({ degrees }: { degrees: number }) {
  return (
    <svg className="needle" viewBox="-10 -10 20 20" aria-hidden="true">
      <circle r="9" />
      <path d="M0 -6 L3 4 L0 2 L-3 4 Z" transform={`rotate(${degrees + 180})`} />
    </svg>
  )
}
