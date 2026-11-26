import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { dateLabel, type Day } from '../lib/days'

interface Props {
  days: Day[]
  tempUnit: string
  rainUnit: string
}

const tick = { fill: 'var(--muted)', fontSize: 12 }
const margin = { top: 8, right: 16, bottom: 0, left: 0 }
// The same axis width and scale on both charts, so each date sits at the same x in temperature and rain.
const xAxis = { dataKey: 'label', tickLine: false, axisLine: false, tick, interval: 6, scale: 'band' } as const
const Y_WIDTH = 40

// No line or bar animation for visitors who ask for less motion.
const animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Past 28 days: temperature, and rain under it on its own mm axis. Hovering one chart shows the same day in both. */
export default function HistoryChart({ days, tempUnit, rainUnit }: Props) {
  const data = days.map((d) => ({ label: dateLabel(d.date), max: d.max, min: d.min, rain: d.rain }))
  return (
    <>
      <figure className="chart" aria-label={`Past 28 days: daily maximum and minimum temperature, ${tempUnit}`}>
        <figcaption className="chart-caption">Temperature, {tempUnit}</figcaption>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} syncId="past" margin={margin}>
            <CartesianGrid vertical={false} stroke="var(--grid)" />
            <XAxis {...xAxis} />
            <YAxis
              width={Y_WIDTH}
              tickLine={false}
              axisLine={false}
              tick={tick}
              allowDecimals={false}
              domain={['auto', 'auto']}
            />
            <Tooltip formatter={(v) => `${Number(v).toFixed(1)} ${tempUnit}`} />
            <Line dataKey="max" name="Daily max" stroke="var(--max)" strokeWidth={2.5} dot={false} isAnimationActive={animate} />
            <Line dataKey="min" name="Daily min" stroke="var(--min)" strokeWidth={2.5} dot={false} isAnimationActive={animate} />
          </LineChart>
        </ResponsiveContainer>
      </figure>
      <figure className="chart" aria-label={`Past 28 days: daily rain, ${rainUnit}`}>
        <figcaption className="chart-caption">Rain, {rainUnit}</figcaption>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={data} syncId="past" margin={margin}>
            <CartesianGrid vertical={false} stroke="var(--grid)" />
            <XAxis {...xAxis} />
            <YAxis width={Y_WIDTH} tickLine={false} axisLine={false} tick={tick} allowDecimals={false} />
            <Tooltip formatter={(v) => `${Number(v).toFixed(1)} ${rainUnit}`} cursor={{ fill: 'var(--row)' }} />
            <Bar dataKey="rain" name="Rain" fill="var(--rain)" radius={[2, 2, 0, 0]} isAnimationActive={animate} />
          </BarChart>
        </ResponsiveContainer>
      </figure>
    </>
  )
}
