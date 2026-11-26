import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { dateLabel, type Day } from '../lib/days'
import { axisTick, PLOT } from './plot'

interface Props {
  days: Day[]
  active: number | null
  warmest: number
  wettest: number
  tempUnit: string
  rainUnit: string
}

const margin = { top: 18, right: PLOT.right, bottom: 0, left: 0 }
const note = { position: 'top', fill: 'var(--ink)', fontSize: 11, fontWeight: 600 } as const

/**
 * Past 28 days: each day's range from min to max, and rain under it on its own mm axis, on the same dates.
 * Loaded lazily with Recharts. The day under the cursor turns ink; the warmest and wettest days carry a label.
 */
export default function PastChart({ days, active, warmest, wettest, tempUnit, rainUnit }: Props) {
  const data = days.map((d, i) => ({
    label: dateLabel(d.date),
    range: [d.min, d.max],
    rain: d.rain,
    // Only one bar per chart gets a label; the others have none to draw.
    maxNote: i === warmest ? `${d.max.toFixed(1)}°` : undefined,
    rainNote: i === wettest ? `${d.rain.toFixed(1)} ${rainUnit}` : undefined, // no-break space: one line
  }))
  const cells = (base: string) => data.map((_, i) => <Cell key={i} fill={i === active ? 'var(--ink)' : base} />)

  return (
    <>
      <p className="chart-caption">Daily range, min to max, {tempUnit}</p>
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={data} margin={margin} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis dataKey="label" hide />
          <YAxis
            width={PLOT.left}
            tickLine={false}
            axisLine={false}
            tick={axisTick}
            allowDecimals={false}
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => `${v}°`}
          />
          <Bar dataKey="range" radius={2} isAnimationActive={false}>
            {cells('var(--range)')}
            <LabelList dataKey="maxNote" {...note} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="chart-caption">Rain, {rainUnit}</p>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={margin} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: 'var(--rule)' }} tick={axisTick} interval={6} />
          <YAxis width={PLOT.left} tickLine={false} axisLine={false} tick={axisTick} allowDecimals={false} />
          <Bar dataKey="rain" radius={[2, 2, 0, 0]} isAnimationActive={false}>
            {cells('var(--rain)')}
            <LabelList dataKey="rainNote" {...note} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </>
  )
}
