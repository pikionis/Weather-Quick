import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { LeadResult } from '../lib/correction/backtest'
import { daysAhead } from '../lib/correction/summary'
import type { Metric } from './Next7Days'
import { axisTick } from './plot'

/** The source's and our average miss per lead day, side by side. Loaded lazily with Recharts. */
export default function TrackChart({ rows, metric }: { rows: LeadResult[]; metric: Metric }) {
  // Whole degrees, from 0 to just above the largest miss.
  const top = Math.max(1, Math.ceil(Math.max(...rows.flatMap((r) => [r.maeSource, r.maeOurs]))))
  const ticks = Array.from({ length: top + 1 }, (_, i) => i)
  return (
    <figure
      className="chart"
      aria-label={`Average error of the source and of our correction for the daily ${metric === 'max' ? 'maximum' : 'minimum'}, 1 to 7 days ahead. The table view has every value.`}
    >
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 18, left: 0 }} barGap={2} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis
            dataKey="lead"
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            label={{ value: 'days ahead', position: 'insideBottom', offset: -12, fill: 'var(--muted)', fontSize: 11 }}
          />
          <YAxis width={40} tick={axisTick} tickLine={false} axisLine={false} domain={[0, top]} ticks={ticks} tickFormatter={(v: number) => `${v}°`} />
          <Tooltip cursor={{ fill: 'var(--grid)', fillOpacity: 0.5 }} content={(p) => <Tip row={p.active ? (p.payload?.[0]?.payload as LeadResult | undefined) : undefined} />} />
          <Bar dataKey="maeSource" name="Source" fill="var(--source)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="maeOurs" name="Ours" fill="var(--ours)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  )
}

function Tip({ row }: { row: LeadResult | undefined }) {
  if (!row) return null
  return (
    <div className="tip">
      <p className="tip-head">{daysAhead([row.lead])}</p>
      <p>Source {row.maeSource.toFixed(2)} °C</p>
      <p>Ours {row.maeOurs.toFixed(2)} °C</p>
      <p className="muted">
        {row.n} days · shown: {row.winner === 'ours' ? 'ours' : 'the source'}
      </p>
    </div>
  )
}
