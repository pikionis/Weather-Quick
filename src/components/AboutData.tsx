import type { ResponseMeta } from '../lib/openMeteo'
import { Section } from './Section'

/** Sources, method and limits. The forecast's grid cell comes from the live response. */
export function AboutData({ meta }: { meta: ResponseMeta }) {
  return (
    <Section id="about" title="About the data">
      <div className="about">
        <div>
          <h3>Sources</h3>
          <p>
            Forecast: Open-Meteo best match, grid cell {meta.latitude.toFixed(3)} N, {meta.longitude.toFixed(3)} E, {meta.elevation} m.
          </p>
          <p>Past forecasts (from step 5): Open-Meteo Previous Runs, the same model, 1 to 7 days ahead, last 90 days.</p>
          <p>Truth (from step 5): ERA5 reanalysis (models=era5), cell 37.0 N, 27.25 E, about 7 days late.</p>
        </div>
        <div>
          <h3>Method</h3>
          <p>
            Ours is the source minus its average error over the last 21 days at the same lead, using only what was known when
            that forecast was made.
          </p>
          <p>
            The 80% band holds 8 in 10 past errors of the line we show. We show ours only where the backtest finds it at least
            0.1 °C better, over 10 days or more.
          </p>
        </div>
        <div>
          <h3>Limits</h3>
          <p>
            The ERA5 cell is mostly sea and the Bodrum coast, with Kos town at its edge. The correction brings us closer to ERA5,
            not to a station in Kos.
          </p>
          <p>One place only. Best match can change its blend of models. The wind map moves the whole frame with one reading.</p>
        </div>
      </div>
    </Section>
  )
}
