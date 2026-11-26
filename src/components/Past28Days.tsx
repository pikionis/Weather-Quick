import { lazy, Suspense } from 'react'
import { dateLabel, type Day } from '../lib/days'
import type { ForecastResponse } from '../lib/openMeteo'
import type { Layers } from './layers'
import { Section } from './Section'
import { ChartFallback } from './Swatches'

const Past28Charts = lazy(() => import('./Past28Charts'))

interface Props {
  days: Day[]
  units: ForecastResponse['daily_units']
  layers: Layers
}

export function Past28Days({ days, units, layers }: Props) {
  const first = days.at(0)
  const last = days.at(-1)
  const anyLayer = layers.temp || layers.rain || layers.wind || layers.gusts
  return (
    <Section
      id="past28"
      title="Past 28 days"
      className="wide"
      subtitle={first && last ? `Daily, ${dateLabel(first.date)} to ${dateLabel(last.date)}. Same layers as the menu.` : 'Daily.'}
    >
      {days.length === 0 ? (
        <p className="empty">The forecast came back without past days.</p>
      ) : anyLayer ? (
        <Suspense fallback={<ChartFallback height={300} />}>
          <Past28Charts days={days} units={units} layers={layers} />
        </Suspense>
      ) : (
        <p className="empty">Temperature, rain, wind and gusts are off. Turn one on in the menu.</p>
      )}
    </Section>
  )
}
