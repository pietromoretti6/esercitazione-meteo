import './style.css'
import { fetchWeatherApi } from 'openmeteo'

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

type WeatherData = {
  current: {
    temperature: number
    humidity: number
    apparentTemperature: number
    isDay: number
    precipitation: number
    weatherCode: number
    windSpeed: number
  }
  daily: {
    date: Date
    weatherCode: number
    temperatureMax: number
    temperatureMin: number
  }[]
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

const forecastUrl = 'https://api.open-meteo.com/v1/forecast'

async function fetchForecast(latitude: number, longitude: number): Promise<WeatherData> {
  const params = {
    latitude: [latitude],
    longitude: [longitude],
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
  }

  const responses = await fetchWeatherApi(forecastUrl, params)
  const response = responses[0]

  if (!response) {
    throw new Error('Le previsioni non sono disponibili.')
  }

  const utcOffsetSeconds = response.utcOffsetSeconds()
  const current = response.current()!
  const daily = response.daily()!
  const dailyDates = Array.from(
    { length: Number(daily.timeEnd() - daily.time()) / daily.interval() },
    (_, index) => new Date((Number(daily.time()) + index * daily.interval() + utcOffsetSeconds) * 1000),
  )

  return {
    current: {
      temperature: current.variables(0)!.value(),
      humidity: current.variables(1)!.value(),
      apparentTemperature: current.variables(2)!.value(),
      isDay: current.variables(3)!.value(),
      precipitation: current.variables(4)!.value(),
      weatherCode: current.variables(5)!.value(),
      windSpeed: current.variables(6)!.value(),
    },
    daily: dailyDates.map((date, index) => ({
      date,
      weatherCode: daily.variables(0)!.valuesArray()![index],
      temperatureMax: daily.variables(1)!.valuesArray()![index],
      temperatureMin: daily.variables(2)!.valuesArray()![index],
    })),
  }
}

function describeWeatherCode(code: number): string {
  if (code === 0) return 'Cielo sereno'
  if ([1, 2, 3].includes(code)) return 'Parzialmente nuvoloso'
  if ([45, 48].includes(code)) return 'Nebbia'
  if ([51, 53, 55, 56, 57].includes(code)) return 'Pioviggine'
  if ([61, 63, 65, 66, 67].includes(code)) return 'Pioggia'
  if ([71, 73, 75, 77].includes(code)) return 'Neve'
  if ([80, 81, 82].includes(code)) return 'Rovesci'
  if ([85, 86].includes(code)) return 'Rovesci di neve'
  if ([95, 96, 99].includes(code)) return 'Temporale'
  return 'Condizioni variabili'
}

function formatDay(date: Date, index: number): string {
  if (index === 0) return 'Oggi'

  return new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric' }).format(date)
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

    const forecast = await fetchForecast(result.latitude, result.longitude)

    const current = forecast.current
    const currentMoment = current.isDay ? 'Giorno' : 'Notte'
    const forecastCards = forecast.daily.map((day, index) => `
      <article class="forecast-card">
        <h3>${formatDay(day.date, index)}</h3>
        <p class="forecast-condition">${describeWeatherCode(day.weatherCode)}</p>
        <p class="forecast-temperatures">
          <strong>${day.temperatureMax.toFixed(0)}°</strong>
          <span>${day.temperatureMin.toFixed(0)}°</span>
        </p>
      </article>
    `).join('')

    weatherResults.innerHTML = `
      <div class="location-result">
        <p class="eyebrow">Meteo per</p>
        <h2>${result.name}, ${result.country}</h2>
        <p class="coordinates">${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}</p>
      </div>

      <section class="current-weather" aria-labelledby="current-weather-title">
        <div class="current-summary">
          <p class="eyebrow">Adesso · ${currentMoment}</p>
          <h3 id="current-weather-title">${current.temperature.toFixed(1)}°C</h3>
          <p>${describeWeatherCode(current.weatherCode)}</p>
        </div>
        <dl class="weather-details">
          <div><dt>Percepita</dt><dd>${current.apparentTemperature.toFixed(1)}°C</dd></div>
          <div><dt>Umidità</dt><dd>${current.humidity.toFixed(0)}%</dd></div>
          <div><dt>Precipitazioni</dt><dd>${current.precipitation.toFixed(1)} mm</dd></div>
          <div><dt>Vento</dt><dd>${current.windSpeed.toFixed(1)} km/h</dd></div>
        </dl>
      </section>

      <section class="forecast" aria-labelledby="forecast-title">
        <div class="section-heading">
          <p class="eyebrow">Prossimi giorni</p>
          <h3 id="forecast-title">Previsioni giornaliere</h3>
        </div>
        <div class="forecast-grid">${forecastCards}</div>
      </section>
    `
  } catch {
    weatherResults.innerHTML = '<p class="empty-state">Si è verificato un errore. Riprova.</p>'
  } finally {
    searchButton.disabled = false
    searchButton.textContent = 'Cerca'
  }
})

