import { LEAD_DAYS, type LeadDay, type LocalDate } from '../openMeteo'
import { errorsFor, VARIABLES, type Aligned, type ErrorDay, type Variable } from './align'
import { biasFor } from './bias'
import { addDays } from './dates'
import { band, decide, mae, MIN_DAYS, type Band, type Winner } from './metrics'

/** One date replayed as if it were live: the source, our correction with the bias known then, and the truth. */
export interface BacktestDay {
  date: LocalDate
  truth: number
  source: number
  bias: number
  corrected: number
}

/** Every date that had a full bias window behind it. */
export function backtest(errors: ErrorDay[], lead: LeadDay): BacktestDay[] {
  const days: BacktestDay[] = []
  for (const e of errors) {
    const bias = biasFor(errors, e.date, lead)
    if (bias !== null) days.push({ date: e.date, truth: e.truth, source: e.forecast, bias, corrected: e.forecast - bias })
  }
  return days
}

/** The result the page shows for one variable and lead day. */
export interface LeadResult {
  variable: Variable
  lead: LeadDay
  /** Backtest days. */
  n: number
  maeSource: number
  maeOurs: number
  winner: Winner
  /** Errors of the line we show (ours or the source), `null` under 10 days. */
  band: Band | null
  /** What we subtract from today's forecast for today + lead. `null` without a full window. */
  biasToday: number | null
}

export function evaluate(errors: ErrorDay[], variable: Variable, lead: LeadDay, today: LocalDate): LeadResult {
  const days = backtest(errors, lead)
  const sourceErrors = days.map((d) => d.source - d.truth)
  const ourErrors = days.map((d) => d.corrected - d.truth)
  const maeSource = mae(sourceErrors)
  const maeOurs = mae(ourErrors)
  const winner = decide(maeSource, maeOurs, days.length)
  return {
    variable,
    lead,
    n: days.length,
    maeSource,
    maeOurs,
    winner,
    band: days.length >= MIN_DAYS ? band(winner === 'ours' ? ourErrors : sourceErrors) : null,
    biasToday: biasFor(errors, addDays(today, lead), lead),
  }
}

/** The whole second opinion: every variable and lead day. `today` is the place's local date. */
export function secondOpinion(aligned: Aligned, today: LocalDate): LeadResult[] {
  return VARIABLES.flatMap((variable) =>
    LEAD_DAYS.map((lead) => evaluate(errorsFor(aligned, variable, lead), variable, lead, today)),
  )
}

/** The value to show for a forecast at `lead`: corrected where ours wins, else the source unchanged. */
export function shownValue(source: number, result: LeadResult): number {
  return result.winner === 'ours' && result.biasToday !== null ? source - result.biasToday : source
}
