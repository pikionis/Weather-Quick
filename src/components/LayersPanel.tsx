import { useState } from 'react'
import { LAYERS, type Layer, type Layers } from './layers'

interface Props {
  layers: Layers
  onToggle: (layer: Layer) => void
}

/** The menu's Layers: what the charts show. Folds away. */
export function LayersPanel({ layers, onToggle }: Props) {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <button type="button" className="sbtn" aria-expanded={open} onClick={() => setOpen(!open)}>
        Layers
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="stroke-icon">
          <path d={open ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
        </svg>
      </button>
      {open && (
        <div className="side-list">
          {LAYERS.map((l) => (
            <label key={l.key} className="chk">
              <input type="checkbox" checked={layers[l.key]} onChange={() => onToggle(l.key)} />
              <span aria-hidden="true" className={`key key-${l.swatch}`} style={{ color: l.color }} />
              {l.label}
            </label>
          ))}
          <p className="side-note">Dew point exists hour by hour only, so it shows in the next 48 hours and on the instrument.</p>
        </div>
      )}
    </div>
  )
}
