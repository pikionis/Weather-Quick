import { Area, CartesianGrid, ComposedChart, LabelList, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, type XAxisTickContentProps } from 'recharts'
import type { ForecastDay } from '../lib/correction/forecast'
import type { Lines } from './layers'
import type { Metric } from './Next7Days'
import { axisTick } from './plot'

interface Props {
  days: ForecastDay[]
  metric: Metric
  unit: string
  label: (date: string) => string
  lines: Lines
  /** The backtest is in: draw ours and the band. */
  ready: boolean
}

interface Row {
  day: string
  source: number
  ours: number | null
  band: [number, number] | null
  shown: 'ours' | 'source' | null
  sourceLabel?: string
  oursLabel?: string
}

const COLOR = { ours: 'var(--ours)', source: 'var(--source)' }

/**
 * The band takes the colour of the line we show on each day, blue for ours and grey for the source, and changes
 * halfway between two days. Recharts sizes a gradient to the band's own box, which runs from its first day to its last.
 */
function bandStops(rows: Row[]): { offset: number; color: string }[] {
  const days = rows.filter((r) => r.band !== null)
  if (days.length < 2) return []
  const stops = [{ offset: 0, color: COLOR[days[0].shown ?? 'source'] }]
  for (let i = 1; i < days.length; i++) {
    const [a, b] = [COLOR[days[i - 1].shown ?? 'source'], COLOR[days[i].shown ?? 'source']]
    const offset = (i - 0.5) / (days.length - 1)
    if (a !== b) stops.push({ offset, color: a }, { offset, color: b })
  }
  stops.push({ offset: 1, color: COLOR[days[days.length - 1].shown ?? 'source'] })
  return stops
}

/** The next 7 days: the source dashed, ours solid where ours won, and the 80% band of the line shown. Loaded lazily. */
export default function Next7Chart({ days, metric, unit, label, lines, ready }: Props) {
  const rows: Row[] = days.map((f) => {
    const o = f[metric]
    return {
      day: label(f.date),
      source: o.source,
      ours: ready && o.shown === 'ours' ? o.ours : null,
      band: ready && o.range ? [o.range.low, o.range.high] : null,
      shown: o.shown,
    }
  })
  if (rows.length > 0) rows[0].sourceLabel = 'Source'
  const firstOurs = rows.find((r) => r.ours !== null)
  if (firstOurs) firstOurs.oursLabel = 'Ours'
  const stops = bandStops(rows)
  const id = `band-${metric}`

  return (
    <figure
      className="chart"
      aria-label={`Daily ${metric === 'max' ? 'maximum' : 'minimum'} for the next 7 days, ${unit}: the source, our correction where it won, and the 80% band. The table has every value.`}
    >
      <ResponsiveContainer width="100%" height={232}>
        <ComposedChart data={rows} margin={{ top: 22, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
              {stops.map((s, i) => (
                <stop key={i} offset={s.offset} style={{ stopColor: s.color }} />
              ))}
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis
            dataKey="day"
            tick={DayTick}
            interval={0}
            height={36}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            padding={{ left: 24, right: 24 }}
          />
          <YAxis width={40} tick={axisTick} tickLine={false} axisLine={false} domain={['auto', 'auto']} allowDecimals={false} tickFormatter={(v: number) => `${v}°`} />
          <Tooltip
            cursor={{ stroke: 'var(--border)' }}
            content={(p) => <Tip row={p.active ? (p.payload?.[0]?.payload as Row | undefined) : undefined} unit={unit} />}
          />
          {lines.band && (
            <Area
              dataKey="band"
              stroke="none"
              fill={stops.length > 0 ? `url(#${id})` : COLOR[firstOurs ? 'ours' : 'source']}
              fillOpacity={0.14}
              activeDot={false}
              isAnimationActive={false}
            />
          )}
          {lines.source && (
            <Line
              dataKey="source"
              stroke="var(--source)"
              strokeWidth={2}
              strokeDasharray="6 5"
              dot={{ r: 3.5, fill: '#ffffff', stroke: 'var(--source)', strokeWidth: 2, strokeDasharray: '0' }}
              activeDot={{ r: 5, fill: '#ffffff', stroke: 'var(--source)', strokeWidth: 2, strokeDasharray: '0' }}
              isAnimationActive={false}
            >
              <LabelList dataKey="sourceLabel" position="top" offset={10} className="line-label" />
            </Line>
          )}
          {lines.ours && (
            <Line
              dataKey="ours"
              stroke="var(--ours)"
              strokeWidth={3}
              strokeLinejoin="round"
              dot={{ r: 4.5, fill: 'var(--ours)', stroke: '#ffffff', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: 'var(--ours)', stroke: '#ffffff', strokeWidth: 2 }}
              isAnimationActive={false}
            >
              <LabelList dataKey="oursLabel" position="left" offset={10} className="line-label line-label-ours" />
            </Line>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </figure>
  )
}

/** "Thu 26" on two lines, so all seven days fit on a phone. */
function DayTick({ x, y, payload }: XAxisTickContentProps) {
  const [weekday, day] = String(payload.value).split(' ')
  return (
    <text x={x} y={Number(y) + 12} textAnchor="middle" fill="var(--muted)" fontSize={11}>
      <tspan x={x}>{weekday}</tspan>
      {day && (
        <tspan x={x} dy={13}>
          {day}
        </tspan>
      )}
    </text>
  )
}

function Tip({ row, unit }: { row: Row | undefined; unit: string }) {
  if (!row) return null
  return (
    <div className="tip">
      <p className="tip-head">{row.day}</p>
      <p>
        Source {row.source.toFixed(1)} {unit}
      </p>
      {row.ours !== null && (
        <p>
          <strong>
            Ours {row.ours.toFixed(1)} {unit}
          </strong>
        </p>
      )}
      {row.band && (
        <p>
          80%: {row.band[0].toFixed(1)} to {row.band[1].toFixed(1)} {unit}
        </p>
      )}
      {row.shown === null && <p className="muted">Today: no correction</p>}
    </div>
  )
}
