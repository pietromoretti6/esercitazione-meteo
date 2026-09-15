import { fetchWeatherApi } from 'openmeteo'
import type { GeocodingResponse, GeocodingResult, WeatherData } from './types'

const forecastUrl = 'https://api.open-meteo.com/v1/forecast'

export async function searchLocation(location: string): Promise<GeocodingResult | null> {
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

export async function fetchForecast(latitude: number, longitude: number): Promise<WeatherData> {
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
