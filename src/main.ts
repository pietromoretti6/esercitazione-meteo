import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <main class="weather-app">
    <header class="app-header">
      <p class="eyebrow">Open-Meteo</p>
      <h1>Meteo in un luogo</h1>
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

type GeocodingResult = {
  name: string
  country: string
  latitude: number
  longitude: number
}

type GeocodingResponse = {
  results?: GeocodingResult[]
}

const searchForm = document.querySelector<HTMLFormElement>('#search-form')!
const locationInput = document.querySelector<HTMLInputElement>('#location-input')!
const searchButton = searchForm.querySelector<HTMLButtonElement>('button')!
const weatherResults = document.querySelector<HTMLElement>('#weather-results')!

async function searchLocation(location: string): Promise<GeocodingResult | null> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', location)
  url.searchParams.set('count', '1')
  url.searchParams.set('language', 'it')
  url.searchParams.set('format', 'json')

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('La ricerca della località non è riuscita.')
  }

  const data = (await response.json()) as GeocodingResponse
  return data.results?.[0] ?? null
}

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

    weatherResults.innerHTML = `
      <div class="location-result">
        <p class="eyebrow">Località trovata</p>
        <h2>${result.name}, ${result.country}</h2>
        <p>Coordinate: ${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}</p>
      </div>
    `
  } catch {
    weatherResults.innerHTML = '<p class="empty-state">Si è verificato un errore. Riprova.</p>'
  } finally {
    searchButton.disabled = false
    searchButton.textContent = 'Cerca'
  }
})

