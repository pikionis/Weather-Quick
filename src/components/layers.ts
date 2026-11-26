/** What the menu's Layers switch on and off in the charts. */
export type Layer = 'temp' | 'dew' | 'wind' | 'gusts' | 'rain'
export type Layers = Record<Layer, boolean>

/** As in the mockup: temperature, wind and rain on; dew point and gusts off. */
export const DEFAULT_LAYERS: Layers = { temp: true, dew: false, wind: true, gusts: false, rain: true }

/** Menu order and keys. The swatch colours are the lighter variants that read on the dark menu. */
export const LAYERS: { key: Layer; label: string; swatch: 'line' | 'dash' | 'box'; color: string }[] = [
  { key: 'temp', label: 'Temperature', swatch: 'line', color: 'var(--temp-menu)' },
  { key: 'dew', label: 'Dew point', swatch: 'line', color: 'var(--dew-menu)' },
  { key: 'wind', label: 'Wind', swatch: 'line', color: 'var(--wind-menu)' },
  { key: 'gusts', label: 'Gusts', swatch: 'dash', color: 'var(--wind-menu)' },
  { key: 'rain', label: 'Rain', swatch: 'box', color: 'var(--rain-menu)' },
]

export type Dashboard = 'overview' | 'instrument'

/** Under 900 px the menu is a drawer over the page. */
export const isNarrow = () => window.matchMedia('(max-width: 899px)').matches

export interface View {
  id: string
  label: string
}

/** The boxes each dashboard's Views jump to. */
export const VIEWS: Record<Dashboard, View[]> = {
  overview: [
    { id: 'live', label: 'Live over Kos' },
    { id: 'overview', label: 'Right now' },
    { id: 'next48', label: 'Next 48 hours' },
    { id: 'next7', label: 'Next 7 days' },
    { id: 'track', label: 'Track record' },
    { id: 'past28', label: 'Past 28 days' },
    { id: 'about', label: 'About the data' },
  ],
  instrument: [
    { id: 'instrument', label: 'Instrument' },
    { id: 'past4', label: 'Past 4 weeks' },
  ],
}
