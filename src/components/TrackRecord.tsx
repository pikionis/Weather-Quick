import { Section } from './Section'

/** Step 6 fills this box from the backtest of step 5. Until then it says what will be here. */
export function TrackRecord() {
  return (
    <Section id="track" title="Track record" subtitle="Average miss against ERA5, by days ahead. Lower is better." className="narrow">
      <div className="pending">
        <p className="pending-title">Arrives with the backtest</p>
        <p className="muted">
          For each lead from 1 to 7 days ahead: the average error of the source and of our correction, over about 50 days, for
          the daily max and min. Where the source is as good or better, the page says so and shows the source.
        </p>
      </div>
    </Section>
  )
}
