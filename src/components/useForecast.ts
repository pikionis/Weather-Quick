import { useCallback, useEffect, useRef, useState } from 'react'
import { splitDays, todayOf, toDays, type Day } from '../lib/days'
import { fetchForecast, forecastUrl, type ForecastQuery } from '../lib/forecastClient'
import { KOS } from '../lib/location'
import { isApiError, type ApiError, type ForecastResponse } from '../lib/openMeteo'
import { forecastQuery, localDate, nextRequestAt } from '../lib/refresh'

/** live: the last reading worked · reading: a request is out · stale: a refresh failed, old data shown · error: no data at all */
export type Status = 'live' | 'reading' | 'stale' | 'error'

export interface ForecastState {
  /** The newest good response: now, the last 24 hours and the next 7 days. */
  latest: ForecastResponse | null
  /** The past 28 days, from the last response that carried the history. */
  past: Day[]
  /** Reason of the last failed request; the next good one clears it. */
  error: string | null
  updatedAt: Date | null
  /** When the next request is due (ms). */
  nextAt: number
  reading: boolean
}

async function request(query: ForecastQuery): Promise<ForecastResponse | ApiError> {
  // Dev only: ?fixture shows the Kos sample, ?fixture=error the error state. The build drops this branch.
  if (import.meta.env.DEV) {
    const mode = new URLSearchParams(window.location.search).get('fixture')
    if (mode === 'error') return (await import('../lib/fixtures/error-400.json')).default as ApiError
    if (mode !== null) return (await import('../lib/fixtures/kos-forecast.json')).default as ForecastResponse
  }
  return fetchForecast(forecastUrl(KOS, query))
}

/** Loads the forecast, then reads again every 10 minutes (1 minute after a failure) while the tab is visible. */
export function useForecast() {
  const [state, setState] = useState<ForecastState>({
    latest: null,
    past: [],
    error: null,
    updatedAt: null,
    nextAt: 0,
    reading: true,
  })
  const historyAsOf = useRef<string | null>(null)
  const nextAt = useRef(0)

  const load = useCallback(async () => {
    const startedAt = Date.now()
    nextAt.current = Infinity // nothing else starts while this request is out
    setState((s) => ({ ...s, reading: true }))
    const query = forecastQuery(historyAsOf.current, localDate(new Date(), KOS.timezone))
    const body = await request(query)
    nextAt.current = nextRequestAt(startedAt, isApiError(body))
    if (isApiError(body)) {
      setState((s) => ({ ...s, error: body.reason, reading: false, nextAt: nextAt.current }))
      return
    }
    const today = todayOf(body.current)
    const withHistory = query.pastDays > 1
    if (withHistory) historyAsOf.current = today
    setState((s) => ({
      latest: body,
      past: withHistory ? splitDays(toDays(body.daily), today).past : s.past,
      error: null,
      updatedAt: new Date(),
      nextAt: nextAt.current,
      reading: false,
    }))
  }, [])

  useEffect(() => {
    // nextAt is 0 only before the first request, so React's dev double-run makes one request, not two.
    if (nextAt.current === 0) void load()
    const tick = () => {
      if (document.visibilityState === 'visible' && Date.now() >= nextAt.current) void load()
    }
    const id = window.setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [load])

  const status: Status = state.reading ? 'reading' : state.error ? (state.latest ? 'stale' : 'error') : 'live'
  return { ...state, status, retry: load }
}
