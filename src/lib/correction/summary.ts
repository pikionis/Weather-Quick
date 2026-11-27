import { isApiError, type ApiError, type Era5Response, type LocalDate, type PreviousRunsResponse } from '../openMeteo'
import { align, VARIABLES, type Aligned, type Variable } from './align'
import { secondOpinion, type LeadResult } from './backtest'
import { BIAS_WINDOW_DAYS } from './bias'
import { MIN_DAYS, MIN_GAIN } from './metrics'

/** How many days of Previous Runs and ERA5 the page reads for the backtest. 35 would leave almost no backtest day. */
export const HISTORY_DAYS = 90

/** The second opinion as the page has it: still loading, a source that failed, or the backtest results. */
export type OpinionState =
  | { kind: 'loading' }
  | { kind: 'missing'; source: 'Previous Runs' | 'ERA5'; reason: string }
  | { kind: 'ready'; results: LeadResult[]; truthUntil: LocalDate | null }

export const LOADING: OpinionState = { kind: 'loading' }

/** Both answers to the backtest results. A failed source comes back as the reason, to show the source alone. */
export function opinionFrom(previous: PreviousRunsResponse | ApiError, era5: Era5Response | ApiError, today: LocalDate): OpinionState {
  if (isApiError(previous)) return { kind: 'missing', source: 'Previous Runs', reason: previous.reason }
  if (isApiError(era5)) return { kind: 'missing', source: 'ERA5', reason: era5.reason }
  const aligned = align(previous, era5)
  return { kind: 'ready', results: secondOpinion(aligned, today), truthUntil: lastTruthDate(aligned) }
}

/** The last full day of ERA5: the backtest is scored up to it. */
export function lastTruthDate(aligned: Aligned): LocalDate | null {
  let last: LocalDate | null = null
  for (const date of aligned.truth.keys()) if (last === null || date > last) last = date
  return last
}

/** The results, or none while loading or when a source failed. */
export const resultsOf = (state: OpinionState): LeadResult[] => (state.kind === 'ready' ? state.results : [])

/** How much better ours did than the source, °C of MAE. */
export const gainOf = (r: LeadResult) => r.maeSource - r.maeOurs

/** The tile on the Now row and the badge on the instrument. */
export interface Verdict {
  kind: 'loading' | 'ours' | 'source' | 'missing' | 'few'
  /** "Ours", "Source", "Unavailable" or "Waiting"; none while loading. */
  pill: string | null
  headline: string
  note: string
}

export function verdict(state: OpinionState): Verdict {
  if (state.kind === 'loading') {
    return { kind: 'loading', pill: null, headline: 'Working out…', note: `Replaying the last ${HISTORY_DAYS} days against ERA5.` }
  }
  if (state.kind === 'missing') {
    return {
      kind: 'missing',
      pill: 'Unavailable',
      headline: 'Not available now',
      note: `${state.source} answered "${state.reason}". The source is shown alone.`,
    }
  }
  const { results } = state
  if (results.every((r) => r.n < MIN_DAYS)) {
    const most = results.reduce<LeadResult | null>((best, r) => (best === null || r.n > best.n ? r : best), null)
    const n = most?.n ?? 0
    return {
      kind: 'few',
      pill: 'Waiting',
      headline: 'Too few days to judge',
      note: `The backtest has ${n} ${n === 1 ? 'day' : 'days'} at ${daysAhead([most?.lead ?? 1])} and needs ${MIN_DAYS}. The source is shown until then.`,
    }
  }
  const wins = results.filter((r) => r.winner === 'ours')
  if (wins.length === 0) {
    return {
      kind: 'source',
      pill: 'Source',
      headline: 'The source wins',
      note: `Ours was not ${MIN_GAIN} °C better at any lead, so the forecast is shown as the source gives it.`,
    }
  }
  const won = VARIABLES.filter((v) => wins.some((r) => r.variable === v))
  const leadsOf = (v: Variable) => wins.filter((r) => r.variable === v).map((r) => r.lead)
  const best = Math.max(...wins.map(gainOf))
  const over = `Up to ${best.toFixed(1)} °C closer, over ${span(wins.map((r) => r.n), 0)} days of backtest.`
  if (won.length === 1) {
    const [v] = won
    const other = v === 'max' ? 'min' : 'max'
    return {
      kind: 'ours',
      pill: 'Ours',
      headline: `Closer on the ${v}, ${daysAhead(leadsOf(v))}`,
      note: `${over} For the ${other} the source wins at every lead, so we show the source.`,
    }
  }
  return {
    kind: 'ours',
    pill: 'Ours',
    headline: 'Closer on the max and the min',
    note: `${over} Max: ${daysAhead(leadsOf('max'))}; min: ${daysAhead(leadsOf('min'))}.`,
  }
}

const NAME: Record<Variable, string> = { max: 'maximum', min: 'minimum' }

/** The Track record's one sentence for the max or the min. */
export function trackSentence(results: LeadResult[], variable: Variable): string {
  const rows = results.filter((r) => r.variable === variable)
  const wins = rows.filter((r) => r.winner === 'ours')
  if (wins.length === 0) return `Ours is not ${MIN_GAIN} °C better at any lead, so the ${NAME[variable]} stays as the source gives it.`
  const leads = wins.map((r) => r.lead)
  const rest = rows.filter((r) => r.winner !== 'ours').map((r) => r.lead)
  const where = runs(leads).length === 1 && leads.length >= 3 ? 'from' : 'at'
  const closer = `Ours is closer ${where} ${daysAhead(leads)}, by ${span(wins.map(gainOf), 2)} °C.`
  return rest.length === 0 ? closer : `${closer} At ${daysAhead(rest)} it is not ${MIN_GAIN} °C better, so there we show the source.`
}

/**
 * The first point of "Why ours should beat the source": how far the source missed in the bias window behind today's
 * correction, for the leads where ours is shown (all leads if none). `null` without a bias.
 */
export function missSentence(results: LeadResult[]): string | null {
  const known = results.filter((r) => r.biasToday !== null)
  const wins = known.filter((r) => r.winner === 'ours')
  const rows = wins.length > 0 ? wins : known
  const parts = VARIABLES.flatMap((v) => {
    const own = rows.filter((r) => r.variable === v)
    if (own.length === 0) return []
    return [`${NAME[v]} ran ${miss(own.map((r) => r.biasToday as number))}, ${daysAhead(own.map((r) => r.lead))}`]
  })
  if (parts.length === 0) return null
  return `In the latest ${BIAS_WINDOW_DAYS} days we can score, the source's ${parts.join(' and its ')}.`
}

/** Bias is forecast − truth: below 0 the source ran too cold. */
function miss(biases: number[]): string {
  if (biases.every((b) => b < 0)) return `${span(biases.map(Math.abs), 1)} °C too cold`
  if (biases.every((b) => b > 0)) return `${span(biases, 1)} °C too warm`
  return `${signed(Math.min(...biases))} to ${signed(Math.max(...biases))} °C off`
}

/** "0.12 to 0.82", or one value when both ends round the same. */
function span(values: number[], digits: number): string {
  const lo = Math.min(...values).toFixed(digits)
  const hi = Math.max(...values).toFixed(digits)
  return lo === hi ? lo : `${lo} to ${hi}`
}

/** Consecutive leads in groups: [2, 3, 4, 6] → [[2, 3, 4], [6]]. */
function runs(leads: number[]): number[][] {
  const groups: number[][] = []
  for (const l of [...leads].sort((a, b) => a - b)) {
    const last = groups.at(-1)
    if (last && l === last[last.length - 1] + 1) last.push(l)
    else groups.push([l])
  }
  return groups
}

/** "2 to 6 days ahead", "1 and 7 days ahead", "1 day ahead". Three or more in a row read as a range. */
export function daysAhead(leads: number[]): string {
  const items = runs(leads).flatMap((g) => (g.length >= 3 ? [`${g[0]} to ${g[g.length - 1]}`] : g.map(String)))
  const list = items.length === 1 ? items[0] : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
  return `${list} ${leads.length === 1 && leads[0] === 1 ? 'day' : 'days'} ahead`
}

/** "+0.7", "−0.5" (a true minus sign), and "0.0" for anything that rounds to zero. */
export function signed(x: number, digits = 1): string {
  const r = Number(x.toFixed(digits))
  if (r === 0) return (0).toFixed(digits)
  return `${r > 0 ? '+' : '−'}${Math.abs(r).toFixed(digits)}`
}
