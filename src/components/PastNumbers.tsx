import { pastNumbers, weekdayDateLabel, type Day } from '../lib/days'
import type { ForecastResponse } from '../lib/openMeteo'

interface Props {
  days: Day[]
  units: ForecastResponse['daily_units']
}

/** "28 days in numbers": the extremes and the totals of the past weeks. */
export function PastNumbers({ days, units: u }: Props) {
  const n = pastNumbers(days)
  if (!n) return null
  const rows: [string, string, string][] = [
    ['Warmest day', `${n.warmest.max.toFixed(1)} ${u.temperature_2m_max}`, weekdayDateLabel(n.warmest.date)],
    ['Coolest night', `${n.coolest.min.toFixed(1)} ${u.temperature_2m_min}`, weekdayDateLabel(n.coolest.date)],
    [
      'Wettest day',
      n.wettest ? `${n.wettest.rain.toFixed(1)} ${u.precipitation_sum}` : 'No rain',
      n.wettest ? weekdayDateLabel(n.wettest.date) : '',
    ],
    ['Total rain', `${Math.round(n.totalRain)} ${u.precipitation_sum}`, `${n.rainyDays} days with 1 ${u.precipitation_sum} or more`],
    ['Strongest gust', `${Math.round(n.gustiest.gustMax)} ${u.wind_gusts_10m_max}`, weekdayDateLabel(n.gustiest.date)],
  ]
  return (
    <section id="numbers" aria-labelledby="numbers-h" className="card narrow">
      <h2 id="numbers-h">{days.length} days in numbers</h2>
      <dl className="numbers">
        {rows.map(([label, value, when]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              <strong>{value}</strong>
              <span>{when}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
