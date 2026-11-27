import { useEffect, useMemo, useRef, useState } from 'react'
import { lastDays } from '../lib/correction/dates'
import { correctedForecast, sourceDays, type ForecastDay } from '../lib/correction/forecast'
import {
  HISTORY_DAYS,
  LOADING,
  NO_ANSWER,
  opinionFrom,
  resultsOf,
  TIMEOUT_SECONDS,
  UNREACHABLE,
  verdict,
  type OpinionState,
  type Verdict,
} from '../lib/correction/summary'
import { todayOf } from '../lib/days'
import { era5Url, fetchEra5 } from '../lib/era5Client'
import { KOS } from '../lib/location'
import type { ApiError, Era5Response, ForecastResponse, LocalDate, PreviousRunsResponse } from '../lib/openMeteo'
import { fetchPreviousRuns, previousRunsUrl } from '../lib/previousRunsClient'

type Range = { start: LocalDate; end: LocalDate }
type Answers = [PreviousRunsResponse | ApiError, Era5Response | ApiError]

/**
 * fetch that gives up after TIMEOUT_SECONDS. fetch throws only when no answer came (a timeout, no network, a blocked
 * request), and the page says which; an answer, even an error, goes on to fetchJson.
 */
const fetchInTime: typeof fetch = (input, init) =>
  fetch(input, { ...init, signal: AbortSignal.timeout(TIMEOUT_SECONDS * 1000) }).catch((e: unknown) => {
    throw new Error(e instanceof DOMException && e.name === 'TimeoutError' ? NO_ANSWER : UNREACHABLE)
  })

async function request(range: Range): Promise<Answers> {
  // Dev only, with ?fixture: the 90-day samples, cut to the range. ?opinion=limit shows "data missing",
  // ?opinion=few "too few days" (it asks for 40 days). The build drops this branch.
  if (import.meta.env.DEV) {
    const params = new URLSearchParams(window.location.search)
    if (params.get('opinion') === 'limit') {
      const limit: ApiError = { error: true, reason: 'Daily API request limit exceeded' }
      return [limit, limit]
    }
    if (params.has('fixture')) {
      const [previous, era5] = await Promise.all([import('../lib/fixtures/kos-previous-runs.json'), import('../lib/fixtures/kos-era5.json')])
      return [from(previous.default as unknown as PreviousRunsResponse, range.start), from(era5.default as unknown as Era5Response, range.start)]
    }
  }
  return Promise.all([fetchPreviousRuns(previousRunsUrl(KOS, range), fetchInTime), fetchEra5(era5Url(KOS, range), fetchInTime)])
}

/** Dev only: a sample's hours from `start` on, as if the API had been asked for that range. */
function from<T extends { hourly: { time: string[] } }>(body: T, start: LocalDate): T {
  const first = body.hourly.time.findIndex((t) => t >= start)
  const keep = first < 0 ? body.hourly.time.length : first
  const hourly = Object.fromEntries(Object.entries(body.hourly).map(([k, v]) => [k, (v as unknown[]).slice(keep)]))
  return { ...body, hourly }
}

const historyDays = () =>
  import.meta.env.DEV && new URLSearchParams(window.location.search).get('opinion') === 'few' ? 40 : HISTORY_DAYS

/** Everything the page shows of the second opinion. */
export interface SecondOpinion {
  state: OpinionState
  verdict: Verdict
  /** Today and the next 6 days: the source (hourly), and ours where ours won. */
  days: ForecastDay[]
  /** The backtest is in and has enough days: there is a line and a band to show. */
  ready: boolean
}

/**
 * The backtest behind the second opinion: Previous Runs and ERA5 for the last 90 days, once per page load and again
 * only when the local date changes. The 10-minute refresh does not repeat it, but the 7 days follow each new forecast.
 */
export function useSecondOpinion(latest: ForecastResponse | null): SecondOpinion {
  const today = latest ? todayOf(latest.current) : null
  const [loaded, setLoaded] = useState<{ today: LocalDate; opinion: OpinionState } | null>(null)
  const asked = useRef<LocalDate | null>(null)

  useEffect(() => {
    // One request per date, so React's dev double-run does not ask twice.
    if (today === null || asked.current === today) return
    asked.current = today
    void request(lastDays(today, historyDays())).then(([previous, era5]) => {
      if (asked.current === today) setLoaded({ today, opinion: opinionFrom(previous, era5, today) })
    })
  }, [today])

  const state = loaded !== null && loaded.today === today ? loaded.opinion : LOADING
  const hourly = latest?.hourly
  return useMemo(() => {
    const v = verdict(state)
    const days = hourly && today ? correctedForecast(resultsOf(state), sourceDays(hourly), today) : []
    return { state, verdict: v, days, ready: v.kind === 'ours' || v.kind === 'source' }
  }, [state, hourly, today])
}
