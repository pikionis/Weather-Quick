import { lazy, Suspense, useState } from 'react'
import { HISTORY_DAYS, trackSentence } from '../lib/correction/summary'
import { dateLabel } from '../lib/days'
import type { Metric } from './Next7Days'
import { Section } from './Section'
import { ChartFallback } from './Swatches'
import type { SecondOpinion } from './useSecondOpinion'

const TrackChart = lazy(() => import('./TrackChart'))

function Segs<T extends string>({ label, options, value, onPick }: { label: string; options: [T, string][]; value: T; onPick: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} className="segs">
      {options.map(([v, text]) => (
        <button key={v} type="button" className="seg" aria-pressed={value === v} onClick={() => onPick(v)}>
          {text}
        </button>
      ))}
    </div>
  )
}

/** The backtest per lead day: the source's and our average miss, the days behind it, and which line the page shows. */
export function TrackRecord({ second }: { second: SecondOpinion }) {
  const [metric, setMetric] = useState<Metric>('max')
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const { state, verdict } = second
  const rows = state.kind === 'ready' ? state.results.filter((r) => r.variable === metric) : []

  return (
    <Section
      id="track"
      title="Track record"
      subtitle="Average miss against ERA5, by days ahead. Lower is better."
      className="track-box"
      actions={
        second.ready && (
          <div className="ctrls">
            <Segs label="Variable" options={[['max', 'Max'], ['min', 'Min']]} value={metric} onPick={setMetric} />
            <Segs label="View" options={[['chart', 'Chart'], ['table', 'Table']]} value={view} onPick={setView} />
          </div>
        )
      }
    >
      {!second.ready || state.kind !== 'ready' ? (
        <div className="pending">
          <p className="pending-title">{verdict.headline}</p>
          <p className="muted">{verdict.note}</p>
        </div>
      ) : (
        <>
          {view === 'chart' ? (
            <Suspense fallback={<ChartFallback height={200} />}>
              <TrackChart rows={rows} metric={metric} />
            </Suspense>
          ) : (
            <div className="table-wrap">
              <table>
                <caption>Average miss (MAE) against ERA5, daily {metric === 'max' ? 'maximum' : 'minimum'}.</caption>
                <thead>
                  <tr>
                    <th scope="col">Days ahead</th>
                    <th scope="col" className="num">
                      Source
                    </th>
                    <th scope="col" className="num">
                      Ours
                    </th>
                    <th scope="col" className="num">
                      Days
                    </th>
                    <th scope="col">Shown</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.lead}>
                      <th scope="row">{r.lead}</th>
                      <td className="num">{r.maeSource.toFixed(2)} °C</td>
                      <td className="num">{r.maeOurs.toFixed(2)} °C</td>
                      <td className="num">{r.n}</td>
                      <td>
                        <span className="key key-box" style={{ color: r.winner === 'ours' ? 'var(--ours)' : 'var(--source)' }} />
                        {r.winner === 'ours' ? 'Ours' : 'Source'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="verdict-line">{trackSentence(state.results, metric)}</p>
          <p className="legend">
            <span>
              <span className="key key-box" style={{ color: 'var(--source)' }} />
              Source
            </span>
            <span>
              <span className="key key-box" style={{ color: 'var(--ours)' }} />
              Ours
            </span>
            <span>
              Backtest from the last {HISTORY_DAYS} days
              {state.truthUntil && `, scored against ERA5 up to ${dateLabel(state.truthUntil)}`}
            </span>
          </p>
        </>
      )}
    </Section>
  )
}
