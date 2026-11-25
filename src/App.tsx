import { KOS } from './lib/location'

// Placeholder until the UI brief lands. Shows only the default place.
function App() {
  return (
    <main>
      <h1>Weather Quick</h1>
      <p>
        {KOS.name}, {KOS.admin1}, {KOS.country}
      </p>
      <footer>
        Weather data by <a href="https://open-meteo.com/">Open-Meteo.com</a>
      </footer>
    </main>
  )
}

export default App
