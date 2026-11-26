import type { Ref } from 'react'
import { longDateTimeLabel } from '../lib/days'
import { KOS } from '../lib/location'
import { StatusBar } from './StatusBar'
import type { Status } from './useForecast'

interface Props {
  title: string
  /** The current reading's local time, once there is one. */
  time: string | null
  status: Status
  updatedAt: Date | null
  nextAt: number
  onMenu: () => void
  menuButtonRef: Ref<HTMLButtonElement>
}

export function PageHeader({ title, time, status, updatedAt, nextAt, onMenu, menuButtonRef }: Props) {
  return (
    <header className="page-head">
      <button ref={menuButtonRef} type="button" className="menu-btn" onClick={onMenu}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="stroke-icon">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        Menu
      </button>
      <div>
        <p className="muted small">
          {KOS.name} town · {time ? `${longDateTimeLabel(time)} local` : 'reading…'}
        </p>
        <h1>{title}</h1>
      </div>
      <StatusBar status={status} updatedAt={updatedAt} nextAt={nextAt} />
    </header>
  )
}
