import { fetchForecast, searchLocation } from './weatherApi'
import { renderWeather } from './weatherView'

const appMarkup = `
  <main class="weather-app">
    <header class="app-header">
      <p class="eyebrow">Open-Meteo</p>
      <h1>Meteo in tempo reale</h1>
      <p class="intro">Cerca una località per vedere il meteo attuale e le previsioni.</p>
    </header>

    <form id="search-form" class="search-form">
      <label for="location-input">Nome del luogo</label>
      <div class="search-controls">
        <input id="location-input" name="location" type="search" placeholder="Es. Roma" autocomplete="off" required />
        <button type="submit">Cerca</button>
      </div>
    </form>

    <section id="weather-results" class="weather-results" aria-live="polite">
      <p class="empty-state">Inserisci una località per iniziare.</p>
    </section>
  </main>
`

export function mountWeatherApp(root: HTMLDivElement): void {
  root.innerHTML = appMarkup

  const searchForm = root.querySelector<HTMLFormElement>('#search-form')!
  const locationInput = root.querySelector<HTMLInputElement>('#location-input')!
  const searchButton = searchForm.querySelector<HTMLButtonElement>('button')!
  const weatherResults = root.querySelector<HTMLElement>('#weather-results')!

  searchForm.addEventListener('submit', async (event) => {
    event.preventDefault()

    const location = locationInput.value.trim()
    if (!location) return

    searchButton.disabled = true
    searchButton.textContent = 'Cerco...'
    weatherResults.innerHTML = '<p class="empty-state">Ricerca della località in corso...</p>'

    try {
      const result = await searchLocation(location)

      if (!result) {
        weatherResults.innerHTML = '<p class="empty-state">Nessuna località trovata.</p>'
        return
      }

      const forecast = await fetchForecast(result.latitude, result.longitude)
      weatherResults.innerHTML = renderWeather(result, forecast)
    } catch {
      weatherResults.innerHTML = '<p class="empty-state">Si è verificato un errore. Riprova.</p>'
    } finally {
      searchButton.disabled = false
      searchButton.textContent = 'Cerca'
    }
  })
}
