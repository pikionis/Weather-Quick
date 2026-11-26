import { CurrentPanel } from './components/CurrentPanel'
import { ErrorState } from './components/ErrorState'
import { Footer } from './components/Footer'
import { ForecastView } from './components/ForecastView'
import { PastWeeks } from './components/PastWeeks'
import { useForecast } from './components/useForecast'
import { splitDays, todayOf, toDays } from './lib/days'
import { KOS } from './lib/location'
import { localTime } from './lib/refresh'

function App() {
  const { latest, past, error, updatedAt, retry } = useForecast()
  const next = latest ? splitDays(toDays(latest.daily), todayOf(latest.current)).next : []

  return (
    <div className="page">
      <header className="top">
        <div>
          <h1>Weather Quick</h1>
          <p className="place muted">
            {KOS.name}, {KOS.admin1}, {KOS.country} · {KOS.latitude.toFixed(2)}° N, {KOS.longitude.toFixed(2)}° E
          </p>
        </div>
        <p className="status muted" role="status">
          {updatedAt
            ? `Updated ${localTime(updatedAt, KOS.timezone)} local · refreshes every 10 min`
            : error
              ? 'Not loaded'
              : 'Loading…'}
          {latest && error && <strong className="stale"> · Last refresh failed: {error}</strong>}
        </p>
      </header>

      <main className="main">
        {!latest && error && <ErrorState reason={error} onRetry={retry} />}
        {!latest && !error && <p className="muted">Loading the weather for Kos…</p>}
        {latest && (
          <>
            <div className="row">
              <CurrentPanel current={latest.current} units={latest.current_units} />
              <ForecastView days={next} units={latest.daily_units} />
            </div>
            <PastWeeks days={past} units={latest.daily_units} />
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default App
