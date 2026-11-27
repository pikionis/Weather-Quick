import type { Verdict } from '../lib/correction/summary'

/** The method in full. */
export const ADR_URL = 'https://github.com/pikionis/Weather-Quick/blob/main/docs/adr/0002-bias-correction.md'

/** The second opinion's pill and headline, in the Now row and on the instrument. */
export function OpinionHead({ verdict: v }: { verdict: Verdict }) {
  return (
    <p className="so-head">
      {v.pill && <span className={`pill pill-${v.kind}`}>{v.pill}</span>}
      <span className="so-headline">{v.headline}</span>
    </p>
  )
}
