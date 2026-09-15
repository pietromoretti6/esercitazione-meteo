import type { GeocodingResult, WeatherData } from './types'

export function describeWeatherCode(code: number): string {
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

export function getWeatherIcon(code: number): string {
  if (code === 0) return '☀️'
  if ([1, 2].includes(code)) return '⛅'
  if (code === 3) return '☁️'
  if ([45, 48].includes(code)) return '🌫️'
  if ([51, 53, 55, 56, 57].includes(code)) return '🌦️'
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '🌧️'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '🌨️'
  if ([95, 96, 99].includes(code)) return '⛈️'
  return '🌤️'
}

function formatDay(date: Date, index: number): string {
  if (index === 0) return 'Oggi'

  return new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric' }).format(date)
}

export function renderWeather(result: GeocodingResult, forecast: WeatherData): string {
  const current = forecast.current
  const currentMoment = current.isDay ? 'Giorno' : 'Notte'
  const forecastCards = forecast.daily.map((day, index) => `
      <article class="forecast-card">
        <h3>${formatDay(day.date, index)}</h3>
        <span class="weather-icon" role="img" aria-label="${describeWeatherCode(day.weatherCode)}">${getWeatherIcon(day.weatherCode)}</span>
        <p class="forecast-condition">${describeWeatherCode(day.weatherCode)}</p>
        <p class="forecast-temperatures">
          <strong>${day.temperatureMax.toFixed(0)}°</strong>
          <span>${day.temperatureMin.toFixed(0)}°</span>
        </p>
      </article>
    `).join('')

  return `
      <div class="location-result">
        <p class="eyebrow">Meteo per</p>
        <h2>${result.name}, ${result.country}</h2>
        <p class="coordinates">${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}</p>
      </div>

      <section class="current-weather" aria-labelledby="current-weather-title">
        <div class="current-summary">
          <p class="eyebrow">Adesso · ${currentMoment}</p>
          <span class="current-weather-icon" role="img" aria-label="${describeWeatherCode(current.weatherCode)}">${getWeatherIcon(current.weatherCode)}</span>
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
}
