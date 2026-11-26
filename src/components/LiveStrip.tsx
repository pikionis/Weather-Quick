import { Bar, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { weekdayDateLabel, type Day } from '../lib/days'
import type { ForecastResponse } from '../lib/openMeteo'
import type { Measure } from './LiveScene'

interface Props {
  days: Day[]
  today: string
  /** The scene's day, marked on the strip. */
  at: string
  measure: Measure
  units: ForecastResponse['daily_units']
  onPick: (date: string) => void
}

const tick = { fill: 'var(--muted)', fontSize: 11 }

/** The chosen measure day by day, the past and the forecast, with today and the scene's day marked. Lazy, Recharts. */
export default function LiveStrip({ days, today, at, measure, units: u, onPick }: Props) {
  const data = days.map((d) => ({ date: d.date, max: d.max, min: d.min, rain: d.rain, wind: d.windMax, gust: d.gustMax }))
  const last = days.at(-1)?.date
  const unit = measure === 'rain' ? u.precipitation_sum : measure === 'wind' ? u.wind_speed_10m_max : u.temperature_2m_max
  const names: Record<string, string> = { max: 'Max', min: 'Min', rain: 'Rain', wind: 'Wind', gust: 'Gusts' }

  return (
    <figure className="chart strip" aria-label={`${measure} by day, past and forecast, ${unit}`}>
      <ResponsiveContainer width="100%" height={150}>
        <ComposedChart
          data={data}
          margin={{ top: 16, right: 8, bottom: 0, left: 0 }}
          onClick={(state) => {
            const date = state?.activeLabel
            if (typeof date === 'string') onPick(date)
          }}
        >
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis dataKey="date" tick={tick} tickLine={false} axisLine={{ stroke: 'var(--border)' }} minTickGap={36} tickFormatter={weekdayDateLabel} />
          <YAxis width={44} tick={tick} tickLine={false} axisLine={false} allowDecimals={false} domain={measure === 'temp' ? ['auto', 'auto'] : [0, 'auto']} />
          {last && <ReferenceArea x1={today} x2={last} fill="var(--forecast-tint)" label={{ value: 'Forecast', position: 'insideTopRight', fill: 'var(--muted)', fontSize: 11 }} />}
          <Tooltip
            labelFormatter={(d) => weekdayDateLabel(String(d))}
            formatter={(v, name) => [`${v} ${unit}`, names[String(name)] ?? name]}
            contentStyle={{ borderRadius: 8, borderColor: 'var(--border)', fontSize: 13 }}
          />
          {measure === 'rain' && <Bar dataKey="rain" name="rain" fill="var(--rain)" radius={[2, 2, 0, 0]} isAnimationActive={false} />}
          {measure === 'wind' && <Line dataKey="gust" name="gust" stroke="var(--wind)" strokeWidth={1.5} strokeDasharray="5 4" dot={false} isAnimationActive={false} />}
          {measure === 'wind' && <Line dataKey="wind" name="wind" stroke="var(--wind)" strokeWidth={2.5} dot={false} isAnimationActive={false} />}
          {measure === 'temp' && <Line dataKey="max" name="max" stroke="var(--temp)" strokeWidth={2.5} dot={false} isAnimationActive={false} />}
          {measure === 'temp' && <Line dataKey="min" name="min" stroke="var(--min)" strokeWidth={2.5} dot={false} isAnimationActive={false} />}
          <ReferenceLine x={today} stroke="var(--ink)" strokeDasharray="3 3" label={{ value: 'Today', position: 'top', fill: 'var(--ink)', fontSize: 11 }} />
          {at !== today && <ReferenceLine x={at} stroke="var(--signal)" strokeWidth={2} />}
        </ComposedChart>
      </ResponsiveContainer>
      <figcaption className="chart-label">
        {measure === 'rain' && `Rain, ${unit} per day`}
        {measure === 'wind' && `Wind, daily maximum (solid) and gusts (dashed), ${unit}`}
        {measure === 'temp' && `Daily maximum (orange) and minimum (blue), ${unit}`}
      </figcaption>
    </figure>
  )
}
