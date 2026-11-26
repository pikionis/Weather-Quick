import { lazy, Suspense } from 'react'
import { dateTimeLabel } from '../lib/days'
import type { Hour } from '../lib/hours'
import type { ForecastResponse } from '../lib/openMeteo'
import type { Layers } from './layers'
import { Section } from './Section'
import { ChartFallback } from './Swatches'

const Next48Charts = lazy(() => import('./Next48Charts'))

interface Props {
  hours: Hour[]
  units: ForecastResponse['hourly_units']
  layers: Layers
}

export function Next48Hours({ hours, units, layers }: Props) {
  const first = hours.at(0)
  const last = hours.at(-1)
  const anyLayer = Object.values(layers).some(Boolean)
  return (
    <Section
      id="next48"
      title="Next 48 hours"
      className="wide"
      subtitle={
        first && last
          ? `Hourly, ${dateTimeLabel(first.time)} to ${dateTimeLabel(last.time)}. The layers in the menu choose what shows.`
          : 'Hourly.'
      }
    >
      {hours.length === 0 ? (
        <p className="empty">The forecast came back without the next hours.</p>
      ) : anyLayer ? (
        <Suspense fallback={<ChartFallback height={260} />}>
          <Next48Charts hours={hours} units={units} layers={layers} />
        </Suspense>
      ) : (
        <p className="empty">Every layer is off. Turn one on in the menu.</p>
      )}
    </Section>
  )
}
