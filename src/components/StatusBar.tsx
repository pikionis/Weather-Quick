import { useEffect, useState } from 'react'
import { KOS } from '../lib/location'
import { countdown, localTime } from '../lib/refresh'
import type { Status } from './useForecast'

const WORD: Record<Status, string> = { live: 'Live', reading: 'Reading', stale: 'Stale', error: 'No signal' }

/** Re-renders once a second; only this bar ticks, not the whole page. */
function useNow() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

interface Props {
  status: Status
  updatedAt: Date | null
  nextAt: number
}

export function StatusBar({ status, updatedAt, nextAt }: Props) {
  const now = useNow()
  const wait = countdown(nextAt - now)
  const detail = {
    live: `next reading in ${wait}`,
    reading: 'asking Open-Meteo…',
    stale: `last reading ${updatedAt ? localTime(updatedAt, KOS.timezone) : ''} · retry in ${wait}`,
    error: `retry in ${wait}`,
  }[status]

  return (
    <div className="status" data-status={status}>
      {/* A new key restarts the light's one-off pulse each time a reading lands. */}
      <span className="status-light" key={updatedAt?.getTime() ?? 0} aria-hidden="true" />
      <span className="status-word" role="status">
        {WORD[status]}
      </span>
      <span className="status-clock">
        <time>{localTime(new Date(now), KOS.timezone, true)}</time> Kos
      </span>
      <span className="status-detail">{detail}</span>
    </div>
  )
}
