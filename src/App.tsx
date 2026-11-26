import { Footer } from './components/Footer'
import { Instrument, InstrumentEmpty } from './components/Instrument'
import { PastWeeks } from './components/PastWeeks'
import { StatusBar } from './components/StatusBar'
import { useForecast } from './components/useForecast'
import { KOS } from './lib/location'

function App() {
  const { latest, past, error, updatedAt, nextAt, status, retry } = useForecast()

  return (
    <div className="page">
      <header className="top">
        <div className="brand">
          <h1>Weather Quick</h1>
          <p className="muted">
            {KOS.name}, {KOS.admin1}, {KOS.country} · {KOS.latitude.toFixed(2)}° N, {KOS.longitude.toFixed(2)}° E
          </p>
        </div>
        <StatusBar status={status} updatedAt={updatedAt} nextAt={nextAt} />
      </header>

      <main className="main">
        {latest ? <Instrument latest={latest} /> : <InstrumentEmpty error={error} onRetry={retry} />}
        {latest && past.length > 0 && <PastWeeks days={past} units={latest.daily_units} />}
      </main>

      <Footer meta={latest} />
    </div>
  )
}

export default App
