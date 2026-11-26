import { KOS } from '../lib/location'
import type { ResponseMeta } from '../lib/openMeteo'

/** The calibration plate: where the numbers come from and which grid cell they describe. */
export function Footer({ meta }: { meta: ResponseMeta | null }) {
  return (
    <footer className="plate">
      <p>
        Open-Meteo Forecast API, best match model
        {meta && ` · grid cell ${meta.latitude.toFixed(3)} N, ${meta.longitude.toFixed(3)} E, ${meta.elevation} m`} ·
        times {KOS.timezone}
      </p>
      <p>
        <a href="https://open-meteo.com/">Weather data by Open-Meteo.com</a> ·{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>
      </p>
    </footer>
  )
}
