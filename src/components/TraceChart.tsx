import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import type { Hour } from '../lib/hours'
import { axisTick, PLOT } from './plot'

interface Props {
  hours: Hour[]
  now: number
  cursor: number | null
  dayStarts: number[]
  showDew?: boolean
}

/**
 * The hourly trace: air temperature (the last 24 hours lighter, the forecast in full ink) and dew point.
 * Loaded lazily with Recharts. It only draws; the cursor lives in Instrument.
 */
export default function TraceChart({ hours, now, cursor, dayStarts, showDew = true }: Props) {
  const data = hours.map((h, i) => ({
    i,
    dew: h.dew,
    earlier: i <= now ? h.temp : null,
    ahead: i >= now ? h.temp : null,
  }))
  const at = cursor ?? now

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 22, right: PLOT.right, bottom: 4, left: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--grid)" />
        <XAxis type="number" dataKey="i" domain={[0, hours.length - 1]} hide />
        <YAxis
          width={PLOT.left}
          tickLine={false}
          axisLine={false}
          tick={axisTick}
          allowDecimals={false}
          domain={['auto', 'auto']}
          tickFormatter={(v: number) => `${v}°`}
        />
        {dayStarts.map((x) => (
          <ReferenceLine key={x} x={x} stroke="var(--rule)" />
        ))}
        {showDew && <Line dataKey="dew" stroke="var(--dew)" strokeWidth={1.25} dot={false} activeDot={false} isAnimationActive={false} />}
        <Line dataKey="earlier" stroke="var(--ink-soft)" strokeWidth={2} dot={false} activeDot={false} isAnimationActive={false} />
        <Line dataKey="ahead" stroke="var(--ink)" strokeWidth={2} dot={false} activeDot={false} isAnimationActive={false} />
        {/* Step 6: the corrected trace and its 80% band go here. */}
        <ReferenceLine
          x={now}
          stroke="var(--signal)"
          strokeWidth={1.5}
          label={{ value: 'NOW', position: 'top', fill: 'var(--signal-text)', fontSize: 10, fontWeight: 700 }}
        />
        {cursor !== null && <ReferenceLine x={cursor} stroke="var(--ink)" strokeDasharray="3 3" />}
        <ReferenceDot x={at} y={hours[at].temp} r={5} fill="var(--signal)" stroke="var(--panel)" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}
