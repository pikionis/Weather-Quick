import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { weekdayLabel, type Day } from '../lib/days'

interface Props {
  days: Day[]
  unit: string
}

const tick = { fill: 'var(--muted)', fontSize: 12 }

// No line or bar animation for visitors who ask for less motion.
const animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Next 7 days, daily max and min. Loaded lazily with Recharts. */
export default function ForecastChart({ days, unit }: Props) {
  const data = days.map((d) => ({ label: weekdayLabel(d.date), max: d.max, min: d.min }))
  return (
    <figure className="chart" aria-label={`Next 7 days: daily maximum and minimum temperature, ${unit}`}>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={tick} padding={{ left: 16, right: 16 }} />
          <YAxis
            width={40}
            tickLine={false}
            axisLine={false}
            tick={tick}
            allowDecimals={false}
            domain={['auto', 'auto']}
          />
          <Tooltip formatter={(v) => `${Number(v).toFixed(1)} ${unit}`} />
          <Line dataKey="max" name="Source max" stroke="var(--source)" strokeWidth={2} strokeDasharray="6 5" dot={false} isAnimationActive={animate} />
          <Line dataKey="min" name="Source min" stroke="var(--source)" strokeWidth={2} strokeDasharray="6 5" dot={false} isAnimationActive={animate} />
          {/* Step 6: the corrected lines and the 80% band go here. */}
        </LineChart>
      </ResponsiveContainer>
    </figure>
  )
}
