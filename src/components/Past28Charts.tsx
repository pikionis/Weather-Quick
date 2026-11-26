import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { weekdayDateLabel, type Day } from '../lib/days'
import type { ForecastResponse } from '../lib/openMeteo'
import type { Layers } from './layers'
import { Caption } from './Swatches'

interface Props {
  days: Day[]
  units: ForecastResponse['daily_units']
  layers: Layers
}

const tick = { fill: 'var(--muted)', fontSize: 11 }
const margin = { top: 6, right: 8, bottom: 0, left: 0 }
const Y_WIDTH = 44
const still = { isAnimationActive: false, dot: false } as const

/**
 * Past 28 days on one date axis: max and min, rain, wind and gusts. Hovering one chart shows the same day in all.
 * Loaded lazily with Recharts.
 */
export default function Past28Charts({ days, units: u, layers }: Props) {
  const data = days.map((d, i) => ({ i, max: d.max, min: d.min, rain: d.rain, wind: d.windMax, gust: d.gustMax }))
  const ticks = data.filter((d) => d.i % 7 === 0).map((d) => d.i)
  const charts = [layers.temp && 'temp', layers.rain && 'rain', (layers.wind || layers.gusts) && 'wind'].filter(Boolean)
  const lastChart = charts.at(-1)
  const xAxis = (name: string, bars = false) => (
    <XAxis
      type={bars ? 'category' : 'number'}
      dataKey="i"
      domain={bars ? undefined : [0, data.length - 1]}
      ticks={ticks}
      interval={bars ? 6 : undefined}
      tickFormatter={(i: number) => weekdayDateLabel(days[i]?.date ?? '')}
      tick={tick}
      tickLine={false}
      axisLine={{ stroke: 'var(--border)' }}
      padding={bars ? undefined : { left: 8, right: 8 }}
      hide={name !== lastChart}
    />
  )
  const tooltip = (unit: string) => (
    <Tooltip
      labelFormatter={(i) => weekdayDateLabel(days[Number(i)]?.date ?? '')}
      formatter={(v, name) => [`${v} ${unit}`, name]}
      contentStyle={{ borderRadius: 8, borderColor: 'var(--border)', fontSize: 13 }}
    />
  )

  return (
    <div className="charts">
      {layers.temp && (
        <figure className="chart" aria-label={`Daily maximum and minimum temperature, past 28 days, ${u.temperature_2m_max}`}>
          <Caption
            unit={u.temperature_2m_max}
            items={[
              { on: true, label: 'Maximum', color: 'var(--temp)' },
              { on: true, label: 'Minimum', color: 'var(--min)' },
            ]}
          />
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={data} margin={margin} syncId="d28">
              <CartesianGrid vertical={false} stroke="var(--grid)" />
              {xAxis('temp')}
              <YAxis width={Y_WIDTH} tick={tick} tickLine={false} axisLine={false} domain={['auto', 'auto']} allowDecimals={false} tickFormatter={(v: number) => `${v}°`} />
              {tooltip(u.temperature_2m_max)}
              <Line dataKey="max" name="Maximum" stroke="var(--temp)" strokeWidth={2.5} {...still} />
              <Line dataKey="min" name="Minimum" stroke="var(--min)" strokeWidth={2.5} {...still} />
            </LineChart>
          </ResponsiveContainer>
        </figure>
      )}
      {layers.rain && (
        <figure className="chart" aria-label={`Daily rain, past 28 days, ${u.precipitation_sum}`}>
          <figcaption className="chart-label">Rain, {u.precipitation_sum} per day</figcaption>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={data} margin={margin} syncId="d28" barCategoryGap="25%">
              <CartesianGrid vertical={false} stroke="var(--grid)" />
              {xAxis('rain', true)}
              <YAxis width={Y_WIDTH} tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
              {tooltip(u.precipitation_sum)}
              <Bar dataKey="rain" name="Rain" fill="var(--rain)" radius={[2, 2, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </figure>
      )}
      {(layers.wind || layers.gusts) && (
        <figure className="chart" aria-label={`Daily maximum wind and gusts, past 28 days, ${u.wind_speed_10m_max}`}>
          <Caption
            unit={u.wind_speed_10m_max}
            items={[
              { on: layers.wind, label: 'Wind, daily maximum', color: 'var(--wind)' },
              { on: layers.gusts, label: 'Gusts', color: 'var(--wind)', dashed: true },
            ]}
          />
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={data} margin={margin} syncId="d28">
              <CartesianGrid vertical={false} stroke="var(--grid)" />
              {xAxis('wind')}
              <YAxis width={Y_WIDTH} tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
              {tooltip(u.wind_speed_10m_max)}
              {layers.gusts && <Line dataKey="gust" name="Gusts" stroke="var(--wind)" strokeWidth={1.5} strokeDasharray="5 4" {...still} />}
              {layers.wind && <Line dataKey="wind" name="Wind" stroke="var(--wind)" strokeWidth={2.5} {...still} />}
            </LineChart>
          </ResponsiveContainer>
        </figure>
      )}
    </div>
  )
}
