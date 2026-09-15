export type GeocodingResult = {
  name: string
  country: string
  latitude: number
  longitude: number
}

export type GeocodingResponse = {
  results?: GeocodingResult[]
}

export type WeatherData = {
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
