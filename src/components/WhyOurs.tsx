import type { LeadResult } from '../lib/correction/backtest'
import { MIN_DAYS, MIN_GAIN } from '../lib/correction/metrics'
import { HISTORY_DAYS, missSentence } from '../lib/correction/summary'
import { ADR_URL } from './OpinionHead'
import { Section } from './Section'

/** The method in three steps, the first one with today's numbers, and what "truth" means here. */
export function WhyOurs({ results }: { results: LeadResult[] }) {
  const miss = missSentence(results)
  return (
    <Section id="why" title="Why ours should beat the source" className="why">
      <ol>
        {miss && <li>{miss}</li>}
        <li>We subtract the source's average miss for each lead day, using only what was known on the day each forecast was made.</li>
        <li>
          We replay the last {HISTORY_DAYS} days as if they were live. Ours is shown only where it came out at least {MIN_GAIN} °C
          better over {MIN_DAYS} days or more. Everywhere else we show the source and say so.
        </li>
      </ol>
      <p className="truth">Truth is ERA5: a 25 km cell, mostly sea and the Bodrum coast. Ours gets closer to ERA5, not to a station in Kos town.</p>
      <p>
        <a href={ADR_URL}>The method in full: ADR 0002</a>
      </p>
    </Section>
  )
}
