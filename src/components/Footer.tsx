import { KOS } from '../lib/location'

export function Footer() {
  return (
    <footer>
      <p>
        <a href="https://open-meteo.com/">Weather data by Open-Meteo.com</a> · licensed{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>
      </p>
      <p>Times in {KOS.timezone}</p>
    </footer>
  )
}
