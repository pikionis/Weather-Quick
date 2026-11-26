import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Day } from '../lib/days'
import type { Metric } from './Next7Days'

interface Props {
  days: Day[]
  metric: Metric
  unit: string
  label: (date: string) => string
}

const tick = { fill: 'var(--muted)', fontSize: 11 }

/** The source's daily max or min for the next 7 days. Loaded lazily with Recharts. */
export default function Next7Chart({ days, metric, unit, label }: Props) {
  const data = days.map((d) => ({ day: label(d.date), value: metric === 'max' ? d.max : d.min }))
  return (
    <figure className="chart" aria-label={`Daily ${metric === 'max' ? 'maximum' : 'minimum'} temperature, next 7 days, ${unit}`}>
      <ResponsiveContainer width="100%" height={224}>
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis dataKey="day" tick={tick} tickLine={false} axisLine={{ stroke: 'var(--border)' }} padding={{ left: 16, right: 16 }} />
          <YAxis width={40} tick={tick} tickLine={false} axisLine={false} domain={['auto', 'auto']} allowDecimals={false} tickFormatter={(v: number) => `${v}°`} />
          <Tooltip formatter={(v) => [`${v} ${unit}`, 'Source']} contentStyle={{ borderRadius: 8, borderColor: 'var(--border)', fontSize: 13 }} />
          <Line
            dataKey="value"
            name="Source"
            stroke="var(--source)"
            strokeWidth={2.5}
            dot={{ r: 4, fill: 'var(--source)', strokeWidth: 0 }}
            activeDot={{ r: 6 }}
            isAnimationActive={false}
          />
          {/* Step 6: our corrected line and its 80% band go here. */}
        </LineChart>
      </ResponsiveContainer>
    </figure>
  )
}
