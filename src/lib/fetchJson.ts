import { isApiError, type ApiError } from './openMeteo'

/** Same contract as `fetchForecast`: never throws; a failed call, a rate limit or a network error come back as an `ApiError`. */
export async function fetchJson<T>(url: string, fetchFn: typeof fetch = fetch): Promise<T | ApiError> {
  try {
    const res = await fetchFn(url)
    const body: unknown = await res.json().catch(() => null)
    if (isApiError(body)) return body
    if (!res.ok || body === null) return { error: true, reason: `HTTP ${res.status} from Open-Meteo` }
    return body as T
  } catch (e) {
    return { error: true, reason: e instanceof Error ? e.message : String(e) }
  }
}
