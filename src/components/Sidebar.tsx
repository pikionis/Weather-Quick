import { useEffect, useRef } from 'react'
import { HISTORY_DAYS } from '../lib/correction/summary'
import { KOS } from '../lib/location'
import { LayersPanel } from './LayersPanel'
import { isNarrow, LINES, VIEWS, type Dashboard, type Layer, type Layers, type Line, type Lines } from './layers'
import { ViewsNav } from './ViewsNav'

interface Props {
  open: boolean
  onToggle: () => void
  dashboard: Dashboard
  dashboardHref: (d: Dashboard) => string
  onDashboard: (d: Dashboard) => void
  layers: Layers
  onLayer: (layer: Layer) => void
  lines: Lines
  onLine: (line: Line) => void
  /** The backtest is in, so Corrected and the band have something to show. */
  opinionReady: boolean
  ready: boolean
}

/**
 * The dashboard menu: place, dashboards, views, layers and the second-opinion switches.
 * On a laptop it folds to a narrow rail; on a phone it is a drawer that Esc or the backdrop closes.
 */
export function Sidebar({ open, onToggle, dashboard, dashboardHref, onDashboard, layers, onLayer, lines, onLine, opinionReady, ready }: Props) {
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
          <div role="group" aria-label="Second opinion switches" className="side-list">
            {LINES.map((l) => (
              <button
                key={l.key}
                type="button"
                className="tog"
                aria-pressed={lines[l.key]}
                disabled={l.key !== 'source' && !opinionReady}
                aria-describedby="so-note"
                onClick={() => onLine(l.key)}
              >
                <span aria-hidden="true" className={`sw sw-${l.key}`} />
                {l.label}
              </button>
            ))}
          </div>
          <p id="so-note" className="side-note">
            {opinionReady
              ? `Shown on the next 7 days. Worked out when the page opens, from the last ${HISTORY_DAYS} days.`
              : 'Corrected and the band wait for the backtest: the Second opinion box says why.'}
          </p>
        </div>

        <p className="side-note side-foot">Now and the forecast refresh every 10 minutes. History loads once per visit.</p>
      </nav>
      <div className="backdrop" onClick={onToggle} aria-hidden="true" />
    </>
  )
}
