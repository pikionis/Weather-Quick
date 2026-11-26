import { KOS } from '../lib/location'

export function Footer() {
  return (
    <footer className="foot">
      <p>
        Weather data by <a href="https://open-meteo.com/">Open-Meteo.com</a> · licensed{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> · coastline from Natural Earth
      </p>
      <p>Times in {KOS.timezone}</p>
    </footer>
  )
}
