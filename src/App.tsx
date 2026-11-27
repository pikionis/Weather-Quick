import { useCallback, useEffect, useRef, useState } from 'react'
import { Footer } from './components/Footer'
import { Instrument, InstrumentEmpty } from './components/Instrument'
import { DEFAULT_LAYERS, isNarrow, type Dashboard } from './components/layers'
import { Overview } from './components/Overview'
import { PageHeader } from './components/PageHeader'
import { PastWeeks } from './components/PastWeeks'
import { Sidebar } from './components/Sidebar'
import { useForecast } from './components/useForecast'
import { useSecondOpinion } from './components/useSecondOpinion'

/** The dashboard lives in the URL (?dashboard=instrument), so a link opens the same one. */
const readDashboard = (): Dashboard =>
  new URLSearchParams(window.location.search).get('dashboard') === 'instrument' ? 'instrument' : 'overview'

function dashboardHref(d: Dashboard): string {
  const params = new URLSearchParams(window.location.search)
  if (d === 'overview') params.delete('dashboard')
  else params.set('dashboard', d)
  const query = params.toString()
  return `${window.location.pathname}${query ? `?${query}` : ''}`
}

function App() {
  const forecast = useForecast()
  const { latest } = forecast
  const second = useSecondOpinion(latest)
  const [menu, setMenu] = useState(() => !isNarrow())
  const [layers, setLayers] = useState(DEFAULT_LAYERS)
  const [dashboard, setDashboard] = useState<Dashboard>(readDashboard)
  const menuButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onBack = () => setDashboard(readDashboard())
    window.addEventListener('popstate', onBack)
    return () => window.removeEventListener('popstate', onBack)
  }, [])

  // When the drawer closes on a phone, focus goes back to the Menu button.
  const wasOpen = useRef(menu)
  useEffect(() => {
    if (wasOpen.current && !menu && isNarrow()) menuButton.current?.focus()
    wasOpen.current = menu
  }, [menu])

  const toggleMenu = useCallback(() => setMenu((open) => !open), [])
  const choose = (d: Dashboard) => {
    window.history.pushState(null, '', dashboardHref(d))
    setDashboard(d)
    window.scrollTo(0, 0)
  }

  return (
    <div className={menu ? 'shell menu-open' : 'shell'}>
      <Sidebar
        open={menu}
        onToggle={toggleMenu}
        dashboard={dashboard}
        dashboardHref={dashboardHref}
        onDashboard={choose}
        layers={layers}
        onLayer={(key) => setLayers((l) => ({ ...l, [key]: !l[key] }))}
        ready={latest !== null}
      />
      <main className="main">
        <PageHeader
          title={dashboard === 'overview' ? 'Overview' : 'Instrument'}
          time={latest?.current.time ?? null}
          status={forecast.status}
          updatedAt={forecast.updatedAt}
          nextAt={forecast.nextAt}
          onMenu={toggleMenu}
          menuButtonRef={menuButton}
        />
        {!latest ? (
          <InstrumentEmpty error={forecast.error} onRetry={forecast.retry} />
        ) : dashboard === 'overview' ? (
          <Overview latest={latest} past={forecast.past} pastHours={forecast.pastHours} layers={layers} second={second} />
        ) : (
          <>
            <Instrument latest={latest} showDew={layers.dew} second={second} />
            {forecast.past.length > 0 && <PastWeeks days={forecast.past} units={latest.daily_units} />}
          </>
        )}
        <Footer />
      </main>
    </div>
  )
}

export default App
