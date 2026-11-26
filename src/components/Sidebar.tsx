import { useEffect, useRef } from 'react'
import { KOS } from '../lib/location'
import { LayersPanel } from './LayersPanel'
import { isNarrow, VIEWS, type Dashboard, type Layer, type Layers } from './layers'
import { ViewsNav } from './ViewsNav'

interface Props {
  open: boolean
  onToggle: () => void
  dashboard: Dashboard
  dashboardHref: (d: Dashboard) => string
  onDashboard: (d: Dashboard) => void
  layers: Layers
  onLayer: (layer: Layer) => void
  ready: boolean
}

/**
 * The dashboard menu: place, dashboards, views, layers and the second-opinion switches.
 * On a laptop it folds to a narrow rail; on a phone it is a drawer that Esc or the backdrop closes.
 */
export function Sidebar({ open, onToggle, dashboard, dashboardHref, onDashboard, layers, onLayer, ready }: Props) {
  const first = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open || !isNarrow()) return
    first.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onToggle()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onToggle])

  const closeOnPhone = () => {
    if (isNarrow()) onToggle()
  }

  if (!open) {
    return (
      <nav className="sidebar rail" aria-label="Dashboard menu">
        <button type="button" className="icon" aria-label="Show menu" onClick={onToggle}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="stroke-icon">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>
    )
  }

  return (
    <>
      <nav className="sidebar" aria-label="Dashboard menu">
        <div className="side-head">
          <div>
            <p className="side-title">Weather Quick</p>
            <p className="side-sub">A second opinion for Kos</p>
          </div>
          <button ref={first} type="button" className="icon" aria-label="Hide menu" onClick={onToggle}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="stroke-icon">
              <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
            </svg>
          </button>
        </div>

        <div className="place-card">
          <p className="place-name">{KOS.name} town</p>
          <p className="side-sub">
            {KOS.admin1}, {KOS.country}
          </p>
          <p className="side-note">
            {KOS.latitude.toFixed(2)}° N, {KOS.longitude.toFixed(2)}° E · {KOS.timezone}
          </p>
        </div>

        <div>
          <p className="sect">Dashboards</p>
          <div className="side-list">
            {(['overview', 'instrument'] as const).map((d) => (
              <a
                key={d}
                className="nav"
                href={dashboardHref(d)}
                aria-current={dashboard === d ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  onDashboard(d)
                  closeOnPhone()
                }}
              >
                {d === 'overview' ? 'Overview' : 'Instrument'}
              </a>
            ))}
          </div>
        </div>

        <div>
          <p className="sect">Views</p>
          <ViewsNav views={VIEWS[dashboard]} ready={ready} onPick={closeOnPhone} />
        </div>

        <LayersPanel layers={layers} onToggle={onLayer} />

        <div>
          <p className="sect">Second opinion</p>
          {/* Step 6 turns these on, once the backtest of step 5 gives them something to show. */}
          <div className="side-list">
            {['Source', 'Corrected', '80% band'].map((label) => (
              <button key={label} type="button" className="tog" disabled aria-describedby="so-note">
                {label}
              </button>
            ))}
          </div>
          <p id="so-note" className="side-note">
            Arrive with the backtest: our correction, its band and the source, on the next 7 days.
          </p>
        </div>

        <p className="side-note side-foot">Now and the forecast refresh every 10 minutes. History loads once per visit.</p>
      </nav>
      <div className="backdrop" onClick={onToggle} aria-hidden="true" />
    </>
  )
}
