import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { dateTimeLabel, weekdayAndDay } from '../lib/days'
import { maxRainChance, type Hour } from '../lib/hours'
import type { ForecastResponse } from '../lib/openMeteo'
import type { Layers } from './layers'
import { Caption } from './Swatches'

interface Props {
  hours: Hour[]
  units: ForecastResponse['hourly_units']
  layers: Layers
}

const tick = { fill: 'var(--muted)', fontSize: 11 }
const margin = { top: 6, right: 8, bottom: 0, left: 0 }
const Y_WIDTH = 44
const noAnimation = { isAnimationActive: false, dot: false } as const

/**
 * Up to three hourly charts on one time axis: temperature and dew point, wind and gusts, rain chance.
 * Hovering one shows the same hour in all of them. Loaded lazily with Recharts.
 */
export default function Next48Charts({ hours, units: u, layers }: Props) {
  const data = hours.map((h, i) => ({
    i,
    temp: h.temp,
    dew: h.dew,
    wind: h.wind,
    gust: h.gust,
    chance: h.rainChance,
  }))
  // Ticks every 6 hours: the weekday at midnight, the hour otherwise.
  const ticks = data.filter((d) => Number(hours[d.i].time.slice(11, 13)) % 6 === 0).map((d) => d.i)
  const tickLabel = (i: number) => {
    const t = hours[i]?.time ?? ''
    return t.endsWith('T00:00') ? weekdayAndDay(t.slice(0, 10))[0] : t.slice(11, 16)
  }
  const rainy = maxRainChance(hours) > 0
  const charts = [
    (layers.temp || layers.dew) && 'temp',
    (layers.wind || layers.gusts) && 'wind',
    layers.rain && rainy && 'rain',
  ].filter(Boolean)
  const lastChart = charts.at(-1)

  const xAxis = (name: string) => (
    <XAxis
      type="number"
      dataKey="i"
      domain={[0, data.length - 1]}
      ticks={ticks}
      tickFormatter={tickLabel}
      tick={tick}
      tickLine={false}
      axisLine={{ stroke: 'var(--border)' }}
      hide={name !== lastChart}
    />
  )
  const tooltip = (unit: string) => (
    <Tooltip
      labelFormatter={(i) => dateTimeLabel(hours[Number(i)]?.time ?? '')}
      formatter={(v, name) => [`${v} ${unit}`, name]}
      contentStyle={{ borderRadius: 8, borderColor: 'var(--border)', fontSize: 13 }}
    />
  )

  return (
    <div className="charts">
      {(layers.temp || layers.dew) && (
        <figure className="chart" aria-label={`Temperature and dew point, next 48 hours, ${u.temperature_2m}`}>
          <Caption
            unit={u.temperature_2m}
            items={[
              { on: layers.temp, label: 'Temperature', color: 'var(--temp)' },
              { on: layers.dew, label: 'Dew point', color: 'var(--dew)' },
            ]}
          />
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={data} margin={margin} syncId="h48">
              <CartesianGrid vertical={false} stroke="var(--grid)" />
              {xAxis('temp')}
              <YAxis width={Y_WIDTH} tick={tick} tickLine={false} axisLine={false} domain={['auto', 'auto']} allowDecimals={false} tickFormatter={(v: number) => `${v}°`} />
              {tooltip(u.temperature_2m)}
              {layers.dew && <Line dataKey="dew" name="Dew point" stroke="var(--dew)" strokeWidth={2} {...noAnimation} />}
              {layers.temp && <Line dataKey="temp" name="Temperature" stroke="var(--temp)" strokeWidth={2.5} {...noAnimation} />}
            </LineChart>
          </ResponsiveContainer>
        </figure>
      )}
      {(layers.wind || layers.gusts) && (
        <figure className="chart" aria-label={`Wind and gusts, next 48 hours, ${u.wind_speed_10m}`}>
          <Caption
            unit={u.wind_speed_10m}
            items={[
              { on: layers.wind, label: 'Wind', color: 'var(--wind)' },
              { on: layers.gusts, label: 'Gusts', color: 'var(--wind)', dashed: true },
            ]}
          />
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={data} margin={margin} syncId="h48">
              <CartesianGrid vertical={false} stroke="var(--grid)" />
              {xAxis('wind')}
              <YAxis width={Y_WIDTH} tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
              {tooltip(u.wind_speed_10m)}
              {layers.gusts && <Line dataKey="gust" name="Gusts" stroke="var(--wind)" strokeWidth={1.5} strokeDasharray="5 4" {...noAnimation} />}
              {layers.wind && <Line dataKey="wind" name="Wind" stroke="var(--wind)" strokeWidth={2.5} {...noAnimation} />}
            </LineChart>
          </ResponsiveContainer>
        </figure>
      )}
      {layers.rain && rainy && (
        <figure className="chart" aria-label={`Rain chance, next 48 hours, ${u.precipitation_probability}`}>
          <figcaption className="chart-label">Rain chance, {u.precipitation_probability}</figcaption>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={data} margin={margin} syncId="h48" barCategoryGap={1}>
              <CartesianGrid vertical={false} stroke="var(--grid)" />
              {xAxis('rain')}
              <YAxis width={Y_WIDTH} tick={tick} tickLine={false} axisLine={false} domain={[0, 100]} ticks={[0, 50, 100]} />
              {tooltip(u.precipitation_probability)}
              <Bar dataKey="chance" name="Rain chance" fill="var(--rain)" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </figure>
      )}
      {layers.rain && !rainy && <p className="note">Rain: 0 % chance in every hour of the next 48.</p>}
    </div>
  )
}
