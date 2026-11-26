import { useCallback, useEffect, useRef, useState } from 'react'
import { splitDays, todayOf, toDays, type Day } from '../lib/days'
import { fetchForecast, forecastUrl, type ForecastQuery } from '../lib/forecastClient'
import { KOS } from '../lib/location'
import { isApiError, type ApiError, type ForecastResponse } from '../lib/openMeteo'
import { forecastQuery, isDue, localDate } from '../lib/refresh'

export interface ForecastState {
  /** The newest good response: now and the next 7 days. */
  latest: ForecastResponse | null
  /** The past 28 days, from the last response that carried the history. */
  past: Day[]
  /** Reason of the last failed request; the next good one clears it. */
  error: string | null
  updatedAt: Date | null
}

const CHECK_MS = 60 * 1000

async function request(query: ForecastQuery): Promise<ForecastResponse | ApiError> {
  // Dev only: ?fixture shows the Kos sample, ?fixture=error the error state. The build drops this branch.
  if (import.meta.env.DEV) {
    const mode = new URLSearchParams(window.location.search).get('fixture')
    if (mode === 'error') return (await import('../lib/fixtures/error-400.json')).default as ApiError
    if (mode !== null) return (await import('../lib/fixtures/kos-forecast.json')).default as ForecastResponse
  }
  return fetchForecast(forecastUrl(KOS, query))
}

/** Loads the forecast, then refreshes it every 10 minutes while the tab is visible. */
export function useForecast() {
  const [state, setState] = useState<ForecastState>({ latest: null, past: [], error: null, updatedAt: null })
  const historyAsOf = useRef<string | null>(null)
  const lastRequest = useRef(0)

  const load = useCallback(async () => {
    lastRequest.current = Date.now()
    const query = forecastQuery(historyAsOf.current, localDate(new Date(), KOS.timezone))
    const body = await request(query)
    if (isApiError(body)) {
      setState((s) => ({ ...s, error: body.reason }))
      return
    }
    const today = todayOf(body.current)
    const withHistory = query.pastDays > 0
    if (withHistory) historyAsOf.current = today
    setState((s) => ({
      latest: body,
      past: withHistory ? splitDays(toDays(body.daily), today).past : s.past,
      error: null,
      updatedAt: new Date(),
    }))
  }, [])

  useEffect(() => {
    // isDue is true on the first run only, so React's dev double-run makes one request, not two.
    if (isDue(lastRequest.current, Date.now())) void load()
    const tick = () => {
      if (document.visibilityState === 'visible' && isDue(lastRequest.current, Date.now())) void load()
    }
    const id = window.setInterval(tick, CHECK_MS)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [load])

  return { ...state, retry: load }
}
